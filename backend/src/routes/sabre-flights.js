/**
 * Sabre GDS API integration — JV_BD OTA Solution
 * OAuth v3 password grant (EPR-PCC + agency password)
 * Credentials stored in system_settings DB table (key: 'api_sabre')
 * Admin Panel → Settings → API Integrations → Sabre GDS
 *
 * Auth: POST /v3/auth/token (password grant, Basic auth with JV_BD shared secret)
 * CERT: https://api.cert.platform.sabre.com
 * PROD: https://api.platform.sabre.com
 * PCC: J4YL | EPR: 631470
 */

const db = require('../config/db');
const zlib = require('zlib');

// ── Config cache (5 min TTL) ──
let _configCache = null;
let _configCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getSabreConfig() {
  if (_configCache && Date.now() - _configCacheTime < CACHE_TTL) return _configCache;
  try {
    const [rows] = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'api_sabre'");
    if (rows.length === 0 || !rows[0].setting_value) return null;
    const cfg = JSON.parse(rows[0].setting_value);
    if (cfg.enabled !== 'true' && cfg.enabled !== true) return null;

    // Auto-detect production: if environment is set, use it; otherwise check if prod URL/credentials exist
    const isProd = cfg.environment === 'production' || cfg.environment === 'prod'
      || (!cfg.environment && (cfg.prod_url || cfg.prod_basic_auth || cfg.prodPassword));
    const baseUrl = isProd
      ? (cfg.prod_url || 'https://api.platform.sabre.com')
      : (cfg.sandbox_url || 'https://api.cert.platform.sabre.com');

    const pick = (...vals) => vals.find(v => typeof v === 'string' && v.trim().length > 0)?.trim() || '';

    // Pick env-specific client credentials (CERT and PROD have different secrets per Sabre JV_BD docs)
    const clientId = isProd
      ? pick(cfg.prod_client_id, cfg.clientId, cfg.sandbox_client_id)
      : pick(cfg.cert_client_id, cfg.clientId, cfg.sandbox_client_id, cfg.prod_client_id);
    const clientSecret = isProd
      ? pick(cfg.prod_client_secret, cfg.clientSecret, cfg.sandbox_client_secret)
      : pick(cfg.cert_client_secret, cfg.clientSecret, cfg.sandbox_client_secret, cfg.prod_client_secret);

    // Pre-computed Basic auth from Sabre JV_BD official docs (avoids encoding issues)
    const basicAuth = isProd
      ? pick(cfg.prod_basic_auth)
      : pick(cfg.cert_basic_auth);

    if (!clientId || !clientSecret) {
      console.error('[Sabre] Missing client credentials. Configure cert/prod client_id and client_secret in Admin → Settings → API Integrations → Sabre GDS');
      return null;
    }

    // EPR + password required for OAuth v3 password grant
    const epr = pick(cfg.epr);
    // Use environment-appropriate password
    const agencyPassword = isProd
      ? pick(cfg.prodPassword, cfg.agency_password)
      : pick(cfg.agencyPassword, cfg.agency_password);
    if (!epr || !agencyPassword) {
      console.error('[Sabre] EPR and agency_password are required for OAuth v3. Configure in Admin → Settings → API Integrations → Sabre GDS');
      return null;
    }

    _configCache = {
      baseUrl: baseUrl.replace(/\/$/, ''),
      clientId,
      clientSecret,
      basicAuth, // pre-computed base64 from Sabre docs
      pcc: cfg.pcc || cfg.scCode || '',
      epr,
      agencyPassword,
      environment: cfg.environment || 'cert',
      ptr: cfg.ptr || cfg.PTR || '',
      tamPool: cfg.tamPool || '',
    };
    _configCacheTime = Date.now();
    console.log(`[Sabre] Config loaded: env=${_configCache.environment}, PCC=${_configCache.pcc}, EPR=${_configCache.epr}, hasBasicAuth=${!!basicAuth}`);
    return _configCache;
  } catch (err) {
    console.error('[Sabre] Config load error:', err.message);
    return null;
  }
}

function clearSabreConfigCache() { _configCache = null; _configCacheTime = 0; }

// ── OAuth2 v3 Token Management (Password Grant — JV_BD OTA) ──
let tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken(config) {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60000) return tokenCache.token;

  try {
    // Use pre-computed Basic auth from Sabre JV_BD official docs if available,
    // otherwise compute from clientId:clientSecret
    const credentials = config.basicAuth
      ? config.basicAuth
      : Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

    // JV_BD OAuth v3: password grant with EPR-PCC-AA as username (confirmed working format)
    const username = `${config.epr}-${config.pcc}-AA`;
    const body = `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(config.agencyPassword)}`;

    console.log(`[Sabre] Authenticating via OAuth v3 (EPR: ${config.epr}, PCC: ${config.pcc}, env: ${config.environment})`);
    console.log(`[Sabre] URL: ${config.baseUrl}/v3/auth/token | username: ${username} | usingPrecomputedAuth: ${!!config.basicAuth}`);

    const res = await fetch(`${config.baseUrl}/v3/auth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[Sabre] OAuth v3 auth failed: ${res.status} ${errText.slice(0, 300)}`);
      console.error(`[Sabre] Debug: clientId=${config.clientId}, basicAuthLen=${credentials.length}, username=${username}`);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 604800) * 1000,
      };
      console.log('[Sabre] OAuth v3 token acquired, expires in', data.expires_in, 'seconds');
      return tokenCache.token;
    }
    return null;
  } catch (err) {
    console.error('[Sabre] OAuth v3 auth error:', err.message);
    return null;
  }
}

// ── Sabre API Request Helper ──
async function sabreRequest(config, endpoint, body, method = 'POST') {
  const token = await getAccessToken(config);
  if (!token) throw new Error('Sabre authentication failed');

  const url = `${config.baseUrl}${endpoint}`;
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(30000),
  };

  if (body && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`[Sabre] API error on ${endpoint}: ${res.status} ${errText.slice(0, 1000)}`);
    throw new Error(`Sabre API ${res.status}: ${errText.slice(0, 500)}`);
  }
  return res.json();
}

