/**
 * TTI/ZENITH API proxy for Air Astra flight search
 * Credentials stored in system_settings DB table (not env vars)
 */

const db = require('../config/db');

// ── Config cache (5 min TTL) ──
let _configCache = null;
let _configCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getTTIConfig() {
  if (_configCache && Date.now() - _configCacheTime < CACHE_TTL) return _configCache;
  try {
    const [rows] = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'api_tti_astra'");
    if (rows.length > 0) {
      const tti = JSON.parse(rows[0].setting_value || '{}');
      const env = tti.environment || 'preproduction';
      const url = env === 'production' ? tti.prod_url : tti.preprod_url;
      const key = env === 'production' ? tti.prod_key : tti.preprod_key;
      if (url && key) {
        _configCache = { url, key, agencyId: tti.agency_id || '', agencyName: tti.agency_name || '', environment: env };
        _configCacheTime = Date.now();
        return _configCache;
      }
    }
  } catch (err) {
    console.error('Failed to load TTI config from DB:', err.message);
  }
  return null;
}

/** Clear cached config (call after admin saves settings) */
function clearTTIConfigCache() {
  _configCache = null;
  _configCacheTime = 0;
}

/**
 * Call a TTI JSON WCF endpoint
 */
async function ttiRequest(method, body) {
  const config = await getTTIConfig();
  if (!config) throw new Error('TTI API not configured — set credentials in Admin → Settings → API Integrations');

  // Try the configured URL first, then HTTPS fallback if HTTP fails
  const baseUrl = config.url.replace(/\/+$/, '');
  const urlsToTry = [baseUrl];

  // If HTTP, also try HTTPS; if HTTPS, also try HTTP
  if (baseUrl.startsWith('http://')) {
    urlsToTry.push(baseUrl.replace('http://', 'https://'));
  } else if (baseUrl.startsWith('https://')) {
    urlsToTry.push(baseUrl.replace('https://', 'http://'));
  }

  let lastError = null;

  for (const tryUrl of urlsToTry) {
    const fullUrl = `${tryUrl}/${method}`;
    console.log(`[TTI] → ${method} | Trying URL: ${fullUrl}`);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ request: body }),  // WCF requires wrapping in "request"
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const responseText = await res.text();
      console.log(`[TTI] ← ${method} | Status: ${res.status} | Body length: ${responseText.length}`);

      if (!res.ok) {
        console.error(`[TTI] ← ERROR (${res.status}): ${responseText.slice(0, 1000)}`);
        // Don't throw yet — try next URL
        lastError = new Error(`TTI ${method} failed (${res.status}): ${responseText.slice(0, 500)}`);
        continue;
      }

      try {
        const json = JSON.parse(responseText);
        console.log(`[TTI] ← Parsed OK. Keys:`, Object.keys(json));
        if (json.Segments) console.log(`[TTI] ← Segments: ${json.Segments.length}`);
        if (json.FareInfo?.Itineraries) console.log(`[TTI] ← Itineraries: ${json.FareInfo.Itineraries.length}`);
        if (json.ResponseInfo?.Errors?.length) console.log(`[TTI] ← ERRORS:`, JSON.stringify(json.ResponseInfo.Errors));

        // If this URL worked and it's different from configured, log it
        if (tryUrl !== baseUrl) {
          console.log(`[TTI] ✓ SUCCESS with fallback URL: ${tryUrl} (configured was: ${baseUrl})`);
        }
        return json;
      } catch (e) {
        console.error(`[TTI] ← JSON parse failed:`, responseText.slice(0, 500));
        lastError = new Error(`TTI ${method}: invalid JSON response`);
        continue;
      }
    } catch (fetchErr) {
      console.error(`[TTI] ✗ Connection failed for ${fullUrl}:`, fetchErr.message, fetchErr.cause || '');
      lastError = fetchErr;
      continue;
    }
  }

  throw lastError || new Error(`TTI ${method}: all URL attempts failed`);
}

/**
 * Search flights via TTI SearchFlights endpoint
 */
