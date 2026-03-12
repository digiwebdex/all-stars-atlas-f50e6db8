/**
 * Ancillary services API — Seat Maps, Extra Baggage, Meals
 * Priority: Sabre SOAP (all airlines) → TTI (Air Astra) → Standard fallback
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

// ── Standard ancillary data (fallback when no GDS provides) ──

const STANDARD_MEALS = [
  { id: 'standard', code: 'AVML', name: 'Standard Meal', price: 0, description: 'Included with your fare', category: 'standard' },
  { id: 'vegetarian', code: 'VGML', name: 'Vegetarian', price: 0, description: 'Lacto-ovo vegetarian meal', category: 'dietary' },
  { id: 'vegan', code: 'VGML', name: 'Vegan', price: 200, description: 'Plant-based meal', category: 'dietary' },
  { id: 'halal', code: 'MOML', name: 'Halal Meal', price: 0, description: 'Halal certified preparation', category: 'dietary' },
  { id: 'kosher', code: 'KSML', name: 'Kosher Meal', price: 300, description: 'Kosher certified meal', category: 'dietary' },
  { id: 'child', code: 'CHML', name: 'Child Meal', price: 0, description: 'Kid-friendly options', category: 'special' },
  { id: 'diabetic', code: 'DBML', name: 'Diabetic Meal', price: 0, description: 'Low sugar, balanced nutrition', category: 'dietary' },
  { id: 'seafood', code: 'SFML', name: 'Seafood Meal', price: 350, description: 'Fresh seafood selection', category: 'premium' },
  { id: 'fruit', code: 'FPML', name: 'Fruit Platter', price: 150, description: 'Fresh fruit selection', category: 'light' },
];

const STANDARD_BAGGAGE = [
  { id: 'extra5', name: '+5 kg Extra Baggage', price: 500, weight: 5, description: 'Total: 25kg checked', type: 'checked' },
  { id: 'extra10', name: '+10 kg Extra Baggage', price: 900, weight: 10, description: 'Total: 30kg checked', type: 'checked' },
  { id: 'extra15', name: '+15 kg Extra Baggage', price: 1200, weight: 15, description: 'Total: 35kg checked', type: 'checked' },
  { id: 'extra20', name: '+20 kg Extra Baggage', price: 1500, weight: 20, description: 'Total: 40kg checked', type: 'checked' },
  { id: 'extra30', name: '+30 kg Extra Baggage', price: 2200, weight: 30, description: 'Total: 50kg checked', type: 'checked' },
  { id: 'sport', name: 'Sports Equipment', price: 2000, weight: null, description: 'Golf, ski, surfboard etc.', type: 'special' },
  { id: 'fragile', name: 'Fragile Handling', price: 800, weight: null, description: 'Priority fragile handling', type: 'special' },
  { id: 'musical', name: 'Musical Instrument', price: 1500, weight: null, description: 'Guitar, violin etc.', type: 'special' },
];

/**
 * GET /api/flights/ancillaries
 * Priority: Sabre SOAP → TTI → Standard fallback
 */
router.get('/ancillaries', async (req, res) => {
  try {
    const { airlineCode, origin, destination, itineraryRef, cabinClass, flightNumber, departureDate, departureTime, adults, children } = req.query;

    let meals = STANDARD_MEALS;
    let baggage = STANDARD_BAGGAGE;
    let seatMapAvailable = true;
    let source = 'standard';

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
                category: 'airline',
              }));
            }
            if (sabreResult.baggage?.length > 0) {
              baggage = sabreResult.baggage.map(b => ({
                id: b.id || b.code, name: b.name,
                price: b.price || 0, weight: b.weight || null,
                description: b.description || b.name, type: 'checked',
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
    if (source === 'standard' && ['2A', 'S2'].includes(airlineCode) && itineraryRef) {
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

    // Adjust prices for domestic vs international
    const BD_AIRPORTS = ['DAC', 'CXB', 'CGP', 'ZYL', 'JSR', 'RJH', 'SPD', 'BZL', 'IRD', 'TKR'];
    const isDomestic = BD_AIRPORTS.includes(origin) && BD_AIRPORTS.includes(destination);

    if (isDomestic && source === 'standard') {
      baggage = baggage.map(b => ({ ...b, price: Math.round(b.price * 0.7) }));
    }

    const includedChecked = req.query.checkedBaggage || null;
    const includedCabin = req.query.handBaggage || null;

    res.json({
      meals, baggage, seatMapAvailable, source,
      includedBaggage: {
        checked: includedChecked || 'As per airline policy',
        cabin: includedCabin || 'As per airline policy',
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
 * Priority: Sabre SOAP → TTI → Generated layout
 */
router.get('/seat-map', async (req, res) => {
  try {
    const { airlineCode, flightNumber, aircraft, itineraryRef, cabinClass, origin, destination, departureDate } = req.query;

    let seatLayout = null;
    let source = 'generated';

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
            flightNumber: flightNumber.replace(/^[A-Z]{2}/i, ''), // Strip airline prefix if present
            cabinClass: cabinClass || 'Economy',
            isDomestic,
          });

          if (sabreResult) {
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

    // ── Fallback: Generate layout based on aircraft type ──
    if (!seatLayout) {
      seatLayout = generateSeatLayout(aircraft || 'A320', cabinClass || 'Economy');
    }

    res.json({
      flightNumber, aircraft: aircraft || 'Unknown',
      cabinClass: cabinClass || 'Economy',
      layout: seatLayout, source,
    });
  } catch (err) {
    console.error('[SeatMap] Error:', err.message);
    res.status(500).json({ message: 'Failed to load seat map' });
  }
});

/**
 * Generate a standard seat layout for common aircraft types
 */
function generateSeatLayout(aircraft, cabinClass) {
  const isRegional = /ATR|Q400|Dash/i.test(aircraft);
  const isWidebody = /777|787|A330|A340|A350|A380|767|747/i.test(aircraft);

  const config = isWidebody
    ? { cols: ['A','B','C','D','E','F','G','H','J'], rows: 35, exitRows: [12,13,25], aisleAfter: [2,5] }
    : isRegional
    ? { cols: ['A','B','C','D'], rows: 18, exitRows: [8], aisleAfter: [1] }
    : { cols: ['A','B','C','D','E','F'], rows: 30, exitRows: [12,13], aisleAfter: [2] };

  return {
    aircraft, columns: config.cols, totalRows: config.rows,
    exitRows: config.exitRows, aisleAfter: config.aisleAfter,
    cabinClass: cabinClass || 'Economy',
  };
}

module.exports = router;
