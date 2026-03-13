const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { notifyBookingConfirm } = require('../services/notify');
const { safeJsonParse } = require('../utils/json');
const { searchHotels: hbSearch, getHotelBedsConfig } = require('./hotelbeds');

const router = express.Router();

// GET /hotels/search — Multi-provider: DB + HotelBeds
router.get('/search', async (req, res) => {
  try {
    const { city, checkIn, checkOut, minPrice, maxPrice, starRating, adults, children, rooms, page = 1, limit = 20 } = req.query;

    // DB search
    let sql = 'SELECT * FROM hotels WHERE available = 1';
    const params = [];
    if (city) { sql += ' AND city LIKE ?'; params.push(`%${city}%`); }
    if (minPrice) { sql += ' AND price_per_night >= ?'; params.push(parseFloat(minPrice)); }
    if (maxPrice) { sql += ' AND price_per_night <= ?'; params.push(parseFloat(maxPrice)); }
    if (starRating) { sql += ' AND star_rating >= ?'; params.push(parseInt(starRating)); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    sql += ` ORDER BY user_rating DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(sql, params);
    const dbData = rows.map(r => ({
      id: r.id, source: 'db', name: r.name, city: r.city, country: r.country, address: r.address,
      starRating: r.star_rating, userRating: r.user_rating ? parseFloat(r.user_rating) : null,
      reviewCount: r.review_count, pricePerNight: parseFloat(r.price_per_night), currency: r.currency,
      images: safeJsonParse(r.images, []), amenities: safeJsonParse(r.amenities, []), description: r.description,
    }));

    // HotelBeds search (parallel, non-blocking)
    let hbData = [];
    try {
      if (city && checkIn && checkOut) {
        hbData = await hbSearch({ city, checkIn, checkOut, adults: adults || 2, children: children || 0, rooms: rooms || 1, minRate: minPrice, maxRate: maxPrice, minStars: starRating });
        hbData = hbData.map(h => ({ ...h, pricePerNight: h.pricePerNight, source: 'hotelbeds' }));
      }
    } catch (err) {
      console.error('HotelBeds search failed (continuing with DB):', err.message);
    }

    const allHotels = [...dbData, ...hbData];
    const total = countResult[0].total + hbData.length;

    res.json({ data: allHotels, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)), sources: { db: dbData.length, hotelbeds: hbData.length } });
  } catch (err) {
    console.error('Hotel search error:', err);
    res.status(500).json({ message: 'Something went wrong', status: 500 });
  }
});

// GET /hotels/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM hotels WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Hotel not found', status: 404 });
    const r = rows[0];
    res.json({
      id: r.id, name: r.name, city: r.city, country: r.country, address: r.address,
      starRating: r.star_rating, userRating: r.user_rating ? parseFloat(r.user_rating) : null,
      reviewCount: r.review_count, pricePerNight: parseFloat(r.price_per_night), currency: r.currency,
      images: safeJsonParse(r.images, []), amenities: safeJsonParse(r.amenities, []),
      description: r.description, latitude: r.latitude, longitude: r.longitude,
    });
  } catch (err) {
    console.error('Hotel detail error:', err);
    res.status(500).json({ message: 'Something went wrong', status: 500 });
  }
});

// POST /hotels/book
router.post('/book', authenticate, async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, rooms, guests, contactInfo, paymentMethod } = req.body;
    const bookingId = uuidv4();
    const bookingRef = `HT${String(Date.now()).slice(-8)}`;

    const [hotels] = await db.query('SELECT * FROM hotels WHERE id = ?', [hotelId]);
    const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)) : 1;
    const totalAmount = hotels.length > 0 ? parseFloat(hotels[0].price_per_night) * nights * (rooms || 1) : 0;

    await db.query(
      `INSERT INTO bookings (id, user_id, booking_type, booking_ref, status, total_amount, payment_method, payment_status, details, passenger_info, contact_info)
       VALUES (?, ?, 'hotel', ?, 'confirmed', ?, ?, 'paid', ?, ?, ?)`,
      [bookingId, req.user.sub, bookingRef, totalAmount, paymentMethod || 'card',
       JSON.stringify({ hotel: hotels[0]?.name, checkIn, checkOut, rooms }), JSON.stringify(guests || []), JSON.stringify(contactInfo || {})]
    );

    await db.query(
      `INSERT INTO transactions (id, user_id, booking_id, type, amount, status, payment_method, reference, description)
       VALUES (?, ?, ?, 'payment', ?, 'completed', ?, ?, ?)`,
      [uuidv4(), req.user.sub, bookingId, totalAmount, paymentMethod || 'card', bookingRef, `Hotel booking at ${hotels[0]?.name || 'Hotel'}`]
    );

    notifyBookingConfirm(req.user.sub, { bookingRef, type: 'Hotel', amount: totalAmount }).catch(console.error);
    res.status(201).json({ id: bookingId, bookingRef, status: 'confirmed', totalAmount, currency: 'BDT', bookingType: 'hotel', createdAt: new Date().toISOString() });
  } catch (err) {
    console.error('Hotel booking error:', err);
    res.status(500).json({ message: 'Something went wrong', status: 500 });
  }
});

module.exports = router;