async function searchFlights({ origin, destination, departDate, returnDate, adults = 1, children = 0, infants = 0, cabinClass }) {
  const config = await getTTIConfig();
  if (!config) throw new Error('TTI API not configured');

  let refCounter = 1;
  const passengers = [];
  // TTI valid codes: AD (adult), CHD (child 2-12), INF (infant 0-2), INS (infant w/ seat), UM (unaccompanied minor)
  if (adults > 0) passengers.push({ Ref: String(refCounter++), PassengerTypeCode: 'AD', PassengerQuantity: parseInt(adults) });
  if (children > 0) passengers.push({ Ref: String(refCounter++), PassengerTypeCode: 'CHD', PassengerQuantity: parseInt(children) });
  if (infants > 0) passengers.push({ Ref: String(refCounter++), PassengerTypeCode: 'INF', PassengerQuantity: parseInt(infants) });

  let odRef = 1;
  const originDestinations = [
    { Ref: String(odRef++), OriginCode: origin, DestinationCode: destination, TargetDate: `/Date(${new Date(departDate).getTime()})/` }
  ];
  if (returnDate) {
    originDestinations.push(
      { Ref: String(odRef++), OriginCode: destination, DestinationCode: origin, TargetDate: `/Date(${new Date(returnDate).getTime()})/` }
    );
  }

  const request = {
    RequestInfo: { AuthenticationKey: config.key },
    Passengers: passengers,
    OriginDestinations: originDestinations,
    FareDisplaySettings: { SaleCurrencyCode: 'BDT' },
  };

  const response = await ttiRequest('SearchFlights', request);

  // TTI returns Error (singular object) not Errors (array)
  if (response.ResponseInfo?.Error) {
    const err = response.ResponseInfo.Error;
    throw new Error(`TTI search error: ${err.Message || err.Code || err.FullText || 'Unknown'}`);
  }

  return normalizeTTIResponse(response, origin, destination);
}

function parseTTIDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/\/Date\((-?\d+)([+-]\d{4})?\)\//);
  if (match) return new Date(parseInt(match[1]));
  return new Date(dateStr);
}

