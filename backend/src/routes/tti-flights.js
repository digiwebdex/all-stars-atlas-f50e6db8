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

  // ── DEEP DEBUG: Log actual TTI structure to find seats & baggage ──
  if (segments.length > 0) {
    const sampleSeg = segments[0];
    console.log('[TTI DEBUG] Segment keys:', Object.keys(sampleSeg));
    console.log('[TTI DEBUG] Segment sample:', JSON.stringify(sampleSeg).substring(0, 500));
  }
  if (etTicketFares.length > 0) {
    const sampleFare = etTicketFares[0];
    const odFares = sampleFare.OriginDestinationFares || [];
    if (odFares.length > 0) {
      console.log('[TTI DEBUG] OriginDestinationFare keys:', Object.keys(odFares[0]));
      console.log('[TTI DEBUG] OriginDestinationFare sample:', JSON.stringify(odFares[0]).substring(0, 800));
      const couponFares = odFares[0].ETCouponFares || odFares[0].CouponFares || [];
      if (couponFares.length > 0) {
        console.log('[TTI DEBUG] ETCouponFare keys:', Object.keys(couponFares[0]));
        console.log('[TTI DEBUG] ETCouponFare sample:', JSON.stringify(couponFares[0]).substring(0, 800));
      }
    }
  }
  // Also check top-level response keys — CRITICAL for booking
  console.log('[TTI DEBUG] Top-level response keys:', JSON.stringify(Object.keys(response)));
  if (fareInfo) console.log('[TTI DEBUG] FareInfo keys:', JSON.stringify(Object.keys(fareInfo)));
  // Check for session/token fields that might be needed for booking
  console.log('[TTI DEBUG] ResponseInfo:', JSON.stringify(response.ResponseInfo || {}).substring(0, 500));
  console.log('[TTI DEBUG] Token/Session fields:', JSON.stringify({
    Token: response.Token || null,
    SearchId: response.SearchId || null,
    SessionId: response.SessionId || null,
    EchoToken: response.ResponseInfo?.EchoToken || null,
    ZietDataUniqueId: response.ZietDataUniqueId || null,
    UniqueId: response.UniqueId || null,
    SearchToken: response.SearchToken || null,
    DataId: response.DataId || null,
  }));
  // Log any non-standard top-level fields
  const knownKeys = new Set(['Segments', 'FareInfo', 'ResponseInfo', 'Extensions', 'Passengers']);
  const unknownKeys = Object.keys(response).filter(k => !knownKeys.has(k));
  if (unknownKeys.length > 0) {
    console.log('[TTI DEBUG] UNKNOWN top-level keys:', JSON.stringify(unknownKeys));
    for (const k of unknownKeys) {
      console.log(`[TTI DEBUG] ${k}:`, JSON.stringify(response[k])?.substring(0, 800));
    }
  }
  // Check itinerary keys
  if (itineraries.length > 0) {
    console.log('[TTI DEBUG] Itinerary keys:', JSON.stringify(Object.keys(itineraries[0])));
    const airODs = itineraries[0].AirOriginDestinations || [];
    if (airODs.length > 0) {
      console.log('[TTI DEBUG] AirOriginDestination keys:', JSON.stringify(Object.keys(airODs[0])));
    }
  }

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

    // Calculate total itinerary price with base/tax breakdown
    let totalItinPrice = 0;
    let baseFareTotal = 0;
    let taxesTotal = 0;
    let currency = 'BDT';
    if (itin.SaleCurrencyAmount) {
      totalItinPrice = itin.SaleCurrencyAmount.TotalAmount || itin.SaleCurrencyAmount.Amount || itin.SaleCurrencyAmount.Value || 0;
      baseFareTotal = itin.SaleCurrencyAmount.BaseFare || itin.SaleCurrencyAmount.BaseAmount || 0;
      taxesTotal = itin.SaleCurrencyAmount.TaxAmount || itin.SaleCurrencyAmount.Taxes || (totalItinPrice - baseFareTotal) || 0;
      currency = itin.SaleCurrencyAmount.CurrencyCode || 'BDT';
    } else if (fares.length > 0) {
      for (const f of fares) {
        if (f.SaleCurrencyAmount) {
          totalItinPrice += f.SaleCurrencyAmount.Amount || f.SaleCurrencyAmount.Value || 0;
          baseFareTotal += f.SaleCurrencyAmount.BaseFare || f.SaleCurrencyAmount.BaseAmount || 0;
          taxesTotal += f.SaleCurrencyAmount.TaxAmount || f.SaleCurrencyAmount.Taxes || 0;
          currency = f.SaleCurrencyAmount.CurrencyCode || currency;
        }
      }
    }
    if (baseFareTotal === 0) baseFareTotal = totalItinPrice;
    if (taxesTotal === 0 && baseFareTotal < totalItinPrice) taxesTotal = totalItinPrice - baseFareTotal;

    // Extract baggage allowance from fare data
    // TTI uses CouponFares[].BagAllowances[] with CarryOn flag
    let checkedBaggage = null;
    let handBaggage = null;
    for (const f of fares) {
      const odFares = f.OriginDestinationFares || [];
      for (const odf of odFares) {
        const couponFares = odf.CouponFares || odf.ETCouponFares || [];
        for (const cf of couponFares) {
          // TTI actual field: BagAllowances array
          const bagAllowances = cf.BagAllowances || cf.BaggageAllowances || [];
          for (const bag of bagAllowances) {
            if (bag.CarryOn === false || bag.CarryOn === undefined) {
              // Checked baggage
              if (!checkedBaggage && bag.Weight) {
                checkedBaggage = `${bag.Weight}${bag.WeightMeasureQualifier || 'kg'}`;
              } else if (!checkedBaggage && bag.Quantity) {
                checkedBaggage = `${bag.Quantity} piece${bag.Quantity > 1 ? 's' : ''}`;
              }
            }
            if (bag.CarryOn === true) {
              // Hand/cabin baggage
              if (!handBaggage && bag.Weight) {
                handBaggage = `${bag.Weight}${bag.WeightMeasureQualifier || 'kg'}`;
              }
            }
          }
          // Fallback: older field names
          if (!checkedBaggage && (cf.FreeBaggageAllowance || cf.BaggageAllowance)) {
            const b = cf.FreeBaggageAllowance || cf.BaggageAllowance;
            if (b.Weight) checkedBaggage = `${b.Weight}${b.WeightUnit || 'kg'}`;
            else if (typeof b === 'string') checkedBaggage = b;
            else if (typeof b === 'number') checkedBaggage = `${b}kg`;
          }
        }
      }
    }

    // Extract penalty/fare rules for cancellation & date change
    let cancellationPolicy = null;
    let dateChangePolicy = null;
    for (const f of fares) {
      if (f.PenaltyDetails || f.Penalties) {
        const pd = f.PenaltyDetails || f.Penalties;
        if (pd.CancellationCharge !== undefined || pd.RefundPenalty !== undefined) {
          cancellationPolicy = {
            beforeDeparture: pd.CancellationCharge ?? pd.RefundPenalty ?? null,
            afterDeparture: pd.PostDepartureCancellation ?? 'Non-refundable',
            noShow: pd.NoShowPenalty ?? pd.NoShowCharge ?? 'Non-refundable',
            currency: currency,
          };
        }
        if (pd.DateChangeCharge !== undefined || pd.ReissuePenalty !== undefined || pd.ChangePenalty !== undefined) {
          dateChangePolicy = {
            changeAllowed: true,
            changeFee: pd.DateChangeCharge ?? pd.ReissuePenalty ?? pd.ChangePenalty ?? null,
            currency: currency,
          };
        }
      }
      if (f.FareRules || f.Rules) {
        const rules = f.FareRules || f.Rules;
        if (Array.isArray(rules)) {
          for (const rule of rules) {
            if (rule.Category === 'CANCELLATION' || rule.Type === 'cancellation') {
              cancellationPolicy = cancellationPolicy || {};
              cancellationPolicy.ruleText = rule.Text || rule.Description || rule.RuleText || null;
            }
            if (rule.Category === 'DATE_CHANGE' || rule.Category === 'REISSUE' || rule.Type === 'reissue') {
              dateChangePolicy = dateChangePolicy || {};
              dateChangePolicy.ruleText = rule.Text || rule.Description || rule.RuleText || null;
            }
          }
        }
      }
    }

    // Get fare details for the itinerary (including seat availability + refundability)
    const fareDetails = [];
    let minAvailableSeats = Infinity;
    let isRefundable = false;
    for (const f of fares) {
      // Check refundability at fare level
      if (f.IsRefundable === true || f.Refundable === true || f.PenaltyDetails?.IsRefundable === true) {
        isRefundable = true;
      }
      const odFares = f.OriginDestinationFares || [];
      for (const odf of odFares) {
        // Check refundability at OD fare level
        if (odf.IsRefundable === true || odf.Refundable === true) isRefundable = true;
        const couponFares = odf.CouponFares || odf.ETCouponFares || [];
        for (const cf of couponFares) {
          // TTI stores seat count in Segments[].BookingClasses[] matching the BookingClassCode
          // We'll resolve it after segment map is built — for now collect fare details
          fareDetails.push({
            fareBasis: cf.FareBasisCode || '',
            bookingClass: cf.BookingClassCode || '',
            cabinClass: cf.CabinClassCode || '',
            refSegment: cf.RefSegment || null,
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

      // ── Extract seats & baggage from AirCoupons (primary TTI location) ──
      for (const coupon of coupons) {
        const ref = coupon.RefSegment || coupon.Ref || coupon;
        const seg = segmentMap[ref];
        if (seg) odSegments.push(seg);
      }



      if (odSegments.length === 0) continue;

      // ── Extract seats from Segments[].BookingClasses[].Quantity ──
      // TTI puts available seat count in the BookingClasses array on each Segment
      for (const seg of odSegments) {
        const bookingClasses = seg.BookingClasses || [];
        for (const bc of bookingClasses) {
          const qty = bc.Quantity ?? bc.AvailableSeats ?? bc.SeatsAvailable ?? null;
          if (qty !== null && typeof qty === 'number' && qty < minAvailableSeats) {
            minAvailableSeats = qty;
          }
        }
      }

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

      // ── Collect ALL segment refs referenced by this itinerary + its fares ──
      // This ensures CreateBooking gets exactly the segments TTI expects
      const itinSegmentRefs = new Set();
      // From itinerary AirOriginDestinations
      for (const aod of airODs) {
        for (const coupon of (aod.AirCoupons || [])) {
          const ref = coupon.RefSegment || coupon.Ref;
          if (ref) itinSegmentRefs.add(ref);
        }
      }
      // From associated ETTicketFares
      for (const f of fares) {
        for (const odf of (f.OriginDestinationFares || [])) {
          for (const cf of (odf.CouponFares || [])) {
            if (cf.RefSegment) itinSegmentRefs.add(cf.RefSegment);
          }
        }
      }
      // Resolve to actual segment objects
      const itinSegments = [];
      for (const ref of itinSegmentRefs) {
        const seg = segmentMap[ref];
        if (seg) itinSegments.push(seg);
      }

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
        availableSeats: minAvailableSeats === Infinity ? null : minAvailableSeats,
        price: pricePerDirection,
        baseFare: odCount > 1 ? Math.round(baseFareTotal / odCount) : baseFareTotal,
        taxes: odCount > 1 ? Math.round(taxesTotal / odCount) : taxesTotal,
        totalRoundTripPrice: isRoundTrip && odCount > 1 ? totalItinPrice : undefined,
        currency: currency,
        refundable: isRefundable,
        baggage: checkedBaggage || null,
        handBaggage: handBaggage || null,
        aircraft: firstLeg.aircraft,
        legs: legs,
        itineraryRef: itin.Ref,
        validatingAirline: itin.ValidatingAirlineDesignator || firstLeg.airlineCode,
        fareDetails: fareDetails,
        timeLimit: timeLimit,
        cancellationPolicy: cancellationPolicy,
        dateChangePolicy: dateChangePolicy,
        _ttiItineraryRef: itin.Ref,
        // ── Raw TTI data for CreateBooking: store COMPLETE search response objects ──
        // TTI requires the full FareInfo (including FareRules, WebClasses, etc.) and ALL segments
        _ttiRawItinerary: itin,
        _ttiRawFares: fares,
        _ttiRawSegments: itinSegments,
        _ttiFullFareInfo: fareInfo,   // Complete FareInfo from search response
        _ttiAllSegments: segments,     // ALL segments from search response
      });
    }
  }

  // Diagnostic logging for seat/baggage extraction
  if (flights.length > 0) {
    const sample = flights[0];
    console.log(`[TTI] Normalized ${flights.length} flights. Sample: ${sample.flightNumber} — seats: ${sample.availableSeats}, baggage: ${sample.baggage}, handBaggage: ${sample.handBaggage}, refundable: ${sample.refundable}`);
  }

  // If no seats/baggage found, log the raw structure for debugging
  if (flights.length > 0 && flights[0].availableSeats === null && itineraries.length > 0) {
    const sampleItin = itineraries[0];
    const sampleOD = sampleItin.AirOriginDestinations?.[0];
    const sampleCoupon = sampleOD?.AirCoupons?.[0];
    const sampleFare = etTicketFares[0];
    console.log('[TTI DEBUG] AirCoupon keys:', sampleCoupon ? Object.keys(sampleCoupon) : 'none');
    console.log('[TTI DEBUG] AirCoupon sample:', JSON.stringify(sampleCoupon)?.slice(0, 500));
    console.log('[TTI DEBUG] ETTicketFare keys:', sampleFare ? Object.keys(sampleFare) : 'none');
    if (sampleFare?.OriginDestinationFares?.[0]?.ETCouponFares?.[0]) {
      console.log('[TTI DEBUG] ETCouponFare keys:', Object.keys(sampleFare.OriginDestinationFares[0].ETCouponFares[0]));
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

  // Build passenger list for TTI — must match WCF DataContract format
  // TTI expects the same structure as search passengers (with PassengerQuantity)
  // plus personal details in specific sub-objects
  let refCounter = 1;
  const ttiPassengers = passengers.map((p, i) => ({
    Ref: String(refCounter++),
    PassengerTypeCode: 'AD',
    PassengerQuantity: 1,
    Title: (p.title || 'Mr').toUpperCase(),
    FirstName: (p.firstName || '').toUpperCase(),
    LastName: (p.lastName || '').toUpperCase(),
    GivenName: (p.firstName || '').toUpperCase(),
    Surname: (p.lastName || '').toUpperCase(),
    DateOfBirth: p.dob ? `/Date(${new Date(p.dob).getTime()})/` : null,
    Gender: p.title === 'Mr' ? 'M' : 'F',
    GenderCode: p.title === 'Mr' ? 'M' : 'F',
    Nationality: p.nationality || 'BD',
    NationalityCode: p.nationality || 'BD',
    PassportNumber: p.passport || null,
    PassportExpiry: p.passportExpiry ? `/Date(${new Date(p.passportExpiry).getTime()})/` : null,
    DocumentInfo: p.passport ? {
      DocumentNumber: p.passport,
      DocumentType: 'P',
      ExpiryDate: p.passportExpiry ? `/Date(${new Date(p.passportExpiry).getTime()})/` : null,
      NationalityCode: p.nationality || 'BD',
    } : null,
    ContactInfo: {
      Email: p.email || contactInfo?.email || '',
      Phone: p.phone || contactInfo?.phone || '',
    },
    Email: p.email || contactInfo?.email || '',
    Phone: p.phone || contactInfo?.phone || '',
    Extensions: null,
  }));

  // ── TTI CreateBooking requires the COMPLETE FareInfo and ALL Segments ──
  // from the original SearchFlights response echoed back exactly
  const fullFareInfo = flightData._ttiFullFareInfo || null;
  const allSegments = flightData._ttiAllSegments || [];
  const rawSegments = flightData._ttiRawSegments || [];

  // Use ALL segments from the original search response (TTI needs complete context)
  let segments = allSegments.length > 0 ? allSegments : rawSegments;
  
  // Fallback: build from legs if no raw data
  if (segments.length === 0) {
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
    }
  }

  // Use the COMPLETE FareInfo from search response (includes FareRules, WebClasses, etc.)
  const fareInfo = fullFareInfo || {};
  
  console.log('[TTI BOOKING] Using full FareInfo keys:', Object.keys(fareInfo));
  console.log('[TTI BOOKING] Segments count:', segments.length, '| FareInfo.Itineraries:', (fareInfo.Itineraries || []).length, '| FareInfo.ETTicketFares:', (fareInfo.ETTicketFares || []).length);

  const request = {
    RequestInfo: { AuthenticationKey: config.key },
    Passengers: ttiPassengers,
    Segments: segments,
    FareInfo: fareInfo,
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
  console.log('[TTI BOOKING] Full FareInfo keys:', Object.keys(fareInfo), '| All segments:', segments.length);
  console.log('[TTI BOOKING] Request payload (truncated):', JSON.stringify(request).substring(0, 3000));

  try {
    const response = await ttiRequest('CreateBooking', request);

    // ── COMPREHENSIVE DEBUG LOGGING ──
    console.log('[TTI BOOKING] Full response keys:', Object.keys(response));
    console.log('[TTI BOOKING] Full response:', JSON.stringify(response).substring(0, 3000));

    if (response.ResponseInfo?.Error) {
      const err = response.ResponseInfo.Error;
      console.error('[TTI BOOKING] API Error:', JSON.stringify(err));
      throw new Error(`TTI booking error: ${err.Message || err.Code || 'Unknown error'}`);
    }

    // Extract PNR from response — try all possible field names
    const pnr = response.BookingReference || response.PNR || response.RecordLocator || 
                 response.Booking?.Reference || response.Booking?.PNR || 
                 response.Booking?.BookingReference || response.Booking?.RecordLocator ||
                 response.AirReservation?.BookingReference ||
                 response.ReservationInfo?.BookingReference ||
                 null;
    const ttiBookingId = response.BookingId || response.Booking?.Id || response.Booking?.BookingId || 
                          response.ReservationInfo?.Id || null;
    const ticketTimeLimit = response.TicketTimeLimit || response.TimeLimit || 
                             response.Booking?.TicketTimeLimit || response.Booking?.TimeLimit ||
                             response.ReservationInfo?.TicketTimeLimit || null;

    console.log('[TTI BOOKING] ✅ Extracted — PNR:', pnr, '| BookingId:', ttiBookingId, '| TimeLimit:', ticketTimeLimit);

    if (!pnr) {
      console.warn('[TTI BOOKING] ⚠️ PNR is null! Full response for inspection:', JSON.stringify(response).substring(0, 5000));
    }

    return {
      success: true,
      pnr,
      ttiBookingId,
      ticketTimeLimit: ticketTimeLimit ? parseTTIDate(ticketTimeLimit)?.toISOString() : null,
      rawResponse: response,
    };
  } catch (err) {
    console.error('[TTI BOOKING] ❌ CreateBooking failed:', err.message);
    // Don't throw — let the caller decide whether to fail the whole booking
    return {
      success: false,
      error: err.message,
      pnr: null,
      ttiBookingId: null,
    };
  }
}

/**
 * Issue/confirm a ticket for an existing TTI booking (PNR)
 * TTI method: TicketBooking / IssueTicket
 */
async function issueTicket({ pnr, bookingId }) {
  const config = await getTTIConfig();
  if (!config) throw new Error('TTI API not configured');

  console.log('[TTI TICKET] Issuing ticket for PNR:', pnr, '| BookingId:', bookingId);

  try {
    const request = {
      RequestInfo: { AuthenticationKey: config.key },
      BookingReference: pnr,
      BookingId: bookingId || undefined,
      AgencyInfo: { AgencyId: config.agencyId, AgencyName: config.agencyName },
    };

    console.log('[TTI TICKET] Request:', JSON.stringify(request));

    const response = await ttiRequest('TicketBooking', request);

    // ── COMPREHENSIVE DEBUG LOGGING ──
    console.log('[TTI TICKET] Full response keys:', Object.keys(response));
    console.log('[TTI TICKET] Full response:', JSON.stringify(response).substring(0, 3000));

    if (response.ResponseInfo?.Error) {
      const errMsg = response.ResponseInfo.Error.Message || response.ResponseInfo.Error.Code || 'Unknown';
      console.error('[TTI TICKET] ❌ API Error:', errMsg);
      throw new Error(`TTI ticketing error: ${errMsg}`);
    }

    const ticketNumbers = [];
    // Try multiple possible response structures
    const tickets = response.Tickets || response.ETickets || response.TicketDetails || 
                    response.Booking?.Tickets || response.Booking?.ETickets ||
                    response.TicketInfo || [];
    if (Array.isArray(tickets)) {
      tickets.forEach(t => {
        const num = t.TicketNumber || t.ETicketNumber || t.Number || t.DocumentNumber;
        if (num) ticketNumbers.push(num);
      });
    }

    // Also check if ticket number is at top level
    if (ticketNumbers.length === 0) {
      if (response.TicketNumber) ticketNumbers.push(response.TicketNumber);
      if (response.ETicketNumber) ticketNumbers.push(response.ETicketNumber);
    }

    console.log('[TTI TICKET] ✅ Tickets issued:', ticketNumbers.length > 0 ? ticketNumbers.join(', ') : 'NONE FOUND');
    if (ticketNumbers.length === 0) {
      console.warn('[TTI TICKET] ⚠️ No ticket numbers extracted! Full response:', JSON.stringify(response).substring(0, 5000));
    }

    return { success: true, ticketNumbers, rawResponse: response };
  } catch (err) {
    console.error('[TTI TICKET] ❌ IssueTicket failed:', err.message);
    return { success: false, error: err.message, ticketNumbers: [] };
  }
}

/**
 * Cancel a TTI booking by PNR
 * TTI method: CancelBooking
 */
async function cancelBooking({ pnr, bookingId }) {
  const config = await getTTIConfig();
  if (!config) throw new Error('TTI API not configured');

  console.log('[TTI CANCEL] Cancelling booking PNR:', pnr, '| BookingId:', bookingId);

  try {
    const request = {
      RequestInfo: { AuthenticationKey: config.key },
      BookingReference: pnr,
      BookingId: bookingId || undefined,
      AgencyInfo: { AgencyId: config.agencyId, AgencyName: config.agencyName },
    };

    console.log('[TTI CANCEL] Request:', JSON.stringify(request));

    const response = await ttiRequest('CancelBooking', request);

    // ── COMPREHENSIVE DEBUG LOGGING ──
    console.log('[TTI CANCEL] Full response keys:', Object.keys(response));
    console.log('[TTI CANCEL] Full response:', JSON.stringify(response).substring(0, 3000));

    if (response.ResponseInfo?.Error) {
      const errMsg = response.ResponseInfo.Error.Message || response.ResponseInfo.Error.Code || 'Unknown';
      console.error('[TTI CANCEL] ❌ API Error:', errMsg);
      throw new Error(`TTI cancel error: ${errMsg}`);
    }

    console.log('[TTI CANCEL] ✅ Booking cancelled — PNR:', pnr);
    return { success: true, rawResponse: response };
  } catch (err) {
    console.error('[TTI CANCEL] ❌ CancelBooking failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Void a ticket in TTI
 * TTI method: VoidTicket
 */
async function voidTicket({ pnr, ticketNumber }) {
  const config = await getTTIConfig();
  if (!config) throw new Error('TTI API not configured');

  console.log('[TTI] Voiding ticket:', ticketNumber, 'PNR:', pnr);

  try {
    const response = await ttiRequest('VoidTicket', {
      RequestInfo: { AuthenticationKey: config.key },
      BookingReference: pnr,
      TicketNumber: ticketNumber,
      AgencyInfo: { AgencyId: config.agencyId, AgencyName: config.agencyName },
    });

    if (response.ResponseInfo?.Error) {
      throw new Error(`TTI void error: ${response.ResponseInfo.Error.Message || response.ResponseInfo.Error.Code}`);
    }

    console.log('[TTI] Ticket voided:', ticketNumber);
    return { success: true, rawResponse: response };
  } catch (err) {
    console.error('[TTI] VoidTicket failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { searchFlights, createBooking, issueTicket, cancelBooking, voidTicket, ttiRequest, getTTIConfig, getAirlineName, clearTTIConfigCache };
