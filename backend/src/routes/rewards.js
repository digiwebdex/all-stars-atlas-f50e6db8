/**
 * Reward Points API Routes
 * Handles points balance, earning, redemption, and coupon management
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');

// ── Helper: ensure user_points row exists ──
async function ensurePointsAccount(userId) {
  await db.query(
    'INSERT IGNORE INTO user_points (user_id, balance, total_earned, total_redeemed) VALUES (?, 0, 0, 0)',
    [userId]
  );
}

// ── GET /rewards/balance — Current points balance ──
router.get('/balance', authenticate, async (req, res) => {
  try {
    await ensurePointsAccount(req.user.id);
    const [rows] = await db.query(
      'SELECT balance, total_earned, total_redeemed FROM user_points WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ balance: rows[0]?.balance || 0, totalEarned: rows[0]?.total_earned || 0, totalRedeemed: rows[0]?.total_redeemed || 0 });
  } catch (err) {
    console.error('[Rewards] Balance error:', err.message);
    res.status(500).json({ message: 'Failed to fetch points balance' });
  }
});

// ── GET /rewards/history — Points transaction history ──
router.get('/history', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT pt.*, b.booking_ref FROM point_transactions pt
       LEFT JOIN bookings b ON pt.booking_id = b.id
       WHERE pt.user_id = ? ORDER BY pt.created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM point_transactions WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ data: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Rewards] History error:', err.message);
    res.status(500).json({ message: 'Failed to fetch points history' });
  }
});

// ── GET /rewards/coupons — User's coupons ──
router.get('/coupons', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM reward_coupons WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('[Rewards] Coupons error:', err.message);
    res.status(500).json({ message: 'Failed to fetch coupons' });
  }
});

// ── POST /rewards/redeem — Generate a coupon from points ──
router.post('/redeem', authenticate, async (req, res) => {
  const { points } = req.body;
  if (!points || points <= 0) return res.status(400).json({ message: 'Invalid points amount' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await ensurePointsAccount(req.user.id);

    // Lock and check balance
    const [[acct]] = await conn.query(
      'SELECT balance FROM user_points WHERE user_id = ? FOR UPDATE',
      [req.user.id]
    );
    if (!acct || acct.balance < points) {
      await conn.rollback();
      return res.status(400).json({ message: 'Insufficient points balance' });
    }

    // Generate unique coupon code
    const code = 'ST' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const amount = points; // 1 point = 1 BDT
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    // Create coupon
    const [couponResult] = await conn.query(
      'INSERT INTO reward_coupons (user_id, code, amount, points_used, expires_at) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, code, amount, points, expiresAt]
    );

    // Deduct points
    await conn.query(
      'UPDATE user_points SET balance = balance - ?, total_redeemed = total_redeemed + ? WHERE user_id = ?',
      [points, points, req.user.id]
    );

    // Log transaction
    await conn.query(
      'INSERT INTO point_transactions (user_id, type, amount, description, coupon_id) VALUES (?, "redeem", ?, ?, ?)',
      [req.user.id, -points, `Redeemed ${points} points for coupon ${code}`, couponResult.insertId]
    );

    await conn.commit();
    res.json({ code, amount, expiresAt, message: `Coupon ${code} created worth BDT ${amount}` });
  } catch (err) {
    await conn.rollback();
    console.error('[Rewards] Redeem error:', err.message);
    res.status(500).json({ message: 'Failed to redeem points' });
  } finally {
    conn.release();
  }
});

// ── POST /rewards/validate-coupon — Validate coupon during checkout ──
router.post('/validate-coupon', authenticate, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Coupon code required' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM reward_coupons WHERE code = ? AND user_id = ? AND status = "active"',
      [code.toUpperCase().trim(), req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Invalid or expired coupon' });

    const coupon = rows[0];
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      await db.query('UPDATE reward_coupons SET status = "expired" WHERE id = ?', [coupon.id]);
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    res.json({ valid: true, amount: coupon.amount, code: coupon.code });
  } catch (err) {
    console.error('[Rewards] Validate coupon error:', err.message);
    res.status(500).json({ message: 'Failed to validate coupon' });
  }
});

// ── POST /rewards/apply-coupon — Apply coupon to a booking ──
router.post('/apply-coupon', authenticate, async (req, res) => {
  const { code, bookingId } = req.body;
  if (!code || !bookingId) return res.status(400).json({ message: 'Code and bookingId required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[coupon]] = await conn.query(
      'SELECT * FROM reward_coupons WHERE code = ? AND user_id = ? AND status = "active" FOR UPDATE',
      [code.toUpperCase().trim(), req.user.id]
    );
    if (!coupon) { await conn.rollback(); return res.status(404).json({ message: 'Invalid coupon' }); }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      await conn.query('UPDATE reward_coupons SET status = "expired" WHERE id = ?', [coupon.id]);
      await conn.rollback();
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    // Mark coupon as used
    await conn.query(
      'UPDATE reward_coupons SET status = "used", used_booking_id = ?, used_at = NOW() WHERE id = ?',
      [bookingId, coupon.id]
    );

    await conn.commit();
    res.json({ applied: true, discount: coupon.amount, message: `Coupon applied: BDT ${coupon.amount} discount` });
  } catch (err) {
    await conn.rollback();
    console.error('[Rewards] Apply coupon error:', err.message);
    res.status(500).json({ message: 'Failed to apply coupon' });
  } finally {
    conn.release();
  }
});

// ── Internal: Award points after a booking is confirmed ──
// Called from booking routes, not directly from client
async function awardBookingPoints(userId, bookingId, fareAmount, serviceType = 'flight') {
  try {
    await ensurePointsAccount(userId);

    // Get earn rate from rules
    const [rules] = await db.query(
      'SELECT earn_rate, max_points_per_booking FROM points_rules WHERE service_type = ? AND is_active = 1',
      [serviceType]
    );
    const rate = rules.length > 0 ? parseFloat(rules[0].earn_rate) : 0.01;
    const maxPts = rules.length > 0 ? rules[0].max_points_per_booking : null;

    let points = Math.round(fareAmount * rate);
    if (maxPts && points > maxPts) points = maxPts;
    if (points <= 0) return 0;

    // Add points
    await db.query(
      'UPDATE user_points SET balance = balance + ?, total_earned = total_earned + ? WHERE user_id = ?',
      [points, points, userId]
    );

    // Log transaction
    await db.query(
      'INSERT INTO point_transactions (user_id, type, amount, description, booking_id) VALUES (?, "earn", ?, ?, ?)',
      [userId, points, `Earned ${points} points from ${serviceType} booking`, bookingId]
    );

    console.log(`[Rewards] Awarded ${points} points to user ${userId} for booking ${bookingId}`);
    return points;
  } catch (err) {
    console.error('[Rewards] Award points error:', err.message);
    return 0;
  }
}

// ── GET /rewards/earn-rate — Get earning rate for display ──
router.get('/earn-rate', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT service_type, earn_rate FROM points_rules WHERE is_active = 1');
    const rates = {};
    for (const r of rows) rates[r.service_type] = parseFloat(r.earn_rate);
    res.json({ rates, conversionRate: 1 }); // 1 point = 1 BDT
  } catch (err) {
    res.json({ rates: { flight: 0.01 }, conversionRate: 1 });
  }
});

module.exports = router;
module.exports.awardBookingPoints = awardBookingPoints;
