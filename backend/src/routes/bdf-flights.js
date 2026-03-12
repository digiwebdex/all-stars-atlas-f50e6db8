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
 * Based on actual BDFare API v2 response: { flightInfos: [{ flightSummary, grossAmount, netAmount, ... }] }
 */
function normalizeBDFareResponse(response, originCode, destinationCode) {
  const flightInfos = response.flightInfos || response.flights || response.data || [];
  const results = [];

  for (let idx = 0; idx < flightInfos.length; idx++) {
    try {
      const f = flightInfos[idx];
      const summaries = f.flightSummary || [];
      if (summaries.length === 0) continue;

      const firstSeg = summaries[0] || {};
      const lastSeg = summaries[summaries.length - 1] || {};

      // Parse price — BDFare returns "BDT 65411" format or numeric
      const parsePrice = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
      };

      const price = f.amount || parsePrice(f.netAmount) || parsePrice(f.customerNetAmount) || parsePrice(f.grossAmount) || 0;
      const currency = f.currency || 'BDT';

      // Extract stops from layover info
      const stopCodes = (f.layoverAirports || []).filter(Boolean);
      const stops = f.stopKey
        ? f.stopKey.filter(k => k === 'OS' || k === 'MS').length
        : Math.max(0, summaries.length - 1);

      // Duration
      const totalDuration = f.duration || 0; // minutes
      const formatDur = (mins) => {
        if (!mins) return '';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
      };

      // Build airline info from summaryAirlineFlight or first segment
      const summaryAirline = f.summaryAirlineFlight || {};
      const airlineCode = f.airlineCode || (summaryAirline.airlineCode?.[0]) || (firstSeg.airlineCode?.[0]) || '';
      const airlineName = summaryAirline.airlineName || firstSeg.airlineName || airlineCode;
      const flightNumber = summaryAirline.airlineFlightNumber || firstSeg.airlineFlightNumber || '';

      // Build legs from flightSummary segments
      const legs = summaries.map(seg => {
        const segStops = seg.layoverInfo?.stops || [];
        return {
          origin: seg.departureAirportCode || '',
          destination: seg.arrivalAirportCode || '',
          departureTime: seg.departureDate && seg.departureTime
            ? parseBDFareDateTime(seg.departureDate, seg.departureTime)
            : null,
          arrivalTime: seg.arrivalDate && seg.arrivalTime
            ? parseBDFareDateTime(seg.arrivalDate, seg.arrivalTime)
            : null,
          duration: seg.journeyDuration || '',
          durationMinutes: parseBDFareDuration(seg.journeyDuration),
          flightNumber: seg.airlineFlightNumber || '',
          airlineCode: (seg.airlineCode?.[0]) || airlineCode,
          operatingAirline: (seg.airlineCode?.[0]) || airlineCode,
          aircraft: '',
          originTerminal: '',
          destinationTerminal: '',
          originAirportName: seg.departureAirportName || '',
          destinationAirportName: seg.arrivalAirportName || '',
          originCity: seg.departureCity || '',
          destinationCity: seg.arrivalCity || '',
          stops: segStops.map(s => ({
            code: s.airportCode || '',
            city: s.cityName || '',
            duration: s.jourenyDuration || s.journeyDuration || '',
          })),
        };
      });

      const departureTime = legs[0]?.departureTime || null;
      const arrivalTime = legs[legs.length - 1]?.arrivalTime || null;

      results.push({
        id: `bdf-${f.itineraryId || idx}`,
        source: 'bdfare',
        airline: airlineName,
        airlineCode,
        airlineLogo: (summaryAirline.airlineLogo?.[0]) || null,
        flightNumber,
        origin: firstSeg.departureAirportCode || originCode,
        destination: lastSeg.arrivalAirportCode || destinationCode,
        departureTime,
        arrivalTime,
        duration: formatDur(totalDuration),
        durationMinutes: totalDuration,
        stops: stopCodes.length > 0 ? Math.ceil(stopCodes.length / (summaries.length || 1)) : stops,
        stopCodes,
        cabinClass: f.productClass || 'Economy',
        bookingClass: '',
        availableSeats: null,
        price,
        baseFare: price,
        taxes: 0,
        currency,
        refundable: f.refundable === true,
        baggage: null,
        handBaggage: null,
        aircraft: '',
        legs,
        fareDetails: [],
        fareType: f.fareFilterType || (f.refundable ? 'Refundable' : 'Non-Refundable'),
        timeLimit: null,
        _bdfOfferId: f.itineraryId || null,
        _bdfGroupId: f.groupId || null,
      });
    } catch (e) {
      console.error('[BDFare] Normalize error on item', idx, ':', e.message);
    }
  }

  console.log(`[BDFare] Normalized ${results.length} flights from ${flightInfos.length} raw items`);
  return results;
}

/**
 * Parse BDFare date+time strings like "02 Apr, Thu" + "15:55" into ISO datetime
 */
function parseBDFareDateTime(dateStr, timeStr) {
  try {
    // dateStr = "02 Apr, Thu" or "02 May, Sat"
    const cleaned = dateStr.replace(/,\s*\w+$/, '').trim(); // remove day name: "02 Apr"
    const currentYear = new Date().getFullYear();
    const d = new Date(`${cleaned} ${currentYear} ${timeStr}`);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Parse BDFare duration string like "17h 50m" into minutes
 */
function parseBDFareDuration(durStr) {
  if (!durStr) return 0;
  const hMatch = durStr.match(/(\d+)h/);
  const mMatch = durStr.match(/(\d+)m/);
  return (parseInt(hMatch?.[1] || '0') * 60) + parseInt(mMatch?.[1] || '0');
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
