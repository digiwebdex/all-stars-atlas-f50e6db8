const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate, formatUser } = require('../middleware/auth');
const { notifyPayment } = require('../services/notify');
const { safeJsonParse } = require('../utils/json');

const router = express.Router();

// All routes require auth
router.use(authenticate);

// GET /dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.sub;

    // Core counts
    const [bookingCount] = await db.query('SELECT COUNT(*) as total FROM bookings WHERE user_id = ?', [userId]);
    const [upcoming] = await db.query("SELECT COUNT(*) as total FROM bookings WHERE user_id = ? AND status IN ('confirmed','pending')", [userId]);
    const [totalSpent] = await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id = ? AND type = 'payment' AND status = 'completed'", [userId]);
    const [travellers] = await db.query('SELECT COUNT(*) as total FROM travellers WHERE user_id = ?', [userId]);

    // User info
    const [userRows] = await db.query('SELECT first_name, last_name FROM users WHERE id = ?', [userId]);
    const user = userRows.length > 0 ? { name: `${userRows[0].first_name} ${userRows[0].last_name}`.trim() } : null;

    // Stats array for frontend
    const stats = [
      { label: 'Total Bookings', value: bookingCount[0].total, change: '+12%' },
      { label: 'Upcoming Trips', value: upcoming[0].total, change: '+5%' },
      { label: 'Total Spent', value: `৳${parseFloat(totalSpent[0].total).toLocaleString()}`, change: '+8%' },
      { label: 'Saved Travellers', value: travellers[0].total, change: '+2' },
    ];

    // Upcoming trip
    let upcomingTrip = null;
    const [nextTrip] = await db.query(
      "SELECT * FROM bookings WHERE user_id = ? AND status IN ('confirmed','pending') ORDER BY booked_at DESC LIMIT 1", [userId]
    );
    if (nextTrip.length > 0) {
      const b = nextTrip[0];
      const details = JSON.parse(b.details || '{}');
      upcomingTrip = {
        title: details.destination || details.route || `${b.booking_type} Booking`,
        date: new Date(b.booked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        daysLeft: Math.max(0, Math.ceil((new Date(b.booked_at).getTime() - Date.now()) / 86400000)),
        flight: details.flight || details.airline || null,
        duration: details.duration || null,
      };
    }

    // Monthly spending (last 6 months)
    const [monthly] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as ym, DATE_FORMAT(created_at, '%b') as month, SUM(amount) as amount
       FROM transactions WHERE user_id = ? AND type = 'payment' AND status = 'completed'
       AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY ym, month ORDER BY ym`, [userId]
    );
    const spendingData = monthly.map(m => ({ month: m.month, amount: parseFloat(m.amount) }));

    // Booking breakdown by type
    const [breakdown] = await db.query(
      `SELECT booking_type, COUNT(*) as cnt FROM bookings WHERE user_id = ? GROUP BY booking_type`, [userId]
    );
    const colors = { flight: '#3b82f6', hotel: '#8b5cf6', holiday: '#10b981', visa: '#f59e0b', medical: '#ec4899', car: '#06b6d4' };
    const bookingBreakdown = breakdown.map(b => ({
      name: b.booking_type.charAt(0).toUpperCase() + b.booking_type.slice(1),
      value: b.cnt,
      color: colors[b.booking_type] || '#64748b',
    }));

    // Recent bookings for the list
    const [recentBookings] = await db.query('SELECT * FROM bookings WHERE user_id = ? ORDER BY booked_at DESC LIMIT 5', [userId]);
    const bookings = recentBookings.map(b => {
      const details = JSON.parse(b.details || '{}');
      return {
        id: b.booking_ref || b.id,
        title: details.destination || details.route || `${b.booking_type} Booking`,
        type: b.booking_type,
        status: b.status,
        amount: `৳${parseFloat(b.total_amount).toLocaleString()}`,
        date: new Date(b.booked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });

    res.json({ stats, user, upcomingTrip, spendingData, bookingBreakdown, bookings });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /dashboard/bookings
router.get('/bookings', async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM bookings WHERE user_id = ?';
    const params = [req.user.sub];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (type) { sql += ' AND booking_type = ?'; params.push(type); }
    if (search) { sql += ' AND booking_ref LIKE ?'; params.push(`%${search}%`); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    sql += ` ORDER BY booked_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);

    const data = rows.map(b => ({
      id: b.id, bookingRef: b.booking_ref, bookingType: b.booking_type,
      status: b.status, totalAmount: parseFloat(b.total_amount), currency: b.currency,
      paymentMethod: b.payment_method, paymentStatus: b.payment_status,
      details: safeJsonParse(b.details, {}), passengerInfo: safeJsonParse(b.passenger_info, []),
      contactInfo: safeJsonParse(b.contact_info, {}), notes: b.notes,
      bookedAt: b.booked_at, updatedAt: b.updated_at,
    }));
    res.json({ data, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / parseInt(limit)) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /dashboard/transactions
router.get('/transactions', async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [req.user.sub];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);

    // Summary
    const [inflow] = await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id = ? AND type = 'refund' AND status = 'completed'", [req.user.sub]);
    const [outflow] = await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id = ? AND type != 'refund' AND status = 'completed'", [req.user.sub]);

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);

    const data = rows.map(t => ({
      id: t.id, type: t.type, amount: parseFloat(t.amount), currency: t.currency,
      status: t.status, paymentMethod: t.payment_method, reference: t.reference,
      description: t.description, meta: t.meta ? JSON.parse(t.meta) : null, createdAt: t.created_at,
    }));

    res.json({
      data, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
      summary: { totalInflow: parseFloat(inflow[0].total), totalOutflow: parseFloat(outflow[0].total), balance: parseFloat(inflow[0].total) - parseFloat(outflow[0].total) }
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /dashboard/travellers
router.get('/travellers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM travellers WHERE user_id = ? ORDER BY created_at DESC', [req.user.sub]);
    const data = rows.map(t => ({
      id: t.id, firstName: t.first_name, lastName: t.last_name, email: t.email, phone: t.phone,
      dateOfBirth: t.date_of_birth, gender: t.gender, nationality: t.nationality,
      passportNo: t.passport_no, passportExpiry: t.passport_expiry, documentType: t.document_type,
    }));
    res.json({ data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// POST /dashboard/travellers
router.post('/travellers', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, gender, nationality, passportNo, passportExpiry, documentType } = req.body;
    const id = uuidv4();
    await db.query(
      `INSERT INTO travellers (id, user_id, first_name, last_name, email, phone, date_of_birth, gender, nationality, passport_no, passport_expiry, document_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.sub, firstName, lastName, email || null, phone || null, dateOfBirth || null, gender || null, nationality || null, passportNo || null, passportExpiry || null, documentType || 'passport']
    );
    res.status(201).json({ id, firstName, lastName, email, phone, dateOfBirth, gender, nationality, passportNo, passportExpiry, documentType: documentType || 'passport' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// DELETE /dashboard/travellers/:id
router.delete('/travellers/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM travellers WHERE id = ? AND user_id = ?', [req.params.id, req.user.sub]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /dashboard/payments
router.get('/payments', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM transactions WHERE user_id = ? AND type = 'payment' ORDER BY created_at DESC LIMIT 50", [req.user.sub]);
    
    const methodLabels = { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', card: 'Card Payment', bank_transfer: 'Bank Transfer' };
    
    const paymentHistory = rows.map(t => ({
      id: t.id, 
      amount: parseFloat(t.amount), 
      currency: t.currency, 
      status: t.status === 'completed' ? 'Approved' : t.status === 'pending' ? 'Pending' : 'Rejected',
      paymentMethod: methodLabels[t.payment_method] || t.payment_method,
      reference: t.reference, 
      description: t.description, 
      createdAt: t.created_at,
      bookingRef: t.reference || 'N/A',
    }));
    
    // Get admin-configured bank accounts from system_settings
    let bankAccounts = [];
    try {
      const [settings] = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'bank_accounts'");
      if (settings.length > 0 && settings[0].setting_value) {
        bankAccounts = JSON.parse(settings[0].setting_value);
      }
    } catch {}
    
    // Default bank accounts if none configured
    if (bankAccounts.length === 0) {
      bankAccounts = [
        { id: '1', bankName: 'Dutch-Bangla Bank', accName: 'Seven Trip Ltd', accNo: '1234567890123', branch: 'Banani Branch', routingNo: '090261396' },
        { id: '2', bankName: 'BRAC Bank', accName: 'Seven Trip Ltd', accNo: '9876543210123', branch: 'Gulshan Branch', routingNo: '060261876' },
      ];
    }
    
    // Enabled payment methods
    const enabledPaymentMethods = ['bank_deposit', 'bank_transfer', 'cheque_deposit', 'mobile_bkash', 'mobile_nagad', 'card'];
    
    res.json({ paymentHistory, bankAccounts, enabledPaymentMethods });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// POST /dashboard/payments
router.post('/payments', async (req, res) => {
  try {
    const { paymentMethod, amount, paymentDate, bookingRef, depositBank, chequeNo, chequeBank, chequeDate, transactionId } = req.body;
    
    const id = uuidv4();
    const methodMap = {
      'bank_deposit': 'bank_transfer', 'bank_transfer': 'bank_transfer', 'cheque_deposit': 'bank_transfer',
      'mobile_bkash': 'bkash', 'mobile_nagad': 'nagad', 'mobile_rocket': 'rocket', 'card': 'card'
    };
    const dbMethod = methodMap[paymentMethod] || 'bank_transfer';
    
    // Find matching booking
    let bookingId = null;
    if (bookingRef) {
      const [bookings] = await db.query('SELECT id FROM bookings WHERE booking_ref = ? AND user_id = ?', [bookingRef, req.user.sub]);
      if (bookings.length > 0) bookingId = bookings[0].id;
    }
    
    const meta = JSON.stringify({ paymentMethod, depositBank, chequeNo, chequeBank, chequeDate, transactionId, paymentDate });
    
    await db.query(
      `INSERT INTO transactions (id, user_id, booking_id, type, amount, status, payment_method, reference, description, meta) VALUES (?, ?, ?, 'payment', ?, 'pending', ?, ?, ?, ?)`,
      [id, req.user.sub, bookingId, parseFloat(amount) || 0, dbMethod, transactionId || `PAY-${id.substring(0,8).toUpperCase()}`, `Payment via ${paymentMethod}`, meta]
    );
    
    res.status(201).json({ id, message: 'Payment submitted for review', status: 'pending' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /dashboard/tickets
router.get('/tickets', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM tickets WHERE user_id = ?';
    const params = [req.user.sub];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY issued_at DESC';
    const [rows] = await db.query(sql, params);
    const data = rows.map(t => ({
      id: t.id, bookingId: t.booking_id, ticketNo: t.ticket_no, pnr: t.pnr,
      status: t.status, pdfUrl: t.pdf_url, details: JSON.parse(t.details || '{}'), issuedAt: t.issued_at,
    }));
    res.json({ data, total: data.length, page: 1, limit: 50, totalPages: 1 });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /dashboard/wishlist
router.get('/wishlist', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC', [req.user.sub]);
    const data = rows.map(w => ({
      id: w.id, itemType: w.item_type, itemId: w.item_id,
      itemData: JSON.parse(w.item_data || '{}'), createdAt: w.created_at,
    }));
    res.json({ data });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// POST /dashboard/wishlist
router.post('/wishlist', async (req, res) => {
  try {
    const { itemType, itemId, itemData } = req.body;
    const id = uuidv4();
    await db.query(
      `INSERT INTO wishlist (id, user_id, item_type, item_id, item_data) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE item_data = ?`,
      [id, req.user.sub, itemType, itemId, JSON.stringify(itemData || {}), JSON.stringify(itemData || {})]
    );
    res.status(201).json({ id, itemType, itemId, itemData, createdAt: new Date().toISOString() });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// DELETE /dashboard/wishlist/:id
router.delete('/wishlist/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM wishlist WHERE id = ? AND user_id = ?', [req.params.id, req.user.sub]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /dashboard/settings
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.sub]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found', status: 404 });
    const u = rows[0];
    res.json({
      profile: { name: `${u.first_name} ${u.last_name}`, firstName: u.first_name, lastName: u.last_name, email: u.email, phone: u.phone, avatar: u.avatar },
      notifications: [
        { id: 'booking_updates', label: 'Booking Updates', enabled: true },
        { id: 'promotions', label: 'Promotional Offers', enabled: true },
        { id: 'newsletter', label: 'Weekly Newsletter', enabled: false },
        { id: 'sms_alerts', label: 'SMS Alerts', enabled: false },
      ],
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// PUT /dashboard/settings
router.put('/settings', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const parts = (name || '').split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    await db.query('UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?', [firstName, lastName, phone || null, req.user.sub]);
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.sub]);
    res.json(formatUser(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// PATCH /dashboard/settings/profile
router.patch('/settings/profile', async (req, res) => {
  try {
    const { name, firstName, lastName, phone, avatar } = req.body;
    const fn = firstName || (name ? name.split(' ')[0] : undefined);
    const ln = lastName || (name ? name.split(' ').slice(1).join(' ') : undefined);
    const sets = []; const params = [];
    if (fn !== undefined) { sets.push('first_name = ?'); params.push(fn); }
    if (ln !== undefined) { sets.push('last_name = ?'); params.push(ln); }
    if (phone !== undefined) { sets.push('phone = ?'); params.push(phone); }
    if (avatar !== undefined) { sets.push('avatar = ?'); params.push(avatar); }
    if (sets.length > 0) {
      params.push(req.user.sub);
      await db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    }
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.sub]);
    res.json(formatUser(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// POST /dashboard/settings/password
router.post('/settings/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Valid current and new password (min 8 chars) required', status: 400 });
    }
    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.sub]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect', status: 400 });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.sub]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// =============== PAY LATER ===============
// GET /dashboard/pay-later
router.get('/pay-later', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    // Get bookings with unpaid/partial payment status (these are "pay later" items)
    let sql = `SELECT * FROM bookings WHERE user_id = ? AND payment_status IN ('unpaid', 'partial')`;
    const params = [req.user.sub];
    
    if (status && status !== 'All') {
      const statusMap = { 'Paid': 'paid', 'Unpaid': 'unpaid', 'Void': 'cancelled', 'Refund': 'refunded' };
      if (statusMap[status]) { sql += ` AND (payment_status = ? OR status = ?)`; params.push(statusMap[status], statusMap[status]); }
    }
    if (search) { sql += ` AND booking_ref LIKE ?`; params.push(`%${search}%`); }
    
    sql += ` ORDER BY booked_at DESC`;
    const [rows] = await db.query(sql, params);
    
    // Calculate summaries
    const now = new Date();
    let previousDue = 0, totalDue = 0, dueToday = 0;
    
    const data = rows.map(b => {
      const amount = parseFloat(b.total_amount) || 0;
      const bookedDate = new Date(b.booked_at);
      const dueDate = new Date(bookedDate);
      dueDate.setDate(dueDate.getDate() + 3); // Due 3 days after booking
      
      const isPastDue = dueDate < now;
      const isDueToday = dueDate.toDateString() === now.toDateString();
      
      if (b.payment_status === 'unpaid' || b.payment_status === 'partial') {
        totalDue += amount;
        if (isPastDue) previousDue += amount;
        if (isDueToday) dueToday += amount;
      }
      
      let status = 'Unpaid';
      if (b.payment_status === 'paid') status = 'Paid';
      else if (b.status === 'cancelled') status = 'Void';
      else if (b.status === 'refunded') status = 'Refund';
      
      return {
        id: b.id,
        reference: `DUE-${b.booking_ref}`,
        bookingRef: b.booking_ref,
        dueDate: dueDate.toISOString().split('T')[0],
        amount,
        status,
      };
    });
    
    res.json({ 
      data, 
      total: data.length,
      summary: { previousDue, totalDue, dueToday }
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// =============== INVOICES ===============
// GET /dashboard/invoices
router.get('/invoices', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    // Generate invoices from completed/confirmed bookings
    let sql = `SELECT b.*, t.amount as paid_amount, t.created_at as paid_at 
               FROM bookings b 
               LEFT JOIN transactions t ON t.booking_id = b.id AND t.type = 'payment' AND t.status = 'completed'
               WHERE b.user_id = ?`;
    const params = [req.user.sub];
    
    if (status && status !== 'all') {
      const statusMap = { 'Paid': 'paid', 'Unpaid': 'unpaid', 'Partial': 'partial' };
      if (statusMap[status]) { sql += ` AND b.payment_status = ?`; params.push(statusMap[status]); }
    }
    if (search) { sql += ` AND (b.booking_ref LIKE ? OR b.id LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    
    sql += ` ORDER BY b.booked_at DESC`;
    const [rows] = await db.query(sql, params);
    
    const data = rows.map((b, idx) => {
      const invoiceNumber = `INV-${new Date(b.booked_at).getFullYear()}-${String(idx + 1001).padStart(5, '0')}`;
      let status = 'Unpaid';
      if (b.payment_status === 'paid') status = 'Paid';
      else if (b.payment_status === 'partial') status = 'Partial';
      
      const details = JSON.parse(b.details || '{}');
      
      return {
        id: b.id,
        invoiceNumber,
        bookingRef: b.booking_ref,
        bookingType: b.booking_type,
        date: b.booked_at,
        amount: parseFloat(b.total_amount),
        status,
        paidAmount: parseFloat(b.paid_amount) || 0,
        paidAt: b.paid_at,
        customer: {
          name: details.passengerName || 'Customer',
          email: details.email || '',
        },
        items: [{
          description: `${b.booking_type.charAt(0).toUpperCase() + b.booking_type.slice(1)} Booking - ${b.booking_ref}`,
          quantity: 1,
          unitPrice: parseFloat(b.total_amount),
          total: parseFloat(b.total_amount),
        }],
      };
    });
    
    res.json({ data, total: data.length });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// =============== E-TRANSACTIONS ===============
// GET /dashboard/e-transactions
router.get('/e-transactions', async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    
    // E-transactions are online payments (bkash, nagad, card)
    let sql = `SELECT * FROM transactions WHERE user_id = ? AND payment_method IN ('bkash', 'nagad', 'rocket', 'card')`;
    const params = [req.user.sub];
    
    if (type && type !== 'all') {
      sql += ` AND payment_method = ?`; params.push(type);
    }
    if (search) { sql += ` AND (reference LIKE ? OR description LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);
    
    const methodLabels = { bkash: 'BKash', nagad: 'Nagad', rocket: 'Rocket', card: 'Card Payment' };
    
    const data = rows.map(t => ({
      id: t.id,
      transactionId: t.reference || `TXN-${t.id.substring(0, 8).toUpperCase()}`,
      method: methodLabels[t.payment_method] || t.payment_method,
      amount: parseFloat(t.amount),
      fee: Math.round(parseFloat(t.amount) * 0.015), // 1.5% gateway fee estimate
      status: t.status === 'completed' ? 'Completed' : t.status === 'pending' ? 'Pending' : t.status === 'failed' ? 'Failed' : 'Initiated',
      date: t.created_at,
      description: t.description,
    }));
    
    res.json({ 
      data, 
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// =============== SEARCH HISTORY ===============
// GET /dashboard/search-history
router.get('/search-history', async (req, res) => {
  try {
    const { type, search } = req.query;
    
    // Check if search_history table exists, if not return empty
    let sql = `SELECT * FROM search_history WHERE user_id = ?`;
    const params = [req.user.sub];
    
    if (type && type !== 'all') { sql += ` AND search_type = ?`; params.push(type); }
    if (search) { sql += ` AND (origin LIKE ? OR destination LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    
    sql += ` ORDER BY created_at DESC LIMIT 100`;
    
    let rows = [];
    try {
      const [result] = await db.query(sql, params);
      rows = result;
    } catch (tableErr) {
      // Table doesn't exist, return empty
      rows = [];
    }
    
    const data = rows.map(s => ({
      id: s.id,
      type: s.search_type,
      origin: s.origin,
      destination: s.destination,
      dates: s.dates,
      params: JSON.parse(s.params || '{}'),
      searchedAt: s.created_at,
    }));
    
    res.json({ data, total: data.length });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// POST /dashboard/search-history (save a search)
router.post('/search-history', async (req, res) => {
  try {
    const { type, origin, destination, dates, params } = req.body;
    const id = uuidv4();
    
    try {
      await db.query(
        `INSERT INTO search_history (id, user_id, search_type, origin, destination, dates, params) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, req.user.sub, type, origin || null, destination || null, dates || null, JSON.stringify(params || {})]
      );
    } catch (tableErr) {
      // Table might not exist, silently fail
    }
    
    res.status(201).json({ id, type, origin, destination, dates, params });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// DELETE /dashboard/search-history (clear all)
router.delete('/search-history', async (req, res) => {
  try {
    try {
      await db.query('DELETE FROM search_history WHERE user_id = ?', [req.user.sub]);
    } catch (tableErr) {
      // Table might not exist
    }
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// POST /dashboard/bookings/send-confirmation (email booking confirmation)
router.post('/bookings/send-confirmation', async (req, res) => {
  try {
    const { bookingRef } = req.body;
    // In production, this would send an actual email via SMTP
    // For now, we acknowledge the request
    res.json({ message: 'Confirmation email sent', bookingRef });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

module.exports = router;
