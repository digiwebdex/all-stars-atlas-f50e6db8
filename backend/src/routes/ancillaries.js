/**
 * Ancillary services API — Seat Maps, Extra Baggage, Meals
 * 100% API-driven — NO mock/fallback data. Zero-mock enforcement.
 * Priority: Sabre SOAP (all airlines) → TTI (Air Astra)
 * If no real data available, return empty arrays.
 */

const express = require('express');
const router = express.Router();

// Lazy-load to avoid circular deps
let _ttiHelpers = null;
function getTTIHelpers() {
  if (!_ttiHelpers) {
    try { _ttiHelpers = require('./tti-flights'); } catch { _ttiHelpers = {}; }
  }
  return _ttiHelpers;
}

let _sabreSoap = null;
function getSabreSoap() {
  if (!_sabreSoap) {
    try { _sabreSoap = require('./sabre-soap'); } catch { _sabreSoap = {}; }
  }
  return _sabreSoap;
}

/**
 * GET /api/flights/ancillaries
 * Priority: Sabre SOAP → TTI → Empty (zero-mock)
 */
router.get('/ancillaries', async (req, res) => {
  try {
    const { airlineCode, origin, destination, itineraryRef, cabinClass, flightNumber, departureDate, departureTime, adults, children } = req.query;

    let meals = [];
    let baggage = [];
    let source = 'none';

    // ── Priority 1: Sabre SOAP — works for ALL airlines in Sabre GDS ──
    if (airlineCode && flightNumber && origin && destination && departureDate) {
      try {
        const sabreSoap = getSabreSoap();
        if (sabreSoap.getAncillaryOffers) {
          console.log(`[Ancillaries] Trying Sabre SOAP for ${airlineCode}${flightNumber} ${origin}-${destination} ${departureDate}`);
          const sabreResult = await sabreSoap.getAncillaryOffers({
            origin, destination, departureDate, departureTime,
            marketingCarrier: airlineCode, flightNumber,
            cabinClass: cabinClass || 'Economy',
            adults: parseInt(adults) || 1,
            children: parseInt(children) || 0,
          });

          if (sabreResult) {
            source = 'sabre';
            if (sabreResult.meals?.length > 0) {
              meals = sabreResult.meals.map(m => ({
                id: m.id || m.code, code: m.code, name: m.name,
                price: m.price || 0, description: m.description || m.name,
                category: 'airline', currency: m.currency || 'BDT',
              }));
            }
            if (sabreResult.baggage?.length > 0) {
              baggage = sabreResult.baggage.map(b => ({
                id: b.id || b.code, name: b.name,
                price: b.price || 0, weight: b.weight || null,
                description: b.description || b.name, type: 'checked',
                currency: b.currency || 'BDT',
              }));
            }
            console.log(`[Ancillaries] Sabre SOAP: ${meals.length} meals, ${baggage.length} baggage options`);
          }
        }
      } catch (sabreErr) {
        console.log(`[Ancillaries] Sabre SOAP not available: ${sabreErr.message}, trying next source`);
      }
    }

    // ── Priority 2: TTI — for Air Astra / S2 airlines ──
    if (source === 'none' && ['2A', 'S2'].includes(airlineCode) && itineraryRef) {
      try {
        const tti = getTTIHelpers();
        if (tti.getTTIConfig && tti.ttiRequest) {
          const config = await tti.getTTIConfig();
          if (config) {
            const ancillaryRequest = {
              RequestInfo: { AuthenticationKey: config.key },
              ItineraryRef: itineraryRef,
              ServiceTypes: ['MEAL', 'BAGGAGE', 'SEAT'],
            };
            try {
              const response = await tti.ttiRequest('GetAncillaries', ancillaryRequest);
              if (response && !response.ResponseInfo?.Error) {
                source = 'tti';
                if (response.Meals?.length > 0) {
                  meals = response.Meals.map(m => ({
                    id: m.Code || m.Ref, code: m.Code, name: m.Name || m.Description,
                    price: m.Amount || 0, description: m.Description || '', category: 'airline',
                  }));
                }
                if (response.BaggageOptions?.length > 0) {
                  baggage = response.BaggageOptions.map(b => ({
                    id: b.Code || b.Ref, name: b.Name || `+${b.Weight}kg`,
                    price: b.Amount || 0, weight: b.Weight || null,
                    description: b.Description || '', type: 'checked',
                  }));
                }
                console.log(`[Ancillaries] TTI data loaded for ${airlineCode}`);
              }
            } catch (ttiErr) {
              console.log(`[Ancillaries] TTI not available: ${ttiErr.message}`);
            }
          }
        }
      } catch (err) {
        console.log('[Ancillaries] TTI config not available');
      }
    }

    // Included baggage comes from the search results (passed as query params)
    const includedChecked = req.query.checkedBaggage || null;
    const includedCabin = req.query.handBaggage || null;

    res.json({
      meals, baggage, source,
      includedBaggage: {
        checked: includedChecked || null,
        cabin: includedCabin || null,
      },
      airline: airlineCode,
    });
  } catch (err) {
    console.error('[Ancillaries] Error:', err.message);
    res.status(500).json({ message: 'Failed to load ancillary services' });
  }
});

