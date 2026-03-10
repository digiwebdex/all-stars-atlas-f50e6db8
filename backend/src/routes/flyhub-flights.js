// FlyHub Flight GDS Integration
// Reads credentials from system_settings table (api_flyhub)
// Admin Panel → Settings → API Integrations → FlyHub

const db = require('../config/db');

let cachedConfig = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function getFlyHubConfig() {
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) return cachedConfig;
  try {
    const [rows] = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'api_flyhub'");
    if (rows.length === 0 || !rows[0].setting_value) return null;
    const cfg = JSON.parse(rows[0].setting_value);
    if (cfg.enabled !== 'true' && cfg.enabled !== true) return null;

    const isProd = cfg.environment === 'production';
    const baseUrl = isProd ? (cfg.prod_url || 'https://api.flyhub.com/api/v1') : (cfg.sandbox_url || 'https://api.sandbox.flyhub.com/api/v1');
    const apiKey = isProd ? cfg.prod_key : cfg.sandbox_key;
    if (!apiKey) return null;

    cachedConfig = { baseUrl: baseUrl.replace(/\/$/, ''), apiKey, environment: cfg.environment };
    cacheTime = Date.now();
    return cachedConfig;
  } catch (err) {
    console.error('[FlyHub] Config load error:', err.message);
    return null;
  }
}

function clearFlyHubConfigCache() { cachedConfig = null; cacheTime = 0; }

// Authenticate and get bearer token
let tokenCache = { token: null, expiresAt: 0 };

async function getToken(config) {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  try {
    const res = await fetch(`${config.baseUrl}/Authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: config.apiKey }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.TokenId) {
      tokenCache = { token: data.TokenId, expiresAt: Date.now() + 23 * 60 * 60 * 1000 }; // 23h
      return data.TokenId;
    }
    return null;
  } catch (err) {
    console.error('[FlyHub] Auth error:', err.message);
    return null;
  }
}

async function searchFlights({ origin, destination, departDate, returnDate, adults = 1, children = 0, infants = 0, cabinClass }) {
  const config = await getFlyHubConfig();
  if (!config) return [];

  const token = await getToken(config);
  if (!token) { console.warn('[FlyHub] No auth token'); return []; }

  const cabinMap = { Economy: '1', 'Premium Economy': '2', Business: '3', First: '4' };
  const segments = [{ Origin: origin, Destination: destination, CabinClass: cabinMap[cabinClass] || '1', DepartureDateTime: departDate }];
  if (returnDate) segments.push({ Origin: destination, Destination: origin, CabinClass: cabinMap[cabinClass] || '1', DepartureDateTime: returnDate });

  const requestBody = {
    AdultQuantity: parseInt(adults),
    ChildQuantity: parseInt(children),
    InfantQuantity: parseInt(infants),
    EndUserIp: '127.0.0.1',
    JourneyType: returnDate ? '2' : '1', // 1=OneWay, 2=Return
    Segments: segments,
  };

  try {
    const res = await fetch(`${config.baseUrl}/AirSearch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) { console.error('[FlyHub] Search HTTP', res.status); return []; }
    const data = await res.json();
    return normalizeFlyHubResponse(data, origin, destination, !!returnDate);
  } catch (err) {
    console.error('[FlyHub] Search error:', err.message);
    return [];
  }
}

