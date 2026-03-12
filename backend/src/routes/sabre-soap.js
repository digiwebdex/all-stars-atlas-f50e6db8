/**
 * Sabre SOAP API integration — Session-based services
 * Used for EnhancedSeatMapRQ and GetAncillaryOffersRQ which require SOAP sessions.
 * REST is used for booking (CreatePNR) and search (BFM).
 *
 * SOAP Endpoint:
 *   CERT: https://webservices.cert.platform.sabre.com
 *   PROD: https://webservices.platform.sabre.com
 *
 * Auth: SessionCreateRQ v2.0.0 with EPR/Password/PCC + JV_BD ClientId/ClientSecret
 */

const { getSabreConfig } = require('./sabre-flights');

// ── SOAP endpoint mapping ──
function getSoapEndpoint(config) {
  const isProd = config.environment === 'production' || config.environment === 'prod';
  return isProd
    ? 'https://webservices.platform.sabre.com'
    : 'https://webservices.cert.platform.sabre.com';
}

// ── SOAP client credentials (per Sabre JV_BD docs) ──
function getSoapClientCredentials(config) {
  const isProd = config.environment === 'production' || config.environment === 'prod';
  return {
    clientId: '5B0K-JvBdOta',
    clientSecret: isProd ? 'M1uty91x' : 'Pl67azTy',
  };
}

// ── Session token cache (reuse across calls, 15min TTL) ──
let _sessionCache = { token: null, conversationId: null, expiresAt: 0 };

/**
 * Create a SOAP session — returns BinarySecurityToken
 */
async function createSession(config) {
  // Reuse cached session if still valid
  if (_sessionCache.token && Date.now() < _sessionCache.expiresAt) {
    return { token: _sessionCache.token, conversationId: _sessionCache.conversationId };
  }

  const soapUrl = getSoapEndpoint(config);
  const { clientId, clientSecret } = getSoapClientCredentials(config);
  const conversationId = `SevenTrip.${Date.now()}`;

  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Header>
    <MessageHeader xmlns="http://www.ebxml.org/namespaces/messageHeader">
      <From><PartyId>Agency</PartyId></From>
      <To><PartyId>Sabre_API</PartyId></To>
      <ConversationId>${conversationId}</ConversationId>
      <Action>SessionCreateRQ</Action>
    </MessageHeader>
    <Security xmlns="http://schemas.xmlsoap.org/ws/2002/12/secext">
      <UsernameToken>
        <Username>${config.epr}</Username>
        <Password>${config.agencyPassword}</Password>
        <Organization>${config.pcc}</Organization>
        <Domain>DEFAULT</Domain>
        <ClientId>${clientId}</ClientId>
        <ClientSecret>${clientSecret}</ClientSecret>
      </UsernameToken>
    </Security>
  </SOAP-ENV:Header>
  <SOAP-ENV:Body>
    <SessionCreateRQ returnContextID="true" Version="2.0.0" xmlns="http://www.opentravel.org/0TA/2002/11"/>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  const res = await fetch(soapUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'SessionCreateRQ' },
    body: envelope,
    signal: AbortSignal.timeout(15000),
  });

  const xml = await res.text();

  // Extract BinarySecurityToken
  const tokenMatch = xml.match(/BinarySecurityToken[^>]*>([^<]+)/);
  if (!tokenMatch) {
    const err = xml.match(/faultstring>([^<]+)/) || xml.match(/Message>([^<]+)/);
    throw new Error(`SOAP SessionCreate failed: ${err ? err[1] : xml.slice(0, 300)}`);
  }

  const token = tokenMatch[1];
  // Cache for 14 minutes (Sabre sessions last ~15min)
  _sessionCache = { token, conversationId, expiresAt: Date.now() + 14 * 60 * 1000 };
  console.log('[Sabre SOAP] Session created successfully');
  return { token, conversationId };
}

/**
 * Close a SOAP session
 */
