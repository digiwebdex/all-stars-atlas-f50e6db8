const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate, requireAdmin, formatUser } = require('../middleware/auth');
const { notifyBookingStatus, notifyPayment } = require('../services/notify');

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [users] = await db.query('SELECT COUNT(*) as total FROM users');
    const [bookings] = await db.query('SELECT COUNT(*) as total FROM bookings');
    const [revenue] = await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type = 'payment' AND status = 'completed'");
    const [visas] = await db.query("SELECT COUNT(*) as total FROM visa_applications WHERE status IN ('submitted','processing')");

    const [byType] = await db.query('SELECT booking_type, COUNT(*) as count FROM bookings GROUP BY booking_type');
    const bookingsByType = {};
    byType.forEach(r => { bookingsByType[r.booking_type] = r.count; });

    const [monthlyRev] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as ym, DATE_FORMAT(created_at, '%b %Y') as month, SUM(amount) as revenue, COUNT(*) as bookings
       FROM transactions WHERE type = 'payment' AND status = 'completed'
       AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY ym, month ORDER BY ym`
    );

    const [recentBookings] = await db.query(
      `SELECT b.*, u.first_name, u.last_name, u.email as user_email FROM bookings b JOIN users u ON b.user_id = u.id ORDER BY b.booked_at DESC LIMIT 5`
    );
    const [recentUsers] = await db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 5');

    res.json({
      totalUsers: users[0].total,
      totalBookings: bookings[0].total,
      totalRevenue: parseFloat(revenue[0].total),
      activeVisaApplications: visas[0].total,
      bookingsByType,
      monthlyRevenue: monthlyRev.map(m => ({ month: m.month, revenue: parseFloat(m.revenue), bookings: m.bookings })),
      recentBookings: recentBookings.map(b => ({
        id: b.id, bookingRef: b.booking_ref, bookingType: b.booking_type, status: b.status,
        totalAmount: parseFloat(b.total_amount), bookedAt: b.booked_at,
        user: { name: `${b.first_name} ${b.last_name}`, email: b.user_email },
      })),
      recentUsers: recentUsers.map(formatUser),
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /admin/users
router.get('/users', async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    if (search) { sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (role) { sql += ' AND role = ?'; params.push(role); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);

    // Stats
    const [totalStat] = await db.query('SELECT COUNT(*) as c FROM users');
    const [activeStat] = await db.query("SELECT COUNT(*) as c FROM users WHERE email_verified = 1");
    const [suspendedStat] = await db.query("SELECT COUNT(*) as c FROM users WHERE email_verified = 0");
    const [newStat] = await db.query('SELECT COUNT(*) as c FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);

    // Get booking counts per user
    const userIds = rows.map(r => r.id);
    let bookingCounts = {};
    if (userIds.length > 0) {
      const [bc] = await db.query(`SELECT user_id, COUNT(*) as count FROM bookings WHERE user_id IN (${userIds.map(() => '?').join(',')}) GROUP BY user_id`, userIds);
      bc.forEach(r => { bookingCounts[r.user_id] = r.count; });
    }

    const users = rows.map(u => ({
      id: u.id, name: `${u.first_name} ${u.last_name}`, email: u.email, phone: u.phone || '-',
      joined: u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
      bookings: bookingCounts[u.id] || 0,
      status: u.email_verified ? 'active' : 'inactive',
      role: u.role,
      idDocument: u.id_document_path || null,
      idDocType: u.id_document_type || null,
      idVerified: !!u.id_verified,
    }));

    res.json({
      users,
      stats: { total: totalStat[0].c, active: activeStat[0].c, suspended: suspendedStat[0].c, newThisMonth: newStat[0].c },
      total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found', status: 404 });
    const [bookings] = await db.query('SELECT * FROM bookings WHERE user_id = ? ORDER BY booked_at DESC LIMIT 10', [req.params.id]);
    res.json({ ...formatUser(rows[0]), bookings: bookings.map(b => ({ id: b.id, bookingRef: b.booking_ref, bookingType: b.booking_type, status: b.status, totalAmount: parseFloat(b.total_amount), bookedAt: b.booked_at })) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// PUT /admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const { role, emailVerified, phoneVerified, idVerified } = req.body;
    const sets = []; const params = [];
    if (role !== undefined) { sets.push('role = ?'); params.push(role); }
    if (emailVerified !== undefined) { sets.push('email_verified = ?'); params.push(emailVerified ? 1 : 0); }
    if (phoneVerified !== undefined) { sets.push('phone_verified = ?'); params.push(phoneVerified ? 1 : 0); }
    if (idVerified !== undefined) { sets.push('id_verified = ?'); params.push(idVerified ? 1 : 0); }
    if (sets.length > 0) { params.push(req.params.id); await db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params); }
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(formatUser(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// DELETE /admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /admin/bookings
router.get('/bookings', async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT b.*, u.first_name, u.last_name, u.email as user_email FROM bookings b JOIN users u ON b.user_id = u.id WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND b.status = ?'; params.push(status); }
    if (type) { sql += ' AND b.booking_type = ?'; params.push(type); }
    if (search) { sql += ' AND (b.booking_ref LIKE ? OR u.first_name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT b.*, u.first_name, u.last_name, u.email as user_email', 'SELECT COUNT(*) as total'), params);
    sql += ` ORDER BY b.booked_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);

    const data = rows.map(b => ({
      id: b.id, bookingRef: b.booking_ref, bookingType: b.booking_type, status: b.status,
      totalAmount: parseFloat(b.total_amount), currency: b.currency, paymentMethod: b.payment_method,
      paymentStatus: b.payment_status, details: JSON.parse(b.details || '{}'),
      user: { name: `${b.first_name} ${b.last_name}`, email: b.user_email },
      bookedAt: b.booked_at,
    }));
    res.json({ data, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / parseInt(limit)) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// PUT /admin/bookings/:id
router.put('/bookings/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const sets = []; const params = [];
    if (status) { sets.push('status = ?'); params.push(status); }
    if (notes !== undefined) { sets.push('notes = ?'); params.push(notes); }
    if (sets.length > 0) { params.push(req.params.id); await db.query(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ?`, params); }
    const [rows] = await db.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    // Notify user of status change
    if (status && rows[0]) {
      notifyBookingStatus(rows[0].user_id, rows[0].booking_ref, status).catch(console.error);
    }
    res.json(rows[0] ? { id: rows[0].id, bookingRef: rows[0].booking_ref, status: rows[0].status } : {});
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /admin/payments
router.get('/payments', async (req, res) => {
  try {
    const { status, method, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT t.*, u.first_name, u.last_name, u.email as user_email FROM transactions t JOIN users u ON t.user_id = u.id WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    if (method) { sql += ' AND t.payment_method = ?'; params.push(method); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT t.*, u.first_name, u.last_name, u.email as user_email', 'SELECT COUNT(*) as total'), params);
    sql += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);

    const data = rows.map(t => ({
      id: t.id, type: t.type, amount: parseFloat(t.amount), currency: t.currency, status: t.status,
      paymentMethod: t.payment_method, reference: t.reference, description: t.description,
      user: { name: `${t.first_name} ${t.last_name}`, email: t.user_email },
      createdAt: t.created_at,
    }));
    res.json({ data, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / parseInt(limit)) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /admin/reports
router.get('/reports', async (req, res) => {
  try {
    const { type = 'revenue', dateFrom, dateTo, groupBy = 'month' } = req.query;
    let dateFormat = '%Y-%m';
    if (groupBy === 'day') dateFormat = '%Y-%m-%d';
    if (groupBy === 'week') dateFormat = '%Y-%u';

    const [data] = await db.query(
      `SELECT DATE_FORMAT(created_at, ?) as period, SUM(amount) as revenue, COUNT(*) as bookings
       FROM transactions WHERE type = 'payment' AND status = 'completed'
       ${dateFrom ? 'AND created_at >= ?' : ''} ${dateTo ? 'AND created_at <= ?' : ''}
       GROUP BY period ORDER BY period`,
      [dateFormat, ...(dateFrom ? [dateFrom] : []), ...(dateTo ? [dateTo] : [])]
    );

    const totalRevenue = data.reduce((sum, d) => sum + parseFloat(d.revenue || 0), 0);
    const totalBookings = data.reduce((sum, d) => sum + d.bookings, 0);

    res.json({
      type, dateFrom, dateTo,
      data: data.map(d => ({ period: d.period, revenue: parseFloat(d.revenue), bookings: d.bookings })),
      summary: { totalRevenue, totalBookings, averageOrderValue: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0, growthRate: 12.5 },
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// GET /admin/settings — returns all settings including API keys (masked)
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM system_settings');
    const settings = {};
    const apiKeys = {};
    const socialOAuth = {};

    rows.forEach(r => {
      if (r.setting_key.startsWith('api_')) {
        // API integration keys — parse JSON, mask secrets for display
        const integrationId = r.setting_key.replace('api_', '');
        try {
          const parsed = JSON.parse(r.setting_value);
          apiKeys[integrationId] = parsed;
        } catch { apiKeys[integrationId] = {}; }
      } else if (r.setting_key.startsWith('social_oauth_')) {
        const provider = r.setting_key.replace('social_oauth_', '');
        try { socialOAuth[provider] = JSON.parse(r.setting_value); } catch { socialOAuth[provider] = {}; }
      } else if (r.setting_key === 'payment_methods') {
        try { settings.paymentMethods = JSON.parse(r.setting_value); } catch {}
      } else if (r.setting_key === 'bank_accounts') {
        try { settings.bankAccounts = JSON.parse(r.setting_value); } catch {}
      } else if (r.setting_key === 'notifications') {
        try { settings.notifications = JSON.parse(r.setting_value); } catch {}
      } else {
        settings[r.setting_key] = r.setting_value;
      }
    });

    res.json({
      siteName: settings.site_name || 'Seven Trip',
      supportEmail: settings.support_email || '',
      supportPhone: settings.support_phone || '',
      defaultCurrency: settings.currency || 'BDT',
      apiKeys,
      socialOAuth,
      paymentMethods: settings.paymentMethods || null,
      bankAccounts: settings.bankAccounts || null,
      notificationPrefs: settings.notifications || null,
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// PUT /admin/settings
router.put('/settings', async (req, res) => {
  try {
    const { section, siteName, supportEmail, supportPhone, defaultCurrency, provider, config, integration, keys, paymentMethods, bankAccounts, notifications } = req.body;

    // Social OAuth config
    if (section === 'social_oauth' && provider && config) {
      const settingKey = `social_oauth_${provider}`;
      const settingValue = JSON.stringify(config);
      await db.query(
        'INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()',
        [settingKey, settingValue, settingValue]
      );
      return res.json({ message: `${provider} OAuth config saved` });
    }

    // API integration config
    if (section === 'api_integration' && integration && keys) {
      const settingKey = `api_${integration}`;
      const settingValue = JSON.stringify(keys);
      await db.query(
        'INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()',
        [settingKey, settingValue, settingValue]
      );
      // Clear TTI config cache if it's the TTI integration
      if (integration === 'tti_astra') {
        try { const { clearTTIConfigCache } = require('./tti-flights'); clearTTIConfigCache(); } catch {}
      }
      return res.json({ message: `${integration} config saved` });
    }

    // Payment methods
    if (section === 'payments' && paymentMethods) {
      const val = JSON.stringify(paymentMethods);
      await db.query('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', ['payment_methods', val, val]);
      return res.json({ message: 'Payment methods saved' });
    }

    // Bank accounts
    if (section === 'bank_accounts' && bankAccounts) {
      const val = JSON.stringify(bankAccounts);
      await db.query('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', ['bank_accounts', val, val]);
      return res.json({ message: 'Bank accounts saved' });
    }

    // Notifications
    if (section === 'notifications' && notifications) {
      const val = JSON.stringify(notifications);
      await db.query('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', ['notifications', val, val]);
      return res.json({ message: 'Notification preferences saved' });
    }

    // General settings
    const updates = { site_name: siteName, support_email: supportEmail, support_phone: supportPhone, currency: defaultCurrency };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await db.query('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, value, value]);
      }
    }
    res.json({ message: 'Settings updated' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// Visa routes moved to visa.js


// =============== PAYMENT APPROVALS ===============
// GET /admin/payment-approvals
router.get('/payment-approvals', async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Payment approvals = transactions that need admin review (bank transfers, manual payments)
    let sql = `SELECT t.*, u.first_name, u.last_name, u.email as user_email, b.booking_ref
               FROM transactions t 
               JOIN users u ON t.user_id = u.id
               LEFT JOIN bookings b ON t.booking_id = b.id
               WHERE t.payment_method IN ('bank_transfer', 'bkash', 'nagad', 'rocket')`;
    const params = [];
    
    if (status && status !== 'All') {
      const statusMap = { 'Pending': 'pending', 'Approved': 'completed', 'Rejected': 'failed' };
      if (statusMap[status]) { sql += ` AND t.status = ?`; params.push(statusMap[status]); }
    }
    if (search) { sql += ` AND (t.reference LIKE ? OR b.booking_ref LIKE ? OR u.email LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    
    sql += ` ORDER BY t.created_at DESC LIMIT 100`;
    const [rows] = await db.query(sql, params);
    
    const methodLabels = { bank_transfer: 'Bank Transfer', bkash: 'Mobile Banking', nagad: 'Mobile Banking', rocket: 'Mobile Banking', card: 'Credit/Debit Card' };
    
    const data = rows.map(t => ({
      id: t.id,
      customer: { name: `${t.first_name} ${t.last_name}`, email: t.user_email },
      bookingRef: t.booking_ref || 'N/A',
      amount: parseFloat(t.amount),
      method: methodLabels[t.payment_method] || t.payment_method,
      status: t.status === 'completed' ? 'Approved' : t.status === 'failed' ? 'Rejected' : 'Pending',
      reference: t.reference || `TXN-${t.id.substring(0, 8).toUpperCase()}`,
      receiptUrl: t.meta ? (JSON.parse(t.meta || '{}').receiptUrl || null) : null,
      note: t.description,
      date: t.created_at,
    }));
    
    // Stats
    const pending = data.filter(d => d.status === 'Pending').length;
    const approved = data.filter(d => d.status === 'Approved').length;
    const rejected = data.filter(d => d.status === 'Rejected').length;
    const totalPending = data.filter(d => d.status === 'Pending').reduce((s, d) => s + d.amount, 0);
    
    res.json({ 
      data,
      stats: { pending, approved, rejected, totalPendingAmount: totalPending },
      total: data.length 
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// PUT /admin/payment-approvals/:id
router.put('/payment-approvals/:id', async (req, res) => {
  try {
    const { status, note } = req.body;
    const dbStatus = status === 'Approved' ? 'completed' : status === 'Rejected' ? 'failed' : 'pending';
    
    await db.query('UPDATE transactions SET status = ?, description = COALESCE(?, description) WHERE id = ?', [dbStatus, note || null, req.params.id]);
    
    // If approved, also update the booking payment status
    if (status === 'Approved') {
      const [txn] = await db.query('SELECT booking_id, user_id, amount, reference FROM transactions WHERE id = ?', [req.params.id]);
      if (txn.length > 0) {
        if (txn[0].booking_id) {
          await db.query("UPDATE bookings SET payment_status = 'paid' WHERE id = ?", [txn[0].booking_id]);
        }
        // Notify user of payment approval
        notifyPayment(txn[0].user_id, txn[0].amount, txn[0].reference || req.params.id).catch(console.error);
      }
    }
    
    res.json({ message: `Payment ${status.toLowerCase()}` });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// =============== ADMIN INVOICES ===============
// GET /admin/invoices
router.get('/invoices', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let sql = `SELECT b.*, u.first_name, u.last_name, u.email as user_email 
               FROM bookings b JOIN users u ON b.user_id = u.id WHERE 1=1`;
    const params = [];
    
    if (status && status !== 'all') {
      const statusMap = { 'Paid': 'paid', 'Unpaid': 'unpaid', 'Partial': 'partial', 'Overdue': 'unpaid' };
      if (statusMap[status]) { sql += ` AND b.payment_status = ?`; params.push(statusMap[status]); }
    }
    if (search) { sql += ` AND (b.booking_ref LIKE ? OR u.email LIKE ? OR u.first_name LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT b.*, u.first_name, u.last_name, u.email as user_email', 'SELECT COUNT(*) as total'), params);
    
    sql += ` ORDER BY b.booked_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);
    
    const data = rows.map((b, idx) => {
      const invoiceNumber = `INV-${new Date(b.booked_at).getFullYear()}-${String(idx + 1001).padStart(5, '0')}`;
      let payStatus = 'Unpaid';
      if (b.payment_status === 'paid') payStatus = 'Paid';
      else if (b.payment_status === 'partial') payStatus = 'Partial';
      
      // Check if overdue (more than 7 days unpaid)
      const daysOld = Math.floor((Date.now() - new Date(b.booked_at).getTime()) / (1000 * 60 * 60 * 24));
      if (payStatus === 'Unpaid' && daysOld > 7) payStatus = 'Overdue';
      
      return {
        id: b.id,
        invoiceNumber,
        bookingRef: b.booking_ref,
        bookingType: b.booking_type,
        customer: { name: `${b.first_name} ${b.last_name}`, email: b.user_email },
        amount: parseFloat(b.total_amount),
        status: payStatus,
        date: b.booked_at,
        dueDate: new Date(new Date(b.booked_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
    
    // Stats
    const [totalStat] = await db.query('SELECT COUNT(*) as c, COALESCE(SUM(total_amount),0) as total FROM bookings');
    const [paidStat] = await db.query("SELECT COALESCE(SUM(total_amount),0) as total FROM bookings WHERE payment_status = 'paid'");
    const [unpaidStat] = await db.query("SELECT COALESCE(SUM(total_amount),0) as total FROM bookings WHERE payment_status IN ('unpaid','partial')");
    
    res.json({
      data,
      total: countResult[0].total,
      page: parseInt(page), limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
      stats: {
        totalInvoices: totalStat[0].c,
        totalAmount: parseFloat(totalStat[0].total),
        paidAmount: parseFloat(paidStat[0].total),
        unpaidAmount: parseFloat(unpaidStat[0].total),
      },
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// POST /admin/invoices/:id/remind
router.post('/invoices/:id/remind', async (req, res) => {
  try {
    // In production, this would send an email
    res.json({ message: 'Payment reminder sent' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// =============== DISCOUNTS & PRICE RULES ===============
// GET /admin/discounts
router.get('/discounts', async (req, res) => {
  try {
    // Discounts stored in system_settings as JSON
    const [discountRows] = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'discounts'");
    const [ruleRows] = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'price_rules'");
    
    const discounts = discountRows.length > 0 ? JSON.parse(discountRows[0].setting_value || '[]') : [];
    const priceRules = ruleRows.length > 0 ? JSON.parse(ruleRows[0].setting_value || '[]') : [];
    
    res.json({ discounts, priceRules });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// PUT /admin/discounts
router.put('/discounts', async (req, res) => {
  try {
    const { section, discounts, priceRules } = req.body;
    
    if (section === 'discounts' && discounts) {
      const val = JSON.stringify(discounts);
      await db.query('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', ['discounts', val, val]);
      return res.json({ message: 'Discounts saved' });
    }
    if (section === 'price_rules' && priceRules) {
      const val = JSON.stringify(priceRules);
      await db.query('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', ['price_rules', val, val]);
      return res.json({ message: 'Price rules saved' });
    }
    
    res.status(400).json({ message: 'Invalid section', status: 400 });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

module.exports = router;
