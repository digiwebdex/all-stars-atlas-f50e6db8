/**
 * Ancillary services API — Seat Maps, Extra Baggage, Meals
 * Queries airline GDS APIs when available, falls back to standard data
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getTTIConfig, ttiRequest } = require('./tti-flights');

// ── Standard ancillary data (fallback when GDS doesn't provide) ──

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
 * GET /api/flights/ancillaries?airlineCode=2A&origin=DAC&destination=CXB&itineraryRef=xxx
 * Returns available meals, baggage, and seat info for a flight
 */
router.get('/ancillaries', async (req, res) => {
  try {
    const { airlineCode, origin, destination, itineraryRef, cabinClass } = req.query;

    let meals = STANDARD_MEALS;
    let baggage = STANDARD_BAGGAGE;
    let seatMapAvailable = true;
    let source = 'standard';

    // Try GDS-specific ancillaries for TTI airlines
    if (['2A', 'S2'].includes(airlineCode) && itineraryRef) {
      try {
        const config = await getTTIConfig();
        if (config) {
          // Attempt to get ancillaries from TTI
          const ancillaryRequest = {
            RequestInfo: { AuthenticationKey: config.key },
            ItineraryRef: itineraryRef,
            ServiceTypes: ['MEAL', 'BAGGAGE', 'SEAT'],
          };

          try {
            const response = await ttiRequest('GetAncillaries', ancillaryRequest);
            if (response && !response.ResponseInfo?.Error) {
              source = 'tti';
              // Parse TTI meals if available
              if (response.Meals?.length > 0) {
                meals = response.Meals.map(m => ({
                  id: m.Code || m.Ref,
                  code: m.Code,
                  name: m.Name || m.Description,
                  price: m.Amount || 0,
                  description: m.Description || '',
                  category: 'airline',
                }));
              }
              // Parse TTI baggage if available
              if (response.BaggageOptions?.length > 0) {
                baggage = response.BaggageOptions.map(b => ({
                  id: b.Code || b.Ref,
                  name: b.Name || `+${b.Weight}kg`,
                  price: b.Amount || 0,
                  weight: b.Weight || null,
                  description: b.Description || '',
                  type: 'checked',
                }));
              }
              console.log(`[Ancillaries] TTI data loaded for ${airlineCode}`);
            }
          } catch (ttiErr) {
            console.log(`[Ancillaries] TTI GetAncillaries not available: ${ttiErr.message}, using standard data`);
          }
        }
      } catch (err) {
        console.log('[Ancillaries] TTI config not available, using standard data');
      }
    }

    // Adjust prices for domestic vs international
    const isDomestic = ['DAC', 'CXB', 'CGP', 'ZYL', 'JSR', 'RJH', 'SPD', 'BZL', 'IRD', 'TKR'].includes(origin) &&
                       ['DAC', 'CXB', 'CGP', 'ZYL', 'JSR', 'RJH', 'SPD', 'BZL', 'IRD', 'TKR'].includes(destination);

    if (isDomestic && source === 'standard') {
      // Domestic flights have lower baggage prices
      baggage = baggage.map(b => ({
        ...b,
        price: Math.round(b.price * 0.7),
      }));
    }

    // Get included baggage from query or defaults
    const includedChecked = req.query.checkedBaggage || null;
    const includedCabin = req.query.handBaggage || null;

    res.json({
      meals,
      baggage,
      seatMapAvailable,
      source,
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
 * GET /api/flights/seat-map?airlineCode=2A&flightNumber=2A443&aircraft=ATR72&itineraryRef=xxx
 * Returns seat map layout for the aircraft
 */
router.get('/seat-map', async (req, res) => {
  try {
    const { airlineCode, flightNumber, aircraft, itineraryRef, cabinClass } = req.query;

    let seatLayout = null;
    let source = 'generated';

    // Try GDS seat map for TTI airlines
    if (['2A', 'S2'].includes(airlineCode) && itineraryRef) {
      try {
        const config = await getTTIConfig();
        if (config) {
          const seatMapRequest = {
            RequestInfo: { AuthenticationKey: config.key },
            ItineraryRef: itineraryRef,
            FlightNumber: flightNumber,
          };
          try {
            const response = await ttiRequest('GetSeatMap', seatMapRequest);
            if (response && !response.ResponseInfo?.Error && response.SeatMap) {
              source = 'tti';
              seatLayout = response.SeatMap;
              console.log(`[SeatMap] TTI data loaded for ${flightNumber}`);
            }
          } catch (ttiErr) {
            console.log(`[SeatMap] TTI GetSeatMap not available: ${ttiErr.message}, generating layout`);
          }
        }
      } catch (err) {
        console.log('[SeatMap] TTI config not available, generating layout');
      }
    }

    // Generate layout based on aircraft type if GDS doesn't provide
    if (!seatLayout) {
      seatLayout = generateSeatLayout(aircraft || 'A320', cabinClass || 'Economy');
    }

    res.json({
      flightNumber,
      aircraft: aircraft || 'Unknown',
      cabinClass: cabinClass || 'Economy',
      layout: seatLayout,
      source,
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
  const isNarrowBody = /ATR|737|A320|A321|A319|Q400|Dash/i.test(aircraft);
  const isRegional = /ATR|Q400|Dash/i.test(aircraft);
  const isWidebody = /777|787|A330|A340|A350|A380|767|747/i.test(aircraft);

  const config = isWidebody
    ? { cols: ['A','B','C','D','E','F','G','H','J'], rows: 35, exitRows: [12,13,25], aisleAfter: [2,5] }
    : isRegional
    ? { cols: ['A','B','C','D'], rows: 18, exitRows: [8], aisleAfter: [1] }
    : { cols: ['A','B','C','D','E','F'], rows: 30, exitRows: [12,13], aisleAfter: [2] };

  return {
    aircraft,
    columns: config.cols,
    totalRows: config.rows,
    exitRows: config.exitRows,
    aisleAfter: config.aisleAfter,
    cabinClass: cabinClass || 'Economy',
  };
}

module.exports = router;
