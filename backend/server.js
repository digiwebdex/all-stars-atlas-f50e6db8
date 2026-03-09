require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const socialAuthRoutes = require('./src/routes/social-auth');
const flightRoutes = require('./src/routes/flights');
const hotelRoutes = require('./src/routes/hotels');
const serviceRoutes = require('./src/routes/services');
const dashboardRoutes = require('./src/routes/dashboard');
const adminRoutes = require('./src/routes/admin');
const visaRoutes = require('./src/routes/visa');
const { publicRouter: cmsPublicRouter, adminRouter: cmsAdminRouter } = require('./src/routes/cms');
const { router: sslcommerzRoutes } = require('./src/routes/sslcommerz');
const { router: bkashRoutes } = require('./src/routes/bkash');
const { router: nagadRoutes } = require('./src/routes/nagad');

const app = express();
app.set('trust proxy', true); // Behind Nginx reverse proxy
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5173', 'http://localhost:8080', 'http://187.77.137.249'],
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { message: 'Too many requests. Try again later.', status: 429 } });

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ====== ROUTES ======

// Auth
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auth/social', authLimiter, socialAuthRoutes);
app.post('/api/admin/auth/login', authLimiter, (req, res, next) => {
  // Redirect to auth route's admin/login handler
  req.url = '/admin/login';
  authRoutes(req, res, next);
});

// Services
app.use('/api/flights', flightRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api', serviceRoutes); // holidays, medical, cars, esim, recharge, paybill, contact
app.use('/api', visaRoutes); // visa apply, upload, user applications + admin visa routes

// Dashboard
app.use('/api/dashboard', dashboardRoutes);

// Payment Gateways
app.use('/api/payments/ssl', sslcommerzRoutes);
app.use('/api/payments/bkash', bkashRoutes);
app.use('/api/payments/nagad', nagadRoutes);

// Admin
app.use('/api/admin', adminRoutes);

// CMS — public route for fetching page content
app.use('/api/cms', cmsPublicRouter);

// CMS — admin CRUD routes
app.use('/api/admin/cms', cmsAdminRouter);

// 404
app.use('/api/*', (req, res) => res.status(404).json({ message: 'Endpoint not found', status: 404 }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', status: 500 });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Seven Trip API running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
});
