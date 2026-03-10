/**
 * Passport OCR — Uses Google Cloud Vision API to extract text from passport/NID images
 * Stores API key in system_settings (key: 'api_google_vision')
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// The admin panel saves under setting_key = 'api_google_vision'
let configCache = null;
let configCacheTime = 0;

async function getVisionConfig() {
  if (configCache && Date.now() - configCacheTime < 5 * 60 * 1000) return configCache;
  try {
    const [rows] = await db.query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key = 'api_google_vision'");
    console.log('[OCR] DB query result rows:', rows.length, rows.length > 0 ? 'Found config' : 'No config found');
    if (rows.length > 0) {
      const raw = rows[0].setting_value;
      console.log('[OCR] Raw setting_value:', raw);
      const config = JSON.parse(raw);
      // Treat as enabled if apiKey exists (enabled field may not be saved by admin panel)
      const isEnabled = config.enabled === false ? false : true;
      if (isEnabled && config.apiKey) {
        configCache = config;
        configCacheTime = Date.now();
        return config;
      }
      console.log('[OCR] Config check failed — enabled:', isEnabled, 'apiKey present:', !!config.apiKey);
    }
  } catch (err) {
    console.error('[OCR] Config load error:', err.message);
  }
  // Fallback to env
  if (process.env.GOOGLE_VISION_API_KEY) {
    const config = { apiKey: process.env.GOOGLE_VISION_API_KEY, enabled: true };
    configCache = config;
    configCacheTime = Date.now();
    return config;
  }
  return null;
}

/**
 * POST /api/passport/ocr
 * Body: { image: "base64-encoded image data" }
 * Returns extracted passport fields
 */