/**
 * GET /api/flights/seat-map
 * Priority: Sabre SOAP → TTI → No data (zero-mock)
 * NO generated/fake layouts. Real API data only.
 */
router.get('/seat-map', async (req, res) => {
  try {
    const { airlineCode, flightNumber, aircraft, itineraryRef, cabinClass, origin, destination, departureDate } = req.query;

    let seatLayout = null;
    let source = 'none';

    // ── Priority 1: Sabre SOAP — real seat map for any airline ──
    if (airlineCode && flightNumber && origin && destination && departureDate) {
      try {
        const sabreSoap = getSabreSoap();
        if (sabreSoap.getSeatMap) {
          console.log(`[SeatMap] Trying Sabre SOAP for ${airlineCode}${flightNumber} ${origin}-${destination}`);
          const BD_AIRPORTS = ['DAC', 'CXB', 'CGP', 'ZYL', 'JSR', 'RJH', 'SPD', 'BZL', 'IRD', 'TKR'];
          const isDomestic = BD_AIRPORTS.includes(origin) && BD_AIRPORTS.includes(destination);

          const sabreResult = await sabreSoap.getSeatMap({
            origin, destination, departureDate,
            marketingCarrier: airlineCode,
            operatingCarrier: airlineCode,
            flightNumber: flightNumber.replace(/^[A-Z]{2}/i, ''),
            cabinClass: cabinClass || 'Economy',
            isDomestic,
          });

          if (sabreResult && sabreResult.rows && sabreResult.rows.length > 0) {
            source = 'sabre';
            seatLayout = sabreResult;
            console.log(`[SeatMap] Sabre SOAP: ${sabreResult.totalRows} rows, ${sabreResult.columns?.length} columns`);
          }
        }
      } catch (sabreErr) {
        console.log(`[SeatMap] Sabre SOAP not available: ${sabreErr.message}`);
      }
    }

    // ── Priority 2: TTI — for Air Astra / S2 ──
    if (!seatLayout && ['2A', 'S2'].includes(airlineCode) && itineraryRef) {
      try {
        const tti = getTTIHelpers();
        if (tti.getTTIConfig && tti.ttiRequest) {
          const config = await tti.getTTIConfig();
          if (config) {
            const seatMapRequest = {
              RequestInfo: { AuthenticationKey: config.key },
              ItineraryRef: itineraryRef,
              FlightNumber: flightNumber,
            };
            try {
              const response = await tti.ttiRequest('GetSeatMap', seatMapRequest);
              if (response && !response.ResponseInfo?.Error && response.SeatMap) {
                source = 'tti';
                seatLayout = response.SeatMap;
                console.log(`[SeatMap] TTI data loaded for ${flightNumber}`);
              }
            } catch (ttiErr) {
              console.log(`[SeatMap] TTI not available: ${ttiErr.message}`);
            }
          }
        }
      } catch (err) {
        console.log('[SeatMap] TTI config not available');
      }
    }

    // No fallback — zero-mock. If no real data, return null layout.
    res.json({
      flightNumber, aircraft: aircraft || null,
      cabinClass: cabinClass || 'Economy',
      layout: seatLayout, source,
      available: !!seatLayout,
    });
  } catch (err) {
    console.error('[SeatMap] Error:', err.message);
    res.status(500).json({ message: 'Failed to load seat map' });
  }
});

module.exports = router;
