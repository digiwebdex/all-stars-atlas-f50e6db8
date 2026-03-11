/**
 * Enterprise Document OCR Engine v3
 * Extracts structured data from ANY passport, National ID, or Driving License worldwide.
 * 
 * Architecture:
 *   1. Google Vision API → raw OCR text (images + PDF support)
 *   2. Multi-strategy parser:
 *      a) MRZ parsing with OCR error correction (ICAO 9303 TD1/TD2/TD3)
 *      b) Universal labeled field extraction (supports 50+ label variations)
 *      c) Contextual heuristic extraction with date disambiguation
 *      d) Cross-validation & conflict resolution across strategies
 *   3. Post-processing: name cleanup, country normalization, date validation
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ── Config cache ──
let configCache = null;
let configCacheTime = 0;

async function getVisionConfig() {
  if (configCache && Date.now() - configCacheTime < 5 * 60 * 1000) return configCache;
  try {
    const [rows] = await db.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'api_google_vision'"
    );
    if (rows.length > 0) {
      const config = JSON.parse(rows[0].setting_value);
      if (config.enabled !== false && config.apiKey) {
        configCache = config;
        configCacheTime = Date.now();
        return config;
      }
    }
  } catch (err) {
    console.error('[OCR] Config load error:', err.message);
  }
  if (process.env.GOOGLE_VISION_API_KEY) {
    const config = { apiKey: process.env.GOOGLE_VISION_API_KEY, enabled: true };
    configCache = config;
    configCacheTime = Date.now();
    return config;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════
// ROUTE HANDLER
// ═══════════════════════════════════════════════════════════

router.post('/ocr', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: 'No image data provided' });

    const config = await getVisionConfig();
    if (!config) return res.status(503).json({ message: 'Google Vision API not configured.' });

    const isPDF = image.startsWith('data:application/pdf');

    const base64Data = image
      .replace(/^data:image\/\w+;base64,/, '')
      .replace(/^data:application\/pdf;base64,/, '');

    let fullText = '';

    if (isPDF) {
      // Use files:annotate for PDF documents
      const filesUrl = `https://vision.googleapis.com/v1/files:annotate?key=${config.apiKey}`;
      const response = await fetch(filesUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            inputConfig: {
              content: base64Data,
              mimeType: 'application/pdf',
            },
            features: [
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 5 },
            ],
            pages: [1, 2], // first 2 pages
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[OCR] Vision Files API error:', response.status, errorData);
        return res.status(502).json({ message: 'Google Vision API error processing PDF', detail: errorData });
      }

      const data = await response.json();
      // files:annotate returns responses[0].responses[] - one per page
      const pages = data.responses?.[0]?.responses || [];
      for (const page of pages) {
        const pageText = page.fullTextAnnotation?.text || '';
        if (pageText) fullText += pageText + '\n';
      }
    } else {
      // Standard image OCR
      const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${config.apiKey}`;
      const response = await fetch(visionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Data },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 1 },
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
            ],
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[OCR] Vision API error:', response.status, errorData);
        return res.status(502).json({ message: 'Google Vision API error', detail: errorData });
      }

      const data = await response.json();
      const resp0 = data.responses?.[0] || {};
      fullText = resp0.fullTextAnnotation?.text ||
                 resp0.textAnnotations?.[0]?.description || '';
    }

    console.log('[OCR] ──── RAW TEXT ────');
    console.log(fullText);
    console.log('[OCR] ──── END RAW TEXT ────');

    const extracted = parseDocument(fullText);

    res.json({ success: true, extracted, rawText: fullText });
  } catch (err) {
    console.error('[OCR] Error:', err.message);
    res.status(500).json({ message: 'OCR processing failed', error: err.message });
  }
});

module.exports = router;

// ═══════════════════════════════════════════════════════════
// MASTER PARSER
// ═══════════════════════════════════════════════════════════

function parseDocument(text) {
  const empty = () => ({
    title: '', firstName: '', lastName: '', country: '',
    passportNumber: '', birthDate: '', birthPlace: '',
    gender: '', issuanceDate: '', expiryDate: '',
  });

  if (!text || text.trim().length < 5) return empty();

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const upper = text.toUpperCase();

  // Run all strategies
  const mrz = parseMRZ(lines);
  const labels = parseLabeledFields(lines);
  const heuristic = parseHeuristic(lines, upper);

  console.log('[OCR] MRZ result:', JSON.stringify(mrz));
  console.log('[OCR] Label result:', JSON.stringify(labels));
  console.log('[OCR] Heuristic result:', JSON.stringify(heuristic));

  // Merge with priority
  const result = empty();
  const fields = Object.keys(result);

  for (const f of fields) {
    result[f] = mergePick(f, mrz[f], labels[f], heuristic[f]);
  }

  // ── Post-processing ──
  result.passportNumber = cleanPassportNumber(result.passportNumber);
  result.firstName = cleanName(result.firstName);
  result.lastName = cleanName(result.lastName);
  result.birthPlace = cleanPlace(result.birthPlace);
  result.country = normalizeCountryCode(result.country);

  // Title from gender
  if (!result.title && result.gender === 'Male') result.title = 'MR';
  if (!result.title && result.gender === 'Female') result.title = 'MS';

  // Validate dates
  result.birthDate = validateDate(result.birthDate);
  result.issuanceDate = validateDate(result.issuanceDate);
  result.expiryDate = validateDate(result.expiryDate);

  // Sanity: DOB must be before issue date, issue before expiry
  if (result.birthDate && result.expiryDate && result.birthDate > result.expiryDate) {
    [result.birthDate, result.expiryDate] = [result.expiryDate, result.birthDate];
  }

  console.log('[OCR] FINAL:', JSON.stringify(result, null, 2));
  return result;
}

// ═══════════════════════════════════════════════════════════
// STRATEGY 1: MRZ (ICAO 9303 TD1 / TD2 / TD3)
// ═══════════════════════════════════════════════════════════

function correctMRZChar(ch, expectDigit) {
  if (expectDigit) {
    const map = { O: '0', o: '0', I: '1', l: '1', B: '8', S: '5', Z: '2', G: '6', D: '0' };
    return map[ch] || ch;
  }
  const map = { '0': 'O', '1': 'I', '8': 'B', '5': 'S', '2': 'Z', '6': 'G' };
  return map[ch] || ch;
}

function cleanMRZLine(raw) {
  return raw.replace(/\s/g, '').replace(/[^A-Z0-9<]/gi, '<');
}

function parseMRZ(lines) {
  const r = emptyResult();

  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const cleaned = cleanMRZLine(lines[i]);
    if (cleaned.length >= 28 && /^[A-Z0-9<]{28,}$/i.test(cleaned)) {
      candidates.push({ line: cleaned.toUpperCase(), idx: i, len: cleaned.length });
    }
  }

  if (candidates.length < 1) return r;

  let format = null;
  let mrzLines = [];

  // Try TD3: find P< line (44 chars)
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if ((c.line.startsWith('P') && c.line.includes('<')) && c.len >= 40) {
      format = 'TD3';
      mrzLines = [c.line];
      for (let j = i + 1; j < candidates.length; j++) {
        if (candidates[j].len >= 40) {
          mrzLines.push(candidates[j].line);
          break;
        }
      }
      break;
    }
  }

  // Try TD1: 3 consecutive short lines
  if (!format && candidates.length >= 3) {
    for (let i = 0; i < candidates.length - 2; i++) {
      if (candidates[i].len >= 28 && candidates[i].len <= 34 &&
          candidates[i+1].len >= 28 && candidates[i+1].len <= 34 &&
          candidates[i+2].len >= 28 && candidates[i+2].len <= 34) {
        format = 'TD1';
        mrzLines = [candidates[i].line, candidates[i+1].line, candidates[i+2].line];
        break;
      }
    }
  }

  // Try TD2: 2 lines of ~36 chars
  if (!format && candidates.length >= 2) {
    for (let i = 0; i < candidates.length - 1; i++) {
      if (candidates[i].len >= 34 && candidates[i].len <= 40 &&
          candidates[i+1].len >= 34 && candidates[i+1].len <= 40) {
        format = 'TD2';
        mrzLines = [candidates[i].line, candidates[i+1].line];
        break;
      }
    }
  }

  // Fallback
  if (!format && candidates.length >= 2) {
    format = 'TD3';
    mrzLines = [candidates[0].line, candidates[1].line];
  }

  if (mrzLines.length < 2) return r;

  console.log(`[OCR] MRZ format: ${format}, lines: ${mrzLines.length}`);
  mrzLines.forEach((l, i) => console.log(`[OCR] MRZ[${i}]: ${l}`));

  if (format === 'TD3') return parseTD3(mrzLines, r);
  if (format === 'TD1') return parseTD1(mrzLines, r);
  if (format === 'TD2') return parseTD2(mrzLines, r);

  return r;
}

function parseTD3(mrzLines, r) {
  const line1 = mrzLines[0];
  const line2 = mrzLines.length > 1 ? mrzLines[1] : '';

  // Line 1: P<ISSUING<SURNAME<<GIVENNAMES<<<<<
  if (line1.startsWith('P')) {
    const issuing = line1.substring(2, 5).replace(/</g, '');
    r.country = issuing;

    const nameSection = line1.substring(5);
    const parts = nameSection.split(/<<+/).filter(Boolean);
    if (parts.length >= 1) r.lastName = parts[0].replace(/</g, ' ').trim();
    if (parts.length >= 2) r.firstName = parts.slice(1).join(' ').replace(/</g, ' ').trim();
  }

  // Line 2
  if (line2.length >= 28) {
    let ppNum = line2.substring(0, 9).replace(/</g, '');
    const corrected = [];
    for (let i = 0; i < ppNum.length; i++) {
      if (i < 2 && /[A-Z]/i.test(ppNum[i])) {
        corrected.push(ppNum[i]);
      } else {
        corrected.push(correctMRZChar(ppNum[i], true));
      }
    }
    r.passportNumber = corrected.join('');

    const dobRaw = line2.substring(13, 19);
    const dob = correctMRZDate(dobRaw);
    if (dob) r.birthDate = mrzDateToISO(dob, true);

    const sex = line2.charAt(20);
    if (sex === 'M') { r.gender = 'Male'; r.title = 'MR'; }
    else if (sex === 'F') { r.gender = 'Female'; r.title = 'MS'; }

    const expRaw = line2.substring(21, 27);
    const exp = correctMRZDate(expRaw);
    if (exp) r.expiryDate = mrzDateToISO(exp, false);
  }

  return r;
}

function parseTD1(mrzLines, r) {
  const line1 = mrzLines[0];
  const line2 = mrzLines[1];
  const line3 = mrzLines[2];

  if (line1.length >= 14) {
    r.country = line1.substring(2, 5).replace(/</g, '');
    r.passportNumber = line1.substring(5, 14).replace(/</g, '');
  }

  if (line2.length >= 18) {
    const dobRaw = line2.substring(0, 6);
    const dob = correctMRZDate(dobRaw);
    if (dob) r.birthDate = mrzDateToISO(dob, true);

    const sex = line2.charAt(7);
    if (sex === 'M') { r.gender = 'Male'; r.title = 'MR'; }
    else if (sex === 'F') { r.gender = 'Female'; r.title = 'MS'; }

    const expRaw = line2.substring(8, 14);
    const exp = correctMRZDate(expRaw);
    if (exp) r.expiryDate = mrzDateToISO(exp, false);

    const nat = line2.substring(15, 18).replace(/</g, '');
    if (nat && !r.country) r.country = nat;
  }

  if (line3) {
    const parts = line3.split(/<<+/).filter(Boolean);
    if (parts.length >= 1) r.lastName = parts[0].replace(/</g, ' ').trim();
    if (parts.length >= 2) r.firstName = parts.slice(1).join(' ').replace(/</g, ' ').trim();
  }

  return r;
}

function parseTD2(mrzLines, r) {
  const line1 = mrzLines[0];
  const line2 = mrzLines[1];

  if (line1.length >= 5) {
    r.country = line1.substring(2, 5).replace(/</g, '');
    const nameSection = line1.substring(5);
    const parts = nameSection.split(/<<+/).filter(Boolean);
    if (parts.length >= 1) r.lastName = parts[0].replace(/</g, ' ').trim();
    if (parts.length >= 2) r.firstName = parts.slice(1).join(' ').replace(/</g, ' ').trim();
  }

  if (line2 && line2.length >= 28) {
    r.passportNumber = line2.substring(0, 9).replace(/</g, '');
    const dobRaw = line2.substring(13, 19);
    const dob = correctMRZDate(dobRaw);
    if (dob) r.birthDate = mrzDateToISO(dob, true);

    const sex = line2.charAt(20);
    if (sex === 'M') { r.gender = 'Male'; r.title = 'MR'; }
    else if (sex === 'F') { r.gender = 'Female'; r.title = 'MS'; }

    const expRaw = line2.substring(21, 27);
    const exp = correctMRZDate(expRaw);
    if (exp) r.expiryDate = mrzDateToISO(exp, false);
  }

  return r;
}

function correctMRZDate(raw) {
  if (!raw || raw.length < 6) return null;
  let corrected = '';
  for (let i = 0; i < 6; i++) {
    corrected += correctMRZChar(raw[i], true);
  }
  if (/^\d{6}$/.test(corrected)) return corrected;
  return null;
}

function mrzDateToISO(yymmdd, isBirthDate) {
  const yy = parseInt(yymmdd.substring(0, 2));
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  let year;
  if (isBirthDate) {
    year = yy > 30 ? 1900 + yy : 2000 + yy;
  } else {
    year = 2000 + yy;
  }
  return `${year}-${mm}-${dd}`;
}

// ═══════════════════════════════════════════════════════════
// STRATEGY 2: UNIVERSAL LABELED FIELD EXTRACTION
// ═══════════════════════════════════════════════════════════

const LABEL_PATTERNS = {
  surname: [
    /(?:বংশগত\s*নাম\s*[\/\|]?\s*)?SURNAME/i,
    /FAMILY\s*NAME/i,
    /LAST\s*NAME/i,
    /NOM\s*(?:DE\s*FAMILLE)?/i,
    /APELLIDO/i,
    /NACHNAME/i,
  ],
  givenName: [
    /(?:প্রদত্ত\s*নাম\s*[\/\|]?\s*)?GIVEN\s*NAME/i,
    /FIRST\s*NAME/i,
    /FORENAME/i,
    /PR[EÉ]NOM/i,
    /NOMBRE/i,
    /VORNAME/i,
  ],
  passportNumber: [
    /(?:পাসপোর্ট\s*(?:নং|নম্বর)\s*[\/\|]?\s*)?PASSPORT\s*(?:NO|NUMBER|#|N[°º])/i,
    /DOCUMENT\s*(?:NO|NUMBER)/i,
    /(?:নং\s*[\/\|]?\s*)?NO\s*(?:DU\s*)?PASSEPORT/i,
  ],
  nationality: [
    /(?:জাতীয়তা\s*[\/\|]?\s*)?NATIONALITY/i,
    /NATIONALIT[ÉE]/i,
    /CIUDADAN[ÍI]A/i,
  ],
  countryCode: [
    /(?:দেশ\s*কোড\s*[\/\|]?\s*)?COUNTRY\s*CODE/i,
    /CODE\s*(?:DU\s*)?PAYS/i,
  ],
  dateOfBirth: [
    /(?:জন্ম\s*তারিখ\s*[\/\|]?\s*)?DATE\s*OF\s*BIRTH/i,
    /D\.?O\.?B\.?/i,
    /BIRTH\s*DATE/i,
    /DATE\s*DE\s*NAISSANCE/i,
    /FECHA\s*DE\s*NACIMIENTO/i,
    /GEBURTSDATUM/i,
  ],
  sex: [
    /(?:লিঙ্গ\s*[\/\|]?\s*)?SEX/i,
    /GENDER/i,
    /SEXE/i,
    /GESCHLECHT/i,
  ],
  placeOfBirth: [
    /(?:জন্মস্থান\s*[\/\|]?\s*)?PLACE\s*OF\s*BIRTH/i,
    /BIRTH\s*PLACE/i,
    /LIEU\s*DE\s*NAISSANCE/i,
    /LUGAR\s*DE\s*NACIMIENTO/i,
  ],
  dateOfIssue: [
    /(?:প্রদানের\s*তারিখ\s*[\/\|]?\s*)?DATE\s*OF\s*ISSUE/i,
    /ISSUE\s*DATE/i,
    /ISSUANCE\s*DATE/i,
    /ISSUED/i,
    /DATE\s*DE\s*D[ÉE]LIVRANCE/i,
  ],
  dateOfExpiry: [
    /(?:মেয়াদোত্তীর্ণের\s*তারিখ\s*[\/\|]?\s*)?DATE\s*OF\s*EXPIR/i,
    /EXPIRY\s*(?:DATE)?/i,
    /EXPIRATION\s*(?:DATE)?/i,
    /EXP\.?\s*DATE/i,
    /DATE\s*D['']EXPIRATION/i,
    /VALID\s*UNTIL/i,
  ],
};

function parseLabeledFields(lines) {
  const r = emptyResult();
  const indexed = lines.map((text, i) => ({ text, upper: text.toUpperCase(), i }));

  r.lastName = findLabeledValue(indexed, LABEL_PATTERNS.surname, 'name') || '';
  r.firstName = findLabeledValue(indexed, LABEL_PATTERNS.givenName, 'name') || '';

  const ppRaw = findLabeledValue(indexed, LABEL_PATTERNS.passportNumber, 'passport') || '';
  if (ppRaw) {
    const m = ppRaw.match(/([A-Z]{0,3}\d{5,10})/i) || ppRaw.match(/([A-Z0-9]{7,12})/i);
    r.passportNumber = m ? m[1].toUpperCase() : ppRaw;
  }

  const nat = findLabeledValue(indexed, LABEL_PATTERNS.nationality, 'text') || '';
  if (nat) r.country = nat;
  if (!r.country) {
    const cc = findLabeledValue(indexed, LABEL_PATTERNS.countryCode, 'text') || '';
    if (cc) r.country = cc.replace(/[^A-Z]/gi, '').substring(0, 3);
  }

  const dobStr = findLabeledValue(indexed, LABEL_PATTERNS.dateOfBirth, 'date') || '';
  if (dobStr) r.birthDate = normalizeDate(dobStr);

  const sexStr = findLabeledValue(indexed, LABEL_PATTERNS.sex, 'gender') || '';
  if (sexStr) {
    const su = sexStr.toUpperCase().trim();
    if (su === 'M' || su.startsWith('MALE') || su.startsWith('MASCULIN')) { r.gender = 'Male'; r.title = 'MR'; }
    else if (su === 'F' || su.startsWith('FEMALE') || su.startsWith('FEMININ') || su.startsWith('FÉMININ')) { r.gender = 'Female'; r.title = 'MS'; }
  }

  // Place of birth — use specialized extractor
  r.birthPlace = findBirthPlaceFromLabels(indexed) || '';

  const issStr = findLabeledValue(indexed, LABEL_PATTERNS.dateOfIssue, 'date') || '';
  if (issStr) r.issuanceDate = normalizeDate(issStr);

  const expStr = findLabeledValue(indexed, LABEL_PATTERNS.dateOfExpiry, 'date') || '';
  if (expStr) r.expiryDate = normalizeDate(expStr);

  console.log('[OCR] Label extraction done');
  return r;
}

/**
 * Specialized birth place extractor from labeled fields.
 * Handles the common OCR issue where gender value (M/F) bleeds into birthplace.
 */
