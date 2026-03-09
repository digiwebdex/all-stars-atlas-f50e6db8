const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { notifyBookingConfirm } = require('../services/notify');
const { searchFlights: ttiSearch } = require('./tti-flights');
const { searchFlights: bdfSearch } = require('./bdf-flights');

const router = express.Router();

// GET /flights/tti-diagnostic — test TTI API connectivity
router.get('/tti-diagnostic', async (req, res) => {
  try {
    const { getTTIConfig, ttiRequest } = require('./tti-flights');
    const dns = require('dns').promises;
    const config = await getTTIConfig();
    if (!config) {
      return res.json({ success: false, error: 'TTI not configured in database. Go to Admin → Settings → API Integrations → Air Astra TTI', config: null });
    }

    const results = { environment: config.environment, apiUrl: config.url, agencyId: config.agencyId, agencyName: config.agencyName };

    // Test 0: DNS resolution
    try {
      const hostname = new URL(config.url).hostname;
      const addresses = await dns.resolve4(hostname);
      results.dns = { hostname, resolved: true, addresses };
    } catch (e) {
      results.dns = { error: e.message, hint: 'DNS resolution failed — VPS cannot resolve TTI hostname. Check /etc/resolv.conf or try adding 8.8.8.8' };
    }

    // Test 1: Raw HTTP connectivity (bypass ttiRequest to get detailed errors)
    const baseUrl = config.url.replace(/\/+$/, '');
    const httpsUrl = baseUrl.replace('http://', 'https://');
    const urlsToTest = [baseUrl, httpsUrl];

    results.connectivityTests = [];
    for (const testBaseUrl of urlsToTest) {
      const testUrl = `${testBaseUrl}/Ping`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const r = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ RequestInfo: { AuthenticationKey: config.key } }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const text = await r.text();
        let parsed; try { parsed = JSON.parse(text); } catch { parsed = null; }
        results.connectivityTests.push({
          url: testBaseUrl, status: r.status, ok: r.ok,
          bodyPreview: text.slice(0, 500),
          parsed: parsed ? Object.keys(parsed) : null,
        });
      } catch (e) {
        results.connectivityTests.push({
          url: testBaseUrl, error: e.message,
          cause: e.cause ? String(e.cause) : undefined,
          code: e.code || undefined,
        });
      }
    }

    // Test 2: Full search via ttiRequest (uses HTTP/HTTPS fallback)
    const searchDate = new Date();
    searchDate.setDate(searchDate.getDate() + 3);
    try {
      const searchReq = {
        RequestInfo: { AuthenticationKey: config.key },
        Passengers: [{ Ref: '1', PassengerTypeCode: 'AD', PassengerQuantity: 1 }],
        OriginDestinations: [{ Ref: '1', OriginCode: 'DAC', DestinationCode: 'CGP', TargetDate: `/Date(${searchDate.getTime()})/` }],
        FareDisplaySettings: { SaleCurrencyCode: 'BDT' },
      };
      const raw = await ttiRequest('SearchFlights', searchReq);
      results.testSearch = {
        route: 'DAC → CGP',
        date: searchDate.toISOString().slice(0, 10),
        segmentCount: raw?.Segments?.length || 0,
        itineraryCount: raw?.FareInfo?.Itineraries?.length || 0,
        errors: raw?.ResponseInfo?.Errors || [],
        rawKeys: raw ? Object.keys(raw) : [],
      };
    } catch (e) {
      results.testSearch = { error: e.message };
    }

    results.success = true;
    results.nodeVersion = process.version;
    results.timestamp = new Date().toISOString();
    res.json(results);
  } catch (err) {
    console.error('TTI diagnostic error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get('/search', async (req, res) => {
  try {
    const {
      origin, destination, from, to,
      departDate, date, depart,
      returnDate, return: returnParam,
      cabinClass, class: classParam, cabin,
      adults, children, infants,
      sort, priceMin, priceMax,
      page = 1, limit = 50
    } = req.query;

    // Normalize params (frontend sends various names)
    const originCode = origin || from || '';
    const destCode = destination || to || '';
    const dDate = departDate || date || depart || '';
    const rDate = returnDate || returnParam || '';
    const cabClass = cabinClass || classParam || cabin || '';
    const adultCount = parseInt(adults) || 1;
    const childCount = parseInt(children) || 0;
    const infantCount = parseInt(infants) || 0;

    // ── Multi-provider parallel search ──
    const searchParams = {
      origin: originCode,
      destination: destCode,
      departDate: dDate,
      returnDate: rDate || undefined,
      adults: adultCount,
      children: childCount,
      infants: infantCount,
      cabinClass: cabClass || undefined,
    };

    const [dbFlights, ttiFlights, bdfFlights] = await Promise.allSettled([
      searchDB({ originCode, destCode, dDate, cabClass, page, limit }),
      ttiSearch(searchParams).catch(err => {
        console.error('TTI search failed (continuing with other providers):', err.message);
        return [];
      }),
      bdfSearch(searchParams).catch(err => {
        console.error('BDFare search failed (continuing with other providers):', err.message);
        return [];
      }),
    ]);

    // Collect results
    let flights = [];

    if (dbFlights.status === 'fulfilled') {
      flights.push(...(dbFlights.value.rows || []));
    }

    if (ttiFlights.status === 'fulfilled') {
      flights.push(...(ttiFlights.value || []));
    }

    if (bdfFlights.status === 'fulfilled') {
      flights.push(...(bdfFlights.value || []));
    }

    // Deduplicate flights from multiple providers (same flight number + same departure)
    const seen = new Set();
    flights = flights.filter(f => {
      const key = `${f.flightNumber}-${f.departureTime}`;
      if (key === '-null' || key === '-') return true; // no dedup key
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Apply client-side filters
    if (priceMin) flights = flights.filter(f => f.price >= parseFloat(priceMin));
    if (priceMax) flights = flights.filter(f => f.price <= parseFloat(priceMax));

    // Sort
    switch (sort) {
      case 'cheapest':
      case 'price':
        flights.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'earliest':
        flights.sort((a, b) => new Date(a.departureTime || 0) - new Date(b.departureTime || 0));
        break;
      case 'fastest':
        flights.sort((a, b) => (a.durationMinutes || 999) - (b.durationMinutes || 999));
        break;
      case 'best':
      default:
        // Best = weighted score of price + duration
        flights.sort((a, b) => {
          const scoreA = (a.price || 0) + (a.durationMinutes || 0) * 50;
          const scoreB = (b.price || 0) + (b.durationMinutes || 0) * 50;
          return scoreA - scoreB;
        });
        break;
    }

    // Extract unique airlines
    const airlines = [...new Set(flights.map(f => f.airline).filter(Boolean))];
    const cheapest = flights.length > 0 ? Math.min(...flights.map(f => f.price || Infinity)) : 0;

    res.json({
      data: flights,
      airlines,
      cheapest,
      total: flights.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(flights.length / parseInt(limit)),
      sources: {
        db: dbFlights.status === 'fulfilled' ? (dbFlights.value.rows || []).length : 0,
        tti: ttiFlights.status === 'fulfilled' ? (ttiFlights.value || []).length : 0,
        bdfare: bdfFlights.status === 'fulfilled' ? (bdfFlights.value || []).length : 0,
      },
    });
  } catch (err) {
    console.error('Flight search error:', err);
    res.status(500).json({ message: 'Something went wrong', status: 500 });
  }
});

// Helper: search local DB flights
async function searchDB({ originCode, destCode, dDate, cabClass, page, limit }) {
  let sql = 'SELECT * FROM flights WHERE 1=1';
  const params = [];

  if (originCode) { sql += ' AND origin = ?'; params.push(originCode); }
  if (destCode) { sql += ' AND destination = ?'; params.push(destCode); }
  if (dDate) { sql += ' AND DATE(departure_time) = ?'; params.push(dDate); }
  if (cabClass) { sql += ' AND cabin_class = ?'; params.push(cabClass); }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  sql += ` ORDER BY price ASC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [rows] = await db.query(sql, params);
  const data = rows.map(r => ({
    id: r.id,
    source: 'db',
    airline: r.airline,
    airlineCode: r.airline_code,
    airlineLogo: r.airline_logo,
    flightNumber: r.flight_number,
    origin: r.origin,
    originCity: r.origin_city,
    destination: r.destination,
    destinationCity: r.destination_city,
    departureTime: r.departure_time,
    arrivalTime: r.arrival_time,
    duration: r.duration,
    durationMinutes: parseDurationToMinutes(r.duration),
    stops: r.stops,
    stopCodes: [],
    cabinClass: r.cabin_class,
    price: parseFloat(r.price),
    currency: r.currency || 'BDT',
    seatsAvailable: r.seats_available,
    baggage: r.baggage,
    refundable: !!r.refundable,
    aircraft: '',
    legs: [{
      origin: r.origin,
      destination: r.destination,
      departureTime: r.departure_time,
      arrivalTime: r.arrival_time,
      duration: r.duration,
      durationMinutes: parseDurationToMinutes(r.duration),
      flightNumber: r.flight_number,
      airlineCode: r.airline_code,
      aircraft: '',
      stops: [],
    }],
  }));

  return { rows: data };
}

function parseDurationToMinutes(dur) {
  if (!dur) return 0;
  const match = dur.match(/(\d+)h\s*(\d+)?m?/i);
  if (match) return parseInt(match[1]) * 60 + (parseInt(match[2]) || 0);
  const minMatch = dur.match(/(\d+)\s*m/i);
  if (minMatch) return parseInt(minMatch[1]);
  return 0;
}

// GET /flights/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM flights WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Flight not found', status: 404 });
    const r = rows[0];
    res.json({
      id: r.id, airline: r.airline, airlineCode: r.airline_code, airlineLogo: r.airline_logo,
      flightNumber: r.flight_number, origin: r.origin, originCity: r.origin_city,
      destination: r.destination, destinationCity: r.destination_city,
      departureTime: r.departure_time, arrivalTime: r.arrival_time,
      duration: r.duration, stops: r.stops, cabinClass: r.cabin_class,
      price: parseFloat(r.price), currency: r.currency, seatsAvailable: r.seats_available,
      baggage: r.baggage, refundable: !!r.refundable, meta: r.meta ? JSON.parse(r.meta) : null,
    });
  } catch (err) {
    console.error('Flight detail error:', err);
    res.status(500).json({ message: 'Something went wrong', status: 500 });
  }
});

// POST /flights/book
router.post('/book', authenticate, async (req, res) => {
  try {
    const { flightId, passengers, contactInfo, paymentMethod } = req.body;
    const bookingId = uuidv4();
    const bookingRef = `ST-FL-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random()*999)).padStart(3,'0')}`;

    const [flights] = await db.query('SELECT * FROM flights WHERE id = ?', [flightId]);
    const totalAmount = flights.length > 0 ? parseFloat(flights[0].price) * (passengers?.length || 1) : 0;

    await db.query(
      `INSERT INTO bookings (id, user_id, booking_type, booking_ref, status, total_amount, payment_method, payment_status, details, passenger_info, contact_info)
       VALUES (?, ?, 'flight', ?, 'confirmed', ?, ?, 'paid', ?, ?, ?)`,
      [bookingId, req.user.sub, bookingRef, totalAmount, paymentMethod || 'card',
       JSON.stringify(flights[0] || {}), JSON.stringify(passengers || []), JSON.stringify(contactInfo || {})]
    );

    // Create transaction
    await db.query(
      `INSERT INTO transactions (id, user_id, booking_id, type, amount, status, payment_method, reference, description)
       VALUES (?, ?, ?, 'payment', ?, 'completed', ?, ?, ?)`,
      [uuidv4(), req.user.sub, bookingId, totalAmount, paymentMethod || 'card', bookingRef, `Flight booking ${flights[0]?.origin || ''} → ${flights[0]?.destination || ''}`]
    );

    // Create ticket
    const ticketNo = `098-${String(Math.floor(Math.random()*9999999999)).padStart(10,'0')}`;
    await db.query(
      `INSERT INTO tickets (id, booking_id, user_id, ticket_no, pnr, status, details)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [uuidv4(), bookingId, req.user.sub, ticketNo, bookingRef.slice(-6).toUpperCase(),
       JSON.stringify({ airline: flights[0]?.airline, flightNumber: flights[0]?.flight_number, origin: flights[0]?.origin, destination: flights[0]?.destination, departureTime: flights[0]?.departure_time, passenger: passengers?.[0]?.firstName + ' ' + passengers?.[0]?.lastName })]
    );

    notifyBookingConfirm(req.user.sub, { bookingRef, type: 'Flight', amount: totalAmount }).catch(console.error);
    res.status(201).json({ id: bookingId, bookingRef, status: 'confirmed', totalAmount, currency: 'BDT', bookingType: 'flight', createdAt: new Date().toISOString() });
  } catch (err) {
    console.error('Flight booking error:', err);
    res.status(500).json({ message: 'Something went wrong', status: 500 });
  }
});

module.exports = router;
