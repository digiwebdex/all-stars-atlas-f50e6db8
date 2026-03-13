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
 * TTI request in Bare mode (?BodyStyle=Bare) — recommended by TTI Help page
 * Sends body directly without wrapping in { "request": ... }
 */
async function ttiRequestBare(method, body) {
  const config = await getTTIConfig();
  if (!config) throw new Error('TTI API not configured');

  const baseUrl = config.url.replace(/\/+$/, '');
  const urlsToTry = [baseUrl];
  if (baseUrl.startsWith('http://')) urlsToTry.push(baseUrl.replace('http://', 'https://'));
  else if (baseUrl.startsWith('https://')) urlsToTry.push(baseUrl.replace('https://', 'http://'));

  let lastError = null;
  for (const tryUrl of urlsToTry) {
    const fullUrl = `${tryUrl}/${method}?BodyStyle=Bare`;
    console.log(`[TTI Bare] → ${method} | URL: ${fullUrl}`);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const responseText = await res.text();
      console.log(`[TTI Bare] ← ${method} | Status: ${res.status} | Length: ${responseText.length}`);
      if (!res.ok) { lastError = new Error(`TTI ${method} Bare failed (${res.status}): ${responseText.slice(0, 500)}`); continue; }
      try {
        const json = JSON.parse(responseText);
        return json;
      } catch (e) { lastError = new Error(`TTI ${method} Bare: invalid JSON`); continue; }
    } catch (fetchErr) { lastError = fetchErr; continue; }
  }
  throw lastError || new Error(`TTI ${method} Bare: all URL attempts failed`);
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

  // Map cabin class to TTI code: Y=Economy, W=Premium Economy, C=Business, F=First
  const cabinMap = { economy: 'Y', premiumeconomy: 'W', business: 'C', first: 'F' };
  const ttiCabinCode = cabinMap[(cabinClass || '').toLowerCase()] || null;

  const request = {
    RequestInfo: { AuthenticationKey: config.key },
    Passengers: passengers,
    OriginDestinations: originDestinations,
    FareDisplaySettings: {
      SaleCurrencyCode: 'BDT',
      ...(ttiCabinCode ? { CabinClassCode: ttiCabinCode } : {}),
    },
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
  const offer = response.Offer || null; // CRITICAL: TTI CreateBooking needs this to reference search session
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

  // Build fare rule map from FareInfo.FareRules (contains refundability/change info)
  const fareRules = fareInfo.FareRules || [];
  const fareRuleMap = {};
  for (const rule of fareRules) {
    if (rule.Ref) fareRuleMap[rule.Ref] = rule;
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

    // Use FareRules VoluntaryRefundCode/VoluntaryChangeCode from the itinerary's linked fare rule
    for (const airOD of airODs) {
      const ruleRef = airOD.RefFareRule;
      if (ruleRef && fareRuleMap[ruleRef]) {
        const rule = fareRuleMap[ruleRef];
        if (rule.VoluntaryRefundCode) {
          cancellationPolicy = cancellationPolicy || {};
          cancellationPolicy.voluntaryRefundCode = rule.VoluntaryRefundCode;
          if (rule.VoluntaryRefundCode === 'NotPermitted') {
            cancellationPolicy.refundable = false;
            cancellationPolicy.label = 'Non-Refundable';
          } else if (rule.VoluntaryRefundCode === 'WithPenalties') {
            cancellationPolicy.refundable = true;
            cancellationPolicy.label = 'Refundable (with penalties)';
          } else if (rule.VoluntaryRefundCode === 'Free') {
            cancellationPolicy.refundable = true;
            cancellationPolicy.label = 'Fully Refundable';
          }
        }
        if (rule.VoluntaryChangeCode) {
          dateChangePolicy = dateChangePolicy || {};
          dateChangePolicy.voluntaryChangeCode = rule.VoluntaryChangeCode;
          if (rule.VoluntaryChangeCode === 'NotPermitted') {
            dateChangePolicy.changeAllowed = false;
            dateChangePolicy.label = 'Date change not permitted';
          } else if (rule.VoluntaryChangeCode === 'WithPenalties') {
            dateChangePolicy.changeAllowed = true;
            dateChangePolicy.label = 'Date change allowed (with penalties)';
          } else if (rule.VoluntaryChangeCode === 'Free') {
            dateChangePolicy.changeAllowed = true;
            dateChangePolicy.label = 'Free date change';
          }
        }
        if (rule.FareConditionText) {
          cancellationPolicy = cancellationPolicy || {};
          cancellationPolicy.ruleText = rule.FareConditionText;
        }
      }
    }

    // Fallback: check PenaltyDetails on fare objects
    for (const f of fares) {
      if (f.PenaltyDetails || f.Penalties) {
        const pd = f.PenaltyDetails || f.Penalties;
        if (!cancellationPolicy && (pd.CancellationCharge !== undefined || pd.RefundPenalty !== undefined)) {
          cancellationPolicy = {
            beforeDeparture: pd.CancellationCharge ?? pd.RefundPenalty ?? null,
            afterDeparture: pd.PostDepartureCancellation ?? 'Non-refundable',
            noShow: pd.NoShowPenalty ?? pd.NoShowCharge ?? 'Non-refundable',
            currency: currency,
          };
        }
        if (!dateChangePolicy && (pd.DateChangeCharge !== undefined || pd.ReissuePenalty !== undefined || pd.ChangePenalty !== undefined)) {
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
              cancellationPolicy.ruleText = cancellationPolicy.ruleText || rule.Text || rule.Description || rule.RuleText || null;
            }
            if (rule.Category === 'DATE_CHANGE' || rule.Category === 'REISSUE' || rule.Type === 'reissue') {
              dateChangePolicy = dateChangePolicy || {};
              dateChangePolicy.ruleText = dateChangePolicy.ruleText || rule.Text || rule.Description || rule.RuleText || null;
            }
          }
        }
      }
    }

    // Get fare details for the itinerary (including seat availability + refundability)
    const fareDetails = [];
    let minAvailableSeats = Infinity;
    let isRefundable = false;
    let voluntaryRefundCode = null;
    let voluntaryChangeCode = null;

    // 1) PRIMARY: Check FareRules via RefFareRule on AirOriginDestinations
    for (const airOD of airODs) {
      const ruleRef = airOD.RefFareRule;
      if (ruleRef && fareRuleMap[ruleRef]) {
        const rule = fareRuleMap[ruleRef];
        voluntaryRefundCode = rule.VoluntaryRefundCode || null;
        voluntaryChangeCode = rule.VoluntaryChangeCode || null;
        // "NotPermitted" = non-refundable, "WithPenalties" or "Free" = refundable
        if (voluntaryRefundCode && voluntaryRefundCode !== 'NotPermitted') {
          isRefundable = true;
        }
      }
    }

    // 2) FALLBACK: Check explicit boolean fields on fare objects
    if (!voluntaryRefundCode) {
      for (const f of fares) {
        if (f.IsRefundable === true || f.Refundable === true || f.PenaltyDetails?.IsRefundable === true) {
          isRefundable = true;
        }
        const odFares = f.OriginDestinationFares || [];
        for (const odf of odFares) {
          if (odf.IsRefundable === true || odf.Refundable === true) isRefundable = true;
        }
      }
    }

    for (const f of fares) {
      const odFares = f.OriginDestinationFares || [];
      for (const odf of odFares) {
        const couponFares = odf.CouponFares || odf.ETCouponFares || [];
        for (const cf of couponFares) {
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
        fareType: voluntaryRefundCode === 'WithPenalties' ? 'Refundable' : voluntaryRefundCode === 'Free' ? 'Fully Refundable' : voluntaryRefundCode === 'NotPermitted' ? 'Non-Refundable' : (isRefundable ? 'Refundable' : 'Non-Refundable'),
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
        _ttiRawItinerary: itin,
        _ttiRawFares: fares,
        _ttiRawSegments: itinSegments,
        _ttiFullFareInfo: fareInfo,
        _ttiAllSegments: segments,
        _ttiOffer: offer,             // CRITICAL: Offer.Ref links CreateBooking to search session
        _ttiPassengers: response.Passengers || [], // Echo back original passengers
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
  const selectedItinRef = flightData._ttiItineraryRef || flightData.itineraryRef;
  
  // ── Get search response's passenger groups to link named passengers ──
  const searchPassengers = flightData._ttiPassengers || [];
  console.log('[TTI BOOKING] Search Passengers (groups):', JSON.stringify(searchPassengers));
  
  // Build a map of passenger type → search group Ref
  // e.g., { AD: "1", CHD: "2" }
  const paxGroupMap = {};
  for (const sp of searchPassengers) {
    if (sp.PassengerTypeCode && sp.Ref) {
      if (!paxGroupMap[sp.PassengerTypeCode]) paxGroupMap[sp.PassengerTypeCode] = [];
      paxGroupMap[sp.PassengerTypeCode].push(sp.Ref);
    }
  }
  console.log('[TTI BOOKING] Passenger group map:', JSON.stringify(paxGroupMap));
  
  // Track how many passengers we've assigned to each group
  const paxGroupUsed = {};
  
  const ttiPassengers = passengers.map((p, i) => {
    // Fix nationality: must be ISO 2-letter country code, NOT a city/birth place
    let natCode = String(p.nationality || p.passportCountry || 'BD').toUpperCase();
    if (natCode.length > 2) natCode = 'BD';

    // Determine passenger type
    const paxType = p.type === 'child' ? 'CHD' : p.type === 'infant' ? 'INF' : 'AD';

    // Find the search passenger group ref for this type
    const groupRefs = paxGroupMap[paxType] || paxGroupMap['AD'] || [];
    const usedCount = paxGroupUsed[paxType] || 0;
    const groupRef = groupRefs[usedCount] || groupRefs[0] || String(i + 1);
    paxGroupUsed[paxType] = usedCount + 1;

    const firstName = String(p.firstName || p.givenName || '').toUpperCase();
    const lastName = String(p.lastName || p.surname || '').toUpperCase();
    const title = String(p.title || 'Mr').toUpperCase();
    const rawDob = p.dateOfBirth || p.dob || null;
    const rawPassport = p.passportNumber || p.passport || null;
    const rawPassportExpiry = p.passportExpiry || null;
    const genderRaw = String(p.gender || '').toLowerCase();
    const genderCode = genderRaw.startsWith('f') ? 'F' : genderRaw.startsWith('m') ? 'M' : (title === 'MR' ? 'M' : 'F');

    const dobDate = rawDob ? new Date(rawDob) : null;
    const passportExpiryDate = rawPassportExpiry ? new Date(rawPassportExpiry) : null;

    return {
      Ref: groupRef,
      RefItinerary: selectedItinRef,
      PassengerTypeCode: paxType,
      PassengerQuantity: 1,
      NameElement: {
        CivilityCode: title,
        Firstname: firstName,
        Middlename: null,
        Surname: lastName,
        Extensions: null,
      },
      Title: title,
      FirstName: firstName,
      LastName: lastName,
      GivenName: firstName,
      Surname: lastName,
      DateOfBirth: dobDate && !isNaN(dobDate.getTime()) ? `/Date(${dobDate.getTime()})/` : null,
      Gender: genderCode,
      GenderCode: genderCode,
      Nationality: natCode,
      NationalityCode: natCode,
      PassportNumber: rawPassport || null,
      PassportExpiry: passportExpiryDate && !isNaN(passportExpiryDate.getTime()) ? `/Date(${passportExpiryDate.getTime()})/` : null,
      DocumentInfo: rawPassport ? {
        DocumentNumber: rawPassport,
        DocumentType: 'P',
        ExpiryDate: passportExpiryDate && !isNaN(passportExpiryDate.getTime()) ? `/Date(${passportExpiryDate.getTime()})/` : null,
        NationalityCode: natCode,
      } : null,
      ContactInfo: {
        Email: p.email || contactInfo?.email || '',
        Phone: p.phone || contactInfo?.phone || '',
      },
      Email: p.email || contactInfo?.email || '',
      Phone: p.phone || contactInfo?.phone || '',
      Extensions: null,
    };
  });
  
  console.log('[TTI BOOKING] Named passengers:', JSON.stringify(ttiPassengers.map(p => ({ Ref: p.Ref, RefItinerary: p.RefItinerary, Type: p.PassengerTypeCode, Name: p.FirstName + ' ' + p.LastName }))));

  // ── CRITICAL: TTI CreateBooking requires the Offer from search response ──
  // Without Offer.Ref, TTI can't link this booking to the search session → NullReferenceException
  const offer = flightData._ttiOffer || null;
  
  // ── Only send the SELECTED itinerary's segments, not ALL search results ──
  const rawSegments = flightData._ttiRawSegments || [];
  const allSegments = flightData._ttiAllSegments || [];
  
  // Prefer the itinerary-specific segments (collected during normalization)
  let segments = rawSegments.length > 0 ? rawSegments : allSegments;
  
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

  // ── Build FareInfo with ONLY the selected itinerary ──
  const fullFareInfo = flightData._ttiFullFareInfo || {};
  
  // Filter to only the selected itinerary and its associated fares
  const filteredFareInfo = {
    ...fullFareInfo,
    Itineraries: (fullFareInfo.Itineraries || []).filter(it => it.Ref === selectedItinRef),
    ETTicketFares: (fullFareInfo.ETTicketFares || []).filter(f => 
      f.RefItinerary === selectedItinRef || !f.RefItinerary
    ),
  };
  
  // If filtering removed everything, fall back to full FareInfo
  const fareInfo = filteredFareInfo.Itineraries.length > 0 ? filteredFareInfo : fullFareInfo;
  
  console.log('[TTI BOOKING] Offer:', offer ? `Ref=${offer.Ref}` : 'MISSING!');
  console.log('[TTI BOOKING] Selected itinerary:', selectedItinRef);
  console.log('[TTI BOOKING] Segments count:', segments.length, '| FareInfo.Itineraries:', (fareInfo.Itineraries || []).length, '| FareInfo.ETTicketFares:', (fareInfo.ETTicketFares || []).length);

  // Add RefItinerary to Offer — TTI requires this to know which itinerary to book
  const offerWithRef = offer ? {
    ...offer,
    RefItinerary: selectedItinRef,
  } : { RefItinerary: selectedItinRef };

  const request = {
    RequestInfo: { AuthenticationKey: config.key },
    Offer: offerWithRef,              // CRITICAL: Links to search session + selected itinerary
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
  console.log('[TTI BOOKING] Request payload (truncated):', JSON.stringify(request).substring(0, 3000));

  try {
    const response = await ttiRequest('CreateBooking', request);

    // ── COMPREHENSIVE DEBUG LOGGING ──
    console.log('[TTI BOOKING] Full response keys:', Object.keys(response));
    if (response.Booking) {
      console.log('[TTI BOOKING] Booking keys:', Object.keys(response.Booking));
      // Log all scalar fields from Booking to find PNR
      const bookingScalars = {};
      for (const [k, v] of Object.entries(response.Booking)) {
        if (typeof v !== 'object' || v === null) bookingScalars[k] = v;
      }
      console.log('[TTI BOOKING] Booking scalar fields:', JSON.stringify(bookingScalars));
      // Check Segments for PNR
      if (response.Booking.Segments?.length) {
        const seg = response.Booking.Segments[0];
        console.log('[TTI BOOKING] Booking.Segments[0] keys:', Object.keys(seg));
        const segScalars = {};
        for (const [k, v] of Object.entries(seg)) {
          if (typeof v !== 'object' || v === null) segScalars[k] = v;
        }
        console.log('[TTI BOOKING] Segment[0] scalars:', JSON.stringify(segScalars));
      }
      // Check Passengers
      if (response.Booking.Passengers?.length) {
        const pax = response.Booking.Passengers[0];
        console.log('[TTI BOOKING] Booking.Passengers[0] keys:', Object.keys(pax));
      }
    }
    console.log('[TTI BOOKING] Full response (5000):', JSON.stringify(response).substring(0, 5000));

    if (response.ResponseInfo?.Error) {
      const err = response.ResponseInfo.Error;
      console.error('[TTI BOOKING] API Error:', JSON.stringify(err));
      throw new Error(`TTI booking error: ${err.Message || err.Code || 'Unknown error'}`);
    }

    // Check InvalidData — TTI returns this when booking data is rejected
    if (response.InvalidData) {
      console.error('[TTI BOOKING] ❌ InvalidData:', JSON.stringify(response.InvalidData));
      throw new Error(`TTI booking rejected: ${JSON.stringify(response.InvalidData).substring(0, 500)}`);
    }

    const booking = response.Booking || {};
    
    if (!booking || Object.keys(booking).length === 0) {
      console.error('[TTI BOOKING] ❌ Empty Booking object in response');
      throw new Error('TTI booking returned empty Booking object');
    }

    // Extract PNR — try all possible field names including TTI-specific ones
    const seg0 = booking.Segments?.[0] || {};
    const pax0 = booking.Passengers?.[0] || {};
    const etFare0 = booking.FareInfo?.ETTicketFares?.[0] || {};
    const pnrInfo = booking.PnrInformation || {};

    // Log PnrInformation — this is where Air Astra's airline PNR typically lives
    if (booking.PnrInformation) {
      console.log('[TTI BOOKING] PnrInformation:', JSON.stringify(booking.PnrInformation).substring(0, 1000));
    }
    
    // Log passenger scalars to discover PNR location
    if (booking.Passengers?.length) {
      const paxScalars = {};
      for (const [k, v] of Object.entries(pax0)) {
        if (typeof v !== 'object' || v === null) paxScalars[k] = v;
      }
      console.log('[TTI BOOKING] Passenger[0] scalars:', JSON.stringify(paxScalars));
    }
    // Log ETTicketFare scalars
    if (booking.FareInfo?.ETTicketFares?.length) {
      const etScalars = {};
      for (const [k, v] of Object.entries(etFare0)) {
        if (typeof v !== 'object' || v === null) etScalars[k] = v;
      }
      console.log('[TTI BOOKING] ETTicketFare[0] scalars:', JSON.stringify(etScalars));
    }

    const normalizeCode = (val) => {
      if (!val) return null;
      const code = String(val).trim().toUpperCase();
      return code || null;
    };

    const isLikelyAirlinePnr = (val) => {
      const code = normalizeCode(val);
      if (!code) return false;
      return /^[A-Z0-9]{5,8}$/.test(code);
    };

    const airlinePnrCandidates = [
      // PnrInformation fields (most likely location for airline PNR)
      pnrInfo.PnrCode,
      pnrInfo.RecordLocator,
      pnrInfo.PNR,
      pnrInfo.BookingReference,
      pnrInfo.AirlinePNR,
      pnrInfo.Locator,
      pnrInfo.Code,
      // Also check if PnrInformation is a string directly
      typeof booking.PnrInformation === 'string' ? booking.PnrInformation : null,
      // Original candidates
      booking.RecordLocator,
      seg0.RecordLocator,
      seg0.AirlinePNR,
      pax0.RecordLocator,
      response.RecordLocator,
      booking.PNR,
      seg0.PNR,
      pax0.PNR,
      booking.BookingReference,
      seg0.BookingReference,
      pax0.BookingReference,
      response.BookingReference,
    ];

    const airlinePnr = airlinePnrCandidates
      .map(normalizeCode)
      .find((code) => isLikelyAirlinePnr(code)) || null;

    const ttiBookingId = booking.Id || booking.BookingId || etFare0.Ref || seg0.Ref ||
                          response.BookingId || booking.Reference || booking.Ref || pax0.Ref || null;

    // Backward-compatible top-level pnr: prefer airline locator, fallback to internal booking ID
    const pnr = airlinePnr || ttiBookingId || null;

    const ticketTimeLimit = seg0.TimeLimit || booking.TicketTimeLimit || booking.TimeLimit ||
                             response.TicketTimeLimit || null;

    console.log('[TTI BOOKING] ✅ Extracted — AirlinePNR:', airlinePnr, '| TTI BookingId:', ttiBookingId, '| PNR (used):', pnr, '| TimeLimit:', ticketTimeLimit);

    return {
      success: true,
      pnr,
      airlinePnr,
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
 * TTI uses a SINGLE "Cancel" method for all booking lifecycle actions.
 * The action is controlled via "CancelTicketSettings" in the request body.
 * Discovered via /api/flights/tti-methods probe — only "Cancel", "Ping", "Help" exist.
 */

/**
 * Issue/confirm a ticket for an existing TTI booking (PNR)
 * 
 * NOTE: TTI's Sale Engine may not have a separate ticketing endpoint.
 * In many PSS systems, ticketing happens automatically when payment is confirmed,
 * or is done via the airline's back-office. The "Cancel" method is the only
 * booking management method available on this API.
 * 
 * We attempt: 1) Cancel method with Confirm action, 2) Known method names
 * If all fail, we return a clear message that ticketing must be done manually.
 */
async function issueTicket({ pnr, bookingId }) {
  const config = await getTTIConfig();
  if (!config) throw new Error('TTI API not configured');

  console.log('[TTI TICKET] Issuing ticket for PNR:', pnr, '| BookingId:', bookingId);

  const requestVariants = [
    {
      label: 'Bare + BookingRef inside CancelTicketSettings',
      bare: true,
      body: {
        RequestInfo: { AuthenticationKey: config.key },
        CancelTicketSettings: {
          Action: 'Ticket',
          BookingReference: pnr,
          BookingId: bookingId || undefined,
        },
      },
    },
    {
      label: 'Bare + BookingRef top-level',
      bare: true,
      body: {
        RequestInfo: { AuthenticationKey: config.key },
        BookingReference: pnr,
        BookingId: bookingId || undefined,
        CancelTicketSettings: { Action: 'Ticket', Type: 'Confirm' },
      },
    },
    {
      label: 'Wrapped + BookingRef inside CancelTicketSettings',
      bare: false,
      body: {
        RequestInfo: { AuthenticationKey: config.key },
        CancelTicketSettings: {
          Action: 'Ticket',
          BookingReference: pnr,
          BookingId: bookingId || undefined,
        },
      },
    },
    {
      label: 'Wrapped + BookingRef top-level',
      bare: false,
      body: {
        RequestInfo: { AuthenticationKey: config.key },
        BookingReference: pnr,
        BookingId: bookingId || undefined,
        AgencyInfo: { AgencyId: config.agencyId, AgencyName: config.agencyName },
        CancelTicketSettings: { Action: 'Ticket', Type: 'Confirm' },
      },
    },
  ];

  for (const variant of requestVariants) {
    try {
      console.log(`[TTI TICKET] Trying: ${variant.label}`);
      const response = variant.bare
        ? await ttiRequestBare('Cancel', variant.body)
        : await ttiRequest('Cancel', variant.body);

      console.log('[TTI TICKET] Response keys:', Object.keys(response));
      console.log('[TTI TICKET] Response:', JSON.stringify(response).substring(0, 3000));

      if (response.ResponseInfo?.Error) {
        const errMsg = response.ResponseInfo.Error.Message || response.ResponseInfo.Error.Code || 'Unknown';
        console.error(`[TTI TICKET] ❌ Variant "${variant.label}" error: ${errMsg}`);
        if (errMsg.includes('Missing field') || errMsg.includes('not found') || errMsg.includes('NullReference')) {
          continue;
        }
        // If ticketing isn't supported at all
        if (errMsg.includes('not supported') || errMsg.includes('invalid')) {
          return {
            success: false,
            error: `TTI API does not support remote ticketing. Use Air Astra back-office. Error: ${errMsg}`,
            ticketNumbers: [],
            hint: 'Contact TTI/Air Astra for ticketing API access or use their admin portal.',
          };
        }
        throw new Error(`TTI ticketing error: ${errMsg}`);
      }

      // Extract ticket numbers from response
      const ticketNumbers = [];
      const tickets = response.Tickets || response.ETickets || response.TicketDetails || 
                      response.Booking?.Tickets || response.Booking?.ETickets ||
                      response.TicketInfo || [];
      if (Array.isArray(tickets)) {
        tickets.forEach(t => {
          const num = t.TicketNumber || t.ETicketNumber || t.Number || t.DocumentNumber;
          if (num) ticketNumbers.push(num);
        });
      }
      if (ticketNumbers.length === 0) {
        if (response.TicketNumber) ticketNumbers.push(response.TicketNumber);
        if (response.ETicketNumber) ticketNumbers.push(response.ETicketNumber);
      }
      if (ticketNumbers.length === 0 && response.Booking?.ETTicketFare) {
        const etf = Array.isArray(response.Booking.ETTicketFare) ? response.Booking.ETTicketFare : [response.Booking.ETTicketFare];
        etf.forEach(t => {
          if (t.TicketNumber) ticketNumbers.push(t.TicketNumber);
          if (t.ETicketNumber) ticketNumbers.push(t.ETicketNumber);
        });
      }

      console.log(`[TTI TICKET] ✅ Result via "${variant.label}":`, ticketNumbers.length > 0 ? `Tickets: ${ticketNumbers.join(', ')}` : 'No ticket numbers found');
      return { success: true, ticketNumbers, rawResponse: response, methodUsed: `Cancel (${variant.label})` };
    } catch (err) {
      if (err.message.startsWith('TTI ticketing error:')) throw err;
      console.error(`[TTI TICKET] Variant "${variant.label}" failed:`, err.message);
      continue;
    }
  }

  // All variants failed — TTI likely doesn't support ticketing via API
  return {
    success: false,
    error: 'TTI Cancel API: all ticketing request formats failed. Ticket must be issued via Air Astra back-office.',
    ticketNumbers: [],
    hint: 'Use Air Astra admin portal for ticketing.',
  };
}

/**
 * Cancel a TTI booking
 * Uses the "Cancel" endpoint with flexible payload contracts (TTI schemas vary by environment)
 */
async function cancelBooking({ pnr, bookingId }) {
  const config = await getTTIConfig();
  if (!config) throw new Error('TTI API not configured');

  console.log('[TTI CANCEL] Cancelling booking PNR:', pnr, '| BookingId:', bookingId);

  const refs = [bookingId, pnr].filter(Boolean).map(v => String(v).trim());
  const uniqueRefs = [...new Set(refs)];

  const buildSettingsVariants = (ref) => [
    { Action: 'Cancel', Type: 'Cancel', CancelAll: true, BookingReference: ref, BookingId: bookingId || undefined },
    { Action: 'Cancel', Type: 'Cancel', BookingReference: ref, BookingId: bookingId || undefined },
    { Action: 'Cancel', BookingReference: ref, BookingId: bookingId || undefined },
    { BookingReference: ref, BookingId: bookingId || undefined },
  ];

  const requestVariants = [];
  for (const ref of uniqueRefs) {
    for (const settings of buildSettingsVariants(ref)) {
      requestVariants.push(
        // Wrapped: sent as { request: body } by ttiRequest
        {
          label: `Wrapped + RequestInfo + CancelTicketSettings=${ref}`,
          bare: false,
          body: {
            RequestInfo: { AuthenticationKey: config.key },
            CancelTicketSettings: settings,
          },
        },
        {
          label: `Wrapped + RequestInfo + cancelTicketSettings=${ref}`,
          bare: false,
          body: {
            RequestInfo: { AuthenticationKey: config.key },
            cancelTicketSettings: settings,
          },
        },
        {
          label: `Wrapped + RequestInfo + CancelTicketSetting=${ref}`,
          bare: false,
          body: {
            RequestInfo: { AuthenticationKey: config.key },
            CancelTicketSetting: settings,
          },
        },
        // Bare: direct JSON body
        {
          label: `Bare + RequestInfo + CancelTicketSettings=${ref}`,
          bare: true,
          body: {
            RequestInfo: { AuthenticationKey: config.key },
            CancelTicketSettings: settings,
          },
        },
        {
          label: `Bare + RequestInfo + cancelTicketSettings=${ref}`,
          bare: true,
          body: {
            RequestInfo: { AuthenticationKey: config.key },
            cancelTicketSettings: settings,
          },
        },
        {
          label: `Bare + RequestInfo + CancelTicketSetting=${ref}`,
          bare: true,
          body: {
            RequestInfo: { AuthenticationKey: config.key },
            CancelTicketSetting: settings,
          },
        },
        {
          label: `Bare + request wrapper + CancelTicketSettings=${ref}`,
          bare: true,
          body: {
            request: {
              RequestInfo: { AuthenticationKey: config.key },
              CancelTicketSettings: settings,
            },
          },
        }
      );
    }
  }

  const isStructuralError = (msg = '') => {
    const m = String(msg);
    return (
      m.includes('Missing field') ||
      m.includes('Missing RequestInfo') ||
      m.includes('MissingRequestInfo') ||
      m.includes('not found') ||
      m.includes('NullReference') ||
      m.includes('not valid')
    );
  };

  for (const variant of requestVariants) {
    try {
      console.log(`[TTI CANCEL] Trying: ${variant.label}`);
      const response = variant.bare
        ? await ttiRequestBare('Cancel', variant.body)
        : await ttiRequest('Cancel', variant.body);

      console.log('[TTI CANCEL] Response keys:', Object.keys(response));
      console.log('[TTI CANCEL] Response:', JSON.stringify(response).substring(0, 3000));

      if (response.ResponseInfo?.Error) {
        const errMsg = response.ResponseInfo.Error.Message || response.ResponseInfo.Error.Code || 'Unknown';
        console.error(`[TTI CANCEL] ❌ ${variant.label}: ${errMsg}`);
        if (isStructuralError(errMsg)) continue;
        throw new Error(`TTI cancel error: ${errMsg}`);
      }

      console.log(`[TTI CANCEL] ✅ Cancelled via "${variant.label}"`);
      return { success: true, rawResponse: response, methodUsed: `Cancel (${variant.label})` };
    } catch (err) {
      if (err.message.startsWith('TTI cancel error:')) throw err;
      console.error(`[TTI CANCEL] Variant "${variant.label}" failed:`, err.message);
      continue;
    }
  }

  console.error('[TTI CANCEL] ❌ All cancel variants failed for refs:', uniqueRefs.join(', '));
  return {
    success: false,
    error: `TTI Cancel API: all request formats failed for refs ${uniqueRefs.join(', ')}. Cancel via Air Astra back-office.`,
  };
}



/**
 * Void a ticket in TTI
 * Uses the "Cancel" method with CancelTicketSettings for void action
 */
async function voidTicket({ pnr, ticketNumber }) {
  const config = await getTTIConfig();
  if (!config) throw new Error('TTI API not configured');

  console.log('[TTI VOID] Voiding ticket:', ticketNumber, 'PNR:', pnr);

  const requestVariants = [
    {
      label: 'Bare + BookingRef inside CancelTicketSettings',
      bare: true,
      body: {
        RequestInfo: { AuthenticationKey: config.key },
        CancelTicketSettings: {
          Action: 'Void',
          BookingReference: pnr,
          TicketNumber: ticketNumber,
        },
      },
    },
    {
      label: 'Bare + BookingRef top-level',
      bare: true,
      body: {
        RequestInfo: { AuthenticationKey: config.key },
        BookingReference: pnr,
        CancelTicketSettings: { Action: 'Void', Type: 'Void', TicketNumber: ticketNumber },
      },
    },
    {
      label: 'Wrapped + BookingRef inside CancelTicketSettings',
      bare: false,
      body: {
        RequestInfo: { AuthenticationKey: config.key },
        CancelTicketSettings: {
          Action: 'Void',
          BookingReference: pnr,
          TicketNumber: ticketNumber,
        },
      },
    },
    {
      label: 'Wrapped + BookingRef top-level',
      bare: false,
      body: {
        RequestInfo: { AuthenticationKey: config.key },
        BookingReference: pnr,
        AgencyInfo: { AgencyId: config.agencyId, AgencyName: config.agencyName },
        CancelTicketSettings: { Action: 'Void', Type: 'Void', TicketNumber: ticketNumber },
      },
    },
  ];

  for (const variant of requestVariants) {
    try {
      console.log(`[TTI VOID] Trying: ${variant.label}`);
      const response = variant.bare
        ? await ttiRequestBare('Cancel', variant.body)
        : await ttiRequest('Cancel', variant.body);

      console.log('[TTI VOID] Response:', JSON.stringify(response).substring(0, 3000));

      if (response.ResponseInfo?.Error) {
        const errMsg = response.ResponseInfo.Error.Message || response.ResponseInfo.Error.Code || 'Unknown';
        console.error(`[TTI VOID] ❌ Variant "${variant.label}" error: ${errMsg}`);
        if (errMsg.includes('Missing field') || errMsg.includes('not found') || errMsg.includes('NullReference')) {
          continue;
        }
        throw new Error(`TTI void error: ${errMsg}`);
      }

      console.log(`[TTI VOID] ✅ Ticket voided via "${variant.label}":`, ticketNumber);
      return { success: true, rawResponse: response, methodUsed: `Cancel (${variant.label})` };
    } catch (err) {
      if (err.message.startsWith('TTI void error:')) throw err;
      console.error(`[TTI VOID] Variant "${variant.label}" failed:`, err.message);
      continue;
    }
  }

  return { success: false, error: `TTI Void API: all request formats failed for PNR ${pnr}.` };
}

module.exports = { searchFlights, createBooking, issueTicket, cancelBooking, voidTicket, ttiRequest, ttiRequestBare, getTTIConfig, getAirlineName, clearTTIConfigCache };