// ── Flight Search (Bargain Finder Max) ──
// Supports: one-way, round-trip, AND multi-city (via params.segments array)
async function searchFlights(params) {
  const config = await getSabreConfig();
  if (!config) return [];

  const {
    origin, destination, departDate, returnDate,
    adults = 1, children = 0, infants = 0,
    cabinClass,
    segments, // multi-city: [{ from, to, date }, ...]
  } = params;

  // Multi-city: build OD from segments array
  const isMultiCity = Array.isArray(segments) && segments.length >= 2;

  if (!isMultiCity && (!origin || !destination || !departDate)) return [];

  // Map cabin class to Sabre codes
  const cabinMap = {
    'Economy': 'Y', 'Premium Economy': 'S', 'Business': 'C', 'First': 'F',
    'economy': 'Y', 'premium_economy': 'S', 'business': 'C', 'first': 'F',
  };
  const sabreCabin = cabinMap[cabinClass] || 'Y';

  // Build passenger types
  const passengers = [];
  if (adults > 0) passengers.push({ Code: 'ADT', Quantity: adults });
  if (children > 0) passengers.push({ Code: 'CNN', Quantity: children });
  if (infants > 0) passengers.push({ Code: 'INF', Quantity: infants });

  // Build origin-destination info
  let originDest;
  if (isMultiCity) {
    originDest = segments.map((seg, i) => ({
      RPH: String(i + 1),
      DepartureDateTime: `${seg.date}T00:00:00`,
      OriginLocation: { LocationCode: seg.from },
      DestinationLocation: { LocationCode: seg.to },
    }));
    console.log(`[Sabre] Multi-city search: ${segments.map(s => `${s.from}→${s.to}`).join(', ')}`);
  } else {
    originDest = [{
      RPH: '1',
      DepartureDateTime: `${departDate}T00:00:00`,
      OriginLocation: { LocationCode: origin },
      DestinationLocation: { LocationCode: destination },
    }];
    if (returnDate) {
      originDest.push({
        RPH: '2',
        DepartureDateTime: `${returnDate}T00:00:00`,
        OriginLocation: { LocationCode: destination },
        DestinationLocation: { LocationCode: origin },
      });
    }
  }

  // Bargain Finder Max request body
  const requestBody = {
    OTA_AirLowFareSearchRQ: {
      Version: '5',
      POS: {
        Source: [{
          PseudoCityCode: config.pcc || 'F9CE',
          RequestorID: { Type: '1', ID: '1', CompanyName: { Code: 'TN' } },
        }],
      },
      OriginDestinationInformation: originDest,
      TravelPreferences: {
        TPA_Extensions: {
          NumTrips: { Number: 200 },
          DataSources: {
            NDC: 'Enable',
            ATPCO: 'Enable',
            LCC: 'Enable',
          },
          DiversityParameters: {
            Weightings: {
              PriceWeight: 8,
              TravelTimeWeight: 2,
            },
          },
        },
        CabinPref: [{ Cabin: sabreCabin, PreferLevel: 'Preferred' }],
      },
        TPA_Extensions: {
          IntelliSellTransaction: {
            RequestType: { Name: '200ITINS' },
          },
        },
      TravelerInfoSummary: {
        AirTravelerAvail: [{
          PassengerTypeQuantity: passengers,
        }],
      },
    },
  };

  try {
    const logRoute = isMultiCity
      ? segments.map(s => `${s.from}→${s.to}`).join(', ')
      : `${origin} → ${destination}`;
    console.log(`[Sabre] Searching ${logRoute}...`);
    let raw = await sabreRequest(config, '/v5/offers/shop', requestBody);

    // Handle compressed response from Sabre (base64-encoded gzip)
    if (raw?.compressedResponse && typeof raw.compressedResponse === 'string') {
      try {
        const buf = Buffer.from(raw.compressedResponse, 'base64');
        const decompressed = zlib.gunzipSync(buf);
        raw = JSON.parse(decompressed.toString('utf8'));
        console.log(`[Sabre] Decompressed response successfully`);
      } catch (decompErr) {
        console.error(`[Sabre] Failed to decompress compressedResponse:`, decompErr.message);
      }
    }

    const topKeys = raw ? Object.keys(raw) : [];
    console.log(`[Sabre] BFM response keys: ${JSON.stringify(topKeys)}`);
    const rs = raw?.OTA_AirLowFareSearchRS || raw?.groupedItineraryResponse || raw;
    const itinCount = rs?.PricedItineraries?.PricedItinerary?.length
      || rs?.itineraryGroups?.[0]?.itineraries?.length
      || 0;
    console.log(`[Sabre] BFM itinerary count: ${itinCount}, hasStatistics: ${!!rs?.statistics}`);
    if (itinCount === 0) {
      console.log(`[Sabre] BFM raw (truncated): ${JSON.stringify(raw).slice(0, 2000)}`);
    }
    const results = normalizeSabreResponse(raw, { ...params, isMultiCity, segmentCount: isMultiCity ? segments.length : (returnDate ? 2 : 1) });
    console.log(`[Sabre] Normalized ${results.length} flights`);
    return results;
  } catch (err) {
    console.error('[Sabre] Search failed:', err.message);
    return [];
  }
}