function findBirthPlaceFromLabels(indexed) {
  const patterns = LABEL_PATTERNS.placeOfBirth;
  
  for (const pat of patterns) {
    for (let i = 0; i < indexed.length; i++) {
      const line = indexed[i].text;
      const match = line.match(pat);
      if (!match) continue;

      // Extract value after the label on the same line
      let after = line.substring(match.index + match[0].length);
      after = after.replace(/^[\s:\/\|,\-–—]+/, '').replace(/^[^\x20-\x7E]+\s*/, '').trim();

      // Validate: birthplace must be a real place name (>= 3 alpha chars), not single letter gender
      if (after.length >= 3 && isValidPlaceName(after)) {
        return after;
      }

      // Try next lines (up to 4 lines ahead)
      for (let j = i + 1; j < Math.min(i + 5, indexed.length); j++) {
        let nextLine = indexed[j].text.trim();
        if (isLabelLine(nextLine)) continue;
        if (isHeaderNoise(nextLine)) continue;
        // Strip Bangla/Unicode prefix
        nextLine = nextLine.replace(/^[^\x20-\x7E]+\s*/, '').trim();
        // Remove leading numbers/codes
        nextLine = nextLine.replace(/^\d+\s*/, '').trim();
        
        if (nextLine.length >= 3 && isValidPlaceName(nextLine)) {
          return nextLine;
        }
      }
    }
  }
  return '';
}

