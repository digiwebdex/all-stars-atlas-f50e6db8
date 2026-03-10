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

  const baseUrl = config.url.replace(/\/+$/, '');
  const urlsToTry = [baseUrl];

  if (baseUrl.startsWith('http://')) {
    urlsToTry.push(baseUrl.replace('http://', 'https://'));
  } else if (baseUrl.startsWith('https://')) {
    urlsToTry.push(baseUrl.replace('https://', 'http://'));
  }

  let lastError = null;

  for (const tryUrl of urlsToTry) {
    const fullUrl = `${tryUrl}/${method}`;
    console.log(`[TTI] → ${method} | URL: ${fullUrl}`);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ request: body }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const responseText = await res.text();
      console.log(`[TTI] ← ${method} | Status: ${res.status} | Length: ${responseText.length}`);

      if (!res.ok) {
        lastError = new Error(`TTI ${method} failed (${res.status}): ${responseText.slice(0, 500)}`);
        continue;
      }

      try {
        const json = JSON.parse(responseText);
        if (tryUrl !== baseUrl) console.log(`[TTI] ✓ Fallback URL worked: ${tryUrl}`);
        return json;
      } catch (e) {
        lastError = new Error(`TTI ${method}: invalid JSON response`);
        continue;
      }
    } catch (fetchErr) {
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

  if (response.ResponseInfo?.Error) {
    const err = response.ResponseInfo.Error;
    throw new Error(`TTI search error: ${err.Message || err.Code || err.FullText || 'Unknown'}`);
  }

  return normalizeTTIResponse(response, origin, destination, !!returnDate);
}

function parseTTIDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/\/Date\((-?\d+)([+-]\d{4})?\)\//);
  if (match) return new Date(parseInt(match[1]));
  return new Date(dateStr);
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/**
 * Normalize TTI response — splits multi-OD itineraries into separate per-direction flights
 */