async function closeSession(config, token, conversationId) {
  try {
    const soapUrl = getSoapEndpoint(config);
    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Header>
    <MessageHeader xmlns="http://www.ebxml.org/namespaces/messageHeader">
      <From><PartyId>Agency</PartyId></From>
      <To><PartyId>Sabre_API</PartyId></To>
      <ConversationId>${conversationId}</ConversationId>
      <Action>SessionCloseRQ</Action>
    </MessageHeader>
    <Security xmlns="http://schemas.xmlsoap.org/ws/2002/12/secext">
      <BinarySecurityToken>${token}</BinarySecurityToken>
    </Security>
  </SOAP-ENV:Header>
  <SOAP-ENV:Body>
    <SessionCloseRQ Version="1.0.0" xmlns="http://www.opentravel.org/OTA/2002/11"/>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

    await fetch(soapUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'SessionCloseRQ' },
      body: envelope,
      signal: AbortSignal.timeout(10000),
    });
    // Invalidate cache
    _sessionCache = { token: null, conversationId: null, expiresAt: 0 };
    console.log('[Sabre SOAP] Session closed');
  } catch (err) {
    console.log('[Sabre SOAP] Session close error (non-critical):', err.message);
  }
}

/**
 * EnhancedSeatMapRQ v6.0.0 — query seat map for any airline via Sabre SOAP
 * @param {Object} params - { origin, destination, departureDate, marketingCarrier, flightNumber, cabinClass }
 * @returns {Object|null} parsed seat map data or null
 */
async function getSeatMap(params) {
  const config = await getSabreConfig();
  if (!config) return null;

  const { token, conversationId } = await createSession(config);
  const soapUrl = getSoapEndpoint(config);

  // Map cabin class to RBD code
  const rbdMap = { 'Economy': 'Y', 'Premium Economy': 'W', 'Business': 'C', 'First': 'F' };
  const rbd = rbdMap[params.cabinClass] || 'Y';

  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:eb="http://www.ebxml.org/namespaces/messageHeader"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <SOAP-ENV:Header>
    <eb:MessageHeader SOAP-ENV:mustUnderstand="1" eb:version="1.0">
      <eb:From><eb:PartyId>Agency</eb:PartyId></eb:From>
      <eb:To><eb:PartyId>Sabre_API</eb:PartyId></eb:To>
      <eb:CPAId>${config.pcc}</eb:CPAId>
      <eb:ConversationId>${conversationId}</eb:ConversationId>
      <eb:Service>EnhancedSeatMapRQ</eb:Service>
      <eb:Action>EnhancedSeatMapRQ</eb:Action>
    </eb:MessageHeader>
    <wsse:Security xmlns:wsse="http://schemas.xmlsoap.org/ws/2002/12/secext">
      <wsse:BinarySecurityToken>${token}</wsse:BinarySecurityToken>
    </wsse:Security>
  </SOAP-ENV:Header>
  <SOAP-ENV:Body>
    <EnhancedSeatMapRQ xmlns="http://stl.sabre.com/Merchandising/v6" version="6">
      <SeatMapQueryEnhanced>
        <RequestType>Payload</RequestType>
        <Flight origin="${params.origin}" destination="${params.destination}">
          <DepartureDate>${params.departureDate}</DepartureDate>
          <Marketing carrier="${params.marketingCarrier}">${params.flightNumber}</Marketing>
        </Flight>
        <CabinDefinition>
          <RBD>${rbd}</RBD>
        </CabinDefinition>
        <POS>
          <PCC>${config.pcc}</PCC>
        </POS>
      </SeatMapQueryEnhanced>
    </EnhancedSeatMapRQ>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  try {
    const res = await fetch(soapUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'EnhancedSeatMapRQ' },
      body: envelope,
      signal: AbortSignal.timeout(20000),
    });

    const xml = await res.text();
    console.log(`[Sabre SOAP] SeatMap response length: ${xml.length}`);
    console.log(`[Sabre SOAP] SeatMap XML (first 3000): ${xml.substring(0, 3000)}`);

    // Check for SOAP fault or error
    if (xml.includes('faultstring') || xml.includes('ErrorRS') || xml.includes('status="NotProcessed"') || xml.includes('status="Incomplete"')) {
      const errMatch = xml.match(/faultstring>([^<]+)/) || xml.match(/Message[^>]*>([^<]+)/) || xml.match(/ShortText="([^"]+)"/) || xml.match(/SystemSpecificResults[^>]*>[\s\S]*?Message[^>]*>([^<]+)/);
      const errMsg = errMatch ? errMatch[1] : 'Unknown error';
      console.log(`[Sabre SOAP] SeatMap error: ${errMsg}`);
      return { _error: true, message: errMsg, rawXml: xml.substring(0, 5000) };
    }

    // Parse seat map XML
    const parsed = parseSeatMapXml(xml);
    if (!parsed) {
      console.log('[Sabre SOAP] SeatMap: parser returned null, returning raw XML');
      return { _error: true, message: 'Parser returned no data', rawXml: xml.substring(0, 5000) };
    }
    return parsed;
  } catch (err) {
    console.error('[Sabre SOAP] SeatMap request failed:', err.message);
    return { _error: true, message: err.message };
  }
}

