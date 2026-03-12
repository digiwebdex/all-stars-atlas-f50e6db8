/**
 * BDFare API provider for flight search
 * Bangladesh's largest B2B/B2C flight aggregator
 * Covers: Biman Bangladesh (BG), US-Bangla (BS), NovoAir (VQ), + international carriers
 * 
 * API Docs: https://developer.bdfares.com
 * 
 * SETUP:
 *  1. Register at https://bdfares.com/agent-registration
 *  2. Get API credentials (username + API key)
 *  3. Add credentials in Admin → Settings → API Integrations → BDFare
 *  4. Toggle environment (sandbox/production) in admin panel
 */

const db = require('../config/db');

// ── Config cache (5 min TTL) ──
let _configCache = null;
let _configCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getBDFareConfig() {
  if (_configCache && Date.now() - _configCacheTime < CACHE_TTL) return _configCache;
  try {
    const [rows] = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'api_bdfare'");
    if (rows.length > 0) {
      const cfg = JSON.parse(rows[0].setting_value || '{}');
      if (!cfg.enabled) return null;
      const env = cfg.environment || 'sandbox';
      const baseUrl = env === 'production'
        ? (cfg.prod_url || 'https://api.bdfares.com/v1')
        : (cfg.sandbox_url || 'https://sandbox.bdfares.com/v1');
      const apiKey = env === 'production' ? cfg.prod_key : cfg.sandbox_key;
      if (baseUrl && apiKey) {
        _configCache = { baseUrl, apiKey, username: cfg.username || '', environment: env };
        _configCacheTime = Date.now();
        return _configCache;
      }
    }
  } catch (err) {
    console.error('[BDFare] Failed to load config:', err.message);
  }
  return null;
}

function clearBDFareConfigCache() {
  _configCache = null;
  _configCacheTime = 0;
}

/**
 * Search flights via BDFare API
 * @returns {Array} Normalized flight objects matching TTI output format
 */
async function searchFlights({ origin, destination, departDate, returnDate, adults = 1, children = 0, infants = 0, cabinClass }) {
  const config = await getBDFareConfig();
  if (!config) {
    console.log('[BDFare] Not configured or disabled — skipping');
    return [];
  }

  try {
    const requestBody = {
      origin,
      destination,
      departureDate: departDate,
      returnDate: returnDate || undefined,
      adults: parseInt(adults),
      children: parseInt(children),
      infants: parseInt(infants),
      cabinClass: (cabinClass || 'Economy').charAt(0).toUpperCase() + (cabinClass || 'Economy').slice(1),
      currency: 'BDT',
    };

    console.log(`[BDFare] → SearchFlights ${origin}→${destination} on ${departDate}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${config.baseUrl}/flights/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Username': config.username,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BDFare] ← Error (${response.status}):`, errorText.slice(0, 500));
      return [];
    }

    const data = await response.json();
    console.log(`[BDFare] ← ${data.flights?.length || 0} flights found`);

    return normalizeBDFareResponse(data, origin, destination);
  } catch (err) {
    console.error('[BDFare] Search failed:', err.message);
    return [];
  }
}

/**
 * Normalize BDFare response to match our unified flight format
 * NOTE: Actual field mapping will be updated once BDFare API access is obtained.
 *       This is a scaffold based on typical OTA response structures.
 */