function normalizeFlyHubResponse(response, originCode, destinationCode, isRoundTrip) {
  const results = response.Results || [];
  const flights = [];

  for (const resultGroup of results) {
    const items = Array.isArray(resultGroup) ? resultGroup : [resultGroup];
    for (const item of items) {
      const segments = item.segments || item.Segments || [];
      if (segments.length === 0) continue;

      const firstSeg = segments[0];
      const lastSeg = segments[segments.length - 1];

      const legs = segments.map(seg => ({
        origin: seg.Origin?.Airport?.AirportCode || seg.origin || '',
        destination: seg.Destination?.Airport?.AirportCode || seg.destination || '',
        departureTime: seg.Origin?.DepTime || seg.departureTime || null,
        arrivalTime: seg.Destination?.ArrTime || seg.arrivalTime || null,
        durationMinutes: seg.JourneyDuration || seg.Duration || 0,
        duration: formatMinutes(seg.JourneyDuration || seg.Duration || 0),
        flightNumber: `${seg.Airline?.AirlineCode || ''}${seg.Airline?.FlightNumber || seg.flightNumber || ''}`,
        airlineCode: seg.Airline?.AirlineCode || seg.airlineCode || '',
        operatingAirline: seg.Airline?.OperatingCarrier || seg.Airline?.AirlineCode || '',
        aircraft: seg.Equipment || '',
        originTerminal: seg.Origin?.Airport?.Terminal || '',
        destinationTerminal: seg.Destination?.Airport?.Terminal || '',
        stops: [],
      }));

      const totalDuration = legs.reduce((sum, l) => sum + l.durationMinutes, 0);
      const fareInfo = item.Fares || item.fares || [];
      const baseFare = fareInfo.reduce((s, f) => s + (f.BaseFare || 0), 0);
      const totalFare = item.TotalFare || fareInfo.reduce((s, f) => s + (f.BaseFare || 0) + (f.Tax || 0) + (f.OtherCharges || 0), 0);

      // Extract seat availability from fare info
      let minSeats = Infinity;
      for (const f of fareInfo) {
        const seats = f.AvailableSeats ?? f.SeatAvailability ?? f.Availability ?? null;
        if (seats !== null && typeof seats === 'number' && seats < minSeats) minSeats = seats;
      }
      // Also check segment-level availability
      for (const seg of segments) {
        const seats = seg.AvailableSeats ?? seg.Availability ?? seg.NoOfSeatAvailable ?? null;
        if (seats !== null && typeof seats === 'number' && seats < minSeats) minSeats = seats;
      }
      const availableSeats = minSeats === Infinity ? null : minSeats;

      flights.push({
        id: `fh-${item.ResultID || item.resultId || flights.length}`,
        source: 'flyhub',
        airline: firstSeg.Airline?.AirlineName || getAirlineName(firstSeg.Airline?.AirlineCode),
        airlineCode: firstSeg.Airline?.AirlineCode || '',
        airlineLogo: null,
        flightNumber: legs[0]?.flightNumber || '',
        origin: legs[0]?.origin || originCode,
        destination: legs[legs.length - 1]?.destination || destinationCode,
        departureTime: legs[0]?.departureTime || null,
        arrivalTime: legs[legs.length - 1]?.arrivalTime || null,
        duration: formatMinutes(totalDuration),
        durationMinutes: totalDuration,
        stops: legs.length - 1,
        stopCodes: legs.length > 1 ? legs.slice(0, -1).map(l => l.destination) : [],
        cabinClass: item.CabinClass || 'Economy',
        bookingClass: fareInfo[0]?.BookingClass || '',
        availableSeats: availableSeats,
        price: totalFare || baseFare,
        baseFare: baseFare,
        taxes: fareInfo.reduce((s, f) => s + (f.Tax || 0) + (f.OtherCharges || 0), 0),
        currency: item.Currency || 'BDT',
        refundable: item.IsRefundable || false,
        baggage: item.Baggage || null,
        handBaggage: item.CabinBaggage || null,
        aircraft: legs[0]?.aircraft || '',
        legs,
        timeLimit: item.LastTicketDate || item.TicketTimeLimit || null,
        fareDetails: fareInfo.map(f => ({ fareBasis: f.FareBasis || '', bookingClass: f.BookingClass || '', cabinClass: f.CabinClass || '', availableSeats: f.AvailableSeats ?? null })),
        _flyhubResultId: item.ResultID || null,
        validatingAirline: item.ValidatingAirline || firstSeg.Airline?.AirlineCode || '',
      });
    }
  }
  return flights;
}

function formatMinutes(mins) {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function getAirlineName(code) {
  const map = { 'BG': 'Biman Bangladesh', 'BS': 'US-Bangla', 'VQ': 'Novoair', '2A': 'Air Astra', 'EK': 'Emirates', 'QR': 'Qatar Airways', 'SQ': 'Singapore Airlines', 'TG': 'Thai Airways', 'TK': 'Turkish Airlines', '6E': 'IndiGo', 'AI': 'Air India', 'SV': 'Saudia', 'MH': 'Malaysia Airlines' };
  return map[code] || code || '';
}

module.exports = { searchFlights, getFlyHubConfig, clearFlyHubConfigCache };