/**
 * GetAncillaryOffersRQ v3.0.0 — query available ancillaries (baggage, meals, etc.)
 * @param {Object} params - { origin, destination, departureDate, departureTime, marketingCarrier, flightNumber, cabinClass }
 * @returns {Object|null} parsed ancillary offers or null
 */
async function getAncillaryOffers(params) {
  const config = await getSabreConfig();
  if (!config) return null;

  const { token, conversationId } = await createSession(config);
  const soapUrl = getSoapEndpoint(config);

  const cabinCodeMap = { 'Economy': 'Y', 'Premium Economy': 'S', 'Business': 'C', 'First': 'F' };
  const cabinCode = cabinCodeMap[params.cabinClass] || 'Y';
  const bookingCode = cabinCode;

  // Build passenger types
  const paxTypes = [];
  const adtCount = params.adults || 1;
  for (let i = 0; i < adtCount; i++) {
    paxTypes.push(`<PassengerInfo><Type>ADT</Type><NameNumber>${i + 1}.1</NameNumber></PassengerInfo>`);
  }
  if (params.children) {
    for (let i = 0; i < params.children; i++) {
      paxTypes.push(`<PassengerInfo><Type>CNN</Type><NameNumber>${adtCount + i + 1}.1</NameNumber></PassengerInfo>`);
    }
  }

  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:eb="http://www.ebxml.org/namespaces/messageHeader"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <SOAP-ENV:Header>
    <eb:MessageHeader SOAP-ENV:mustUnderstand="1" eb:version="1.0">
      <eb:From><eb:PartyId>Agency</eb:PartyId></eb:From>
      <eb:To><eb:PartyId>Sabre_API</eb:PartyId></eb:To>
      <eb:CPAId>${config.pcc}</eb:CPAId>
      <eb:ConversationId>${conversationId}</eb:ConversationId>
      <eb:Service>GetAncillaryOffersRQ</eb:Service>
      <eb:Action>GetAncillaryOffersRQ</eb:Action>
    </eb:MessageHeader>
    <wsse:Security xmlns:wsse="http://schemas.xmlsoap.org/ws/2002/12/secext">
      <wsse:BinarySecurityToken>${token}</wsse:BinarySecurityToken>
    </wsse:Security>
  </SOAP-ENV:Header>
  <SOAP-ENV:Body>
    <GetAncillaryOffersRQ xmlns="http://services.sabre.com/merch/ancillary/offer/v03" version="3.0.0">
      <RequestType>payload</RequestType>
      <RequestMode>booking</RequestMode>
      <SummaryOnly>false</SummaryOnly>
      <QueryByItinerary>
        <Itinerary>
          <FlightSegment origin="${params.origin}" destination="${params.destination}" departureDate="${params.departureDate}"${params.departureTime ? ` departureTime="${params.departureTime}"` : ''} sequence="1">
            <Marketing carrier="${params.marketingCarrier}">${params.flightNumber}</Marketing>
            <Operating carrier="${params.operatingCarrier || params.marketingCarrier}">${params.flightNumber}</Operating>
            <BookingCode>${bookingCode}</BookingCode>
            <CabinCode>${cabinCode}</CabinCode>
          </FlightSegment>
        </Itinerary>
        ${paxTypes.join('\n        ')}
        <POS>
          <PCC>${config.pcc}</PCC>
        </POS>
      </QueryByItinerary>
    </GetAncillaryOffersRQ>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  try {
    const res = await fetch(soapUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'GetAncillaryOffersRQ' },
      body: envelope,
      signal: AbortSignal.timeout(20000),
    });

    const xml = await res.text();
    console.log(`[Sabre SOAP] Ancillary response length: ${xml.length}`);
    console.log(`[Sabre SOAP] Ancillary XML (first 3000): ${xml.substring(0, 3000)}`);

    if (xml.includes('faultstring') || xml.includes('ErrorRS') || xml.includes('status="NotProcessed"') || xml.includes('status="Incomplete"')) {
      const errMatch = xml.match(/faultstring>([^<]+)/) || xml.match(/Message[^>]*>([^<]+)/) || xml.match(/ShortText="([^"]+)"/);
      const errMsg = errMatch ? errMatch[1] : 'Unknown error';
      console.log(`[Sabre SOAP] Ancillary error: ${errMsg}`);
      return { _error: true, message: errMsg, rawXml: xml.substring(0, 5000) };
    }

    const parsed = parseAncillaryXml(xml);
    if (!parsed) {
      console.log('[Sabre SOAP] Ancillary: parser returned null, returning raw XML');
      return { _error: true, message: 'Parser returned no data', rawXml: xml.substring(0, 5000) };
    }
    return parsed;
  } catch (err) {
    console.error('[Sabre SOAP] Ancillary request failed:', err.message);
    return { _error: true, message: err.message };
  }
}