function formatDuration(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function normalizeTTIResponse(response, originCode, destinationCode) {
  const segments = response.Segments || [];
  const fareInfo = response.FareInfo || {};
  const itineraries = fareInfo.Itineraries || [];
  const etTicketFares = fareInfo.ETTicketFares || [];

  const segmentMap = {};
  for (const seg of segments) segmentMap[seg.Ref] = seg;

  const itinFareMap = {};
  for (const fare of etTicketFares) {
    if (fare.RefItinerary) {
      if (!itinFareMap[fare.RefItinerary]) itinFareMap[fare.RefItinerary] = [];
      itinFareMap[fare.RefItinerary].push(fare);
    }
  }

  const flights = [];

  for (const itin of itineraries) {
    const airODs = itin.AirOriginDestinations || [];
    const fares = itinFareMap[itin.Ref] || [];

    let totalPrice = 0;
    let currency = 'BDT';
    if (itin.SaleCurrencyAmount) {
      totalPrice = itin.SaleCurrencyAmount.Amount || itin.SaleCurrencyAmount.Value || 0;
      currency = itin.SaleCurrencyAmount.CurrencyCode || 'BDT';
    } else if (fares.length > 0) {
      for (const f of fares) {
        if (f.SaleCurrencyAmount) {
          totalPrice += f.SaleCurrencyAmount.Amount || f.SaleCurrencyAmount.Value || 0;
          currency = f.SaleCurrencyAmount.CurrencyCode || currency;
        }
      }
    }

    const itinSegments = [];
    for (const od of airODs) {
      const segRefs = od.SegmentReferences || od.Segments || [];
      for (const segRef of segRefs) {
        const ref = segRef.Ref || segRef.RefSegment || segRef;
        const seg = segmentMap[ref] || segmentMap[segRef];
        if (seg) itinSegments.push(seg);
      }
    }

    if (itinSegments.length === 0) continue;

    const legs = itinSegments.map(seg => {
      const fi = seg.FlightInfo || {};
      return {
        origin: seg.OriginCode,
        destination: seg.DestinationCode,
        departureTime: parseTTIDate(fi.DepartureDate)?.toISOString() || null,
        arrivalTime: parseTTIDate(fi.ArrivalDate)?.toISOString() || null,
        durationMinutes: fi.DurationMinutes || 0,
        duration: formatDuration(fi.DurationMinutes),
        flightNumber: `${seg.AirlineDesignator || ''}${fi.FlightNumber || ''}`,
        airlineCode: seg.AirlineDesignator || '',
        operatingAirline: fi.OperatingAirlineDesignator || seg.AirlineDesignator || '',
        aircraft: fi.EquipmentText || fi.EquipmentCode || '',
        originTerminal: fi.OriginAirportTerminal || '',
        destinationTerminal: fi.DestinationAirportTerminal || '',
        stops: (fi.Stops || []).map(s => ({
          code: s.AirportCode || s.Code || '',
          duration: s.DurationMinutes || 0,
        })),
      };
    });

    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];

    let totalDurationMin = 0;
    for (const leg of legs) totalDurationMin += leg.durationMinutes;
    for (let i = 1; i < legs.length; i++) {
      if (legs[i].departureTime && legs[i - 1].arrivalTime) {
        const layover = (new Date(legs[i].departureTime).getTime() - new Date(legs[i - 1].arrivalTime).getTime()) / 60000;
        if (layover > 0) totalDurationMin += layover;
      }
    }

    const stopsCount = legs.length - 1;
    const stopCodes = legs.slice(0, -1).map(l => l.destination);

    const fareDetails = [];
    for (const f of fares) {
      const odFares = f.OriginDestinationFares || [];
      for (const odf of odFares) {
        const couponFares = odf.ETCouponFares || odf.CouponFares || [];
        for (const cf of couponFares) {
          fareDetails.push({
            fareBasis: cf.FareBasisCode || '',
            bookingClass: cf.BookingClassCode || '',
            cabinClass: cf.CabinClassCode || '',
          });
        }
      }
    }

    const cabinClass = fareDetails[0]?.cabinClass || '';
    const cabinName = cabinClass === 'Y' ? 'Economy' : cabinClass === 'C' ? 'Business' : cabinClass === 'F' ? 'First' : cabinClass === 'W' ? 'Premium Economy' : cabinClass || 'Economy';

    flights.push({
      id: `tti-${itin.Ref}`,
      source: 'tti',
      airline: getAirlineName(firstLeg.airlineCode),
      airlineCode: firstLeg.airlineCode,
      airlineLogo: null,
      flightNumber: firstLeg.flightNumber,
      origin: firstLeg.origin,
      destination: lastLeg.destination,
      departureTime: firstLeg.departureTime,
      arrivalTime: lastLeg.arrivalTime,
      duration: formatDuration(totalDurationMin),
      durationMinutes: totalDurationMin,
      stops: stopsCount,
      stopCodes: stopCodes,
      cabinClass: cabinName,
      price: totalPrice,
      currency: currency,
      refundable: false,
      baggage: '20kg',
      aircraft: firstLeg.aircraft,
      legs: legs,
      itineraryRef: itin.Ref,
      validatingAirline: itin.ValidatingAirlineDesignator || firstLeg.airlineCode,
      fareDetails: fareDetails,
      _ttiItineraryRef: itin.Ref,
    });
  }

  return flights;
}

function getAirlineName(code) {
  const names = {
    'S2': 'Air Astra', 'BG': 'Biman Bangladesh', 'BS': 'US-Bangla Airlines',
    'VQ': 'Novoair', 'RX': 'Regent Airways', 'EK': 'Emirates',
    'QR': 'Qatar Airways', 'SQ': 'Singapore Airlines', 'TG': 'Thai Airways',
    '6E': 'IndiGo', 'G9': 'Air Arabia', 'MH': 'Malaysia Airlines',
    'TK': 'Turkish Airlines', 'CX': 'Cathay Pacific', 'AI': 'Air India',
    'UL': 'SriLankan Airlines', 'SV': 'Saudi Arabian Airlines', 'FZ': 'flydubai',
    'WY': 'Oman Air', 'GF': 'Gulf Air', 'PG': 'Bangkok Airways',
    'OZ': 'Asiana Airlines', 'KE': 'Korean Air', 'NH': 'ANA',
    'JL': 'Japan Airlines', 'LH': 'Lufthansa', 'BA': 'British Airways',
    'AF': 'Air France', 'KL': 'KLM', 'LO': 'LOT Polish Airlines',
    'SK': 'SAS', 'ET': 'Ethiopian Airlines',
  };
  return names[code] || code;
}

module.exports = { searchFlights, ttiRequest, getTTIConfig, getAirlineName, clearTTIConfigCache };