router.post('/ocr', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    const config = await getVisionConfig();
    if (!config) {
      return res.status(503).json({ message: 'Google Vision API not configured. Add api_google_vision in Admin → API Integrations or set GOOGLE_VISION_API_KEY env var.' });
    }

    // Strip data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/pdf;base64,/, '');

    // Call Google Vision API
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${config.apiKey}`;
    const visionRequest = {
      requests: [{
        image: { content: base64Data },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 1 },
          { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
        ],
      }],
    };

    const response = await fetch(visionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visionRequest),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[OCR] Vision API error:', response.status, errorData);
      return res.status(502).json({ message: 'Google Vision API error', detail: errorData });
    }

    const data = await response.json();
    const fullText = data.responses?.[0]?.fullTextAnnotation?.text ||
                     data.responses?.[0]?.textAnnotations?.[0]?.description || '';

    console.log('[OCR] Extracted text length:', fullText.length);

    // Parse passport fields from extracted text
    const extracted = parsePassportText(fullText);

    res.json({
      success: true,
      extracted,
      rawText: fullText,
    });
  } catch (err) {
    console.error('[OCR] Error:', err.message);
    res.status(500).json({ message: 'OCR processing failed', error: err.message });
  }
});

/**
 * Parse passport/NID text to extract structured fields
 * Handles both Machine Readable Zone (MRZ) and visual text
 */
function parsePassportText(text) {
  const result = {
    title: '',
    firstName: '',
    lastName: '',
    country: '',
    passportNumber: '',
    birthDate: '',
    birthPlace: '',
    gender: '',
    issuanceDate: '',
    expiryDate: '',
  };

  if (!text) return result;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = text.toUpperCase();

  // ── Try MRZ parsing first (most reliable) ──
  // MRZ line 1: P<BGDMAHMUD<<MD<FAYSAL<<<<<<<<<<<<<<<<<<<<<
  // MRZ line 2: A109227518GD9312052M3506178644301595C<<C<76
  const mrzLines = lines.filter(l => /^[A-Z0-9<]{30,}$/.test(l.replace(/\s/g, '')));

  if (mrzLines.length >= 2) {
    const mrz1 = mrzLines[0].replace(/\s/g, '');
    const mrz2 = mrzLines[1].replace(/\s/g, '');

    // Line 1: Type, Country, Name
    if (mrz1.startsWith('P')) {
      // Country code (positions 2-4)
      const countryCode = mrz1.substring(2, 5).replace(/</g, '');
      // Convert ISO 3166 alpha-3 to alpha-2 for common codes
      const countryMap = { BGD: 'BD', IND: 'IN', USA: 'US', GBR: 'GB', PAK: 'PK', NPL: 'NP', LKA: 'LK', MMR: 'MM', MYS: 'MY', SGP: 'SG', ARE: 'AE', SAU: 'SA', KWT: 'KW', QAT: 'QA', BHR: 'BH', OMN: 'OM', CAN: 'CA', AUS: 'AU' };
      result.country = countryMap[countryCode] || countryCode;

      // Names: after position 5, split by <<
      const nameSection = mrz1.substring(5);
      const nameParts = nameSection.split('<<').filter(Boolean);
      if (nameParts.length >= 1) {
        result.lastName = nameParts[0].replace(/</g, ' ').trim();
      }
      if (nameParts.length >= 2) {
        result.firstName = nameParts[1].replace(/</g, ' ').trim();
      }
    }

    // Line 2: Passport number, nationality, DOB, sex, expiry
    if (mrz2.length >= 28) {
      // Passport number: positions 0-8
      const passportNum = mrz2.substring(0, 9).replace(/</g, '');
      result.passportNumber = passportNum;

      // DOB: positions 13-18 (YYMMDD)
      const dobStr = mrz2.substring(13, 19);
      if (/^\d{6}$/.test(dobStr)) {
        const yy = parseInt(dobStr.substring(0, 2));
        const mm = dobStr.substring(2, 4);
        const dd = dobStr.substring(4, 6);
        const year = yy > 50 ? 1900 + yy : 2000 + yy;
        result.birthDate = `${year}-${mm}-${dd}`;
      }

      // Sex: position 20
      const sex = mrz2.charAt(20);
      if (sex === 'M') { result.gender = 'Male'; result.title = 'MR'; }
      else if (sex === 'F') { result.gender = 'Female'; result.title = 'MS'; }

      // Expiry: positions 21-26 (YYMMDD)
      const expStr = mrz2.substring(21, 27);
      if (/^\d{6}$/.test(expStr)) {
        const yy = parseInt(expStr.substring(0, 2));
        const mm = expStr.substring(2, 4);
        const dd = expStr.substring(4, 6);
        const year = yy > 50 ? 1900 + yy : 2000 + yy;
        result.expiryDate = `${year}-${mm}-${dd}`;
      }
    }

    console.log('[OCR] MRZ parsed successfully');
    // Don't return yet — fall through to visual parsing for fields MRZ doesn't cover
    // (birthPlace, issuanceDate)
  }

  // ── Visual text parsing for remaining empty fields ──
  // Try to find key fields from labels in the scanned text

  // Passport/Document number
  if (!result.passportNumber) {
    const passportMatch = fullText.match(/(?:PASSPORT\s*(?:NO|NUMBER|#)|DOCUMENT\s*(?:NO|NUMBER))[:\s]*([A-Z0-9]{6,12})/i) ||
                          fullText.match(/\b([A-Z]{1,2}\d{6,9})\b/);
    if (passportMatch) result.passportNumber = passportMatch[1];
  }

  // Name parsing from labels (only fill if empty)
  if (!result.lastName) {
    const surnameMatch = fullText.match(/(?:SURNAME|FAMILY\s*NAME|LAST\s*NAME)[:\s/]*([A-Z\s]+?)(?:\n|$)/i);
    if (surnameMatch) result.lastName = surnameMatch[1].trim();
  }
  if (!result.firstName) {
    const givenMatch = fullText.match(/(?:GIVEN\s*NAME|FIRST\s*NAME|FORENAME)[:\s/]*([A-Z\s]+?)(?:\n|$)/i);
    if (givenMatch) result.firstName = givenMatch[1].trim();
  }

  // Gender
  if (!result.gender) {
    if (/\bMALE\b/.test(fullText) && !/FEMALE/.test(fullText)) { result.gender = 'Male'; result.title = 'MR'; }
    else if (/\bFEMALE\b/.test(fullText)) { result.gender = 'Female'; result.title = 'MS'; }
  }

  // Country
  if (!result.country) {
    const countryMatch = fullText.match(/(?:NATIONALITY|COUNTRY)[:\s]*([A-Z\s]+?)(?:\n|$)/i);
    if (countryMatch) {
      const c = countryMatch[1].trim();
      if (c.includes('BANGLADESH') || c === 'BGD') result.country = 'BD';
      else result.country = c.substring(0, 3);
    }
  }

  // Dates (DD/MM/YYYY or DD MMM YYYY patterns)
  const datePattern = /(\d{1,2})\s*[\/\-\.]\s*(\d{1,2}|[A-Z]{3})\s*[\/\-\.]\s*(\d{2,4})/g;
  const dates = [];
  let match;
  while ((match = datePattern.exec(fullText)) !== null) {
    dates.push({ raw: match[0], dd: match[1], mm: match[2], yyyy: match[3] });
  }

  // Birth date
  if (!result.birthDate) {
    const dobContext = fullText.match(/(?:DATE\s*OF\s*BIRTH|DOB|BIRTH\s*DATE)[:\s]*(\d{1,2}[\s\/\-\.]\w{2,3}[\s\/\-\.]\d{2,4})/i);
    if (dobContext) {
      result.birthDate = normalizeDate(dobContext[1]);
    } else if (dates.length > 0) {
      result.birthDate = normalizeDate(dates[0].raw);
    }
  }

  // Expiry date
  if (!result.expiryDate) {
    const expContext = fullText.match(/(?:EXPIRY|EXPIRATION|EXP\s*DATE|DATE\s*OF\s*EXP)[:\s]*(\d{1,2}[\s\/\-\.]\w{2,3}[\s\/\-\.]\d{2,4})/i);
    if (expContext) {
      result.expiryDate = normalizeDate(expContext[1]);
    } else if (dates.length > 2) {
      result.expiryDate = normalizeDate(dates[dates.length - 1].raw);
    }
  }

  // Issue date — BD passports show "Date of Issue" or just a date near "18 JUN 2025" pattern
  if (!result.issuanceDate) {
    const issueContext = fullText.match(/(?:DATE\s*OF\s*ISSUE|ISSUE\s*DATE|ISSUANCE\s*DATE|ISSUED)[:\s]*(\d{1,2}[\s\/\-\.]\w{2,3}[\s\/\-\.]\d{2,4})/i);
    if (issueContext) {
      result.issuanceDate = normalizeDate(issueContext[1]);
    } else if (dates.length >= 3 && result.birthDate && result.expiryDate) {
      // On BD passports: DOB, Issue Date, Expiry Date appear in order
      // Find a date that isn't DOB or expiry
      for (const d of dates) {
        const normalized = normalizeDate(d.raw);
        if (normalized && normalized !== result.birthDate && normalized !== result.expiryDate) {
          result.issuanceDate = normalized;
          break;
        }
      }
    }
  }

  // Birth place — BD passports: "Place of Birth" or city name near birth info
  if (!result.birthPlace) {
    const placeMatch = fullText.match(/(?:BIRTH\s*PLACE|PLACE\s*OF\s*BIRTH)[:\s]*([A-Z][A-Z\s,]+?)(?:\n|$)/i) ||
                       fullText.match(/(?:PLACE\s*OF\s*BIRTH|BIRTH\s*PLACE)[:\s\/]*\n?\s*([A-Z][A-Z\s,]+?)(?:\n|$)/i);
    if (placeMatch) {
      let place = placeMatch[1].trim();
      // Strip leading gender letter artifact (e.g. "MBARGUNA" → "BARGUNA")
      if (place.length > 2 && /^[MF][A-Z]/.test(place)) {
        place = place.substring(1);
      }
      if (place.length <= 2) place = '';
      result.birthPlace = place;
    }
    // BD passport fallback: search for known district names in text
    if (!result.birthPlace) {
      const bdDistricts = ['BARGUNA','DHAKA','CHITTAGONG','CHATTOGRAM','RAJSHAHI','KHULNA','BARISAL','SYLHET','RANGPUR','MYMENSINGH','COMILLA','GAZIPUR','NARAYANGANJ','PATUAKHALI','PIROJPUR','JHALOKATHI','BHOLA','NOAKHALI','FENI','LAKSHMIPUR','CHANDPUR','JESSORE','NARAIL','BOGURA','DINAJPUR','TANGAIL','FARIDPUR','BRAHMANBARIA','KISHOREGANJ','HABIGANJ','MOULVIBAZAR','SUNAMGANJ','COXS BAZAR'];
      for (const district of bdDistricts) {
        if (fullText.toUpperCase().includes(district)) {
          result.birthPlace = district.charAt(0) + district.slice(1).toLowerCase();
          break;
        }
      }
    }
  }

  console.log('[OCR] Visual text parsed');
  return result;
}

/**
 * Normalize date string to YYYY-MM-DD
 */
function normalizeDate(dateStr) {
  if (!dateStr) return '';
  const months = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };

  // Try DD/MMM/YYYY or DD MMM YYYY
  const mmmMatch = dateStr.match(/(\d{1,2})\s*[\/\-\.\s]\s*([A-Z]{3})\s*[\/\-\.\s]\s*(\d{2,4})/i);
  if (mmmMatch) {
    const dd = mmmMatch[1].padStart(2, '0');
    const mm = months[mmmMatch[2].toUpperCase()] || '01';
    let yyyy = mmmMatch[3];
    if (yyyy.length === 2) yyyy = parseInt(yyyy) > 50 ? '19' + yyyy : '20' + yyyy;
    return `${yyyy}-${mm}-${dd}`;
  }

  // Try DD/MM/YYYY
  const numMatch = dateStr.match(/(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{2,4})/);
  if (numMatch) {
    const dd = numMatch[1].padStart(2, '0');
    const mm = numMatch[2].padStart(2, '0');
    let yyyy = numMatch[3];
    if (yyyy.length === 2) yyyy = parseInt(yyyy) > 50 ? '19' + yyyy : '20' + yyyy;
    return `${yyyy}-${mm}-${dd}`;
  }

  return '';
}

module.exports = router;
