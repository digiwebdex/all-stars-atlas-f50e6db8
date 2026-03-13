// Combined routes for: holidays, visa, medical, cars, esim, recharge, paybill, contact
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { notifyBookingConfirm, notifyContactSubmission } = require('../services/notify');
const { safeJsonParse } = require('../utils/json');
const { getCountries: airaloCountries, getPackages: airaloPackages, placeOrder: airaloOrder, getAiraloConfig } = require('./airalo');
const { submitRecharge: sslRecharge, getRechargeConfig } = require('./ssl-recharge');
const { submitBillPayment: sslBillPay, getBillPayConfig } = require('./ssl-recharge');

const router = express.Router();

// ============ HOLIDAYS ============

router.get('/holidays/search', async (req, res) => {
  try {
    const { destination, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM holiday_packages WHERE available = 1';
    const params = [];
    if (destination) { sql += ' AND destination LIKE ?'; params.push(`%${destination}%`); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (minPrice) { sql += ' AND price >= ?'; params.push(parseFloat(minPrice)); }
    if (maxPrice) { sql += ' AND price <= ?'; params.push(parseFloat(maxPrice)); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    sql += ` ORDER BY rating DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);

    const data = rows.map(r => ({
      id: r.id, title: r.title, destination: r.destination, country: r.country,
      duration: r.duration, price: parseFloat(r.price), currency: r.currency,
      discountPct: r.discount_pct, images: safeJsonParse(r.images, []),
      highlights: safeJsonParse(r.highlights, []), category: r.category,
      rating: r.rating ? parseFloat(r.rating) : null, reviewCount: r.review_count,
    }));
    res.json({ data, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / parseInt(limit)) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

router.get('/holidays/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM holiday_packages WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Package not found', status: 404 });
    const r = rows[0];
    res.json({
      id: r.id, title: r.title, destination: r.destination, country: r.country,
      duration: r.duration, price: parseFloat(r.price), currency: r.currency,
      discountPct: r.discount_pct, images: safeJsonParse(r.images, []),
      highlights: safeJsonParse(r.highlights, []), itinerary: safeJsonParse(r.itinerary, []),
      inclusions: safeJsonParse(r.inclusions, []), exclusions: safeJsonParse(r.exclusions, []),
      category: r.category, rating: r.rating ? parseFloat(r.rating) : null, reviewCount: r.review_count,
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

router.post('/holidays/book', authenticate, async (req, res) => {
  try {
    const { packageId, travellers, contactInfo, paymentMethod } = req.body;
    const bookingId = uuidv4();
    const bookingRef = `HP${String(Date.now()).slice(-8)}`;
    const [pkgs] = await db.query('SELECT * FROM holiday_packages WHERE id = ?', [packageId]);
    const totalAmount = pkgs.length > 0 ? parseFloat(pkgs[0].price) * (travellers?.length || 1) : 0;

    await db.query(
      `INSERT INTO bookings (id, user_id, booking_type, booking_ref, status, total_amount, payment_method, payment_status, details, passenger_info, contact_info) VALUES (?, ?, 'holiday', ?, 'confirmed', ?, ?, 'paid', ?, ?, ?)`,
      [bookingId, req.user.sub, bookingRef, totalAmount, paymentMethod || 'card', JSON.stringify(pkgs[0] || {}), JSON.stringify(travellers || []), JSON.stringify(contactInfo || {})]
    );
    await db.query(`INSERT INTO transactions (id, user_id, booking_id, type, amount, status, payment_method, reference, description) VALUES (?, ?, ?, 'payment', ?, 'completed', ?, ?, ?)`,
      [uuidv4(), req.user.sub, bookingId, totalAmount, paymentMethod || 'card', bookingRef, `Holiday package: ${pkgs[0]?.title || ''}`]);

    // Notify user + admin
    notifyBookingConfirm(req.user.sub, { bookingRef, type: 'Holiday Package', amount: totalAmount }).catch(console.error);

    res.status(201).json({ id: bookingId, bookingRef, status: 'confirmed', totalAmount, currency: 'BDT', bookingType: 'holiday', createdAt: new Date().toISOString() });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// ============ VISA — moved to visa.js ============


// ============ MEDICAL ============

router.get('/medical/hospitals', async (req, res) => {
  try {
    const { country, specialty, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM medical_hospitals WHERE available = 1';
    const params = [];
    if (country) { sql += ' AND country LIKE ?'; params.push(`%${country}%`); }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    sql += ` LIMIT ? OFFSET ?`; params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);
    const data = rows.map(r => ({
      id: r.id, name: r.name, city: r.city, country: r.country,
      specialties: safeJsonParse(r.specialties, []), accreditations: safeJsonParse(r.accreditations, []),
      rating: r.rating ? parseFloat(r.rating) : null, priceRange: r.price_range, description: r.description,
      images: safeJsonParse(r.images, []), contact: safeJsonParse(r.contact, {}),
    }));
    res.json({ data, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / parseInt(limit)) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

router.get('/medical/search', async (req, res) => {
  try {
    const { treatment, country, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM medical_hospitals WHERE available = 1';
    const params = [];
    if (country) { sql += ' AND country LIKE ?'; params.push(`%${country}%`); }
    if (treatment) { sql += ' AND specialties LIKE ?'; params.push(`%${treatment}%`); }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    sql += ` LIMIT ? OFFSET ?`; params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);
    const data = rows.map(r => ({
      id: r.id, name: r.name, city: r.city, country: r.country,
      specialties: safeJsonParse(r.specialties, []), accreditations: safeJsonParse(r.accreditations, []),
      rating: r.rating ? parseFloat(r.rating) : null, priceRange: r.price_range, description: r.description, images: safeJsonParse(r.images, []),
    }));
    res.json({ data, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / parseInt(limit)) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

router.post('/medical/book', authenticate, async (req, res) => {
  try {
    const { hospitalId, treatmentType, patientInfo, contactInfo, paymentMethod } = req.body;
    const bookingId = uuidv4();
    const bookingRef = `MD${String(Date.now()).slice(-8)}`;
    await db.query(
      `INSERT INTO bookings (id, user_id, booking_type, booking_ref, status, total_amount, payment_method, payment_status, details, passenger_info, contact_info) VALUES (?, ?, 'medical', ?, 'confirmed', 0, ?, 'paid', ?, ?, ?)`,
      [bookingId, req.user.sub, bookingRef, paymentMethod || 'card', JSON.stringify({ hospitalId, treatmentType }), JSON.stringify(patientInfo || {}), JSON.stringify(contactInfo || {})]
    );
    notifyBookingConfirm(req.user.sub, { bookingRef, type: 'Medical', amount: 0 }).catch(console.error);
    res.status(201).json({ id: bookingId, bookingRef, status: 'confirmed', bookingType: 'medical', createdAt: new Date().toISOString() });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// ============ CARS ============

router.get('/cars/search', async (req, res) => {
  try {
    const { city, type, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM cars WHERE available = 1';
    const params = [];
    if (city) { sql += ' AND city LIKE ?'; params.push(`%${city}%`); }
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (minPrice) { sql += ' AND price_per_day >= ?'; params.push(parseFloat(minPrice)); }
    if (maxPrice) { sql += ' AND price_per_day <= ?'; params.push(parseFloat(maxPrice)); }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    sql += ` LIMIT ? OFFSET ?`; params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);
    const data = rows.map(r => ({
      id: r.id, name: r.name, type: r.type, brand: r.brand, model: r.model, year: r.year,
      seats: r.seats, transmission: r.transmission, fuelType: r.fuel_type,
      pricePerDay: parseFloat(r.price_per_day), currency: r.currency,
      images: safeJsonParse(r.images, []), features: safeJsonParse(r.features, []), city: r.city,
    }));
    res.json({ data, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / parseInt(limit)) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

router.get('/cars/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Car not found', status: 404 });
    const r = rows[0];
    res.json({
      id: r.id, name: r.name, type: r.type, brand: r.brand, model: r.model, year: r.year,
      seats: r.seats, transmission: r.transmission, fuelType: r.fuel_type,
      pricePerDay: parseFloat(r.price_per_day), currency: r.currency,
      images: safeJsonParse(r.images, []), features: safeJsonParse(r.features, []), city: r.city,
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

router.post('/cars/book', authenticate, async (req, res) => {
  try {
    const { carId, pickupDate, returnDate, driverInfo, contactInfo, paymentMethod } = req.body;
    const bookingId = uuidv4();
    const bookingRef = `CR${String(Date.now()).slice(-8)}`;
    const [cars] = await db.query('SELECT * FROM cars WHERE id = ?', [carId]);
    const days = pickupDate && returnDate ? Math.max(1, Math.ceil((new Date(returnDate) - new Date(pickupDate)) / 86400000)) : 1;
    const totalAmount = cars.length > 0 ? parseFloat(cars[0].price_per_day) * days : 0;

    await db.query(
      `INSERT INTO bookings (id, user_id, booking_type, booking_ref, status, total_amount, payment_method, payment_status, details, passenger_info, contact_info) VALUES (?, ?, 'car', ?, 'confirmed', ?, ?, 'paid', ?, ?, ?)`,
      [bookingId, req.user.sub, bookingRef, totalAmount, paymentMethod || 'card', JSON.stringify({ car: cars[0]?.name, pickupDate, returnDate }), JSON.stringify(driverInfo || {}), JSON.stringify(contactInfo || {})]
    );
    notifyBookingConfirm(req.user.sub, { bookingRef, type: 'Car Rental', amount: totalAmount }).catch(console.error);
    res.status(201).json({ id: bookingId, bookingRef, status: 'confirmed', totalAmount, currency: 'BDT', bookingType: 'car', createdAt: new Date().toISOString() });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// ============ eSIM ============

router.get('/esim/plans', async (req, res) => {
  try {
    const { country, page = 1, limit = 20 } = req.query;

    // Try Airalo API first
    const airaloConfig = await getAiraloConfig();
    if (airaloConfig && country) {
      try {
        const packages = await airaloPackages(country.toLowerCase());
        if (packages.length > 0) {
          return res.json({ data: packages, total: packages.length, page: 1, limit: 50, totalPages: 1, source: 'airalo' });
        }
      } catch (err) { console.error('Airalo fetch failed, falling back to DB:', err.message); }
    }

    // Fallback to DB
    let sql = 'SELECT * FROM esim_plans WHERE available = 1';
    const params = [];
    if (country) { sql += ' AND country LIKE ?'; params.push(`%${country}%`); }
    const [rows] = await db.query(sql, params);
    const data = rows.map(r => ({
      id: r.id, country: r.country, region: r.region, dataAmount: r.data_amount,
      duration: r.duration, price: parseFloat(r.price), currency: r.currency,
      provider: r.provider, features: safeJsonParse(r.features, []),
    }));
    res.json({ data, total: data.length, page: 1, limit: 50, totalPages: 1, source: 'db' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

router.post('/esim/purchase', authenticate, async (req, res) => {
  try {
    const { planId, email, paymentMethod } = req.body;
    const txnId = uuidv4();
    const [plans] = await db.query('SELECT * FROM esim_plans WHERE id = ?', [planId]);
    const amount = plans.length > 0 ? parseFloat(plans[0].price) : 0;

    await db.query(
      `INSERT INTO transactions (id, user_id, type, amount, status, payment_method, description) VALUES (?, ?, 'esim_purchase', ?, 'completed', ?, ?)`,
      [txnId, req.user.sub, amount, paymentMethod || 'bkash', `eSIM purchase: ${plans[0]?.country || ''} ${plans[0]?.data_amount || ''}`]
    );
    res.status(201).json({ id: uuidv4(), qrCode: 'https://placehold.co/300x300?text=eSIM+QR', activationCode: 'LPA:1$example.com$ABCD1234', instructions: 'Go to Settings > Cellular > Add eSIM > Scan QR Code', transactionId: txnId });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// ============ RECHARGE ============

router.get('/recharge/operators', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM recharge_operators WHERE active = 1');
    res.json({ data: rows.map(r => ({ id: r.id, name: r.name, logo: r.logo, type: r.type })) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

router.post('/recharge/submit', authenticate, async (req, res) => {
  try {
    const { operator, phoneNumber, number, amount, type, paymentMethod } = req.body;
    const phone = phoneNumber || number || '';
    const txnId = uuidv4();

    // Try SSL Wireless API first
    const rechargeConf = await getRechargeConfig();
    let apiResult = null;
    if (rechargeConf) {
      try {
        apiResult = await sslRecharge({ operator, phoneNumber: phone, amount, type });
      } catch (err) { console.error('SSL Recharge API failed:', err.message); }
    }

    await db.query(
      `INSERT INTO transactions (id, user_id, type, amount, status, payment_method, description, meta) VALUES (?, ?, 'recharge', ?, 'completed', ?, ?, ?)`,
      [txnId, req.user.sub, amount || 0, paymentMethod || 'bkash', `Recharge ৳${amount} to ${phone}`, JSON.stringify({ operator, phoneNumber: phone, rechargeType: type, provider: apiResult?.provider || 'local', apiTxnId: apiResult?.transactionId })]
    );
    res.status(201).json({ id: uuidv4(), status: 'completed', transactionId: txnId, provider: apiResult?.provider || 'local', message: apiResult?.message || `Recharge of ৳${amount} to ${phone} successful` });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// ============ PAY BILL ============

router.get('/paybill/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bill_categories WHERE active = 1');
    const data = rows.map(r => ({
      id: r.id, name: r.name, icon: r.icon, billers: safeJsonParse(r.billers, []),
    }));
    res.json({ data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

router.get('/paybill/billers', async (req, res) => {
  try {
    const { category } = req.query;
    const [rows] = await db.query('SELECT billers FROM bill_categories WHERE name LIKE ? AND active = 1', [`%${category || ''}%`]);
    const billers = rows.length > 0 ? safeJsonParse(rows[0].billers, []) : [];
    res.json({ data: billers });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

router.post('/paybill/submit', authenticate, async (req, res) => {
  try {
    const { billerId, accountNumber, amount, paymentMethod, month } = req.body;
    const txnId = uuidv4();
    await db.query(
      `INSERT INTO transactions (id, user_id, type, amount, status, payment_method, description, meta) VALUES (?, ?, 'bill_payment', ?, 'completed', ?, ?, ?)`,
      [txnId, req.user.sub, amount || 0, paymentMethod || 'bkash', `Bill payment ৳${amount} to ${billerId}`, JSON.stringify({ billerId, accountNumber, month })]
    );
    res.status(201).json({ id: uuidv4(), status: 'completed', transactionId: txnId, message: `Bill payment of ৳${amount} successful` });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// ============ CONTACT ============

router.post('/contact/submit', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required', status: 400 });
    }
    const id = uuidv4();
    await db.query(
      `INSERT INTO contact_submissions (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)`,
      [id, name, email, subject || '', message]
    );
    // Auto-reply email + notify admin
    notifyContactSubmission(name, email).catch(console.error);

    res.status(201).json({ id, message: "Thank you! We'll get back to you within 24 hours." });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// Newsletter subscribe — stores in contact_submissions with subject 'newsletter'
router.post('/contact/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required', status: 400 });
    const id = uuidv4();
    await db.query(
      `INSERT INTO contact_submissions (id, name, email, subject, message) VALUES (?, ?, ?, 'newsletter', 'Newsletter subscription')`,
      [id, 'Subscriber', email]
    );
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

module.exports = router;