// ── XML parsers (regex-based, avoids xml2js dependency) ──

function parseSeatMapXml(xml) {
  const rows = [];
  const columns = new Set();

  // Extract all Row elements (handle namespaced and non-namespaced)
  const rowMatches = xml.matchAll(/<(?:\w+:)?Row(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?Row>/gi);
  for (const match of rowMatches) {
    const rowXml = match[1];
    const rowNum = (rowXml.match(/<(?:\w+:)?RowNumber>(\d+)<\//) || [])[1];
    if (!rowNum) continue;

    const seats = [];
    const seatMatches = rowXml.matchAll(/<(?:\w+:)?Seat(?:\s[^>]*)?>(([\s\S]*?))<\/(?:\w+:)?Seat>/gi);
    for (const seatMatch of seatMatches) {
      const seatXml = seatMatch[0]; // full match including attributes
      const seatInner = seatMatch[1];
      
      // v6 uses <Number>A</Number>, older uses <Column>A</Column>
      const col = (seatInner.match(/<(?:\w+:)?Number>([A-Z])<\//) || seatInner.match(/<(?:\w+:)?Column>([A-Z])<\//) || [])[1];
      if (!col) continue;
      columns.add(col);

      // Check availability via occupiedInd attribute or Occupation detail
      const occupiedAttr = seatXml.match(/occupiedInd="(true|false)"/);
      const inoperativeAttr = seatXml.match(/inoperativeInd="(true|false)"/);
      const hasSeatIsFree = seatInner.includes('SeatIsFree');
      const hasOccupied = seatInner.includes('SeatIsOccupied') || seatInner.includes('Occupied');
      const hasBlocked = seatInner.includes('Blocked') || (inoperativeAttr && inoperativeAttr[1] === 'true');
      
      let available;
      if (occupiedAttr) {
        available = occupiedAttr[1] === 'false' && !hasBlocked;
      } else {
        available = hasSeatIsFree || (!hasOccupied && !hasBlocked);
      }

      // Location details
      const isExit = seatXml.includes('exitRowInd="true"') || seatInner.includes('ExitRow') || seatInner.includes('EXIT');
      const isWindow = seatInner.includes('Window');
      const isAisle = seatInner.includes('Aisle');
      const isMiddle = seatInner.includes('Middle');
      const isPremium = seatXml.includes('premiumInd="true"');
      const isChargeable = seatXml.includes('chargeableInd="true"');

      // v6 price: <Offer><Price><TotalAmount>...</TotalAmount></Price></Offer>
      // Also try <BasePrice> and older <Amount>
      const priceMatch = seatInner.match(/<(?:\w+:)?TotalAmount>([0-9.]+)<\//) 
        || seatInner.match(/<(?:\w+:)?BasePrice>([0-9.]+)<\//)
        || seatInner.match(/<(?:\w+:)?Amount[^>]*>([0-9.]+)<\//);
      const currencyMatch = seatInner.match(/currencyCode="([A-Z]+)"/) 
        || seatInner.match(/<(?:\w+:)?Currency[^>]*>([A-Z]+)<\//);

      let type = 'standard';
      if (isExit) type = 'exit-row';
      else if (isPremium) type = 'premium';
      else if (isWindow) type = 'window';
      else if (isAisle) type = 'aisle';
      else if (isMiddle) type = 'middle';

      seats.push({
        id: `${rowNum}${col}`,
        row: parseInt(rowNum),
        col,
        type,
        status: available ? 'available' : 'occupied',
        price: priceMatch ? parseFloat(priceMatch[1]) : 0,
        currency: currencyMatch ? currencyMatch[1] : 'BDT',
        label: `${rowNum}${col}`,
        isExit,
        isPremium,
        isChargeable,
      });
    }

    if (seats.length > 0) {
      rows.push({ rowNumber: parseInt(rowNum), seats });
    }
  }

  if (rows.length === 0) return null;

  // Detect aisles from column layout
  const sortedCols = [...columns].sort();
  const aisleAfter = [];
  for (let i = 0; i < sortedCols.length - 1; i++) {
    const gap = sortedCols[i + 1].charCodeAt(0) - sortedCols[i].charCodeAt(0);
    if (gap > 1) aisleAfter.push(i);
  }

  const exitRows = rows.filter(r => r.seats.some(s => s.isExit)).map(r => r.rowNumber);

  return {
    columns: sortedCols,
    totalRows: rows.length,
    rows,
    exitRows,
    aisleAfter,
    source: 'sabre-soap',
  };
}

function parseAncillaryXml(xml) {
  const meals = [];
  const baggage = [];
  const other = [];

  // Extract ancillary offers
  const offerMatches = xml.matchAll(/<Offer[^>]*>([\s\S]*?)<\/Offer>/gi);
  for (const match of offerMatches) {
    const offerXml = match[1];

    const name = (offerXml.match(/<CommercialName>([^<]+)<\/CommercialName>/) || [])[1] || '';
    const code = (offerXml.match(/<SubCode>([^<]+)<\/SubCode>/) || [])[1] || '';
    const group = (offerXml.match(/<GroupCode>([^<]+)<\/GroupCode>/) || [])[1] || '';
    const priceMatch = offerXml.match(/<TotalAmount>([0-9.]+)<\/TotalAmount>/) || offerXml.match(/<Amount>([0-9.]+)<\/Amount>/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
    const currency = (offerXml.match(/<Currency>([A-Z]+)<\/Currency>/) || [])[1] || 'BDT';

    const item = {
      id: code || `anc_${meals.length + baggage.length + other.length}`,
      code,
      name: name || code,
      price,
      currency,
      group,
    };

    // Categorize by group code
    // BG = Baggage, ML = Meal, SA = Seat, PT = Pet, etc.
    if (group === 'BG' || group === 'CY' || name.toLowerCase().includes('baggage') || name.toLowerCase().includes('bag')) {
      // Extract weight if in name
      const weightMatch = name.match(/(\d+)\s*kg/i);
      baggage.push({
        ...item,
        weight: weightMatch ? parseInt(weightMatch[1]) : null,
        description: name,
        type: 'checked',
      });
    } else if (group === 'ML' || name.toLowerCase().includes('meal') || name.toLowerCase().includes('food')) {
      meals.push({
        ...item,
        description: name,
        category: 'airline',
      });
    } else {
      other.push(item);
    }
  }

  if (meals.length === 0 && baggage.length === 0 && other.length === 0) return null;

  return {
    meals,
    baggage,
    other,
    source: 'sabre-soap',
  };
}

/**
 * Invalidate the SOAP session cache (e.g. after config change)
 */
function clearSoapSessionCache() {
  _sessionCache = { token: null, conversationId: null, expiresAt: 0 };
}

module.exports = {
  createSession,
  closeSession,
  getSeatMap,
  getAncillaryOffers,
  clearSoapSessionCache,
};
