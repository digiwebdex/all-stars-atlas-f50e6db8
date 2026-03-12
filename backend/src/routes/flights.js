const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { notifyBookingConfirm } = require('../services/notify');
const { searchFlights: ttiSearch, createBooking: ttiCreateBooking } = require('./tti-flights');
const { searchFlights: bdfSearch } = require('./bdf-flights');
const { searchFlights: flyhubSearch } = require('./flyhub-flights');
const { searchFlights: sabreSearch, createBooking: sabreCreateBooking } = require('./sabre-flights');
const { searchFlights: galileoSearch } = require('./galileo-flights');
const { searchFlights: ndcSearch } = require('./ndc-flights');
const { searchAllLCCs } = require('./lcc-flights');

const router = express.Router();

// ─── Travel Document Upload (Passport/Visa copies) ───
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const TRAVEL_DOCS_DIR = path.join(UPLOAD_DIR, 'travel-documents');
if (!fs.existsSync(TRAVEL_DOCS_DIR)) fs.mkdirSync(TRAVEL_DOCS_DIR, { recursive: true });

const travelDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(TRAVEL_DOCS_DIR, req.user.sub);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const docType = file.fieldname || 'doc'; // passport_0 or visa_0
    cb(null, `${docType}-${Date.now()}${ext}`);
  },
});
const travelDocUpload = multer({
  storage: travelDocStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not allowed`));
  },
});

// POST /flights/upload-travel-docs — upload passport + visa copies per passenger
router.post('/upload-travel-docs', authenticate, travelDocUpload.any(), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded', status: 400 });
    }
    const docs = req.files.map(f => ({
      fieldname: f.fieldname,
      originalName: f.originalname,
      filename: f.filename,
      size: f.size,
      mimetype: f.mimetype,
      url: `/uploads/travel-documents/${req.user.sub}/${f.filename}`,
    }));
    res.json({ message: 'Documents uploaded', documents: docs });
  } catch (err) {
    console.error('Travel doc upload error:', err);
    res.status(500).json({ message: 'Upload failed', status: 500 });
  }
});

// GET /flights/travel-docs/:bookingId — admin: list travel docs for a booking
router.get('/travel-docs/:bookingId', authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT details, user_id FROM bookings WHERE id = ?', [req.params.bookingId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    const details = typeof rows[0].details === 'string' ? JSON.parse(rows[0].details) : (rows[0].details || {});
    const travelDocs = details.travelDocuments || [];
    res.json({ documents: travelDocs, userId: rows[0].user_id });
  } catch (err) {
    console.error('Travel docs fetch error:', err);
    res.status(500).json({ message: 'Something went wrong', status: 500 });
  }
});



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
// GET /flights/tti-methods — discover which API methods exist on TTI
router.get('/tti-methods', async (req, res) => {
  try {
    const { getTTIConfig } = require('./tti-flights');
    const config = await getTTIConfig();
    if (!config) return res.json({ success: false, error: 'TTI not configured' });

    const baseUrl = config.url.replace(/\/+$/, '');
    const urls = baseUrl.startsWith('https://') 
      ? [baseUrl, baseUrl.replace('https://', 'http://')]
      : [baseUrl, baseUrl.replace('http://', 'https://')];

    const dummyBody = JSON.stringify({
      request: { RequestInfo: { AuthenticationKey: config.key }, BookingReference: 'TEST', AgencyInfo: { AgencyId: config.agencyId } }
    });

    const methods = [
      // Booking lifecycle
      'Cancel', 'CancelBooking', 'CancelPNR',
      'SearchFlights', 'CreateBooking', 'Confirm', 'Book',
      // Ticketing (Cancel method may handle this too via CancelTicketSettings)
      'TicketBooking', 'IssueTicket', 'Ticket', 'IssueETicket', 'ConfirmBooking', 'Ticketing',
      // Void
      'VoidTicket', 'Void', 'VoidETicket',
      // Ancillaries — seat selection, baggage, meals, SSR
      'GetSeatMap', 'GetSSR', 'GetValueCodes', 'AddServices', 'GetServices',
      'GetAncillaries', 'GetExtras', 'GetBaggage', 'AddBaggage', 'GetMeals',
      'SelectSeat', 'AssignSeat', 'SeatMap', 'PreSeatBooking',
      'GetFareRules', 'GetFareQuote', 'Reprice', 'RepriceBooking',
      // Retrieve / manage PNR
      'GetBooking', 'RetrieveBooking', 'GetPNR', 'RetrievePNR', 'ReadBooking', 'DisplayPNR',
      // Utility
      'Ping', 'Help', 'GetMethods', 'GetSchedules', 'GetAvailability',
    ];

    const results = {};
    for (const method of methods) {
      for (const tryUrl of urls) {
        const fullUrl = `${tryUrl}/${method}`;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const r = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: dummyBody,
            signal: controller.signal,
          });
          clearTimeout(timeout);
          const text = await r.text();
          results[method] = { status: r.status, exists: r.status !== 404, bodyPreview: text.slice(0, 300) };
          break;
        } catch (e) {
          results[method] = { error: e.message, exists: false };
          break;
        }
      }
    }

    const existingMethods = Object.entries(results)
      .filter(([, v]) => v.exists)
      .map(([k, v]) => ({ method: k, status: v.status }));

    res.json({ success: true, baseUrl, existingMethods, allResults: results, timestamp: new Date().toISOString() });
  } catch (err) {
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
      page = 1, limit = 500,
      segments: segmentsRaw, // multi-city: JSON array of {from, to, date}
    } = req.query;

    // Parse multi-city segments
    let multiCitySegments = null;
    if (segmentsRaw) {
      try {
        multiCitySegments = JSON.parse(segmentsRaw);
        if (!Array.isArray(multiCitySegments) || multiCitySegments.length < 2) {
          multiCitySegments = null;
        }
      } catch { multiCitySegments = null; }
    }
    const isMultiCity = !!multiCitySegments;

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
      origin: isMultiCity ? multiCitySegments[0].from : originCode,
      destination: isMultiCity ? multiCitySegments[multiCitySegments.length - 1].to : destCode,
      departDate: isMultiCity ? multiCitySegments[0].date : dDate,
      returnDate: isMultiCity ? undefined : (rDate || undefined),
      adults: adultCount,
      children: childCount,
      infants: infantCount,
      cabinClass: cabClass || undefined,
      segments: multiCitySegments || undefined, // pass segments for multi-city Sabre BFM
    };

    if (isMultiCity) {
      console.log(`[Search] Multi-city: ${multiCitySegments.map(s => `${s.from}→${s.to}`).join(', ')}`);
    }

    const [dbFlights, ttiFlights, bdfFlights, flyhubFlights, sabreFlights, galileoFlights, ndcFlights, lccFlights] = await Promise.allSettled([
      isMultiCity ? Promise.resolve([]) : searchDB({ originCode, destCode, dDate, cabClass, page, limit }),
      isMultiCity ? Promise.resolve([]) : ttiSearch(searchParams).catch(err => {
        console.error('TTI search failed (continuing with other providers):', err.message);
        return [];
      }),
      isMultiCity ? Promise.resolve([]) : bdfSearch(searchParams).catch(err => {
        console.error('BDFare search failed (continuing with other providers):', err.message);
        return [];
      }),
      isMultiCity ? Promise.resolve([]) : flyhubSearch(searchParams).catch(err => {
        console.error('FlyHub search failed (continuing with other providers):', err.message);
        return [];
      }),
      sabreSearch(searchParams).catch(err => {
        console.error('Sabre search failed (continuing with other providers):', err.message);
        return [];
      }),
      isMultiCity ? Promise.resolve([]) : galileoSearch(searchParams).catch(err => {
        console.error('Galileo search failed (continuing with other providers):', err.message);
        return [];
      }),
      isMultiCity ? Promise.resolve([]) : ndcSearch(searchParams).catch(err => {
        console.error('NDC search failed (continuing with other providers):', err.message);
        return [];
      }),
      isMultiCity ? Promise.resolve([]) : searchAllLCCs(searchParams).catch(err => {
        console.error('LCC search failed (continuing with other providers):', err.message);
        return [];
      }),
    ]);

    // Collect results
    let flights = [];

    const providerResults = [dbFlights, ttiFlights, bdfFlights, flyhubFlights, sabreFlights, galileoFlights, ndcFlights, lccFlights];
    for (const result of providerResults) {
      if (result.status === 'fulfilled') {
        const val = result.value;
        flights.push(...(val?.rows || val || []));
      }
    }

    // Deduplicate flights from multiple providers
    // Use flight number + departure + destination + stops + connection airports as key
    // This preserves itineraries with same first flight but different connections
    const seen = new Set();
    flights = flights.filter(f => {
      const stopKey = (f.stopCodes || []).join(',') || (f.legs || []).map(l => l.destination).join(',');
      const key = `${f.flightNumber}-${f.departureTime}-${f.destination}-${f.stops ?? 0}-${stopKey}`;
      if (key === '-null---0-' || key === '----0-') return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ── Apply per-airline fare rules from admin settings ──
    try {
      const [settingsRows] = await db.query(
        "SELECT meta FROM system_settings WHERE setting_key IN ('markup_config', 'airline_markup_config')"
      );
      let globalDiscount = 6.30;
      let globalAitVat = 0.3;
      let airlineOverrides = {};

      for (const row of settingsRows) {
        const parsed = typeof row.meta === 'string' ? JSON.parse(row.meta) : (row.meta || {});
        // markup_config stores per-segment configs; FLIGHT segment has fareSummaryDiscount/fareSummaryAitVat
        if (parsed.FLIGHT && parsed.FLIGHT.fareSummaryDiscount !== undefined) {
          globalDiscount = parseFloat(parsed.FLIGHT.fareSummaryDiscount) || 6.30;
          globalAitVat = parseFloat(parsed.FLIGHT.fareSummaryAitVat) || 0.3;
        }
        // airline_markup_config is keyed by airline IATA code
        if (parsed && !parsed.FLIGHT && typeof parsed === 'object') {
          airlineOverrides = parsed;
        }
      }

      flights = flights.map(f => {
        const code = f.airlineCode || '';
        const override = airlineOverrides[code];
        let discount = globalDiscount;
        let aitVat = globalAitVat;
        let markup = 0;
        let fixedMarkup = 0;

        if (override && !override.useGlobal) {
          discount = parseFloat(override.discount) || 0;
          markup = parseFloat(override.markup) || 0;
          fixedMarkup = parseFloat(override.fixedMarkup) || 0;
        }

        // Attach fare rule params for frontend fare summary display
        f.fareRules = { discount, aitVat, markup, fixedMarkup, isGlobal: !override || override.useGlobal };
        return f;
      });
    } catch (fareRuleErr) {
      console.error('Fare rule loading failed (using defaults):', fareRuleErr.message);
      // Attach default rules so frontend always has them
      flights = flights.map(f => {
        f.fareRules = { discount: 6.30, aitVat: 0.3, markup: 0, fixedMarkup: 0, isGlobal: true };
        return f;
      });
    }

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

    const responseData = {
      data: flights,
      airlines,
      cheapest,
      total: flights.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(flights.length / parseInt(limit)),
      sources: {
        db: dbFlights.status === 'fulfilled' ? (dbFlights.value?.rows || []).length : 0,
        tti: ttiFlights.status === 'fulfilled' ? (ttiFlights.value || []).length : 0,
        bdfare: bdfFlights.status === 'fulfilled' ? (bdfFlights.value || []).length : 0,
        flyhub: flyhubFlights.status === 'fulfilled' ? (flyhubFlights.value || []).length : 0,
        sabre: sabreFlights.status === 'fulfilled' ? (sabreFlights.value || []).length : 0,
        galileo: galileoFlights.status === 'fulfilled' ? (galileoFlights.value || []).length : 0,
        ndc: ndcFlights.status === 'fulfilled' ? (ndcFlights.value || []).length : 0,
        lcc: lccFlights.status === 'fulfilled' ? (lccFlights.value || []).length : 0,
      },
    };


    res.json(responseData);
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
    baseFare: parseFloat(r.base_fare || r.price),
    taxes: parseFloat(r.taxes || 0),
    currency: r.currency || 'BDT',
    availableSeats: r.seats_available ?? null,
    baggage: r.baggage || null,
    handBaggage: null,
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

// Bangladesh domestic airports
const BD_AIRPORTS = ['DAC', 'CXB', 'CGP', 'ZYL', 'JSR', 'RJH', 'SPD', 'BZL', 'IRD', 'TKR'];

/**
 * Determine payment deadline.
 * Priority: 1) Airline-provided time limit  2) Fallback calculation
 * The airline's GDS response includes a LastTicketingDate / TimeLimit that
 * specifies exactly when the PNR will be auto-cancelled. We use that first.
 */
function resolvePaymentDeadline(airlineTimeLimit, departureTime, isDomestic) {
  // 1) Use airline-provided time limit if available and valid
  if (airlineTimeLimit) {
    const tl = new Date(airlineTimeLimit);
    if (!isNaN(tl.getTime()) && tl > new Date()) {
      return tl;
    }
  }

  // 2) Fallback: calculate based on route type (for DB-sourced flights with no GDS TL)
  const now = new Date();
  const departure = new Date(departureTime);
  const hoursUntilFlight = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (isDomestic) {
    if (hoursUntilFlight <= 48) {
      return new Date(departure.getTime() - 3 * 60 * 60 * 1000);
    } else {
      const deadline48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const deadline24hBefore = new Date(departure.getTime() - 24 * 60 * 60 * 1000);
      return deadline48h < deadline24hBefore ? deadline48h : deadline24hBefore;
    }
  } else {
    if (hoursUntilFlight <= 7 * 24) {
      return new Date(departure.getTime() - 24 * 60 * 60 * 1000);
    } else {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
}

// POST /flights/book
router.post('/book', authenticate, async (req, res) => {
  try {
    const { flightData, returnFlightData, passengers, isRoundTrip, isDomestic, payLater, paymentMethod, totalAmount, baseFare, taxes, serviceCharge, addOns, contactInfo, travelDocuments, specialServices } = req.body;
    const bookingId = uuidv4();
    const bookingRef = `ST-FL-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random()*999)).padStart(3,'0')}`;

    const origin = flightData?.origin || '';
    const destination = flightData?.destination || '';
    const departureTime = flightData?.departureTime || new Date().toISOString();

    // Determine domestic/international
    const domestic = isDomestic !== undefined ? isDomestic : (BD_AIRPORTS.includes(origin.toUpperCase()) && BD_AIRPORTS.includes(destination.toUpperCase()));

    // Resolve payment deadline: use airline-provided timeLimit first, fallback to calculation
    const airlineTimeLimit = flightData?.timeLimit || null;
    let paymentDeadline = null;
    if (payLater) {
      paymentDeadline = resolvePaymentDeadline(airlineTimeLimit, departureTime, domestic);
    }

    const status = payLater ? 'on_hold' : 'confirmed';
    const payStatus = payLater ? 'pending' : 'paid';

    const details = {
      outbound: flightData || {},
      return: returnFlightData || null,
      isRoundTrip: !!isRoundTrip,
      isDomestic: domestic,
      addOns: addOns || {},
      specialServices: specialServices || {},
      baseFare, taxes, serviceCharge,
      travelDocuments: travelDocuments || [],
    };

    // If this is a TTI/Air Astra flight, create booking in GDS first
    let gdsPnr = null;
    let gdsBookingResult = null;
    const flightSource = flightData?.source || '';
    if (flightSource === 'tti' || (flightData?.airlineCode === '2A' || flightData?.airlineCode === 'S2')) {
      console.log('[Booking] TTI/Air Astra flight detected — creating GDS booking...');
      try {
        gdsBookingResult = await ttiCreateBooking({ flightData, passengers: passengers || [], contactInfo: contactInfo || {} });
        if (gdsBookingResult.success && gdsBookingResult.pnr) {
          gdsPnr = gdsBookingResult.pnr;
          console.log('[Booking] TTI PNR created:', gdsPnr);
          // Use TTI time limit if available
          if (gdsBookingResult.ticketTimeLimit && payLater) {
            const ttiDeadline = new Date(gdsBookingResult.ticketTimeLimit);
            if (!isNaN(ttiDeadline.getTime()) && ttiDeadline > new Date()) {
              paymentDeadline = ttiDeadline;
            }
          }
        } else {
          console.warn('[Booking] TTI booking failed:', gdsBookingResult.error, '— proceeding with local booking only');
        }
      } catch (ttiErr) {
        console.error('[Booking] TTI CreateBooking exception:', ttiErr.message, '— proceeding with local booking');
      }
    }

    // If this is a Sabre-sourced flight, create PNR with SSR in Sabre
    if (!gdsPnr && (flightSource === 'sabre' || flightData?._sabreSource)) {
      console.log('[Booking] Sabre flight detected — creating GDS booking with SSR...');
      try {
        gdsBookingResult = await sabreCreateBooking({
          flightData,
          passengers: passengers || [],
          contactInfo: contactInfo || {},
          specialServices: specialServices || {},
        });
        if (gdsBookingResult.success && gdsBookingResult.pnr) {
          gdsPnr = gdsBookingResult.pnr;
          console.log('[Booking] Sabre PNR created:', gdsPnr);
        } else {
          console.warn('[Booking] Sabre booking failed:', gdsBookingResult.error, '— proceeding with local booking only');
        }
      } catch (sabreErr) {
        console.error('[Booking] Sabre CreateBooking exception:', sabreErr.message, '— proceeding with local booking');
      }
    }

    await db.query(
      `INSERT INTO bookings (id, user_id, booking_type, booking_ref, status, total_amount, payment_method, payment_status, details, passenger_info, contact_info, payment_deadline)
       VALUES (?, ?, 'flight', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, req.user.sub, bookingRef, status, totalAmount || 0, paymentMethod || 'pay_later', payStatus,
       JSON.stringify({ ...details, gdsPnr, gdsBookingResult: gdsBookingResult || null }),
       JSON.stringify(passengers || []), JSON.stringify(contactInfo || {}),
       paymentDeadline]
    );

    // Create transaction only if paid
    if (!payLater) {
      await db.query(
        `INSERT INTO transactions (id, user_id, booking_id, type, amount, status, payment_method, reference, description)
         VALUES (?, ?, ?, 'payment', ?, 'completed', ?, ?, ?)`,
        [uuidv4(), req.user.sub, bookingId, totalAmount || 0, paymentMethod || 'card', bookingRef, `Flight booking ${origin} → ${destination}`]
      );

      // Create ticket only if paid immediately
      const ticketNo = `098-${String(Math.floor(Math.random()*9999999999)).padStart(10,'0')}`;
      await db.query(
        `INSERT INTO tickets (id, booking_id, user_id, ticket_no, pnr, status, details)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`,
        [uuidv4(), bookingId, req.user.sub, ticketNo, gdsPnr || bookingRef.slice(-6).toUpperCase(),
         JSON.stringify({ airline: flightData?.airline, flightNumber: flightData?.flightNumber, origin, destination, departureTime, passenger: passengers?.[0]?.firstName + ' ' + passengers?.[0]?.lastName })]
      );
    }

    notifyBookingConfirm(req.user.sub, { bookingRef, type: 'Flight', amount: totalAmount || 0 }).catch(console.error);
    res.status(201).json({
      id: bookingId,
      bookingRef,
      status,
      payLater: !!payLater,
      paymentDeadline: paymentDeadline ? paymentDeadline.toISOString() : null,
      totalAmount: totalAmount || 0,
      currency: 'BDT',
      bookingType: 'flight',
      pnr: gdsPnr || null,
      gdsBooked: !!(gdsBookingResult?.success),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Flight booking error:', err);
    res.status(500).json({ message: 'Something went wrong', status: 500 });
  }
});

module.exports = router;
