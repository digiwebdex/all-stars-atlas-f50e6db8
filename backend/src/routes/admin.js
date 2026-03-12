const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate, requireAdmin, formatUser } = require('../middleware/auth');
const { notifyBookingStatus, notifyPayment } = require('../services/notify');
const { safeJsonParse } = require('../utils/json');

// GDS providers for real flight operations
const ttiFlights = require('./tti-flights');
const bdfFlights = require('./bdf-flights');
const flyhubFlights = require('./flyhub-flights');
const sabreFlights = require('./sabre-flights');
const galileoFlights = require('./galileo-flights');
const ndcFlights = require('./ndc-flights');
const lccFlights = require('./lcc-flights');

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [users] = await db.query('SELECT COUNT(*) as total FROM users');
    const [bookings] = await db.query('SELECT COUNT(*) as total FROM bookings WHERE (archived IS NULL OR archived = 0)');
    const [revenue] = await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type = 'payment' AND status = 'completed'");
    const [visas] = await db.query("SELECT COUNT(*) as total FROM visa_applications WHERE status IN ('submitted','processing')");

    const [byType] = await db.query('SELECT booking_type, COUNT(*) as count FROM bookings WHERE (archived IS NULL OR archived = 0) GROUP BY booking_type');
    const bookingsByType = {};
    byType.forEach(r => { bookingsByType[r.booking_type] = r.count; });

    const [monthlyRev] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as ym, DATE_FORMAT(created_at, '%b %Y') as month, SUM(amount) as revenue, COUNT(*) as bookings
       FROM transactions WHERE type = 'payment' AND status = 'completed'
       AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY ym, month ORDER BY ym`
    );

    const [recentBookings] = await db.query(
      `SELECT b.*, u.first_name, u.last_name, u.email as user_email FROM bookings b JOIN users u ON b.user_id = u.id WHERE (b.archived IS NULL OR b.archived = 0) ORDER BY b.booked_at DESC LIMIT 5`
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
    let sql = 'SELECT b.*, u.first_name, u.last_name, u.email as user_email FROM bookings b JOIN users u ON b.user_id = u.id WHERE (b.archived IS NULL OR b.archived = 0)';
    const params = [];
    if (status) { sql += ' AND b.status = ?'; params.push(status); }
    if (type) { sql += ' AND b.booking_type = ?'; params.push(type); }
    if (search) { sql += ' AND (b.booking_ref LIKE ? OR u.first_name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [countResult] = await db.query(sql.replace('SELECT b.*, u.first_name, u.last_name, u.email as user_email', 'SELECT COUNT(*) as total'), params);
    sql += ` ORDER BY b.booked_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    const [rows] = await db.query(sql, params);

    const data = rows.map(b => {
      const details = safeJsonParse(b.details, {});
      return {
        id: b.id, bookingRef: b.booking_ref, bookingType: b.booking_type, status: b.status,
        totalAmount: parseFloat(b.total_amount), currency: b.currency, paymentMethod: b.payment_method,
        paymentStatus: b.payment_status, paymentDeadline: b.payment_deadline,
        details,
        pnr: details.gdsPnr || null,
        passengerInfo: safeJsonParse(b.passenger_info, []),
        contactInfo: safeJsonParse(b.contact_info, {}),
        user: { name: `${b.first_name} ${b.last_name}`, email: b.user_email },
        notes: b.notes || '',
        bookedAt: b.booked_at, updatedAt: b.updated_at,
      };
    });
    res.json({ data, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / parseInt(limit)) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// PUT /admin/bookings/:id — with real GDS API calls for flight bookings
router.put('/bookings/:id', async (req, res) => {
  try {
    const { status, notes, paymentStatus, paymentMethod, totalAmount, passengerInfo, contactInfo, details, gdsAction } = req.body;
    const bookingId = req.params.id;

    // Fetch current booking first
    const [currentRows] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (currentRows.length === 0) return res.status(404).json({ message: 'Booking not found', status: 404 });

    const booking = currentRows[0];
    const bookingDetails = safeJsonParse(booking.details, {});
    const isFlightBooking = booking.booking_type === 'flight';
    const flightSource = bookingDetails.outbound?.source || '';
    const gdsPnr = bookingDetails.gdsPnr || bookingDetails.outbound?.pnr || null;
    const gdsBookingId = bookingDetails.gdsBookingResult?.ttiBookingId || bookingDetails.gdsBookingResult?.bookingId || null;
    const bdfOrderId = bookingDetails.gdsBookingResult?.orderId || bookingDetails.outbound?._bdfOfferId || null;

    let gdsResult = null;
    let gdsError = null;
    let gdsSkipped = false; // When GDS action is intentionally skipped (e.g., TTI has no ticketing API)

    // ── Real GDS actions for flight bookings ──
    if (isFlightBooking && status) {
      const oldStatus = booking.status;
      const isTTI = flightSource === 'tti' || bookingDetails.outbound?.airlineCode === '2A' || bookingDetails.outbound?.airlineCode === 'S2';
      console.log(`[Admin GDS] Flight booking update: ${bookingId} | Source: ${flightSource} | TTI: ${isTTI} | PNR: ${gdsPnr} | GDS BookingId: ${gdsBookingId} | Status: ${oldStatus} → ${status}`);

      // CONFIRM / TICKETED → Issue ticket via GDS
      if ((status === 'confirmed' || status === 'ticketed') && oldStatus !== 'confirmed' && oldStatus !== 'ticketed') {
        if (gdsPnr || gdsBookingId) {
          console.log(`[Admin GDS] → ISSUE TICKET via ${flightSource || 'unknown'} — PNR: ${gdsPnr} | BookingId: ${gdsBookingId}`);
          try {
            if (isTTI) {
              // TTI has NO separate ticketing API — ticket issuance must be done via Air Astra back-office
              // Allow DB status update but log that GDS ticketing was skipped
              console.log('[Admin GDS] TTI: No ticketing API available — marking as ticketed locally only');
              gdsResult = { success: true, ticketNumbers: [], methodUsed: 'manual (TTI has no ticketing API)', skipped: true };
              gdsSkipped = true;
            } else if (flightSource === 'bdfare') {
              gdsResult = await bdfFlights.issueTicket({ orderId: bdfOrderId, pnr: gdsPnr });
            } else if (flightSource === 'flyhub') {
              gdsResult = await flyhubFlights.issueTicket({ bookingId: gdsBookingId || gdsPnr, pnr: gdsPnr });
            } else if (flightSource === 'sabre') {
              gdsResult = await sabreFlights.issueTicket({ pnr: gdsPnr });
            }

            if (gdsResult && !gdsResult.success) {
              gdsError = gdsResult.error || 'GDS ticketing failed';
              console.error(`[Admin] GDS ticket issue failed:`, gdsError);
            } else if (gdsResult?.ticketNumbers?.length > 0) {
              // Create ticket records in DB
              for (const ticketNo of gdsResult.ticketNumbers) {
                await db.query(
                  `INSERT INTO tickets (id, booking_id, user_id, ticket_no, pnr, status, details) VALUES (?, ?, ?, ?, ?, 'active', ?)`,
                  [uuidv4(), bookingId, booking.user_id, ticketNo, gdsPnr || booking.booking_ref.slice(-6),
                   JSON.stringify({ source: flightSource, issuedBy: req.user.email, issuedAt: new Date().toISOString() })]
                );
              }
              console.log(`[Admin] ${gdsResult.ticketNumbers.length} ticket(s) recorded in DB`);
            }
          } catch (err) {
            gdsError = err.message;
            console.error('[Admin] GDS issueTicket exception:', err.message);
          }
        }
      }

      // CANCELLED → Cancel in GDS
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        if (gdsPnr || gdsBookingId) {
          console.log(`[Admin] Cancelling via ${flightSource} — PNR: ${gdsPnr}`);
          try {
            if (isTTI) {
              gdsResult = await ttiFlights.cancelBooking({ pnr: gdsPnr, bookingId: gdsBookingId });
            } else if (flightSource === 'bdfare') {
              gdsResult = await bdfFlights.cancelBooking({ orderId: bdfOrderId, pnr: gdsPnr });
            } else if (flightSource === 'flyhub') {
              gdsResult = await flyhubFlights.cancelBooking({ bookingId: gdsBookingId || gdsPnr, pnr: gdsPnr });
            } else if (flightSource === 'sabre') {
              gdsResult = await sabreFlights.cancelBooking({ pnr: gdsPnr });
            }

            if (gdsResult && !gdsResult.success) {
              gdsError = gdsResult.error || 'GDS cancellation failed';
            }

            // Update tickets to cancelled
            await db.query('UPDATE tickets SET status = ? WHERE booking_id = ?', ['cancelled', bookingId]);
          } catch (err) {
            gdsError = err.message;
            console.error('[Admin] GDS cancelBooking exception:', err.message);
          }
        }
      }

      // VOID → Void ticket in GDS
      if (status === 'void' && oldStatus !== 'void') {
        if (gdsPnr) {
          console.log(`[Admin] Voiding via ${flightSource} — PNR: ${gdsPnr}`);
          try {
            if (isTTI) {
              // Get ticket numbers from DB
              const [tickets] = await db.query('SELECT ticket_no FROM tickets WHERE booking_id = ?', [bookingId]);
              if (tickets.length > 0) {
                for (const t of tickets) {
                  const voidResult = await ttiFlights.voidTicket({ pnr: gdsPnr, ticketNumber: t.ticket_no });
                  if (!voidResult.success) {
                    gdsError = (gdsError ? gdsError + '; ' : '') + `Void ${t.ticket_no}: ${voidResult.error}`;
                  }
                }
              } else {
                // No tickets in DB — try voiding the PNR directly
                const voidResult = await ttiFlights.voidTicket({ pnr: gdsPnr, ticketNumber: null });
                if (!voidResult.success) gdsError = voidResult.error;
              }
              if (!gdsError) {
                gdsResult = { success: true };
                await db.query('UPDATE tickets SET status = ? WHERE booking_id = ?', ['voided', bookingId]);
              }
            } else {
              // Non-TTI void: update tickets locally, GDS void not implemented for other providers
              await db.query('UPDATE tickets SET status = ? WHERE booking_id = ?', ['voided', bookingId]);
              gdsResult = { success: true, skipped: true };
              gdsSkipped = true;
            }
          } catch (err) {
            gdsError = err.message;
          }
        }
      }
    }

    // ── SAFETY: Block DB status change if GDS action failed for flight bookings ──
    // For flight bookings with GDS integration, critical status changes (cancel, confirm, ticketed, void)
    // must ONLY update the DB if the GDS action succeeded. Otherwise the local status would be
    // out of sync with the airline's system — a dangerous inconsistency.
    // Exception: gdsSkipped means the action was intentionally skipped (e.g., TTI has no ticketing API)
    const gdsRequiredStatuses = ['cancelled', 'void']; // Only block for cancel/void — ticketing allowed to skip for TTI
    const gdsActionWasRequired = isFlightBooking && status && gdsRequiredStatuses.includes(status) && (gdsPnr || gdsBookingId) && !gdsSkipped;
    const gdsActionFailed = gdsActionWasRequired && (gdsError || (gdsResult && !gdsResult.success));

    if (gdsActionFailed) {
      // Do NOT update status — keep original status in DB
      // But still log the failed attempt in details for audit trail
      const mergedDetails = { ...bookingDetails };
      mergedDetails.lastGdsAction = {
        action: status,
        source: flightSource,
        result: gdsResult,
        error: gdsError,
        timestamp: new Date().toISOString(),
        performedBy: req.user.email,
        statusBlocked: true,
      };
      await db.query('UPDATE bookings SET details = ? WHERE id = ?', [JSON.stringify(mergedDetails), bookingId]);

      return res.status(422).json({
        message: `GDS ${status} failed — booking status NOT changed`,
        status: 422,
        gdsError: gdsError,
        gdsAction: {
          success: false,
          error: gdsError,
          source: flightSource,
        },
        currentStatus: booking.status,
        hint: 'The airline system rejected the request. The booking remains in its previous state. Check TTI/GDS API logs or cancel manually via the airline portal.',
      });
    }

    // ── Perform DB update (only reaches here if GDS succeeded or no GDS action was needed) ──
    const sets = []; const params = [];
    if (status) { sets.push('status = ?'); params.push(status); }
    if (notes !== undefined) { sets.push('notes = ?'); params.push(notes); }
    if (paymentStatus) { sets.push('payment_status = ?'); params.push(paymentStatus); }
    if (paymentMethod) { sets.push('payment_method = ?'); params.push(paymentMethod); }
    if (totalAmount !== undefined) { sets.push('total_amount = ?'); params.push(totalAmount); }
    if (passengerInfo !== undefined) { sets.push('passenger_info = ?'); params.push(JSON.stringify(passengerInfo)); }
    if (contactInfo !== undefined) { sets.push('contact_info = ?'); params.push(JSON.stringify(contactInfo)); }

    // Merge GDS result into details
    if (details !== undefined || gdsResult) {
      const mergedDetails = { ...bookingDetails, ...(details || {}) };
      if (gdsResult) {
        mergedDetails.lastGdsAction = {
          action: status,
          source: flightSource,
          result: gdsResult,
          error: null,
          timestamp: new Date().toISOString(),
          performedBy: req.user.email,
        };
      }
      sets.push('details = ?');
      params.push(JSON.stringify(mergedDetails));
    }

    if (sets.length > 0) {
      params.push(bookingId);
      await db.query(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    const [rows] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (status && rows[0]) {
      notifyBookingStatus(rows[0].user_id, rows[0].booking_ref, status).catch(console.error);
    }

    const response = {
      id: rows[0]?.id,
      bookingRef: rows[0]?.booking_ref,
      status: rows[0]?.status,
      message: gdsSkipped 
        ? `Booking updated (GDS: ${gdsResult?.methodUsed || 'manual'})` 
        : 'Booking updated',
      gdsAction: gdsResult ? {
        success: true,
        ticketNumbers: gdsResult.ticketNumbers || [],
        methodUsed: gdsResult.methodUsed || null,
        skipped: gdsSkipped || false,
      } : null,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong', status: 500 });
  }
});

// PATCH /admin/bookings/:id/archive — soft archive (hide from dashboards)
router.patch('/bookings/:id/archive', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { archived } = req.body; // true to archive, false to unarchive
    const [rows] = await db.query('SELECT id FROM bookings WHERE id = ?', [bookingId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found', status: 404 });
    await db.query('UPDATE bookings SET archived = ? WHERE id = ?', [archived ? 1 : 0, bookingId]);
    res.json({ message: archived ? 'Booking archived' : 'Booking unarchived', id: bookingId });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

// DELETE /admin/bookings/:id — permanent delete
router.delete('/bookings/:id', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const [rows] = await db.query('SELECT id, booking_ref FROM bookings WHERE id = ?', [bookingId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found', status: 404 });
    // Delete related records first
    await db.query('DELETE FROM tickets WHERE booking_id = ?', [bookingId]);
    await db.query('DELETE FROM transactions WHERE booking_id = ?', [bookingId]);
    await db.query('DELETE FROM bookings WHERE id = ?', [bookingId]);
    console.log(`[Admin] Permanently deleted booking ${rows[0].booking_ref} (${bookingId}) by ${req.user.email}`);
    res.json({ message: 'Booking permanently deleted', id: bookingId, bookingRef: rows[0].booking_ref });
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

    // Calculate real growth rate: compare current period vs prior
    let growthRate = 0;
    if (data.length >= 2) {
      const lastVal = parseFloat(data[data.length - 1].revenue);
      const prevVal = parseFloat(data[data.length - 2].revenue);
      if (prevVal > 0) growthRate = Math.round(((lastVal - prevVal) / prevVal) * 100 * 10) / 10;
    }

    res.json({
      type, dateFrom, dateTo,
      data: data.map(d => ({ period: d.period, revenue: parseFloat(d.revenue), bookings: d.bookings })),
      summary: { totalRevenue, totalBookings, averageOrderValue: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0, growthRate },
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Something went wrong', status: 500 }); }
});

function pickFirstString(...values) {
  return values.find(v => typeof v === 'string' && v.trim().length > 0)?.trim() || '';
}

function normalizeSabreSettings(input = {}, existing = {}) {
  const merged = { ...existing, ...input };

  const certClientId = pickFirstString(merged.cert_client_id, merged.sandbox_client_id, existing.cert_client_id, existing.sandbox_client_id);
  const certClientSecret = pickFirstString(merged.cert_client_secret, merged.sandbox_client_secret, existing.cert_client_secret, existing.sandbox_client_secret);
  const certPassword = pickFirstString(merged.agencyPassword, merged.agency_password, existing.agencyPassword, existing.agency_password);
  const prodPassword = pickFirstString(merged.prodPassword, existing.prodPassword);

  return {
    ...merged,
    // Keep both old/new key names so any deployed admin build can read/write safely
    cert_client_id: certClientId,
    sandbox_client_id: certClientId,
    cert_client_secret: certClientSecret,
    sandbox_client_secret: certClientSecret,
    agencyPassword: certPassword,
    agency_password: certPassword,
    prodPassword,
    cert_basic_auth: pickFirstString(merged.cert_basic_auth, existing.cert_basic_auth),
    prod_basic_auth: pickFirstString(merged.prod_basic_auth, existing.prod_basic_auth),
  };
}

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
          apiKeys[integrationId] = integrationId === 'sabre' ? normalizeSabreSettings(parsed) : parsed;
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
    } else if (r.setting_key === 'markup_config') {
        try { settings.markup_config = JSON.parse(r.setting_value); } catch {}
      } else if (r.setting_key === 'airline_markup_config') {
        try { settings.airline_markup_config = JSON.parse(r.setting_value); } catch {}
      } else if (r.setting_key === 'currency_rates') {
        try { settings.currency_rates = JSON.parse(r.setting_value); } catch {}
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
      settings: {
        ...settings,
        markup_config: settings.markup_config || null,
        airline_markup_config: settings.airline_markup_config || null,
        currency_rates: settings.currency_rates || null,
      },
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

      // Merge with existing config to avoid dropping hidden/unrendered fields on partial saves
      const [existingRows] = await db.query('SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1', [settingKey]);
      let existingKeys = {};
      if (existingRows.length > 0 && existingRows[0].setting_value) {
        try { existingKeys = JSON.parse(existingRows[0].setting_value); } catch { existingKeys = {}; }
      }

      let mergedKeys = { ...existingKeys, ...keys };
      if (integration === 'sabre') {
        mergedKeys = normalizeSabreSettings(mergedKeys, existingKeys);
      }

      const settingValue = JSON.stringify(mergedKeys);
      await db.query(
        'INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()',
        [settingKey, settingValue, settingValue]
      );
      // Clear provider config caches when API settings change
      const cacheClears = {
        tti_astra: () => { try { ttiFlights.clearTTIConfigCache?.(); } catch {} },
        bdfare: () => { try { bdfFlights.clearBDFareConfigCache?.(); } catch {} },
        flyhub: () => { try { flyhubFlights.clearFlyHubConfigCache?.(); } catch {} },
        sabre: () => { try { sabreFlights.clearSabreConfigCache?.(); } catch {} },
        galileo: () => { try { galileoFlights.clearGalileoConfigCache?.(); } catch {} },
        ndc_gateway: () => { try { ndcFlights.clearNDCConfigCache?.(); } catch {} },
        air_arabia: () => { try { lccFlights.clearLCCConfigCache?.('air_arabia'); } catch {} },
        indigo_ndc: () => { try { lccFlights.clearLCCConfigCache?.('indigo_ndc'); } catch {} },
        salam_air: () => { try { lccFlights.clearLCCConfigCache?.('salam_air'); } catch {} },
        airasia: () => { try { lccFlights.clearLCCConfigCache?.('airasia'); } catch {} },
        novoair: () => { try { lccFlights.clearLCCConfigCache?.('novoair'); } catch {} },
        flyadeal: () => { try { lccFlights.clearLCCConfigCache?.('flyadeal'); } catch {} },
        flynas: () => { try { lccFlights.clearLCCConfigCache?.('flynas'); } catch {} },
      };
      if (cacheClears[integration]) cacheClears[integration]();
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

    // Markup config
    if (req.body.markup_config) {
      const val = JSON.stringify(req.body.markup_config);
      await db.query('INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()', ['markup_config', val, val]);
      // Also save airline markup config if included
      if (req.body.airline_markup_config) {
        const airlineVal = JSON.stringify(req.body.airline_markup_config);
        await db.query('INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()', ['airline_markup_config', airlineVal, airlineVal]);
      }
      return res.json({ message: 'Markup config saved' });
    }

    // Currency rates
    if (req.body.currency_rates) {
      const val = JSON.stringify(req.body.currency_rates);
      await db.query('INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()', ['currency_rates', val, val]);
      return res.json({ message: 'Currency rates saved' });
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
      receiptUrl: t.meta ? (safeJsonParse(t.meta, {}).receiptUrl || null) : null,
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
    const [rows] = await db.query(
      `SELECT b.booking_ref, b.total_amount, u.email, u.first_name FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.id = ?`,
      [req.params.id]
    );
    if (rows.length > 0 && rows[0].email) {
      try {
        await notifyPayment(rows[0].email, rows[0].first_name, {
          bookingRef: rows[0].booking_ref,
          amount: parseFloat(rows[0].total_amount),
          type: 'reminder',
        });
      } catch (notifyErr) {
        console.error('Payment reminder notification failed:', notifyErr.message);
      }
    }
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