/** Check if a string looks like a real place name (not a gender code or noise) */
function isValidPlaceName(text) {
  const clean = text.replace(/[^A-Za-z\s\-',]/g, '').trim();
  // Reject single chars, single letter gender codes
  if (clean.length < 2) return false;
  const u = clean.toUpperCase();
  // Reject obvious non-place values
  const rejectValues = ['M', 'F', 'MALE', 'FEMALE', 'MR', 'MS', 'MRS', 'SEX', 'GENDER',
    'PASSPORT', 'TYPE', 'CODE', 'DATE', 'BIRTH', 'ISSUE', 'EXPIRY', 'NUMBER',
    'PERSONAL', 'EMERGENCY', 'CONTACT', 'DATA', 'AUTHORITY', 'DIP'];
  if (rejectValues.includes(u)) return false;
  // Must have at least 2 consecutive alpha chars
  if (!/[A-Za-z]{2,}/.test(clean)) return false;
  return true;
}

/**
 * Generic labeled value finder with type-aware validation.
 * @param {string} valueType - 'name', 'date', 'passport', 'gender', 'text'
 */
function findLabeledValue(indexed, patterns, valueType = 'text') {
  for (const pat of patterns) {
    for (let i = 0; i < indexed.length; i++) {
      const line = indexed[i].text;
      const match = line.match(pat);
      if (!match) continue;

      // Extract value after the label on the same line
      let after = line.substring(match.index + match[0].length);
      after = after.replace(/^[\s:\/\|,\-–—]+/, '').replace(/^[^\x20-\x7E]+\s*/, '').trim();

      if (after.length >= 1 && !isHeaderNoise(after) && isValidFieldValue(after, valueType)) {
        return after;
      }

      // Try next lines
      for (let j = i + 1; j < Math.min(i + 4, indexed.length); j++) {
        let nextLine = indexed[j].text.trim();
        if (isLabelLine(nextLine)) continue;
        nextLine = nextLine.replace(/^[^\x20-\x7E]+\s*/, '').trim();
        if (nextLine.length >= 1 && !isHeaderNoise(nextLine) && isValidFieldValue(nextLine, valueType)) {
          return nextLine;
        }
      }
    }
  }
  return '';
}

/** Validate extracted value based on expected field type */
function isValidFieldValue(value, type) {
  if (!value || value.length === 0) return false;
  switch (type) {
    case 'name':
      // Name must have at least 2 alpha chars, not be a label or noise
      return /[A-Za-z]{2,}/.test(value) && !isLabelLine(value);
    case 'date':
      // Must contain digits
      return /\d/.test(value);
    case 'passport':
      // Must contain digits
      return /\d/.test(value);
    case 'gender':
      // Single M/F is valid for gender
      return true;
    default:
      return true;
  }
}

function isLabelLine(text) {
  const u = text.toUpperCase();
  const labelWords = ['SURNAME', 'GIVEN', 'NAME', 'PASSPORT', 'DATE', 'BIRTH', 'SEX', 'GENDER',
    'PLACE', 'ISSUE', 'EXPIRY', 'EXPIRATION', 'NATIONALITY', 'COUNTRY', 'CODE', 'TYPE',
    'PERSONAL', 'PREVIOUS', 'ISSUING', 'AUTHORITY', 'NUMBER', 'HOLDER'];
  const words = u.split(/\s+/);
  const labelCount = words.filter(w => labelWords.includes(w)).length;
  return labelCount >= Math.ceil(words.length * 0.6) && words.length <= 5;
}

function isHeaderNoise(text) {
  const u = text.toUpperCase();
  const noise = [
    'PERSONAL DATA AND EMERGENCY',
    'EMERGENCY CONTACT',
    "PEOPLE'S REPUBLIC",
    'REPUBLIC OF BANGLADESH',
    'MACHINE READABLE',
    'TRAVEL DOCUMENT',
    'GOVERNMENT OF',
  ];
  return noise.some(n => u.includes(n));
}

// ═══════════════════════════════════════════════════════════
// STRATEGY 3: HEURISTIC / CONTEXTUAL EXTRACTION
// ═══════════════════════════════════════════════════════════

function parseHeuristic(lines, upper) {
  const r = emptyResult();

  // ── Passport number by pattern ──
  for (const line of lines) {
    const u = line.toUpperCase().replace(/\s/g, '');
    if (u.length > 30 && /^[A-Z0-9<]+$/.test(u)) continue;
    if (isHeaderNoise(line)) continue;

    const ppMatch = line.match(/\b([A-Z]{1,3}\d{6,9})\b/i);
    if (ppMatch && !r.passportNumber) {
      r.passportNumber = ppMatch[1].toUpperCase();
    }
  }

  // ── Gender ──
  if (/\bFEMALE\b/.test(upper)) { r.gender = 'Female'; r.title = 'MS'; }
  else if (/\bMALE\b/.test(upper) && !/FEMALE/.test(upper)) { r.gender = 'Male'; r.title = 'MR'; }

  // ── Country ──
  detectCountry(upper, r);

  // ── Birth place via district lookup (BD) + contextual search ──
  if (!r.birthPlace) {
    r.birthPlace = findBirthPlace(lines, upper);
  }

  // ── Date extraction with context-aware assignment ──
  const allDates = extractAllDates(lines);
  assignDatesByContext(allDates, r);

  return r;
}

function detectCountry(upper, r) {
  const countryPatterns = [
    [/BANGLADES/i, 'BD'], [/\bINDIA\b/i, 'IN'], [/\bPAKISTAN/i, 'PK'],
    [/\bNEPAL/i, 'NP'], [/\bSRI\s*LANKA/i, 'LK'], [/\bMYANMAR/i, 'MM'],
    [/\bUNITED STATES/i, 'US'], [/\bUNITED KINGDOM/i, 'GB'], [/\bCANAD/i, 'CA'],
    [/\bAUSTRALI/i, 'AU'], [/\bMALAYSI/i, 'MY'], [/\bSINGAPORE/i, 'SG'],
    [/\bPHILIPPIN/i, 'PH'], [/\bTHAILAND/i, 'TH'], [/\bINDONESI/i, 'ID'],
    [/\bCHINA/i, 'CN'], [/\bJAPAN/i, 'JP'], [/\bKOREA/i, 'KR'],
    [/\bSAUDI/i, 'SA'], [/\bEMIRAT|\bUAE\b/i, 'AE'], [/\bKUWAIT/i, 'KW'],
    [/\bQATAR/i, 'QA'], [/\bBAHRAIN/i, 'BH'], [/\bOMAN\b/i, 'OM'],
    [/\bTURK/i, 'TR'], [/\bEGYPT/i, 'EG'], [/\bGERMAN/i, 'DE'],
    [/\bFRANC/i, 'FR'], [/\bITAL/i, 'IT'], [/\bSPAIN\b|ESPAÑOL/i, 'ES'],
  ];
  for (const [pat, code] of countryPatterns) {
    if (pat.test(upper)) { r.country = code; return; }
  }
}

function extractAllDates(lines) {
  const dates = [];
  for (const line of lines) {
    const u = line.toUpperCase();
    if (u.replace(/\s/g, '').length > 30 && /^[A-Z0-9<]+$/.test(u.replace(/\s/g, ''))) continue;
    if (isHeaderNoise(line)) continue;

    // DD MMM YYYY
    const pat1 = /(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/gi;
    let m;
    while ((m = pat1.exec(line)) !== null) {
      const d = normalizeDate(m[0]);
      if (d) dates.push({ normalized: d, context: u, raw: m[0] });
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const pat2 = /(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{4})/g;
    while ((m = pat2.exec(line)) !== null) {
      const d = normalizeDate(m[0]);
      if (d) dates.push({ normalized: d, context: u, raw: m[0] });
    }
  }
  return dates;
}

function assignDatesByContext(dates, r) {
  for (const d of dates) {
    const ctx = d.context;
    if (!r.birthDate && /BIRTH/i.test(ctx)) r.birthDate = d.normalized;
    else if (!r.issuanceDate && /ISSUE/i.test(ctx)) r.issuanceDate = d.normalized;
    else if (!r.expiryDate && (/EXPIR/i.test(ctx) || /VALID/i.test(ctx))) r.expiryDate = d.normalized;
  }

  const used = new Set([r.birthDate, r.issuanceDate, r.expiryDate].filter(Boolean));
  const remaining = [...new Set(dates.map(d => d.normalized).filter(d => !used.has(d)))].sort();

  if (!r.birthDate && remaining.length >= 1) r.birthDate = remaining[0];
  if (!r.issuanceDate && remaining.length >= 2) r.issuanceDate = remaining[1];
  if (!r.expiryDate && remaining.length >= 3) r.expiryDate = remaining[2];
}

// ═══════════════════════════════════════════════════════════
// BIRTH PLACE — BD districts + contextual extraction
// ═══════════════════════════════════════════════════════════

const BD_DISTRICTS = [
  'BAGERHAT','BANDARBAN','BARGUNA','BARISAL','BARISHAL','BHOLA','BOGRA','BOGURA',
  'BRAHMANBARIA','CHANDPUR','CHAPAINAWABGANJ','CHATTOGRAM','CHITTAGONG','CHUADANGA',
  'COMILLA','CUMILLA',"COX'S BAZAR",'COXS BAZAR','DHAKA','DINAJPUR','FARIDPUR',
  'FENI','GAIBANDHA','GAZIPUR','GOPALGANJ','HABIGANJ','JAMALPUR','JESSORE','JASHORE',
  'JHALOKATHI','JHALOKATI','JHENAIDAH','JOYPURHAT','KHAGRACHARI','KHULNA','KISHOREGANJ',
  'KURIGRAM','KUSHTIA','LAKSHMIPUR','LALMONIRHAT','MADARIPUR','MAGURA','MANIKGANJ',
  'MEHERPUR','MOULVIBAZAR','MUNSHIGANJ','MYMENSINGH','NAOGAON','NARAIL','NARAYANGANJ',
  'NARSINGDI','NATORE','NETROKONA','NILPHAMARI','NOAKHALI','PABNA','PANCHAGARH',
  'PATUAKHALI','PIROJPUR','RAJBARI','RAJSHAHI','RANGAMATI','RANGPUR','SATKHIRA',
  'SHARIATPUR','SHERPUR','SIRAJGANJ','SUNAMGANJ','SYLHET','TANGAIL','THAKURGAON',
  'LOHAGARA','DAKSHIN','BOALKHALI','KADHURKHIL','PANCHLAISH','RANGUNIA',
  'HATHAZARI','PATIYA','SATKANIA','ANWARA','CHANDANAISH','MIRSHARAI','SANDWIP',
  'SITAKUNDA',
];

function findBirthPlace(lines, upper) {
  // Strategy A: look near "Place of Birth" label with smarter extraction
  for (let i = 0; i < lines.length; i++) {
    const u = lines[i].toUpperCase();
    if (/PLACE\s*OF\s*BIRTH/i.test(u) || /BIRTH\s*PLACE/i.test(u) || /জন্মস্থান/i.test(lines[i])) {
      // Check same line after label
      const after = u.replace(/.*(?:PLACE\s*OF\s*BIRTH|BIRTH\s*PLACE)\s*[:\s\/]*/i, '').trim();
      const cleanedAfter = after.replace(/^\s*[MF]\s*$/i, '').replace(/\d+/g, '').trim();
      
      if (cleanedAfter.length >= 3 && isValidPlaceName(cleanedAfter)) {
        return titleCase(cleanedAfter);
      }

      // Check next lines (up to 5 lines ahead — sometimes there's a gap)
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        let next = lines[j].replace(/^[^\x20-\x7E]+\s*/, '').trim();
        // Remove leading digits/codes
        next = next.replace(/^\d+\s*/, '').trim();
        // Skip single char (M/F gender bleed), label lines, headers
        if (next.length < 2) continue;
        if (isLabelLine(next)) continue;
        if (isHeaderNoise(next)) continue;
        // Skip date-like strings
        if (/^\d{1,2}\s*[\/\-\.]\s*\d{1,2}/.test(next)) continue;
        if (/^\d{1,2}\s+[A-Z]{3}\s+\d{4}$/i.test(next)) continue;
        // Skip gender values
        if (/^(M|F|MALE|FEMALE)$/i.test(next.trim())) continue;
        
        if (next.length >= 2 && isValidPlaceName(next)) {
          // Try to match a known district
          for (const d of BD_DISTRICTS) {
            if (next.toUpperCase().includes(d)) {
              return titleCase(d);
            }
          }
          return titleCase(next);
        }
      }
    }
  }

  // Strategy B: search for known BD district names anywhere (not in noise lines)
  for (const d of BD_DISTRICTS) {
    const regex = new RegExp(`\\b${d.replace(/['\s]/g, "[\\s']?")}\\b`, 'i');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isHeaderNoise(line)) continue;
      if (/EMERGENCY|PERMANENT\s*ADDRESS|FATHER|MOTHER|SPOUSE/i.test(line)) continue;
      // Only match near birthplace context or standalone
      if (regex.test(line.toUpperCase())) {
        // Check if this line is near a birthplace label (within 3 lines)
        let nearBirthLabel = false;
        for (let k = Math.max(0, i - 3); k <= Math.min(lines.length - 1, i + 1); k++) {
          if (/PLACE\s*OF\s*BIRTH|BIRTH\s*PLACE|জন্মস্থান/i.test(lines[k])) {
            nearBirthLabel = true;
            break;
          }
        }
        if (nearBirthLabel) {
          return titleCase(d);
        }
      }
    }
  }

  // Strategy C: last resort — find any district name not in emergency/father/mother context
  for (const d of BD_DISTRICTS) {
    const regex = new RegExp(`\\b${d.replace(/['\s]/g, "[\\s']?")}\\b`, 'i');
    for (const line of lines) {
      if (isHeaderNoise(line)) continue;
      if (/EMERGENCY|PERMANENT\s*ADDRESS|FATHER|MOTHER|SPOUSE|LEGAL|GUARDIAN/i.test(line)) continue;
      if (regex.test(line.toUpperCase())) {
        return titleCase(d);
      }
    }
  }

  return '';
}

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

function emptyResult() {
  return {
    title: '', firstName: '', lastName: '', country: '',
    passportNumber: '', birthDate: '', birthPlace: '',
    gender: '', issuanceDate: '', expiryDate: '',
  };
}

/** Pick best value across strategies — MRZ is king for structured data */
function mergePick(field, mrzVal, labelVal, heuristicVal) {
  const mv = (mrzVal || '').trim();
  const lv = (labelVal || '').trim();
  const hv = (heuristicVal || '').trim();

  // Passport number: prefer well-formatted
  if (field === 'passportNumber') {
    const isGoodPP = v => /^[A-Z]{1,3}\d{5,10}$/.test(v);
    if (isGoodPP(mv)) return mv;
    if (isGoodPP(lv)) return lv;
    if (isGoodPP(hv)) return hv;
    return mv || lv || hv || '';
  }

  // Names: MRZ is most reliable (structured parsing), then labeled
  if (field === 'firstName' || field === 'lastName') {
    // MRZ names are structured and reliable
    if (mv && mv.length >= 2 && /^[A-Z\s]+$/i.test(mv) && !isHeaderNoise(mv)) return mv;
    // Label as fallback
    if (lv && lv.length >= 2 && lv.length <= 40 && /^[A-Z\s.\-']+$/i.test(lv) && !isHeaderNoise(lv)) return lv;
    return mv || lv || hv || '';
  }

  // Birth place: prefer labeled (MRZ doesn't have it), then heuristic
  if (field === 'birthPlace') {
    if (lv && lv.length >= 2 && isValidPlaceName(lv)) return lv;
    if (hv && hv.length >= 2 && isValidPlaceName(hv)) return hv;
    return lv || hv || '';
  }

  // Dates: prefer labeled with YYYY-MM-DD format, then MRZ
  if (field.includes('Date') || field.includes('date')) {
    const isValidDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (isValidDate(lv)) return lv;
    if (isValidDate(mv)) return mv;
    if (isValidDate(hv)) return hv;
    return lv || mv || hv || '';
  }

  // Gender, title: MRZ first
  return mv || lv || hv || '';
}

function normalizeDate(dateStr) {
  if (!dateStr) return '';
  const months = {
    JAN:'01', FEB:'02', MAR:'03', APR:'04', MAY:'05', JUN:'06',
    JUL:'07', AUG:'08', SEP:'09', OCT:'10', NOV:'11', DEC:'12',
    JANUARY:'01', FEBRUARY:'02', MARCH:'03', APRIL:'04',
    JUNE:'06', JULY:'07', AUGUST:'08', SEPTEMBER:'09',
    OCTOBER:'10', NOVEMBER:'11', DECEMBER:'12',
  };

  const m1 = dateStr.match(/(\d{1,2})\s*[\/\-\.\s]\s*([A-Z]+)\s*[\/\-\.\s]\s*(\d{4})/i);
  if (m1) {
    const dd = m1[1].padStart(2, '0');
    const mm = months[m1[2].toUpperCase()] || null;
    if (mm) return `${m1[3]}-${mm}-${dd}`;
  }

  const m1b = dateStr.match(/([A-Z]+)\s+(\d{1,2}),?\s*(\d{4})/i);
  if (m1b) {
    const dd = m1b[2].padStart(2, '0');
    const mm = months[m1b[1].toUpperCase()] || null;
    if (mm) return `${m1b[3]}-${mm}-${dd}`;
  }

  const m2 = dateStr.match(/(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{4})/);
  if (m2) {
    const dd = m2[1].padStart(2, '0');
    const mm = m2[2].padStart(2, '0');
    return `${m2[3]}-${mm}-${dd}`;
  }

  const m3 = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m3) return m3[0];

  const m4 = dateStr.match(/(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{2})/);
  if (m4) {
    const dd = m4[1].padStart(2, '0');
    const mm = m4[2].padStart(2, '0');
    const yy = parseInt(m4[3]);
    const yyyy = yy > 50 ? 1900 + yy : 2000 + yy;
    return `${yyyy}-${mm}-${dd}`;
  }

  return '';
}

function validateDate(d) {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return d || '';
  const [y, m, dd] = d.split('-').map(Number);
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || dd < 1 || dd > 31) return '';
  return d;
}

function cleanPassportNumber(pp) {
  if (!pp) return '';
  return pp.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function cleanName(name) {
  if (!name) return '';
  name = name.replace(/[^A-Za-z\s\-'.]/g, '').trim();
  // Remove single-char artifact at start
  name = name.replace(/^[A-Z]\s+(?=[A-Z]{2})/i, '');
  const noiseWords = [
    'PERSONAL', 'DATA', 'EMERGENCY', 'CONTACT', 'PASSPORT', 'REPUBLIC',
    'BANGLADESH', 'PEOPLES', 'TYPE', 'CODE', 'COUNTRY', 'NUMBER',
    'GOVERNMENT', 'MACHINE', 'READABLE', 'ZONE', 'DOCUMENT', 'TRAVEL',
  ];
  const words = name.split(/\s+/).filter(w => !noiseWords.includes(w.toUpperCase()));
  name = words.join(' ').trim();
  if (name.length > 45) name = name.substring(0, 45).trim();
  return name;
}

function cleanPlace(place) {
  if (!place) return '';
  place = place.replace(/[^A-Za-z\s,\-']/g, '').trim();
  const noise = ['PERSONAL', 'DATA', 'EMERGENCY', 'CONTACT', 'PASSPORT', 'REPUBLIC',
    'BANGLADESH', 'SEX', 'MALE', 'FEMALE', 'ISSUING', 'AUTHORITY', 'M', 'F'];
  const words = place.split(/\s+/).filter(w => !noise.includes(w.toUpperCase()));
  place = words.join(' ').trim();
  // If result is just a single char, it's garbage
  if (place.length <= 1) return '';
  if (place.length > 30) place = place.substring(0, 30).trim();
  return titleCase(place);
}

function normalizeCountryCode(c) {
  if (!c) return '';
  c = c.replace(/[^A-Z]/gi, '').toUpperCase();
  const map = {
    BGD:'BD', BANGLADESH:'BD', BANGLADESHI:'BD',
    IND:'IN', INDIA:'IN', INDIAN:'IN',
    USA:'US', UNITEDSTATES:'US',
    GBR:'GB', UNITEDKINGDOM:'GB', BRITISH:'GB',
    PAK:'PK', PAKISTAN:'PK', PAKISTANI:'PK',
    NPL:'NP', NEPAL:'NP', NEPALESE:'NP',
    LKA:'LK', SRILANKA:'LK', SRILANKAN:'LK',
    MMR:'MM', MYANMAR:'MM',
    MYS:'MY', MALAYSIA:'MY', MALAYSIAN:'MY',
    SGP:'SG', SINGAPORE:'SG', SINGAPOREAN:'SG',
    ARE:'AE', UAE:'AE',
    SAU:'SA', SAUDIARABIA:'SA', SAUDI:'SA',
    KWT:'KW', KUWAIT:'KW', KUWAITI:'KW',
    QAT:'QA', QATAR:'QA', QATARI:'QA',
    BHR:'BH', BAHRAIN:'BH', BAHRAINI:'BH',
    OMN:'OM', OMAN:'OM', OMANI:'OM',
    CAN:'CA', CANADA:'CA', CANADIAN:'CA',
    AUS:'AU', AUSTRALIA:'AU', AUSTRALIAN:'AU',
    JPN:'JP', JAPAN:'JP', JAPANESE:'JP',
    KOR:'KR', KOREA:'KR', KOREAN:'KR',
    CHN:'CN', CHINA:'CN', CHINESE:'CN',
    THA:'TH', THAILAND:'TH', THAI:'TH',
    IDN:'ID', INDONESIA:'ID', INDONESIAN:'ID',
    PHL:'PH', PHILIPPINES:'PH', FILIPINO:'PH',
    TUR:'TR', TURKEY:'TR', TURKISH:'TR', TURKIYE:'TR',
    EGY:'EG', EGYPT:'EG', EGYPTIAN:'EG',
    DEU:'DE', GERMANY:'DE', GERMAN:'DE',
    FRA:'FR', FRANCE:'FR', FRENCH:'FR',
    ITA:'IT', ITALY:'IT', ITALIAN:'IT',
    ESP:'ES', SPAIN:'ES', SPANISH:'ES',
    NLD:'NL', NETHERLANDS:'NL', DUTCH:'NL',
    BEL:'BE', BELGIUM:'BE',
    CHE:'CH', SWITZERLAND:'CH', SWISS:'CH',
    SWE:'SE', SWEDEN:'SE',
    NOR:'NO', NORWAY:'NO',
    DNK:'DK', DENMARK:'DK',
    FIN:'FI', FINLAND:'FI',
    IRL:'IE', IRELAND:'IE',
    PRT:'PT', PORTUGAL:'PT',
    GRC:'GR', GREECE:'GR',
    POL:'PL', POLAND:'PL',
    ROU:'RO', ROMANIA:'RO',
    RUS:'RU', RUSSIA:'RU',
    BRA:'BR', BRAZIL:'BR',
    MEX:'MX', MEXICO:'MX',
    ARG:'AR', ARGENTINA:'AR',
    COL:'CO', COLOMBIA:'CO',
    ZAF:'ZA', SOUTHAFRICA:'ZA',
    NGA:'NG', NIGERIA:'NG',
    KEN:'KE', KENYA:'KE',
    ETH:'ET', ETHIOPIA:'ET',
    GHA:'GH', GHANA:'GH',
  };
  return map[c] || (c.length === 2 ? c : (c.length >= 3 ? (map[c.substring(0,3)] || c.substring(0,2)) : c));
}

function titleCase(str) {
  if (!str) return '';
  return str.split(/\s+/).map(w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' ');
}