function normalizeBDFareResponse(response, originCode, destinationCode) {
  const flights = response.flights || response.data || response.results || [];
  
  return flights.map((f, idx) => {
    const segments = f.segments || f.legs || [f];
    const firstSeg = segments[0] || {};
    const lastSeg = segments[segments.length - 1] || firstSeg;

    return {
      id: `bdf-${f.id || f.offerId || idx}`,
      source: 'bdfare',
      airline: f.airline || f.carrierName || firstSeg.airline || '',
      airlineCode: f.airlineCode || f.carrierCode || firstSeg.airlineCode || '',
      airlineLogo: null,
      flightNumber: f.flightNumber || firstSeg.flightNumber || '',
      origin: f.origin || firstSeg.origin || originCode,
      destination: f.destination || lastSeg.destination || destinationCode,
      departureTime: f.departureTime || firstSeg.departureTime || null,
      arrivalTime: f.arrivalTime || lastSeg.arrivalTime || null,
      duration: f.duration || '',
      durationMinutes: f.durationMinutes || 0,
      stops: segments.length - 1,
      stopCodes: segments.length > 1 ? segments.slice(0, -1).map(s => s.destination) : [],
      cabinClass: f.cabinClass || 'Economy',
      bookingClass: f.bookingClass || firstSeg.bookingClass || '',
      availableSeats: f.availableSeats ?? f.seatsAvailable ?? f.seats ?? firstSeg.availableSeats ?? null,
      price: parseFloat(f.price || f.totalFare || f.totalPrice || 0),
      baseFare: parseFloat(f.baseFare || f.basePrice || 0) || parseFloat(f.price || f.totalFare || f.totalPrice || 0),
      taxes: parseFloat(f.taxes || f.taxAmount || 0),
      currency: f.currency || 'BDT',
      refundable: f.refundable || f.isRefundable || false,
      baggage: f.baggage || null,
      handBaggage: f.handBaggage || f.cabinBaggage || null,
      aircraft: f.aircraft || firstSeg.aircraft || '',
      legs: segments.map(seg => ({
        origin: seg.origin || '',
        destination: seg.destination || '',
        departureTime: seg.departureTime || null,
        arrivalTime: seg.arrivalTime || null,
        duration: seg.duration || '',
        durationMinutes: seg.durationMinutes || 0,
        flightNumber: seg.flightNumber || '',
        airlineCode: seg.airlineCode || '',
        operatingAirline: seg.operatingAirline || seg.airlineCode || '',
        aircraft: seg.aircraft || '',
        originTerminal: seg.originTerminal || '',
        destinationTerminal: seg.destinationTerminal || '',
        stops: [],
      })),
      fareDetails: f.fareDetails || [],
      timeLimit: f.lastTicketingDate || f.ticketTimeLimit || f.timeLimit || null,
      _bdfOfferId: f.id || f.offerId || null,
    };
  });
}

/**
 * Book a flight via BDFare AirBook endpoint
 * Requires the _bdfOfferId from search results
 */
async function createBooking({ offerId, passengers, contactInfo }) {
  const config = await getBDFareConfig();
  if (!config) throw new Error('BDFare API not configured');

  console.log('[BDFare] Creating booking for offerId:', offerId);

  try {
    const body = {
      offerId,
      passengers: passengers.map((p, i) => ({
        type: p.type || 'ADT',
        title: p.title || 'Mr',
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dob,
        gender: p.title === 'Mr' ? 'Male' : 'Female',
        nationality: p.nationality || 'BD',
        passport: p.passport || null,
        passportExpiry: p.passportExpiry || null,
      })),
      contact: {
        email: contactInfo?.email || '',
        phone: contactInfo?.phone || '',
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${config.baseUrl}/flights/book`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.username ? { 'X-Username': config.username } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `BDFare booking failed (${res.status})`);

    const pnr = data.pnr || data.bookingReference || data.booking?.pnr || null;
    const orderId = data.orderId || data.booking?.orderId || data.id || null;

    console.log('[BDFare] Booking created — PNR:', pnr, 'OrderId:', orderId);
    return { success: true, pnr, orderId, rawResponse: data };
  } catch (err) {
    console.error('[BDFare] CreateBooking failed:', err.message);
    return { success: false, error: err.message, pnr: null };
  }
}

/**
 * Issue ticket for BDFare booking
 */
async function issueTicket({ orderId, pnr }) {
  const config = await getBDFareConfig();
  if (!config) throw new Error('BDFare API not configured');

  console.log('[BDFare] Issuing ticket for order:', orderId || pnr);

  try {
    const res = await fetch(`${config.baseUrl}/flights/ticket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.username ? { 'X-Username': config.username } : {}),
      },
      body: JSON.stringify({ orderId, pnr }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `BDFare ticketing failed (${res.status})`);

    const ticketNumbers = data.ticketNumbers || data.tickets?.map(t => t.number) || [];
    console.log('[BDFare] Tickets issued:', ticketNumbers);
    return { success: true, ticketNumbers, rawResponse: data };
  } catch (err) {
    console.error('[BDFare] IssueTicket failed:', err.message);
    return { success: false, error: err.message, ticketNumbers: [] };
  }
}

/**
 * Cancel a BDFare booking
 */
async function cancelBooking({ orderId, pnr }) {
  const config = await getBDFareConfig();
  if (!config) throw new Error('BDFare API not configured');

  console.log('[BDFare] Cancelling order:', orderId || pnr);

  try {
    const res = await fetch(`${config.baseUrl}/flights/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.username ? { 'X-Username': config.username } : {}),
      },
      body: JSON.stringify({ orderId, pnr }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `BDFare cancel failed (${res.status})`);

    console.log('[BDFare] Booking cancelled');
    return { success: true, rawResponse: data };
  } catch (err) {
    console.error('[BDFare] CancelBooking failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { searchFlights, createBooking, issueTicket, cancelBooking, getBDFareConfig, clearBDFareConfigCache };