// ── Normalize Sabre BFM response to standard flight format ──
function normalizeSabreResponse(raw, params) {
  const flights = [];

  try {
    // Detect response format: grouped (newer) vs classic OTA
    if (raw?.groupedItineraryResponse) {
      return normalizeGroupedResponse(raw.groupedItineraryResponse, params);
    }

    const response = raw?.OTA_AirLowFareSearchRS || raw;
    const pricedItins = response?.PricedItineraries?.PricedItinerary || [];

    for (let idx = 0; idx < pricedItins.length; idx++) {
      const itin = pricedItins[idx];
      const airItinerary = itin.AirItinerary || {};
      const pricingInfo = itin.AirItineraryPricingInfo || {};
      const odOptions = airItinerary.OriginDestinationOptions?.OriginDestinationOption || [];

      // Extract pricing
      const totalFare = pricingInfo.ItinTotalFare || {};
      const totalAmount = parseFloat(totalFare.TotalFare?.Amount || totalFare.Amount || 0);
      const baseFareAmt = parseFloat(totalFare.BaseFare?.Amount || 0);
      const taxesAmt = parseFloat(totalFare.Taxes?.Tax?.[0]?.Amount || totalFare.Taxes?.Amount || 0) || (totalAmount - baseFareAmt);
      const currency = totalFare.TotalFare?.CurrencyCode || totalFare.CurrencyCode || 'BDT';

      // Extract fare rules
      let isRefundable = false;
      let cancellationPolicy = null;
      let dateChangePolicy = null;
      const fareInfos = pricingInfo.FareInfos?.FareInfo || [];
      for (const fi of fareInfos) {
        if (fi.TPA_Extensions?.Refundable?.Ind === true || fi.IsRefundable === true) {
          isRefundable = true;
        }
        if (fi.TPA_Extensions?.Penalties) {
          const penalties = fi.TPA_Extensions.Penalties;
          if (penalties.Penalty) {
            for (const p of (Array.isArray(penalties.Penalty) ? penalties.Penalty : [penalties.Penalty])) {
              if (p.Type === 'Refund' || p.Type === 'Cancel') {
                cancellationPolicy = {
                  beforeDeparture: p.Amount ? parseFloat(p.Amount) : null,
                  afterDeparture: 'Non-refundable',
                  noShow: 'Non-refundable',
                  currency,
                };
              }
              if (p.Type === 'Exchange' || p.Type === 'Reissue') {
                dateChangePolicy = {
                  changeAllowed: !p.NotPermitted,
                  changeFee: p.Amount ? parseFloat(p.Amount) : null,
                  currency,
                };
              }
            }
          }
        }
      }

      // Process each origin-destination (outbound / return)
      for (let odIdx = 0; odIdx < odOptions.length; odIdx++) {
        const od = odOptions[odIdx];
        const segments = od.FlightSegment || [];
        if (segments.length === 0) continue;

        const legs = segments.map(seg => {
          const depAirport = seg.DepartureAirport || {};
          const arrAirport = seg.ArrivalAirport || {};
          const operatingAirline = seg.OperatingAirline || {};
          const marketingAirline = seg.MarketingAirline || {};
          const equipment = seg.Equipment || {};

          return {
            origin: depAirport.LocationCode || '',
            destination: arrAirport.LocationCode || '',
            departureTime: seg.DepartureDateTime || null,
            arrivalTime: seg.ArrivalDateTime || null,
            durationMinutes: seg.ElapsedTime || 0,
            duration: formatDuration(seg.ElapsedTime || 0),
            flightNumber: `${marketingAirline.Code || ''}${seg.FlightNumber || ''}`,
            airlineCode: marketingAirline.Code || operatingAirline.Code || '',
            operatingAirline: operatingAirline.Code || marketingAirline.Code || '',
            aircraft: equipment.AirEquipType || '',
            originTerminal: depAirport.Terminal || '',
            destinationTerminal: arrAirport.Terminal || '',
            stops: [],
          };
        });

        const firstLeg = legs[0];
        const lastLeg = legs[legs.length - 1];

        // Total duration including layovers
        let totalDurationMin = 0;
        for (const leg of legs) totalDurationMin += leg.durationMinutes;
        for (let i = 1; i < legs.length; i++) {
          if (legs[i].departureTime && legs[i - 1].arrivalTime) {
            const layover = (new Date(legs[i].departureTime).getTime() - new Date(legs[i - 1].arrivalTime).getTime()) / 60000;
            if (layover > 0) totalDurationMin += layover;
          }
        }

        const direction = odIdx === 0 ? 'outbound' : 'return';
        const pricePerDirection = odOptions.length > 1 ? Math.round(totalAmount / odOptions.length) : totalAmount;

        // Extract booking class and seat availability
        let bookingClass = '';
        let minSeats = Infinity;
        let checkedBaggage = null;
        for (const fi of fareInfos) {
          if (fi.FareReference) bookingClass = fi.FareReference;
          if (fi.TPA_Extensions?.SeatsRemaining?.Number !== undefined) {
            const seats = parseInt(fi.TPA_Extensions.SeatsRemaining.Number);
            if (seats < minSeats) minSeats = seats;
          }
          // Baggage
          if (fi.TPA_Extensions?.BaggageInformationList?.BaggageInformation) {
            const bagInfos = fi.TPA_Extensions.BaggageInformationList.BaggageInformation;
            for (const bi of (Array.isArray(bagInfos) ? bagInfos : [bagInfos])) {
              const allowance = bi.Allowance || {};
              if (allowance.Weight) {
                checkedBaggage = `${allowance.Weight}${(allowance.Unit || 'KG').toUpperCase()}`;
              } else if (allowance.Pieces !== undefined) {
                checkedBaggage = `${allowance.Pieces} piece${allowance.Pieces > 1 ? 's' : ''}`;
              } else if (allowance.PieceCount !== undefined) {
                checkedBaggage = `${allowance.PieceCount} piece${allowance.PieceCount > 1 ? 's' : ''}`;
              }
            }
          }
        }
        const availableSeats = minSeats === Infinity ? null : minSeats;

        // Extract time limit
        let timeLimit = null;
        if (pricingInfo.TPA_Extensions?.TicketingTimeLimit) {
          timeLimit = pricingInfo.TPA_Extensions.TicketingTimeLimit;
        } else if (itin.TPA_Extensions?.ValidatingCarrier?.TicketingTimeLimit) {
          timeLimit = itin.TPA_Extensions.ValidatingCarrier.TicketingTimeLimit;
        }

        const validatingCarrier = itin.TPA_Extensions?.ValidatingCarrier?.Code
          || itin.ValidatingAirlineCode
          || firstLeg.airlineCode;

        flights.push({
          id: `sabre-${idx}-${direction}`,
          source: 'sabre',
          direction,
          isRoundTrip: odOptions.length > 1,
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
          stops: legs.length - 1,
          stopCodes: legs.length > 1 ? legs.slice(0, -1).map(l => l.destination) : [],
          cabinClass: getCabinName(fareInfos[0]?.TPA_Extensions?.Cabin?.Cabin || 'Y'),
          bookingClass,
          availableSeats,
          price: pricePerDirection,
          baseFare: odOptions.length > 1 ? Math.round(baseFareAmt / odOptions.length) : baseFareAmt,
          taxes: odOptions.length > 1 ? Math.round(taxesAmt / odOptions.length) : taxesAmt,
          totalRoundTripPrice: odOptions.length > 1 ? totalAmount : undefined,
          currency,
          refundable: isRefundable,
          baggage: checkedBaggage || null,
          handBaggage: '7KG',
          aircraft: firstLeg.aircraft,
          legs,
          fareDetails: fareInfos.map(fi => ({
            fareBasis: fi.FareBasis?.Code || fi.FareReference || '',
            bookingClass: fi.FareReference || '',
            cabinClass: fi.TPA_Extensions?.Cabin?.Cabin || '',
            availableSeats: fi.TPA_Extensions?.SeatsRemaining?.Number ?? null,
          })),
          timeLimit,
          cancellationPolicy,
          dateChangePolicy,
          validatingAirline: validatingCarrier,
          _sabreSeqNumber: itin.SequenceNumber || idx,
        });
      }
    }
  } catch (err) {
    console.error('[Sabre] Normalization error:', err.message);
  }

  return flights;
}