function normalizeTTIResponse(response, originCode, destinationCode, isRoundTrip) {
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

    // Calculate total itinerary price
    let totalItinPrice = 0;
    let currency = 'BDT';
    if (itin.SaleCurrencyAmount) {
      totalItinPrice = itin.SaleCurrencyAmount.TotalAmount || itin.SaleCurrencyAmount.Amount || itin.SaleCurrencyAmount.Value || 0;
      currency = itin.SaleCurrencyAmount.CurrencyCode || 'BDT';
    } else if (fares.length > 0) {
      for (const f of fares) {
        if (f.SaleCurrencyAmount) {
          totalItinPrice += f.SaleCurrencyAmount.Amount || f.SaleCurrencyAmount.Value || 0;
          currency = f.SaleCurrencyAmount.CurrencyCode || currency;
        }
      }
    }

    // Get fare details for the itinerary (including seat availability)
    const fareDetails = [];
    let minAvailableSeats = Infinity;
    for (const f of fares) {
      const odFares = f.OriginDestinationFares || [];
      for (const odf of odFares) {
        const couponFares = odf.ETCouponFares || odf.CouponFares || [];
        for (const cf of couponFares) {
          const seats = cf.AvailableSeats ?? cf.SeatsAvailable ?? cf.Availability ?? cf.AvailableCount ?? null;
          if (seats !== null && seats < minAvailableSeats) minAvailableSeats = seats;
          fareDetails.push({
            fareBasis: cf.FareBasisCode || '',
            bookingClass: cf.BookingClassCode || '',
            cabinClass: cf.CabinClassCode || '',
            availableSeats: seats,
          });
        }
      }
    }
    const availableSeats = minAvailableSeats === Infinity ? null : minAvailableSeats;

    const cabinClass = fareDetails[0]?.cabinClass || '';
    const cabinName = cabinClass === 'Y' ? 'Economy' : cabinClass === 'C' ? 'Business' : cabinClass === 'F' ? 'First' : cabinClass === 'W' ? 'Premium Economy' : cabinClass || 'Economy';

    // ─── KEY FIX: Split each AirOriginDestination into a separate flight ───
    // For round-trip, this creates outbound + return as independent flight objects
    // For one-way with connections, legs within the SAME OD stay together

    const odCount = airODs.length;
    const pricePerDirection = odCount > 1 ? Math.round(totalItinPrice / odCount) : totalItinPrice;

    for (let odIdx = 0; odIdx < airODs.length; odIdx++) {
      const od = airODs[odIdx];
      const coupons = od.AirCoupons || od.SegmentReferences || od.Segments || [];
      const odSegments = [];

      for (const coupon of coupons) {
        const ref = coupon.RefSegment || coupon.Ref || coupon;
        const seg = segmentMap[ref];
        if (seg) odSegments.push(seg);
      }

      if (odSegments.length === 0) continue;

      const legs = odSegments.map(seg => {
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

      // Calculate total duration for THIS direction only (legs + layovers within OD)
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

      // Determine direction
      const direction = odIdx === 0 ? 'outbound' : 'return';

      // Extract time limit from itinerary (airline-provided booking deadline)
      let timeLimit = null;
      if (itin.LastTicketingDate) {
        timeLimit = parseTTIDate(itin.LastTicketingDate)?.toISOString() || null;
      } else if (itin.TicketTimeLimit) {
        timeLimit = parseTTIDate(itin.TicketTimeLimit)?.toISOString() || null;
      } else if (itin.TimeLimit) {
        timeLimit = parseTTIDate(itin.TimeLimit)?.toISOString() || null;
      } else if (itin.PricingInfo?.LastTicketingDate) {
        timeLimit = parseTTIDate(itin.PricingInfo.LastTicketingDate)?.toISOString() || null;
      } else if (itin.PricingInfo?.TicketTimeLimit) {
        timeLimit = parseTTIDate(itin.PricingInfo.TicketTimeLimit)?.toISOString() || null;
      }

      const bookingClass = fareDetails[0]?.bookingClass || '';

      flights.push({
        id: `tti-${itin.Ref}-${direction}`,
        source: 'tti',
        direction: direction,
        isRoundTrip: isRoundTrip && odCount > 1,
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
        bookingClass: bookingClass,
        availableSeats: availableSeats,
        price: pricePerDirection,
        totalRoundTripPrice: isRoundTrip && odCount > 1 ? totalItinPrice : undefined,
        currency: currency,
        refundable: false,
        baggage: '20kg',
        aircraft: firstLeg.aircraft,
        legs: legs,
        itineraryRef: itin.Ref,
        validatingAirline: itin.ValidatingAirlineDesignator || firstLeg.airlineCode,
        fareDetails: fareDetails,
        timeLimit: timeLimit,
        _ttiItineraryRef: itin.Ref,
      });
    }
  }

  return flights;
}

function getAirlineName(code) {
  const names = {
    '2A': 'Air Astra', 'S2': 'Air Astra', 'BG': 'Biman Bangladesh', 'BS': 'US-Bangla Airlines',
    'VQ': 'Novoair', 'RX': 'Regent Airways', 'EK': 'Emirates',
    'QR': 'Qatar Airways', 'SQ': 'Singapore Airlines', 'TG': 'Thai Airways',
    '6E': 'IndiGo', 'G9': 'Air Arabia', 'MH': 'Malaysia Airlines',
    'TK': 'Turkish Airlines', 'CX': 'Cathay Pacific', 'AI': 'Air India',
    'UL': 'SriLankan Airlines', 'SV': 'Saudi Arabian Airlines', 'FZ': 'flydubai',
    'WY': 'Oman Air', 'GF': 'Gulf Air', 'PG': 'Bangkok Airways',
    'OZ': 'Asiana Airlines', 'KE': 'Korean Air', 'NH': 'ANA',
    'JL': 'Japan Airlines', 'LH': 'Lufthansa', 'BA': 'British Airways',
    'AF': 'Air France', 'KL': 'KLM', 'LO': 'LOT Polish Airlines',
    'SK': 'SAS', 'ET': 'Ethiopian Airlines', 'WS': 'WestJet',
    'AC': 'Air Canada', 'UA': 'United Airlines', 'AA': 'American Airlines',
    'DL': 'Delta Air Lines', 'IB': 'Iberia', 'AY': 'Finnair',
    'OS': 'Austrian Airlines', 'LX': 'Swiss International', 'EY': 'Etihad Airways',
    'W5': 'Mahan Air', 'PK': 'Pakistan International', 'BR': 'EVA Air',
    'CI': 'China Airlines', 'CA': 'Air China', 'MU': 'China Eastern',
    'CZ': 'China Southern', 'HU': 'Hainan Airlines', 'VN': 'Vietnam Airlines',
    'GA': 'Garuda Indonesia', 'OD': 'Malindo Air', 'AK': 'AirAsia',
    'FD': 'Thai AirAsia', 'SL': 'Thai Lion Air', 'DD': 'Nok Air',
    'QF': 'Qantas', 'NZ': 'Air New Zealand', 'PR': 'Philippine Airlines',
    'IT': 'Tigerair Taiwan', '5J': 'Cebu Pacific', 'J9': 'Jazeera Airways',
    'WF': 'Widerøe', 'DY': 'Norwegian', 'FR': 'Ryanair', 'U2': 'easyJet',
    'W6': 'Wizz Air',
  };
  return names[code] || code;
}

/**
 * Create a booking in TTI/Zenith GDS
 * This sends passenger + itinerary data to TTI to create a real PNR
 */
async function createBooking({ flightData, passengers, contactInfo }) {
  const config = await getTTIConfig();
  if (!config) throw new Error('TTI API not configured');

  // Build passenger list for TTI
  let refCounter = 1;
  const ttiPassengers = passengers.map((p, i) => ({
    Ref: String(refCounter++),
    PassengerTypeCode: 'AD', // TODO: detect child/infant from DOB
    Title: p.title || 'Mr',
    FirstName: (p.firstName || '').toUpperCase(),
    LastName: (p.lastName || '').toUpperCase(),
    DateOfBirth: p.dob ? `/Date(${new Date(p.dob).getTime()})/` : null,
    Gender: p.title === 'Mr' ? 'M' : 'F',
    Nationality: p.nationality || 'BD',
    PassportNumber: p.passport || null,
    PassportExpiry: p.passportExpiry ? `/Date(${new Date(p.passportExpiry).getTime()})/` : null,
    Email: p.email || contactInfo?.email || '',
    Phone: p.phone || contactInfo?.phone || '',
  }));

  // Build segments from flight data
  const segments = [];
  const legs = flightData.legs || [];
  if (legs.length > 0) {
    legs.forEach((leg, i) => {
      segments.push({
        Ref: String(i + 1),
        FlightNumber: leg.flightNumber || flightData.flightNumber,
        AirlineCode: leg.airlineCode || flightData.airlineCode,
        Origin: leg.origin || flightData.origin,
        Destination: leg.destination || flightData.destination,
        DepartureDate: leg.departureTime ? `/Date(${new Date(leg.departureTime).getTime()})/` : null,
        CabinClass: flightData.cabinClass || 'Economy',
      });
    });
  } else {
    segments.push({
      Ref: '1',
      FlightNumber: flightData.flightNumber,
      AirlineCode: flightData.airlineCode,
      Origin: flightData.origin,
      Destination: flightData.destination,
      DepartureDate: flightData.departureTime ? `/Date(${new Date(flightData.departureTime).getTime()})/` : null,
      CabinClass: flightData.cabinClass || 'Economy',
    });
  }

  const request = {
    RequestInfo: { AuthenticationKey: config.key },
    Passengers: ttiPassengers,
    Segments: segments,
    ContactInfo: {
      Email: contactInfo?.email || passengers[0]?.email || '',
      Phone: contactInfo?.phone || passengers[0]?.phone || '',
    },
    AgencyInfo: {
      AgencyId: config.agencyId,
      AgencyName: config.agencyName,
    },
  };

  console.log('[TTI] Creating booking for', flightData.origin, '→', flightData.destination, 'flight', flightData.flightNumber);

  try {
    const response = await ttiRequest('CreateBooking', request);

    if (response.ResponseInfo?.Error) {
      const err = response.ResponseInfo.Error;
      console.error('[TTI] CreateBooking error:', err);
      throw new Error(`TTI booking error: ${err.Message || err.Code || 'Unknown error'}`);
    }

    // Extract PNR from response
    const pnr = response.BookingReference || response.PNR || response.RecordLocator || 
                 response.Booking?.Reference || response.Booking?.PNR || null;
    const ttiBookingId = response.BookingId || response.Booking?.Id || null;
    const ticketTimeLimit = response.TicketTimeLimit || response.TimeLimit || null;

    console.log('[TTI] Booking created — PNR:', pnr, 'BookingId:', ttiBookingId);

    return {
      success: true,
      pnr,
      ttiBookingId,
      ticketTimeLimit: ticketTimeLimit ? parseTTIDate(ticketTimeLimit)?.toISOString() : null,
      rawResponse: response,
    };
  } catch (err) {
    console.error('[TTI] CreateBooking failed:', err.message);
    // Don't throw — let the caller decide whether to fail the whole booking
    return {
      success: false,
      error: err.message,
      pnr: null,
      ttiBookingId: null,
    };
  }
}

module.exports = { searchFlights, createBooking, ttiRequest, getTTIConfig, getAirlineName, clearTTIConfigCache };
