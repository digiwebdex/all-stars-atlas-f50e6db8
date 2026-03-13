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
    // Key includes ALL leg flight numbers + times to preserve different round-trip/connection combos
    const seen = new Set();
    flights = flights.filter(f => {
      // Build a comprehensive key from all legs
      const legsKey = (f.legs || []).map(l => `${l.flightNumber || ''}@${l.departureTime || ''}`).join('|');
      const stopKey = (f.stopCodes || []).join(',');
      const key = `${f.flightNumber}-${f.departureTime}-${f.arrivalTime || ''}-${f.destination}-${f.stops ?? 0}-${stopKey}-${f.direction || ''}-${legsKey}`;
      if (key === '---------' || !f.flightNumber) return true; // keep unkeyed
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ── Apply per-airline fare rules from admin settings ──
    try {
      const [settingsRows] = await db.query(
        "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('markup_config', 'airline_markup_config')"
      );
      let globalDiscount = 6.30;
      let globalAitVat = 0.3;
      let airlineOverrides = {};

      for (const row of settingsRows) {
        const parsed = typeof row.setting_value === 'string' ? JSON.parse(row.setting_value) : (row.setting_value || {});
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
 * API-ONLY: Uses airline-provided timeLimit / LastTicketingDate from GDS.
 * No hardcoded fallbacks — if GDS provides no deadline, returns null.
 */
function resolvePaymentDeadline(airlineTimeLimit) {
  if (airlineTimeLimit) {
    const tl = new Date(airlineTimeLimit);
    if (!isNaN(tl.getTime()) && tl > new Date()) {
      return tl;
    }
  }
  return null; // No deadline from API — booking stays open until airline auto-cancels
}

// POST /flights/book
router.post('/book', authenticate, async (req, res) => {
  try {
    const {
      flightData,
      returnFlightData,
      passengers: rawPassengers,
      isRoundTrip,
      isDomestic,
      payLater,
      paymentMethod,
      totalAmount,
      baseFare,
      taxes,
      serviceCharge,
      addOns,
      contactInfo,
      travelDocuments,
      specialServices,
    } = req.body;

    const passengers = (Array.isArray(rawPassengers) ? rawPassengers : []).map((p) => {
      const titleRaw = String(p?.title || p?.civility || '').trim();
      const title = titleRaw || 'Mr';
      const firstName = String(p?.firstName || p?.firstname || p?.givenName || '').trim();
      const lastName = String(p?.lastName || p?.lastname || p?.surname || '').trim();
      const dateOfBirth = p?.dateOfBirth || p?.dob || p?.birthDate || null;
      const passportNumber = p?.passportNumber || p?.passport || p?.documentNumber || null;
      const passportExpiry = p?.passportExpiry || p?.documentExpiry || p?.expiryDate || null;
      const passportCountry = p?.passportCountry || p?.documentCountry || p?.nationality || 'BD';
      const nationality = p?.nationality || passportCountry || 'BD';
      const genderRaw = String(p?.gender || '').trim().toLowerCase();
      const gender = genderRaw || (/^(mr|mstr)$/i.test(title) ? 'male' : 'female');

      return {
        ...p,
        title,
        firstName,
        lastName,
        dateOfBirth,
        dob: dateOfBirth,
        gender,
        type: p?.type || 'adult',
        nationality,
        passportCountry,
        passportNumber,
        passport: passportNumber,
        passportExpiry,
      };
    });

    const bookingId = uuidv4();
    // Temporary fallback ref — will be replaced with real PNR after GDS booking
    let bookingRef = `ST-FL-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random()*999)).padStart(3,'0')}`;

    const origin = flightData?.origin || '';
    const destination = flightData?.destination || '';
    const departureTime = flightData?.departureTime || new Date().toISOString();

    // Determine domestic/international
    const domestic = isDomestic !== undefined ? isDomestic : (BD_AIRPORTS.includes(origin.toUpperCase()) && BD_AIRPORTS.includes(destination.toUpperCase()));

    // Resolve payment deadline: API-only, from airline GDS timeLimit
    const airlineTimeLimit = flightData?.timeLimit || null;
    let paymentDeadline = null;
    if (payLater) {
      paymentDeadline = resolvePaymentDeadline(airlineTimeLimit);
    }

    const status = payLater ? 'on_hold' : 'confirmed';
    const payStatus = payLater ? 'pending' : 'paid';

    const flightSourceRaw = flightData?.source || flightData?.provider || '';
    const flightSource = String(flightSourceRaw).toLowerCase().trim();
    const airlineCode = String(flightData?.airlineCode || '').toUpperCase();
    const isTtiFlight = flightSource.includes('tti') || flightSource.includes('astra') || ['2A', 'S2'].includes(airlineCode);
    const isSabreFlight = flightSource.includes('sabre') || !!flightData?._sabreSource;

    const details = {
      outbound: flightData || {},
      return: returnFlightData || null,
      isRoundTrip: !!isRoundTrip,
      isDomestic: domestic,
      source: flightSource || null,
      addOns: addOns || {},
      specialServices: specialServices || {},
      baseFare, taxes, serviceCharge,
      travelDocuments: travelDocuments || [],
    };

    // Create booking in external GDS first (TTI/Sabre)
    let gdsPnr = null;
    let gdsBookingResult = null;
    let airlinePnr = null; // Actual airline record locator (e.g., "00KSQZ")
    let gdsBookingId = null; // Internal GDS booking ID (e.g., "1654483")

    if (isTtiFlight) {
      console.log('[Booking] TTI/Air Astra flight detected — creating GDS booking...');
      try {
        gdsBookingResult = await ttiCreateBooking({ flightData, passengers, contactInfo: contactInfo || {} });
        if (gdsBookingResult.success && (gdsBookingResult.pnr || gdsBookingResult.ttiBookingId)) {
          gdsPnr = gdsBookingResult.pnr || gdsBookingResult.ttiBookingId || null;
          airlinePnr = gdsBookingResult.airlinePnr || null;
          gdsBookingId = gdsBookingResult.ttiBookingId || null;
          console.log('[Booking] TTI PNR:', gdsPnr, '| Airline PNR:', airlinePnr, '| Booking ID:', gdsBookingId);
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

    if (!gdsPnr && isSabreFlight) {
      console.log('[Booking] Sabre flight detected — creating GDS booking with SSR...');
      try {
        gdsBookingResult = await sabreCreateBooking({
          flightData,
          passengers,
          contactInfo: contactInfo || {},
          specialServices: specialServices || {},
        });
        if (gdsBookingResult.success && gdsBookingResult.pnr) {
          gdsPnr = gdsBookingResult.pnr;
          airlinePnr = gdsBookingResult.pnr;
          console.log('[Booking] Sabre PNR created:', gdsPnr);
          if (gdsBookingResult.ticketTimeLimit && payLater) {
            const sabreDeadline = new Date(gdsBookingResult.ticketTimeLimit);
            if (!isNaN(sabreDeadline.getTime()) && sabreDeadline > new Date()) {
              paymentDeadline = sabreDeadline;
              console.log('[Booking] Sabre ticket time limit:', paymentDeadline.toISOString());
            }
          }
        } else {
          console.warn('[Booking] Sabre booking failed:', gdsBookingResult.error, '— proceeding with local booking only');
        }
      } catch (sabreErr) {
        console.error('[Booking] Sabre CreateBooking exception:', sabreErr.message, '— proceeding with local booking');
      }
    }

    // Use real PNR as booking reference when available
    if (gdsPnr) {
      bookingRef = gdsPnr;
    }

    const flightRoute = `${origin}-${destination}`;
    const flightProvider = flightSource || (isTtiFlight ? 'tti' : (isSabreFlight ? 'sabre' : (gdsPnr ? 'gds' : 'local')));

    await db.query(
      `INSERT INTO bookings (id, user_id, booking_type, booking_ref, pnr, status, ticket_status, provider, route, total_amount, payment_method, payment_status, details, passenger_info, contact_info, payment_deadline)
       VALUES (?, ?, 'flight', ?, ?, ?, 'not_issued', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, req.user.sub, bookingRef, gdsPnr || null, status, flightProvider, flightRoute, totalAmount || 0, paymentMethod || 'pay_later', payStatus,
       JSON.stringify({ ...details, gdsPnr, airlinePnr, gdsBookingId, gdsBookingResult: gdsBookingResult || null }),
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
      airlinePnr: airlinePnr || null,
      gdsBookingId: gdsBookingId || null,
      gdsBooked: !!(gdsBookingResult?.success),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Flight booking error:', err);
    res.status(500).json({ message: 'Something went wrong', status: 500 });
  }
});
// POST /flights/cancel — customer cancellation
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    if (!bookingId) return res.status(400).json({ message: 'bookingId required' });

    const [rows] = await db.query('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [bookingId, req.user.sub]);
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });

    const booking = rows[0];
    if (['cancelled', 'void', 'refunded', 'completed'].includes(booking.status)) {
      return res.status(422).json({ message: `Booking already ${booking.status}` });
    }

    const details = typeof booking.details === 'string' ? JSON.parse(booking.details) : (booking.details || {});
    const gdsPnr = details.gdsPnr || booking.pnr;
    const sourceRaw = details.outbound?.source || details.source || booking.provider || '';
    const source = String(sourceRaw).toLowerCase().trim();

    const airlineCode = String(details.outbound?.airlineCode || details.airlineCode || '').toUpperCase();
    const isSabreSource = source.includes('sabre');
    const isTtiSource = source.includes('tti') || source.includes('astra') || ['2A', 'S2'].includes(airlineCode);

    // For TTI, provider booking id from GDS response is required (local booking.id is NOT valid for TTI Cancel API)
    const ttiBookingId = details?.gdsBookingResult?.ttiBookingId
      || details?.gdsBookingId
      || details?.ttiBookingId
      || details?.outbound?._ttiBookingId
      || null;

    // Attempt GDS cancellation if PNR exists
    let gdsCancelResult = null;
    let gdsCancelFailed = false;
    if (gdsPnr) {
      try {
        console.log(`[Cancel] Provider source='${source}' | airlineCode='${airlineCode || '-'}' | booking.provider='${booking.provider || ''}' | pnr='${gdsPnr}' | ttiBookingId='${ttiBookingId || '-'}'`);

        if (isSabreSource) {
          const { cancelBooking: sabreCancelBooking } = require('./sabre-flights');
          gdsCancelResult = await sabreCancelBooking({ pnr: gdsPnr });
          if (!gdsCancelResult?.success) gdsCancelFailed = true;
        } else if (isTtiSource) {
          const { cancelBooking: ttiCancelBooking } = require('./tti-flights');
          gdsCancelResult = await ttiCancelBooking({ pnr: gdsPnr, bookingId: ttiBookingId });
          if (!gdsCancelResult?.success) gdsCancelFailed = true;
        } else {
          gdsCancelFailed = true;
          gdsCancelResult = { success: false, error: `Unsupported provider/source for cancellation: ${source || 'unknown'}` };
        }
      } catch (gdsErr) {
        console.error('[Cancel] GDS cancel error:', gdsErr.message);
        gdsCancelFailed = true;
        gdsCancelResult = { success: false, error: gdsErr.message };
      }
    }

    // Safety block: if GDS cancel failed and PNR exists, don't update local status
    if (gdsCancelFailed && gdsPnr) {
      console.warn(`[Cancel] GDS cancel failed for PNR ${gdsPnr} — local status NOT changed`);
      return res.status(422).json({
        message: 'GDS cancellation failed — booking status unchanged',
        gdsError: gdsCancelResult?.error || 'Provider returned failure',
        hint: 'Contact support or try again later',
      });
    }

    await db.query('UPDATE bookings SET status = ?, notes = CONCAT(IFNULL(notes,""), ?) WHERE id = ?', [
      'cancelled',
      `\n[Customer Cancel ${new Date().toISOString()}] ${reason || 'No reason provided'}${gdsPnr ? ` | GDS: ${gdsCancelResult?.success ? 'OK' : 'N/A'}` : ''}`,
      bookingId,
    ]);

    console.log(`[Cancel] Booking ${booking.booking_ref} cancelled by user ${req.user.sub}`);
    res.json({ success: true, message: 'Booking cancelled', gdsCancelled: !!(gdsCancelResult?.success) });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