// ── Grouped Itinerary Response (newer Sabre format) ──
function normalizeGroupedResponse(response, params) {
  const flights = [];
  try {
    const legDescs = response.legDescs || [];
    const scheduleDescs = response.scheduleDescs || [];
    const fareComponentDescs = response.fareComponentDescs || [];
    const baggageAllowanceDescs = response.baggageAllowanceDescs || [];
    const itinGroups = response.itineraryGroups || [];

    // Build baggage lookup: id → descriptor (handle both camelCase and PascalCase)
    const baggageLookup = {};
    for (const bd of baggageAllowanceDescs) {
      const bdId = bd.id ?? bd.Id ?? bd.ID;
      if (bdId !== undefined) baggageLookup[bdId] = bd;
    }

    // Debug: log baggage descriptors once
    if (baggageAllowanceDescs.length > 0) {
      console.log(`[Sabre] baggageAllowanceDescs (${baggageAllowanceDescs.length}):`, JSON.stringify(baggageAllowanceDescs.slice(0, 5)));
    } else {
      console.log(`[Sabre] WARNING: No baggageAllowanceDescs in grouped response`);
    }

    for (const group of itinGroups) {
      const groupDesc = group.groupDescription || {};
      const itineraries = group.itineraries || [];

      for (let idx = 0; idx < itineraries.length; idx++) {
        const itin = itineraries[idx];
        const pricingInfo = itin.pricingInformation || [];
        if (pricingInfo.length === 0) continue;

        const pricing = pricingInfo[0];
        const fare = pricing.fare || {};
        const totalFare = fare.totalFare || {};
        const totalAmount = parseFloat(totalFare.totalPrice || 0);
        const baseFareAmt = parseFloat(totalFare.baseFareAmount || 0);
        const taxesAmt = parseFloat(totalFare.totalTaxAmount || 0);
        const currency = totalFare.currency || 'BDT';

        // Extract baggage per segment from passengerInfoList
        const passengerInfoList = fare.passengerInfoList || [];
        const allBaggageInfos = [];
        let checkedBaggageGlobal = null;
        let handBaggageGlobal = null;

        // Debug first itinerary's baggage structure
        if (idx === 0) {
          const pInfo = passengerInfoList[0]?.passengerInfo || {};
          console.log(`[Sabre] First itin passengerInfo keys:`, Object.keys(pInfo));
          const bi = pInfo.baggageInformation || pInfo.BaggageInformation || [];
          console.log(`[Sabre] baggageInformation (${bi.length}):`, JSON.stringify(bi.slice(0, 3)));
        }

        for (const paxInfo of passengerInfoList) {
          const pInfo = paxInfo.passengerInfo || paxInfo.PassengerInfo || {};
          const baggageInfos = pInfo.baggageInformation || pInfo.BaggageInformation || [];
          
          for (const bi of baggageInfos) {
            const allowance = bi.allowance || bi.Allowance || {};
            const ref = allowance.ref ?? allowance.Ref ?? allowance.REF;
            
            // Resolve from lookup
            let resolved = allowance;
            if (ref !== undefined && baggageLookup[ref]) {
              resolved = baggageLookup[ref];
            }
            
            // Extract segment info
            const segmentInfo = bi.segment || bi.Segment || {};
            const provisionType = bi.provisionType || bi.ProvisionType || '';
            
            // Try all possible field name variations (camelCase, PascalCase, lowercase)
            const weight = resolved.weight ?? resolved.Weight ?? resolved.WEIGHT;
            const unit = (resolved.unit ?? resolved.Unit ?? resolved.UNIT) || 'KG';
            const pieceCount = resolved.pieceCount ?? resolved.PieceCount ?? resolved.Pieces ?? resolved.pieces ?? resolved.NumberOfPieces ?? resolved.numberOfPieces;
            const maxWeight = resolved.maxWeight ?? resolved.MaxWeight;
            const maxWeightUnit = resolved.maxWeightUnit ?? resolved.MaxWeightUnit;
            
            let baggageStr = null;
            if (weight) {
              baggageStr = `${weight}${String(unit).toUpperCase()}`;
            } else if (pieceCount !== undefined) {
              // If piece-based, check if there's a per-piece weight
              if (maxWeight) {
                baggageStr = `${pieceCount}PC x ${maxWeight}${String(maxWeightUnit || 'KG').toUpperCase()}`;
              } else {
                baggageStr = `${pieceCount} Piece${pieceCount > 1 ? 's' : ''}`;
              }
            }
            
            if (baggageStr) {
              // provisionType: 'A' = checked, 'B' = carry-on/hand, 'C' = carry-on
              if (provisionType === 'B' || provisionType === 'C') {
                if (!handBaggageGlobal) handBaggageGlobal = baggageStr;
              } else {
                if (!checkedBaggageGlobal) checkedBaggageGlobal = baggageStr;
              }
              allBaggageInfos.push({ provisionType, baggage: baggageStr, segment: segmentInfo });
            }
          }
        }

        // Default hand baggage to 7KG if not provided (standard IATA cabin allowance)
        if (!handBaggageGlobal) {
          handBaggageGlobal = '7KG';
        }

        // Debug baggage result for first itinerary
        if (idx === 0) {
          console.log(`[Sabre] Resolved baggage: checked=${checkedBaggageGlobal}, hand=${handBaggageGlobal}, total infos=${allBaggageInfos.length}`);
        }

        // Extract fare details from pricingInformation for fare options (branded fares)
        const fareDetailsArr = pricingInfo.map((pi, piIdx) => {
          const piFare = pi.fare || {};
          const piTotal = piFare.totalFare || {};
          const piPassengers = piFare.passengerInfoList || [];
          const piFareComponents = piPassengers[0]?.passengerInfo?.fareComponents || [];
          
          // Extract brand name from fareComponentDescs reference
          let brandName = '';
          let brandCode = '';
          for (const fc of piFareComponents) {
            const brand = fc.brand || fc.brandFeatures || {};
            brandName = brand.brandName || brand.name || brandName;
            brandCode = brand.brandCode || brand.code || brandCode;
            // Also check fareComponentDescs lookup by ref
            const fcRef = fc.ref ?? fc.id;
            if (!brandName && fcRef !== undefined) {
              const fcDesc = fareComponentDescs.find(d => d.id === fcRef);
              if (fcDesc) {
                brandName = fcDesc.brandName || fcDesc.brand?.brandName || fcDesc.brand?.name || '';
                brandCode = fcDesc.brandCode || fcDesc.brand?.brandCode || '';
              }
            }
          }
          
          // Extract per-pax baggage for this fare option
          let piBaggage = checkedBaggageGlobal;
          let piHandBaggage = handBaggageGlobal;
          let mealIncluded = false;
          let seatSelection = false;
          let isNonRefundable = true;

          for (const paxInfo of piPassengers) {
            const pInfo = paxInfo.passengerInfo || {};
            const bInfos = pInfo.baggageInformation || [];
            if (pInfo.nonRefundable === false) isNonRefundable = false;
            for (const bi of bInfos) {
              const allowance = bi.allowance || {};
              const ref = allowance.ref ?? allowance.Ref;
              const resolved = (ref !== undefined && baggageLookup[ref]) ? baggageLookup[ref] : allowance;
              const w = resolved.weight ?? resolved.Weight;
              const u = (resolved.unit ?? resolved.Unit) || 'KG';
              const pc = resolved.pieceCount ?? resolved.PieceCount ?? resolved.Pieces ?? resolved.pieces;
              const pt = bi.provisionType || '';
              let bStr = null;
              if (w) bStr = `${w}${String(u).toUpperCase()}`;
              else if (pc !== undefined) bStr = `${pc} Piece${pc > 1 ? 's' : ''}`;
              if (bStr) {
                if (pt === 'B' || pt === 'C') { if (!piHandBaggage) piHandBaggage = bStr; }
                else { piBaggage = bStr; }
              }
            }
          }

          // Extract penalty info for this pricing option
          const penInfos = piPassengers[0]?.passengerInfo?.penaltyInformation || [];
          let rebookingAllowed = true;
          let cancellationAllowed = !isNonRefundable;
          for (const pen of penInfos) {
            const cat = pen.cat || pen.category || '';
            if (cat === 'Exchange' || cat === 'Reissue') {
              rebookingAllowed = !(pen.details?.isNonChangeable);
            }
            if (cat === 'Refund' || cat === 'Cancel') {
              cancellationAllowed = !(pen.details?.isNonRefundable);
            }
          }

          return {
            fareBasis: piFareComponents[0]?.segments?.[0]?.fareBasisCode || '',
            bookingClass: piFareComponents[0]?.segments?.[0]?.bookingCode || '',
            cabinClass: piFareComponents[0]?.segments?.[0]?.cabin?.cabin || '',
            availableSeats: piFareComponents[0]?.segments?.[0]?.seatsAvailable ?? null,
            price: parseFloat(piTotal.totalPrice || 0),
            baseFare: parseFloat(piTotal.baseFareAmount || 0),
            taxes: parseFloat(piTotal.totalTaxAmount || 0),
            currency: piTotal.currency || 'BDT',
            baggage: piBaggage,
            handBaggage: piHandBaggage,
            refundable: !isNonRefundable,
            brandName: brandName || '',
            brandCode: brandCode || '',
            mealIncluded,
            seatSelection,
            rebookingAllowed,
            cancellationAllowed,
          };
        });

        const itinLegs = itin.legs || [];
        const isMultiCityItin = (params.isMultiCity && itinLegs.length >= 2);
        
        if (isMultiCityItin) {
          // ── MULTI-CITY: Emit one combined flight object with all segment legs ──
          const allLegs = [];
          const segmentDetails = [];
          
          for (let legIdx = 0; legIdx < itinLegs.length; legIdx++) {
            const leg = itinLegs[legIdx];
            const legRef = leg.ref;
            const legDesc = legDescs.find(ld => ld.id === legRef) || {};
            const schedules = legDesc.schedules || [];
            const legDepartDate = groupDesc.legDescriptions?.[legIdx]?.departureDate || '';

            const segLegs = schedules.map((sched) => {
              const schedRef = sched.ref;
              const schedDesc = scheduleDescs.find(sd => sd.id === schedRef) || {};
              const dep = schedDesc.departure || sched.departure || {};
              const arr = schedDesc.arrival || sched.arrival || {};
              const carrier = schedDesc.carrier || {};

              let depDateTime = dep.dateTime || null;
              let arrDateTime = arr.dateTime || null;
              if (!depDateTime && dep.time && legDepartDate) {
                const depAdj = sched.departureDateAdjustment || 0;
                depDateTime = `${adjustDate(legDepartDate, depAdj)}T${dep.time}`;
              }
              if (!arrDateTime && arr.time && legDepartDate) {
                const arrAdj = sched.departureDateAdjustment || 0;
                const arrDateAdj = (arr.time < dep.time) ? arrAdj + 1 : arrAdj;
                arrDateTime = `${adjustDate(legDepartDate, arrDateAdj)}T${arr.time}`;
              }

              return {
                origin: dep.airport || '',
                destination: arr.airport || '',
                departureTime: depDateTime,
                arrivalTime: arrDateTime,
                durationMinutes: schedDesc.elapsedTime || 0,
                duration: formatDuration(schedDesc.elapsedTime || 0),
                flightNumber: `${carrier.marketing || carrier.operating || ''}${carrier.marketingFlightNumber || ''}`,
                airlineCode: carrier.marketing || carrier.operating || '',
                operatingAirline: carrier.operating || carrier.marketing || '',
                aircraft: carrier.equipment?.code || '',
                originTerminal: dep.terminal || '',
                destinationTerminal: arr.terminal || '',
                stops: [],
              };
            });

            if (segLegs.length === 0) continue;
            allLegs.push(...segLegs);

            const segFirst = segLegs[0];
            const segLast = segLegs[segLegs.length - 1];
            const segDuration = legDesc.elapsedTime || segLegs.reduce((s, l) => s + l.durationMinutes, 0);
            
            segmentDetails.push({
              segmentIndex: legIdx,
              origin: segFirst.origin,
              destination: segLast.destination,
              departureTime: segFirst.departureTime,
              arrivalTime: segLast.arrivalTime,
              duration: formatDuration(segDuration),
              durationMinutes: segDuration,
              stops: segLegs.length - 1,
              stopCodes: segLegs.length > 1 ? segLegs.slice(0, -1).map(l => l.destination) : [],
              airline: getAirlineName(segFirst.airlineCode),
              airlineCode: segFirst.airlineCode,
              flightNumber: segFirst.flightNumber,
              legs: segLegs,
              baggage: checkedBaggageGlobal,
              handBaggage: handBaggageGlobal,
              aircraft: segFirst.aircraft,
            });
          }

          if (allLegs.length === 0 || segmentDetails.length === 0) continue;

          const firstSeg = segmentDetails[0];
          const lastSeg = segmentDetails[segmentDetails.length - 1];

          let minSeats = Infinity;
          let bookingClass = '';
          const fareComponents = passengerInfoList[0]?.passengerInfo?.fareComponents || [];
          for (const fc of fareComponents) {
            for (const seg of (fc.segments || [])) {
              if (seg.seatsAvailable !== undefined && seg.seatsAvailable < minSeats) minSeats = seg.seatsAvailable;
              if (seg.bookingCode) bookingClass = seg.bookingCode;
            }
          }

          const isRefundable = fare.passengerInfoList?.[0]?.passengerInfo?.nonRefundable === false;

          flights.push({
            id: `sabre-mc-${idx}`,
            source: 'sabre',
            direction: 'multicity',
            isMultiCity: true,
            segmentCount: segmentDetails.length,
            segments: segmentDetails,
            airline: firstSeg.airline,
            airlineCode: firstSeg.airlineCode,
            airlineLogo: null,
            flightNumber: segmentDetails.map(s => s.flightNumber).join(', '),
            origin: firstSeg.origin,
            destination: lastSeg.destination,
            departureTime: firstSeg.departureTime,
            arrivalTime: lastSeg.arrivalTime,
            duration: formatDuration(segmentDetails.reduce((s, seg) => s + seg.durationMinutes, 0)),
            durationMinutes: segmentDetails.reduce((s, seg) => s + seg.durationMinutes, 0),
            stops: segmentDetails.reduce((s, seg) => s + seg.stops, 0),
            stopCodes: segmentDetails.flatMap(s => s.stopCodes),
            cabinClass: getCabinName(fareComponents[0]?.segments?.[0]?.cabin?.cabin || 'Y'),
            bookingClass,
            availableSeats: minSeats === Infinity ? null : minSeats,
            price: totalAmount,
            baseFare: baseFareAmt,
            taxes: taxesAmt,
            currency,
            refundable: isRefundable,
            baggage: checkedBaggageGlobal,
            handBaggage: handBaggageGlobal,
            aircraft: firstSeg.aircraft,
            legs: allLegs,
            fareDetails: fareDetailsArr,
            timeLimit: fare.lastTicketDate || null,
            validatingAirline: fare.validatingCarrierCode || firstSeg.airlineCode,
            _sabreSeqNumber: idx,
          });
        } else {
          // ── ONE-WAY / ROUND-TRIP: per-leg emission (original logic) ──
          for (let legIdx = 0; legIdx < itinLegs.length; legIdx++) {
            const leg = itinLegs[legIdx];
            const legRef = leg.ref;
            const legDesc = legDescs.find(ld => ld.id === legRef) || {};
            const schedules = legDesc.schedules || [];

            const legDepartDate = groupDesc.legDescriptions?.[legIdx]?.departureDate || params.departDate || '';

            const legs = schedules.map((sched) => {
              const schedRef = sched.ref;
              const schedDesc = scheduleDescs.find(sd => sd.id === schedRef) || {};
              const dep = schedDesc.departure || sched.departure || {};
              const arr = schedDesc.arrival || sched.arrival || {};
              const carrier = schedDesc.carrier || {};

              let depDateTime = dep.dateTime || null;
              let arrDateTime = arr.dateTime || null;
              if (!depDateTime && dep.time && legDepartDate) {
                const depAdj = sched.departureDateAdjustment || 0;
                const depDate = adjustDate(legDepartDate, depAdj);
                depDateTime = `${depDate}T${dep.time}`;
              }
              if (!arrDateTime && arr.time && legDepartDate) {
                const arrAdj = sched.departureDateAdjustment || 0;
                const arrDateAdj = (schedDesc.elapsedTime && dep.time && arr.time) ? 
                  (arr.time < dep.time ? arrAdj + 1 : arrAdj) : arrAdj;
                const arrDate = adjustDate(legDepartDate, arrDateAdj);
                arrDateTime = `${arrDate}T${arr.time}`;
              }

              return {
                origin: dep.airport || '',
                destination: arr.airport || '',
                departureTime: depDateTime,
                arrivalTime: arrDateTime,
                durationMinutes: schedDesc.elapsedTime || 0,
                duration: formatDuration(schedDesc.elapsedTime || 0),
                flightNumber: `${carrier.marketing || carrier.operating || ''}${carrier.marketingFlightNumber || ''}`,
                airlineCode: carrier.marketing || carrier.operating || '',
                operatingAirline: carrier.operating || carrier.marketing || '',
                aircraft: carrier.equipment?.code || '',
                originTerminal: dep.terminal || '',
                destinationTerminal: arr.terminal || '',
                stops: [],
              };
            });

            if (legs.length === 0) continue;
            const firstLeg = legs[0];
            const lastLeg = legs[legs.length - 1];

            let totalDurationMin = legDesc.elapsedTime || legs.reduce((s, l) => s + l.durationMinutes, 0);
            const direction = legIdx === 0 ? 'outbound' : 'return';
            const pricePerDirection = itinLegs.length > 1 ? Math.round(totalAmount / itinLegs.length) : totalAmount;

            let minSeats = Infinity;
            let bookingClass = '';
            const fareComponents = passengerInfoList[0]?.passengerInfo?.fareComponents || [];
            for (const fc of fareComponents) {
              const segments = fc.segments || [];
              for (const seg of segments) {
                if (seg.seatsAvailable !== undefined && seg.seatsAvailable < minSeats) {
                  minSeats = seg.seatsAvailable;
                }
                if (seg.bookingCode) bookingClass = seg.bookingCode;
              }
            }

            // Determine refundable status
            const isRefundable = fare.passengerInfoList?.[0]?.passengerInfo?.nonRefundable === false;

            // Extract cancellation/date change from fare penalties
            let cancellationPolicy = null;
            let dateChangePolicy = null;
            const penaltyInfos = fare.passengerInfoList?.[0]?.passengerInfo?.penaltyInformation || [];
            for (const pen of penaltyInfos) {
              const cat = pen.cat || pen.category || '';
              const details = pen.details || {};
              if (cat === 'Refund' || cat === 'Cancel') {
                cancellationPolicy = {
                  beforeDeparture: details.amount ? parseFloat(details.amount) : null,
                  afterDeparture: 'As per airline policy',
                  noShow: 'As per airline policy',
                  currency: details.currency || currency,
                  allowed: !details.isNonRefundable,
                };
              }
              if (cat === 'Exchange' || cat === 'Reissue') {
                dateChangePolicy = {
                  changeAllowed: !details.isNonChangeable,
                  changeFee: details.amount ? parseFloat(details.amount) : null,
                  currency: details.currency || currency,
                };
              }
            }

            flights.push({
              id: `sabre-g-${group.groupDescription?.legDescriptions?.[0]?.departureDate || idx}-${legIdx}-${idx}`,
              source: 'sabre',
              direction,
              isRoundTrip: itinLegs.length > 1,
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
              stops: legs.length - 1,
              stopCodes: legs.length > 1 ? legs.slice(0, -1).map(l => l.destination) : [],
              cabinClass: getCabinName(fareComponents[0]?.segments?.[0]?.cabin?.cabin || 'Y'),
              bookingClass,
              availableSeats: minSeats === Infinity ? null : minSeats,
              price: pricePerDirection,
              baseFare: itinLegs.length > 1 ? Math.round(baseFareAmt / itinLegs.length) : baseFareAmt,
              taxes: itinLegs.length > 1 ? Math.round(taxesAmt / itinLegs.length) : taxesAmt,
              totalRoundTripPrice: itinLegs.length > 1 ? totalAmount : undefined,
              currency,
              refundable: isRefundable,
              baggage: checkedBaggageGlobal,
              handBaggage: handBaggageGlobal,
              aircraft: firstLeg.aircraft,
              legs,
              fareDetails: fareDetailsArr,
              timeLimit: fare.lastTicketDate || null,
              cancellationPolicy,
              dateChangePolicy,
              validatingAirline: fare.validatingCarrierCode || firstLeg.airlineCode,
              _sabreSeqNumber: idx,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[Sabre] Grouped normalization error:', err.message, err.stack);
  }
  return flights;
}

// ── Helpers ──
function adjustDate(dateStr, days) {
  if (!days) return dateStr;
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
}

function getCabinName(code) {
  const map = { 'Y': 'Economy', 'S': 'Premium Economy', 'C': 'Business', 'J': 'Business', 'F': 'First', 'W': 'Premium Economy' };
  return map[code] || code || 'Economy';
}

function getAirlineName(code) {
  const names = {
    'EK': 'Emirates', 'QR': 'Qatar Airways', 'SQ': 'Singapore Airlines',
    'TG': 'Thai Airways', 'MH': 'Malaysia Airlines', 'TK': 'Turkish Airlines',
    'CX': 'Cathay Pacific', 'AI': 'Air India', 'SV': 'Saudi Arabian Airlines',
    'EY': 'Etihad Airways', 'LH': 'Lufthansa', 'BA': 'British Airways',
    'AF': 'Air France', 'KL': 'KLM', 'LO': 'LOT Polish Airlines',
    'SK': 'SAS', 'ET': 'Ethiopian Airlines', 'WY': 'Oman Air',
    'GF': 'Gulf Air', 'PG': 'Bangkok Airways', 'OZ': 'Asiana Airlines',
    'KE': 'Korean Air', 'NH': 'ANA', 'JL': 'Japan Airlines',
    'AA': 'American Airlines', 'UA': 'United Airlines', 'DL': 'Delta',
    'AC': 'Air Canada', 'FZ': 'flydubai', 'G9': 'Air Arabia',
    'UL': 'SriLankan Airlines', '6E': 'IndiGo', 'BG': 'Biman Bangladesh',
    'BS': 'US-Bangla Airlines', 'VQ': 'Novoair', '2A': 'Air Astra',
    'S2': 'Air Astra', 'RX': 'Regent Airways', 'PK': 'PIA',
    'BR': 'EVA Air', 'CI': 'China Airlines', 'CA': 'Air China',
    'MU': 'China Eastern', 'CZ': 'China Southern', 'GA': 'Garuda Indonesia',
    'VN': 'Vietnam Airlines', 'QF': 'Qantas', 'NZ': 'Air New Zealand',
    'PR': 'Philippine Airlines', 'AK': 'AirAsia', 'FR': 'Ryanair',
    'U2': 'easyJet', 'W6': 'Wizz Air', 'IB': 'Iberia',
    'AY': 'Finnair', 'LX': 'SWISS', 'OS': 'Austrian Airlines',
    'W5': 'Mahan Air', 'HU': 'Hainan Airlines', 'WS': 'WestJet',
  };
  return names[code] || code || 'Unknown';
}

/**
 * Create a PNR in Sabre using CreatePassengerNameRecordRQ
 * Supports SSR: meals, wheelchair, medical, pets, UMNR, FF#, DOCS/DOCA
 */
async function createBooking({ flightData, passengers, contactInfo, specialServices }) {
  const config = await getSabreConfig();
  if (!config) throw new Error('Sabre API not configured');

  console.log('[Sabre] Creating PNR for', flightData?.origin, '→', flightData?.destination);

  try {
    const paxSegments = [];
    const legs = flightData?.legs || [];
    const segs = legs.length > 0 ? legs : [flightData];

    const toSabreDateTime = (value) => {
      if (!value) return '';
      const raw = String(value).trim();

      // Convert ISO/offset datetime to schema-safe format: YYYY-MM-DDTHH:mm:ss (no timezone suffix)
      const m = raw.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/);
      if (m) return `${m[1]}T${m[2]}:00`;

      // If already in MM-DDTHH:mm style, keep as-is for Sabre compatibility
      const shortM = raw.match(/^(\d{2}-\d{2})[T\s](\d{2}:\d{2})(?::\d{2})?$/);
      if (shortM) return `${shortM[1]}T${shortM[2]}`;

      return raw.replace('Z', '').split('.')[0].replace(/[+-]\d{2}:?\d{2}$/, '');
    };

    segs.forEach((seg) => {
      const departureDateTime = toSabreDateTime(seg.departureTime);
      const arrivalDateTime = toSabreDateTime(seg.arrivalTime);
      const numericFlightNumber = String(seg.flightNumber || '').replace(/\D/g, '');

      paxSegments.push({
        DepartureDateTime: departureDateTime,
        ArrivalDateTime: arrivalDateTime,
        FlightNumber: numericFlightNumber,
        NumberInParty: String(Math.max(passengers.length || 1, 1)),
        ResBookDesigCode: seg.bookingClass || 'Y',
        Status: 'NN',
        OriginLocation: { LocationCode: seg.origin || flightData.origin },
        DestinationLocation: { LocationCode: seg.destination || flightData.destination },
        MarketingAirline: { Code: seg.airlineCode || flightData.airlineCode, FlightNumber: numericFlightNumber },
      });
    });

    const travelersInfo = passengers.map((p, i) => ({
      PersonName: {
        NameNumber: `${i + 1}.1`,
        GivenName: (p.firstName || '').toUpperCase(),
        Surname: (p.lastName || '').toUpperCase(),
      },
    }));

    // ── Build SSR (Special Service Requests) ──
    const ssrList = [];
    const advancePassenger = [];
    const ss = specialServices || {};

    passengers.forEach((pax, i) => {
      const nameNumber = `${i + 1}.1`;
      const paxSS = ss.perPassenger?.[i] || {};
      const airlineCode = flightData?.airlineCode || segs[0]?.airlineCode || '';

      // Meal SSR (VGML, MOML, AVML, KSML, DBML, CHML, SFML, FPML, BBML, GFML, LCML, NLML, RVML, SPML)
      if (paxSS.meal && paxSS.meal !== 'none' && paxSS.meal !== 'standard') {
        ssrList.push({
          SSRCode: paxSS.meal,
          AirlineCode: airlineCode,
          Text: `${paxSS.meal}-${(pax.firstName || '').toUpperCase()}/${(pax.lastName || '').toUpperCase()}`,
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A', // All segments
        });
      }

      // Wheelchair SSR (WCHR, WCHS, WCHC)
      if (paxSS.wheelchair && paxSS.wheelchair !== 'none') {
        ssrList.push({
          SSRCode: paxSS.wheelchair,
          AirlineCode: airlineCode,
          Text: `${(pax.firstName || '').toUpperCase()}/${(pax.lastName || '').toUpperCase()}`,
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A',
        });
      }

      // Medical SSR (MEDA)
      if (paxSS.medical) {
        ssrList.push({
          SSRCode: 'MEDA',
          AirlineCode: airlineCode,
          Text: paxSS.medicalDetails || `MEDICAL ASSISTANCE REQUIRED-${(pax.lastName || '').toUpperCase()}`,
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A',
        });
      }

      // Blind passenger (BLND)
      if (paxSS.blind) {
        ssrList.push({
          SSRCode: 'BLND',
          AirlineCode: airlineCode,
          Text: `BLIND PASSENGER-${(pax.lastName || '').toUpperCase()}`,
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A',
        });
      }

      // Deaf passenger (DEAF)
      if (paxSS.deaf) {
        ssrList.push({
          SSRCode: 'DEAF',
          AirlineCode: airlineCode,
          Text: `DEAF PASSENGER-${(pax.lastName || '').toUpperCase()}`,
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A',
        });
      }

      // Unaccompanied Minor (UMNR)
      if (paxSS.unaccompaniedMinor) {
        ssrList.push({
          SSRCode: 'UMNR',
          AirlineCode: airlineCode,
          Text: paxSS.umnrDetails || `UM${paxSS.umnrAge || '10'}-${(pax.lastName || '').toUpperCase()}`,
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A',
        });
      }

      // Pet in Cabin (PETC) or Pet in Hold (AVIH)
      if (paxSS.pet && paxSS.pet !== 'none') {
        ssrList.push({
          SSRCode: paxSS.pet, // PETC or AVIH
          AirlineCode: airlineCode,
          Text: paxSS.petDetails || `PET-${paxSS.pet === 'PETC' ? 'CABIN' : 'CARGO'}`,
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A',
        });
      }

      // Extra Baggage SSR (XBAG) — for non-ancillary based extra bags
      if (paxSS.extraBaggage) {
        ssrList.push({
          SSRCode: 'XBAG',
          AirlineCode: airlineCode,
          Text: `${paxSS.extraBaggage}KG EXTRA BAGGAGE`,
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A',
        });
      }

      // Frequent Flyer (FQTV)
      if (paxSS.frequentFlyer?.number) {
        ssrList.push({
          SSRCode: 'FQTV',
          AirlineCode: paxSS.frequentFlyer.airline || airlineCode,
          Text: `${paxSS.frequentFlyer.airline || airlineCode}${paxSS.frequentFlyer.number}`,
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A',
        });
      }

      // Free-text special request (OSI)
      if (paxSS.specialRequest?.trim()) {
        ssrList.push({
          SSRCode: 'OTHS',
          AirlineCode: airlineCode,
          Text: paxSS.specialRequest.trim().substring(0, 70).toUpperCase(),
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A',
        });
      }

      // DOCS — Passport/Travel Document (IATA standard, always recommended for international)
      const passportNo = pax.passport || pax.passportNumber || '';
      const passportExpiry = pax.passportExpiry || '';
      const docCountry = pax.documentCountry || pax.passportCountry || 'BD';

      if (passportNo) {
        const expiryFormatted = String(passportExpiry).replace(/-/g, '');
        const nationality = docCountry; // ISO 2-letter

        const docPayload = {
          Type: 'P', // Passport
          Number: String(passportNo).toUpperCase(),
          IssueCountry: docCountry,
          NationalityCountry: nationality,
        };

        // Keep optional to avoid schema rejection on empty values
        if (expiryFormatted) docPayload.ExpirationDate = expiryFormatted;

        advancePassenger.push({
          Document: docPayload,
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A',
          VendorPrefs: { Airline: { Hosted: true } },
        });
      }

      // DOCA — Destination Address (if provided)
      if (paxSS.destinationAddress?.trim()) {
        advancePassenger.push({
          Document: {
            Type: 'A', // Address
            Text: paxSS.destinationAddress.trim().substring(0, 99).toUpperCase(),
          },
          PersonName: { NameNumber: nameNumber },
          SegmentNumber: 'A',
        });
      }
    });

    const body = {
      CreatePassengerNameRecordRQ: {
        targetCity: config.pcc,
        TravelItineraryAddInfo: {
          AgencyInfo: { Ticketing: { TicketType: '7TAW' } },
          CustomerInfo: {
            ContactNumbers: {
              ContactNumber: [{
                Phone: contactInfo?.phone || '01700000000',
                PhoneUseType: 'H',
              }],
            },
            Email: [{ Address: contactInfo?.email || '', Type: 'TO' }],
            PersonName: travelersInfo.map(t => t.PersonName),
          },
        },
        AirBook: {
          HaltOnStatus: [{ Code: 'NN' }, { Code: 'UC' }, { Code: 'US' }, { Code: 'UN' }],
          OriginDestinationInformation: {
            FlightSegment: paxSegments,
          },
        },
        PostProcessing: {
          EndTransaction: { Source: { ReceivedFrom: 'SEVEN TRIP API' } },
        },
      },
    };

    // Inject SSR and DOCS/DOCA into SpecialReqDetails
    if (ssrList.length > 0 || advancePassenger.length > 0) {
      const specialServiceInfo = {};

      if (ssrList.length > 0) {
        specialServiceInfo.Service = ssrList.map(ssr => ({
          SSRCode: ssr.SSRCode,
          ...(ssr.AirlineCode ? { Airline: { Code: ssr.AirlineCode } } : {}),
          Text: ssr.Text,
          PersonName: ssr.PersonName,
          SegmentNumber: ssr.SegmentNumber,
        }));
        console.log(`[Sabre] Adding ${ssrList.length} SSR(s): ${ssrList.map(s => s.SSRCode).join(', ')}`);
      }

      body.CreatePassengerNameRecordRQ.SpecialReqDetails = {
        SpecialService: {
          SpecialServiceInfo: specialServiceInfo,
        },
      };

      // DOCS/DOCA go under SpecialService.SpecialServiceInfo.AdvancePassenger
      if (advancePassenger.length > 0) {
        specialServiceInfo.AdvancePassenger = advancePassenger;
        console.log(`[Sabre] Adding ${advancePassenger.length} DOCS/DOCA entries`);
      }
    }

    const response = await sabreRequest(config, '/v2.4.0/passenger/records?mode=create', body);

    // Log full response keys for debugging
    console.log('[Sabre] CreatePNR response keys:', JSON.stringify(Object.keys(response || {})));
    const rs = response?.CreatePassengerNameRecordRS;
    if (rs) {
      console.log('[Sabre] RS keys:', JSON.stringify(Object.keys(rs)));
      if (rs.ApplicationResults) {
        console.log('[Sabre] ApplicationResults status:', rs.ApplicationResults.status);
        if (rs.ApplicationResults.Error) {
          console.log('[Sabre] RS Errors:', JSON.stringify(rs.ApplicationResults.Error).slice(0, 500));
        }
        if (rs.ApplicationResults.Warning) {
          console.log('[Sabre] RS Warnings:', JSON.stringify(rs.ApplicationResults.Warning).slice(0, 500));
        }
      }
      if (rs.ItineraryRef) console.log('[Sabre] ItineraryRef:', JSON.stringify(rs.ItineraryRef));
    } else {
      console.log('[Sabre] CreatePNR raw (truncated):', JSON.stringify(response).slice(0, 1000));
    }

    const pnrCandidates = [
      rs?.ItineraryRef?.ID,
      rs?.ItineraryRef?.id,
      rs?.TravelItineraryRead?.TravelItinerary?.ItineraryRef?.ID,
      rs?.TravelItineraryRead?.TravelItinerary?.ItineraryRef?.id,
      rs?.TravelItineraryRead?.ItineraryRef?.ID,
      rs?.TravelItineraryRead?.ItineraryRef?.id,
      response?.ItineraryRef?.ID,
      response?.RecordLocator,
      response?.PNR,
      response?.BookingReference,
    ];

    const pnr = pnrCandidates.find((value) =>
      typeof value === 'string' && /^[A-Z0-9]{5,8}$/i.test(value.trim())
    ) || null;
    console.log('[Sabre] PNR created:', pnr);

    return { success: !!pnr, pnr, rawResponse: response };
  } catch (err) {
    console.error('[Sabre] CreateBooking failed:', err.message);
    return { success: false, error: err.message, pnr: null };
  }
}

/**
 * Issue ticket via Sabre AirTicketRQ
 */
async function issueTicket({ pnr }) {
  const config = await getSabreConfig();
  if (!config) throw new Error('Sabre API not configured');

  console.log('[Sabre] Issuing ticket for PNR:', pnr);

  try {
    const body = {
      AirTicketRQ: {
        DesignatePrinter: { Printers: { Hardcopy: { LNIATA: '000000' }, Ticket: { CountryCode: 'BD' } } },
        Itinerary: { ID: pnr },
        Ticketing: [{ PricingQualifiers: { PriceQuote: [{ Record: [{ Number: '1', Reissue: false }] }] } }],
        PostProcessing: { EndTransaction: { Source: { ReceivedFrom: 'SEVEN TRIP API' } } },
      },
    };

    const response = await sabreRequest(config, '/v1.2.1/air/ticket', body);

    const ticketNumbers = [];
    const docs = response.AirTicketRS?.Summary || [];
    if (Array.isArray(docs)) {
      docs.forEach(s => { if (s.DocumentNumber) ticketNumbers.push(s.DocumentNumber); });
    }

    console.log('[Sabre] Tickets issued:', ticketNumbers);
    return { success: true, ticketNumbers, rawResponse: response };
  } catch (err) {
    console.error('[Sabre] IssueTicket failed:', err.message);
    return { success: false, error: err.message, ticketNumbers: [] };
  }
}

/**
 * Cancel/void a Sabre PNR via OTA_CancelLLSRQ
 */
async function cancelBooking({ pnr }) {
  const config = await getSabreConfig();
  if (!config) throw new Error('Sabre API not configured');

  console.log('[Sabre] Cancelling PNR:', pnr);

  try {
    const body = {
      OTA_CancelRQ: {
        Version: '2.0.2',
        UniqueID: { ID: pnr },
        Segment: [{ Type: 'entire' }],
      },
    };

    const response = await sabreRequest(config, '/v2.0.2/booking/cancel', body);
    console.log('[Sabre] PNR cancelled:', pnr);
    return { success: true, rawResponse: response };
  } catch (err) {
    console.error('[Sabre] CancelBooking failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { searchFlights, createBooking, issueTicket, cancelBooking, getSabreConfig, clearSabreConfigCache };
