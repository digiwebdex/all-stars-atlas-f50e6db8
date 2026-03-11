/**
 * Document OCR — Enterprise-grade extraction for Passport, NID, Driving License
 * Uses Google Cloud Vision API with robust multi-strategy parsing
 * Stores API key in system_settings (key: 'api_google_vision')
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
    const [rows] = await db.query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key = 'api_google_vision'");
    if (rows.length > 0) {
      const config = JSON.parse(rows[0].setting_value);
      const isEnabled = config.enabled !== false;
      if (isEnabled && config.apiKey) {
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

/**
 * POST /api/passport/ocr
 * Body: { image: "base64-encoded image data" }
 */
router.post('/ocr', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: 'No image data provided' });

    const config = await getVisionConfig();
    if (!config) return res.status(503).json({ message: 'Google Vision API not configured.' });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/pdf;base64,/, '');

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

    console.log('[OCR] Raw text length:', fullText.length);
    console.log('[OCR] Raw text preview:', fullText.substring(0, 500));

    const extracted = parseDocument(fullText);

    res.json({ success: true, extracted, rawText: fullText });
  } catch (err) {
    console.error('[OCR] Error:', err.message);
    res.status(500).json({ message: 'OCR processing failed', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ENTERPRISE DOCUMENT PARSER
// ═══════════════════════════════════════════════════════════════════

function parseDocument(text) {
  const result = {
    title: '', firstName: '', lastName: '', country: '',
    passportNumber: '', birthDate: '', birthPlace: '',
    gender: '', issuanceDate: '', expiryDate: '',
  };

  if (!text || text.trim().length < 10) return result;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const upper = text.toUpperCase();

  // Strategy 1: MRZ (most reliable when present)
  const mrzResult = parseMRZ(lines);

  // Strategy 2: Labeled field extraction (BD passport visual zone)
  const labelResult = parseLabeledFields(lines, upper);

  // Strategy 3: Heuristic/contextual extraction
  const heuristicResult = parseHeuristic(lines, upper);

  // Merge: MRZ > Label > Heuristic (per field, pick best non-empty)
  const fields = ['firstName', 'lastName', 'passportNumber', 'birthDate',
    'gender', 'expiryDate', 'country', 'birthPlace', 'issuanceDate', 'title'];

  for (const f of fields) {
    result[f] = pickBest(f, mrzResult[f], labelResult[f], heuristicResult[f]);
  }

  // Post-processing: validate and clean
  result.passportNumber = cleanPassportNumber(result.passportNumber);
  result.firstName = cleanName(result.firstName);
  result.lastName = cleanName(result.lastName);
  result.birthPlace = cleanBirthPlace(result.birthPlace);
  result.country = normalizeCountry(result.country);

  // Ensure title from gender
  if (!result.title && result.gender) {
    result.title = result.gender === 'Male' ? 'MR' : 'MS';
  }
  if (result.gender === 'Male' && !result.title) result.title = 'MR';
  if (result.gender === 'Female' && !result.title) result.title = 'MS';

  // Validate dates
  result.birthDate = validateDate(result.birthDate);
  result.expiryDate = validateDate(result.expiryDate);
  result.issuanceDate = validateDate(result.issuanceDate);

  console.log('[OCR] Final result:', JSON.stringify(result));
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// STRATEGY 1: MRZ PARSING (ICAO 9303 TD3)
// ═══════════════════════════════════════════════════════════════════

function parseMRZ(lines) {
  const result = emptyResult();

  // Find MRZ lines — allow minor OCR noise (spaces, O/0 confusion)
  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const cleaned = lines[i].replace(/\s/g, '');
    // MRZ lines are 44 chars, but OCR may truncate/extend slightly
    if (cleaned.length >= 30 && /^[A-Z0-9<]{28,}/.test(cleaned)) {
      candidates.push({ line: cleaned, index: i });
    }
  }

  // Find the P< line (line 1) and the subsequent numeric line (line 2)
  let mrz1 = null, mrz2 = null;

  for (const c of candidates) {
    if (c.line.startsWith('P') && c.line.includes('<')) {
      mrz1 = c.line;
      // Find mrz2: next candidate or next line
      const nextCandidates = candidates.filter(x => x.index > c.index);
      if (nextCandidates.length > 0) {
        mrz2 = nextCandidates[0].line;
      }
      break;
    }
  }

  // If no P< found, try finding two consecutive long alphanumeric lines
  if (!mrz1 && candidates.length >= 2) {
    for (let i = 0; i < candidates.length - 1; i++) {
      if (candidates[i + 1].index - candidates[i].index <= 3) {
        mrz1 = candidates[i].line;
        mrz2 = candidates[i + 1].line;
        break;
      }
    }
  }

  if (!mrz1) return result;
  console.log('[OCR] MRZ Line 1:', mrz1);
  if (mrz2) console.log('[OCR] MRZ Line 2:', mrz2);

  // ── Parse Line 1: Type + Country + Names ──
  if (mrz1.startsWith('P')) {
    // Country: positions 2-4
    const countryRaw = mrz1.substring(2, 5).replace(/</g, '');
    result.country = countryRaw;

    // Names: everything after position 5
    const nameSection = mrz1.substring(5);
    const nameParts = nameSection.split(/<<+/).filter(Boolean);
    if (nameParts.length >= 1) {
      result.lastName = nameParts[0].replace(/</g, ' ').trim();
    }
    if (nameParts.length >= 2) {
      // Given names may have < separating multiple names
      result.firstName = nameParts.slice(1).join(' ').replace(/</g, ' ').trim();
    }
  }

  // ── Parse Line 2: Passport#, DOB, Sex, Expiry ──
  if (mrz2 && mrz2.length >= 28) {
    // Passport number: positions 0-8 (9 chars)
    result.passportNumber = mrz2.substring(0, 9).replace(/</g, '');

    // Position 9: check digit (skip)
    // Positions 10-12: Nationality (3 chars) — we already have from line 1

    // DOB: positions 13-18 (YYMMDD)
    const dobStr = mrz2.substring(13, 19);
    if (/^\d{6}$/.test(dobStr)) {
      result.birthDate = mrzDateToISO(dobStr);
    }

    // Sex: position 20
    const sex = mrz2.charAt(20);
    if (sex === 'M') { result.gender = 'Male'; result.title = 'MR'; }
    else if (sex === 'F') { result.gender = 'Female'; result.title = 'MS'; }

    // Expiry: positions 21-26 (YYMMDD)
    const expStr = mrz2.substring(21, 27);
    if (/^\d{6}$/.test(expStr)) {
      result.expiryDate = mrzDateToISO(expStr);
    }
  }

  if (result.passportNumber) console.log('[OCR] MRZ parsed OK');
  return result;
}

function mrzDateToISO(yymmdd) {
  const yy = parseInt(yymmdd.substring(0, 2));
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  const year = yy > 50 ? 1900 + yy : 2000 + yy;
  return `${year}-${mm}-${dd}`;
}

// ═══════════════════════════════════════════════════════════════════
// STRATEGY 2: LABELED FIELD EXTRACTION
// Handles BD passport visual zone and international passport labels
// ═══════════════════════════════════════════════════════════════════

function parseLabeledFields(lines, upper) {
  const result = emptyResult();

  // Build a joined version for multi-line label matching
  const joinedLines = lines.map((l, i) => ({ text: l, upper: l.toUpperCase(), index: i }));

  // ── Surname / Last Name ──
  for (let i = 0; i < joinedLines.length; i++) {
    const u = joinedLines[i].upper;
    if (/\bSURNAME\b/.test(u) || /\bFAMILY\s*NAME\b/.test(u)) {
      // Value might be on same line after label or on next line
      const val = extractValueAfterLabel(joinedLines, i, /(?:SURNAME|FAMILY\s*NAME)/i);
      if (val && val.length >= 2 && !isNoiseWord(val)) {
        result.lastName = val;
      }
    }
  }

  // ── Given Name / First Name ──
  for (let i = 0; i < joinedLines.length; i++) {
    const u = joinedLines[i].upper;
    if (/\bGIVEN\s*NAME\b/.test(u) || /\bFIRST\s*NAME\b/.test(u) || /\bFORENAME\b/.test(u)) {
      const val = extractValueAfterLabel(joinedLines, i, /(?:GIVEN\s*NAME|FIRST\s*NAME|FORENAME)/i);
      if (val && val.length >= 2 && !isNoiseWord(val)) {
        result.firstName = val;
      }
    }
  }

  // ── Passport Number ──
  for (let i = 0; i < joinedLines.length; i++) {
    const u = joinedLines[i].upper;
    if (/\bPASSPORT\s*N(?:O|UMBER)\b/.test(u) || /\bPASSPORT\s*#\b/.test(u)) {
      const val = extractValueAfterLabel(joinedLines, i, /PASSPORT\s*(?:NO|NUMBER|#)/i);
      if (val) {
        const ppMatch = val.match(/([A-Z]{1,2}\d{6,9})/);
        if (ppMatch) result.passportNumber = ppMatch[1];
        else {
          const anyMatch = val.match(/([A-Z0-9]{7,12})/);
          if (anyMatch) result.passportNumber = anyMatch[1];
        }
      }
    }
  }

  // ── Nationality ──
  for (let i = 0; i < joinedLines.length; i++) {
    const u = joinedLines[i].upper;
    if (/\bNATIONALITY\b/.test(u)) {
      const val = extractValueAfterLabel(joinedLines, i, /NATIONALITY/i);
      if (val) {
        if (/BANGLADESH/i.test(val)) result.country = 'BD';
        else result.country = val.trim().substring(0, 20);
      }
    }
  }

  // ── Country Code (for passports that show it as a field) ──
  if (!result.country) {
    for (let i = 0; i < joinedLines.length; i++) {
      const u = joinedLines[i].upper;
      if (/\bCOUNTRY\s*CODE\b/.test(u)) {
        const val = extractValueAfterLabel(joinedLines, i, /COUNTRY\s*CODE/i);
        if (val) {
          const cc = val.replace(/[^A-Z]/g, '').substring(0, 3);
          if (cc.length >= 2) result.country = cc;
        }
      }
    }
  }

  // ── Date of Birth ──
  for (let i = 0; i < joinedLines.length; i++) {
    const u = joinedLines[i].upper;
    if (/\bDATE\s*OF\s*BIRTH\b/.test(u) || /\bD\.?O\.?B\b/.test(u) || /\bBIRTH\s*DATE\b/.test(u)) {
      const val = extractValueAfterLabel(joinedLines, i, /(?:DATE\s*OF\s*BIRTH|D\.?O\.?B|BIRTH\s*DATE)/i);
      if (val) {
        const d = normalizeDate(val);
        if (d) result.birthDate = d;
      }
    }
  }

  // ── Sex / Gender ──
  for (let i = 0; i < joinedLines.length; i++) {
    const u = joinedLines[i].upper;
    if (/\bSEX\b/.test(u) || /\bGENDER\b/.test(u)) {
      const val = extractValueAfterLabel(joinedLines, i, /(?:SEX|GENDER)/i);
      if (val) {
        if (/\bM\b/.test(val) || /\bMALE\b/i.test(val)) { result.gender = 'Male'; result.title = 'MR'; }
        else if (/\bF\b/.test(val) || /\bFEMALE\b/i.test(val)) { result.gender = 'Female'; result.title = 'MS'; }
      }
    }
  }

  // ── Place of Birth ──
  for (let i = 0; i < joinedLines.length; i++) {
    const u = joinedLines[i].upper;
    if (/\bPLACE\s*OF\s*BIRTH\b/.test(u) || /\bBIRTH\s*PLACE\b/.test(u)) {
      const val = extractValueAfterLabel(joinedLines, i, /(?:PLACE\s*OF\s*BIRTH|BIRTH\s*PLACE)/i);
      if (val && val.length >= 2 && !isNoiseWord(val)) {
        result.birthPlace = val;
      }
    }
  }

  // ── Date of Issue ──
  for (let i = 0; i < joinedLines.length; i++) {
    const u = joinedLines[i].upper;
    if (/\bDATE\s*OF\s*ISSUE\b/.test(u) || /\bISSUE\s*DATE\b/.test(u) || /\bISSUANCE\b/.test(u)) {
      const val = extractValueAfterLabel(joinedLines, i, /(?:DATE\s*OF\s*ISSUE|ISSUE\s*DATE|ISSUANCE\s*DATE|ISSUED)/i);
      if (val) {
        const d = normalizeDate(val);
        if (d) result.issuanceDate = d;
      }
    }
  }

  // ── Date of Expiry ──
  for (let i = 0; i < joinedLines.length; i++) {
    const u = joinedLines[i].upper;
    if (/\bDATE\s*OF\s*EXP/i.test(u) || /\bEXPIRY\b/.test(u) || /\bEXPIRATION\b/.test(u)) {
      const val = extractValueAfterLabel(joinedLines, i, /(?:DATE\s*OF\s*EXPIR|EXPIRY|EXPIRATION|EXP\s*DATE)/i);
      if (val) {
        const d = normalizeDate(val);
        if (d) result.expiryDate = d;
      }
    }
  }

  console.log('[OCR] Label parsing done');
  return result;
}

/**
 * Extract the value portion after a label on the same line or the next line.
 * Handles formats like:
 *   "Surname: AKTER"
 *   "Surname\nAKTER"
 *   "বংশগত নাম /Surname\nAKTER"
 */
function extractValueAfterLabel(joinedLines, idx, labelRegex) {
  const line = joinedLines[idx].text;

  // Try same-line: everything after the label
  const match = line.match(labelRegex);
  if (match) {
    let after = line.substring(match.index + match[0].length).replace(/^[\s:\/,]+/, '').trim();
    // Remove Bangla/unicode prefix noise
    after = after.replace(/^[^\x20-\x7E]+\s*/, '').trim();
    if (after.length >= 1 && !/^[\/\s:]+$/.test(after)) {
      return after;
    }
  }

  // Try next line
  if (idx + 1 < joinedLines.length) {
    let nextLine = joinedLines[idx + 1].text.trim();
    // Skip if next line is another label
    if (/\b(SURNAME|GIVEN|PASSPORT|DATE|SEX|PLACE|NATIONALITY|COUNTRY|PERSONAL|PREVIOUS|ISSUING)\b/i.test(nextLine)) {
      return '';
    }
    // Remove Bangla prefix
    nextLine = nextLine.replace(/^[^\x20-\x7E]+\s*/, '').trim();
    if (nextLine.length >= 1) return nextLine;
  }

  return '';
}

// ═══════════════════════════════════════════════════════════════════
// STRATEGY 3: HEURISTIC / CONTEXTUAL PARSING
// Catches fields that labeled parsing missed
// ═══════════════════════════════════════════════════════════════════

function parseHeuristic(lines, upper) {
  const result = emptyResult();

  // ── Passport number pattern: 1-2 letters + 6-9 digits ──
  if (!result.passportNumber) {
    // Look for standalone passport number patterns (not in MRZ)
    for (const line of lines) {
      const u = line.toUpperCase().replace(/\s/g, '');
      // Skip MRZ lines
      if (u.length > 30 && /^[A-Z0-9<]+$/.test(u)) continue;
      // BD format: A12345678, EE0012345
      const ppMatch = line.match(/\b([A-Z]{1,2}\d{7,9})\b/);
      if (ppMatch) {
        result.passportNumber = ppMatch[1];
        break;
      }
    }
  }

  // ── Gender from text ──
  if (!result.gender) {
    // Only match isolated M or F near Sex label context, or MALE/FEMALE words
    if (/\bFEMALE\b/.test(upper)) { result.gender = 'Female'; result.title = 'MS'; }
    else if (/\bMALE\b/.test(upper) && !/FEMALE/.test(upper)) { result.gender = 'Male'; result.title = 'MR'; }
  }

  // ── Birth place: BD district lookup ──
  if (!result.birthPlace) {
    const district = findBDDistrict(upper);
    if (district) result.birthPlace = district;
  }

  // ── Country from "BANGLADESH" or nationality keywords ──
  if (!result.country) {
    if (/BANGLADESH/i.test(upper)) result.country = 'BD';
    else if (/\bINDIA\b/i.test(upper)) result.country = 'IN';
    else if (/\bPAKISTAN\b/i.test(upper)) result.country = 'PK';
    else if (/\bNEPAL\b/i.test(upper)) result.country = 'NP';
  }

  // ── Dates: find all date patterns and assign by context ──
  const allDates = [];
  for (const line of lines) {
    const u = line.toUpperCase();
    // Skip MRZ lines and header
    if (u.replace(/\s/g, '').length > 30 && /^[A-Z0-9<]+$/.test(u.replace(/\s/g, ''))) continue;
    if (/PERSONAL DATA/.test(u) || /EMERGENCY/.test(u)) continue;

    // Find dates: DD MMM YYYY, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const dateRegex = /(\d{1,2})\s*[\/\-\.\s]\s*([A-Z]{3}|\d{1,2})\s*[\/\-\.\s]\s*(\d{4}|\d{2})/gi;
    let m;
    while ((m = dateRegex.exec(line)) !== null) {
      const normalized = normalizeDate(m[0]);
      if (normalized) {
        allDates.push({ raw: m[0], normalized, context: u, pos: m.index });
      }
    }
  }

  // Assign dates by context keywords on the same line
  for (const d of allDates) {
    if (!result.birthDate && /BIRTH/i.test(d.context)) result.birthDate = d.normalized;
    else if (!result.issuanceDate && /ISSUE/i.test(d.context)) result.issuanceDate = d.normalized;
    else if (!result.expiryDate && /EXPIR/i.test(d.context)) result.expiryDate = d.normalized;
  }

  // If still missing, assign by chronological order (DOB < Issue < Expiry)
  const unassigned = allDates.filter(d =>
    d.normalized !== result.birthDate &&
    d.normalized !== result.issuanceDate &&
    d.normalized !== result.expiryDate
  ).map(d => d.normalized).filter(Boolean);

  if (unassigned.length > 0) {
    const sorted = [...new Set(unassigned)].sort();
    if (!result.birthDate && sorted.length >= 1) result.birthDate = sorted[0];
    if (!result.issuanceDate && sorted.length >= 2) result.issuanceDate = sorted[1];
    if (!result.expiryDate && sorted.length >= 3) result.expiryDate = sorted[2];
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function emptyResult() {
  return {
    title: '', firstName: '', lastName: '', country: '',
    passportNumber: '', birthDate: '', birthPlace: '',
    gender: '', issuanceDate: '', expiryDate: '',
  };
}

/** Pick the best non-empty value, with field-specific validation */
function pickBest(field, mrzVal, labelVal, heuristicVal) {
  // For passport number: prefer label > MRZ (MRZ can have OCR artifacts)
  if (field === 'passportNumber') {
    const lv = (labelVal || '').trim();
    const mv = (mrzVal || '').trim();
    const hv = (heuristicVal || '').trim();
    // Prefer the one that matches passport format best
    const isValidPP = (v) => /^[A-Z]{1,2}\d{6,9}$/.test(v);
    if (isValidPP(lv)) return lv;
    if (isValidPP(mv)) return mv;
    if (isValidPP(hv)) return hv;
    return mv || lv || hv || '';
  }

  // For names: prefer labeled extraction (more contextual)
  if (field === 'firstName' || field === 'lastName') {
    const lv = (labelVal || '').trim();
    const mv = (mrzVal || '').trim();
    // If label value is clean (no garbage), prefer it
    if (lv && lv.length >= 2 && lv.length < 30 && /^[A-Z\s]+$/i.test(lv)) return lv;
    if (mv && mv.length >= 2) return mv;
    return lv || mv || (heuristicVal || '').trim() || '';
  }

  // For dates: prefer labeled extraction
  if (field.includes('Date')) {
    const lv = (labelVal || '').trim();
    const mv = (mrzVal || '').trim();
    const hv = (heuristicVal || '').trim();
    if (lv && /^\d{4}-\d{2}-\d{2}$/.test(lv)) return lv;
    if (mv && /^\d{4}-\d{2}-\d{2}$/.test(mv)) return mv;
    if (hv && /^\d{4}-\d{2}-\d{2}$/.test(hv)) return hv;
    return lv || mv || hv || '';
  }

  // Default: MRZ > Label > Heuristic
  return (mrzVal || '').trim() || (labelVal || '').trim() || (heuristicVal || '').trim() || '';
}

/** Normalize date to YYYY-MM-DD */
function normalizeDate(dateStr) {
  if (!dateStr) return '';
  const months = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };

  // DD MMM YYYY (e.g., "20 DEC 1993", "01 OCT 2023")
  const mmmMatch = dateStr.match(/(\d{1,2})\s*[\/\-\.\s]\s*([A-Z]{3})\s*[\/\-\.\s]\s*(\d{2,4})/i);
  if (mmmMatch) {
    const dd = mmmMatch[1].padStart(2, '0');
    const mm = months[mmmMatch[2].toUpperCase()] || '01';
    let yyyy = mmmMatch[3];
    if (yyyy.length === 2) yyyy = parseInt(yyyy) > 50 ? '19' + yyyy : '20' + yyyy;
    return `${yyyy}-${mm}-${dd}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
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

/** Validate a date string is reasonable */
function validateDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return '';
  return dateStr;
}

/** Clean passport number: remove noise, validate format */
function cleanPassportNumber(pp) {
  if (!pp) return '';
  pp = pp.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  // Must be 7-12 alphanumeric chars, starting with letter(s)
  if (/^[A-Z]{1,2}\d{6,10}$/.test(pp)) return pp;
  // Allow all-alphanumeric if length is right
  if (pp.length >= 7 && pp.length <= 12) return pp;
  return pp;
}

/** Clean a name field: remove noise, digits, excessive length */
function cleanName(name) {
  if (!name) return '';
  // Remove digits and special chars except spaces
  name = name.replace(/[^A-Za-z\s]/g, '').trim();
  // Remove single-char noise at start
  name = name.replace(/^[A-Z]\s+(?=[A-Z]{2})/i, '');
  // Remove known noise words
  const noiseWords = ['PERSONAL', 'DATA', 'EMERGENCY', 'CONTACT', 'PASSPORT', 'REPUBLIC', 'BANGLADESH', 'PEOPLES', 'TYPE', 'CODE', 'COUNTRY', 'NUMBER'];
  const words = name.split(/\s+/).filter(w => !noiseWords.includes(w.toUpperCase()));
  name = words.join(' ').trim();
  // Limit to 40 chars
  if (name.length > 40) name = name.substring(0, 40).trim();
  return name;
}

/** Clean birth place */
function cleanBirthPlace(place) {
  if (!place) return '';
  place = place.replace(/[^A-Za-z\s,]/g, '').trim();
  // Remove noise
  const noise = ['PERSONAL', 'DATA', 'EMERGENCY', 'CONTACT', 'PASSPORT', 'REPUBLIC', 'BANGLADESH', 'SEX'];
  const words = place.split(/\s+/).filter(w => !noise.includes(w.toUpperCase()));
  place = words.join(' ').trim();
  if (place.length > 30) place = place.substring(0, 30).trim();
  // Title case
  if (place.length >= 2) {
    place = place.charAt(0).toUpperCase() + place.slice(1).toLowerCase();
  }
  return place;
}

/** Normalize country code */
function normalizeCountry(country) {
  if (!country) return '';
  country = country.replace(/[^A-Z]/gi, '').toUpperCase();
  const map = {
    BGD: 'BD', BANGLADESH: 'BD', BANGLADESHI: 'BD',
    IND: 'IN', INDIA: 'IN', INDIAN: 'IN',
    USA: 'US', GBR: 'GB', PAK: 'PK', PAKISTAN: 'PK',
    NPL: 'NP', NEPAL: 'NP', LKA: 'LK', MMR: 'MM',
    MYS: 'MY', SGP: 'SG', ARE: 'AE', SAU: 'SA',
    KWT: 'KW', QAT: 'QA', BHR: 'BH', OMN: 'OM',
    CAN: 'CA', AUS: 'AU', JPN: 'JP', KOR: 'KR',
    CHN: 'CN', THA: 'TH', IDN: 'ID', PHL: 'PH',
  };
  return map[country] || (country.length === 2 ? country : country.substring(0, 2));
}

/** Check if a word is noise (header text, labels) */
function isNoiseWord(text) {
  if (!text) return true;
  const upper = text.toUpperCase();
  const noisePatterns = [
    'PERSONAL DATA', 'EMERGENCY CONTACT', 'PASSPORT', 'REPUBLIC',
    'BANGLADESH', 'PEOPLE', 'GOVERNMENT', 'TYPE', 'COUNTRY CODE',
    'MACHINE READABLE', 'TRAVEL DOCUMENT',
  ];
  return noisePatterns.some(p => upper.includes(p));
}

/** Find a BD district name in OCR text */
function findBDDistrict(upperText) {
  const bdDistricts = [
    'CHATTOGRAM', 'CHITTAGONG', 'DHAKA', 'RAJSHAHI', 'KHULNA', 'BARISAL',
    'SYLHET', 'RANGPUR', 'MYMENSINGH', 'COMILLA', 'GAZIPUR', 'NARAYANGANJ',
    'FENI', 'NOAKHALI', 'LAKSHMIPUR', 'CHANDPUR', 'BRAHMANBARIA', 'KISHOREGANJ',
    'HABIGANJ', 'MOULVIBAZAR', 'SUNAMGANJ', 'COXS BAZAR', "COX'S BAZAR",
    'BARGUNA', 'PATUAKHALI', 'PIROJPUR', 'JHALOKATHI', 'BHOLA',
    'JESSORE', 'NARAIL', 'BOGURA', 'DINAJPUR', 'TANGAIL', 'FARIDPUR',
    'MUNSHIGANJ', 'MADARIPUR', 'GOPALGANJ', 'SHARIATPUR', 'MANIKGANJ',
    'NARSINGDI', 'SHERPUR', 'NETROKONA', 'JAMALPUR',
    'PABNA', 'SIRAJGANJ', 'NATORE', 'CHAPAINAWABGANJ', 'NAOGAON',
    'JOYPURHAT', 'GAIBANDHA', 'KURIGRAM', 'LALMONIRHAT', 'NILPHAMARI',
    'THAKURGAON', 'PANCHAGARH', 'SATKHIRA', 'BAGERHAT', 'MAGURA',
    'MEHERPUR', 'CHUADANGA', 'KUSHTIA', 'JHENAIDAH',
    'BANDARBAN', 'RANGAMATI', 'KHAGRACHARI',
    'CUMILLA', 'BARISHAL',
  ];

  // Check in context of "Place of Birth" or "Birth Place" first
  const birthContext = upperText.match(/(?:PLACE\s*OF\s*BIRTH|BIRTH\s*PLACE)[^A-Z]*([A-Z\s,]{3,30})/i);
  if (birthContext) {
    const contextText = birthContext[1];
    for (const d of bdDistricts) {
      if (contextText.includes(d)) {
        return d.charAt(0) + d.slice(1).toLowerCase();
      }
    }
  }

  // Fallback: find any district in text (with word boundaries to avoid false matches)
  for (const d of bdDistricts) {
    const regex = new RegExp(`\\b${d.replace(/['\s]/g, '[\\s\']?')}\\b`, 'i');
    if (regex.test(upperText)) {
      return d.charAt(0) + d.slice(1).toLowerCase();
    }
  }

  return '';
}

module.exports = router;
