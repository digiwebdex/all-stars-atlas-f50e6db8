# Seven Trip — Bangladesh's #1 Travel Platform

> Full-stack B2C travel agency web application. Book flights, hotels, visa, holiday packages, medical tourism, car rentals, eSIM, mobile recharge & utility bill payments.

**Live URL:** [http://187.77.137.249](http://187.77.137.249) → [https://seventrip.com.bd](https://seventrip.com.bd)

---

## 🏗 Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Node.js (Express), MySQL/MariaDB, JWT Auth |
| **Hosting** | Ubuntu 24.04 VPS (Hostinger KVM 2), Nginx, PM2, local file storage |
| **State** | React Query (server), Context API (auth), localStorage (CMS) |

---

## 📂 Project Structure

```
├── backend/                  # Node.js Express API
│   ├── server.js             # Entry point (Express app)
│   ├── src/
│   │   ├── config/db.js      # MySQL connection pool
│   │   ├── middleware/auth.js # JWT auth + role guards
│   │   ├── services/
│   │   │   ├── email.js       # Resend transactional emails
│   │   │   ├── sms.js         # BulkSMSBD SMS notifications
│   │   │   └── notify.js      # Unified notification triggers
│   │   └── routes/
│   │       ├── auth.js        # Register, login, OTP, password reset
│   │       ├── social-auth.js # Google & Facebook OAuth
│   │       ├── flights.js     # Multi-GDS flight search & booking
│   │       ├── tti-flights.js # TTI/ZENITH (Air Astra) GDS
│   │       ├── bdf-flights.js # BDFare GDS integration
│   │       ├── flyhub-flights.js # FlyHub GDS integration
│   │       ├── sabre-flights.js  # Sabre REST (BFM search, PNR, SSR, ticketing)
│   │       ├── sabre-soap.js     # Sabre SOAP (EnhancedSeatMap, GetAncillaryOffers)
│   │       ├── ancillaries.js    # Seat map + baggage/meal (Sabre SOAP → TTI → fallback)
│   │       ├── hotels.js      # Hotel search (DB + HotelBeds)
│   │       ├── hotelbeds.js   # HotelBeds API integration
│   │       ├── services.js    # Holidays, medical, cars, eSIM, recharge, paybill
│   │       ├── airalo.js      # Airalo eSIM API integration
│   │       ├── ssl-recharge.js # SSL Wireless recharge + bill pay
│   │       ├── sslcommerz.js  # SSLCommerz payment gateway
│   │       ├── bkash.js       # bKash payment gateway
│   │       ├── nagad.js       # Nagad payment gateway
│   │       ├── visa.js        # Visa applications
│   │       ├── dashboard.js   # User dashboard APIs
│   │       ├── admin.js       # Admin panel APIs
│   │       └── cms.js         # CMS CRUD (public + admin)
│   ├── database/
│   │   ├── migration.sql            # Full schema (20 tables)
│   │   ├── social-auth-migration.sql # Social login columns
│   │   └── pay-later-migration.sql  # Pay-later due tracking
│   └── uploads/              # Local file storage
├── src/                      # React frontend
│   ├── App.tsx               # Root router (70+ routes)
│   ├── components/           # Shared UI components
│   │   ├── layout/           # Header, Footer, PublicLayout
│   │   ├── search/           # SearchWidget (10 tabs)
│   │   ├── ui/               # shadcn/ui components
│   │   ├── AdminRoute.tsx    # Admin route guard
│   │   ├── ProtectedRoute.tsx # User route guard
│   │   ├── AuthGateModal.tsx # Inline auth popup (booking flow)
│   │   ├── IdUploadModal.tsx # Mandatory NID/Passport upload
│   │   ├── ErrorBoundary.tsx # Global error boundary
│   │   └── DataLoader.tsx    # Skeleton/error/retry wrapper
│   ├── contexts/AuthContext.tsx # Auth state + social login
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.ts        # Auth context consumer
│   │   ├── useApiData.ts     # React Query hooks (all endpoints)
│   │   ├── usePaymentGateways.ts # SSLCommerz, bKash, Nagad hooks
│   │   └── useCmsContent.ts  # CMS page content hook
│   ├── lib/                  # Utilities
│   │   ├── api.ts            # HTTP client with auto-refresh
│   │   ├── social-auth.ts    # Google GSI + Facebook SDK
│   │   ├── google-drive.ts   # Google Drive upload
│   │   ├── airports.ts       # 740+ airport database
│   │   ├── config.ts         # App configuration
│   │   ├── constants.ts      # API endpoints, enums
│   │   ├── keep-alive.ts    # Server warm-up on first visit
│   │   ├── prefetch.ts      # Route prefetching on hover
│   │   ├── pdf-generator.ts  # Invoice, Money Receipt & E-ticket PDFs (with QR codes)
│   │   └── cms-defaults.ts   # CMS page defaults
│   └── pages/                # Route pages
│       ├── Index.tsx          # Homepage (CMS-driven, 11 sections)
│       ├── auth/              # Login, Register, ForgotPassword, VerifyOTP
│       ├── flights/           # FlightResults, FlightBooking, SeatMap
│       ├── hotels/            # HotelResults, HotelDetail
│       ├── holidays/          # HolidayPackages, HolidayDetail
│       ├── visa/              # VisaServices, VisaApplication
│       ├── medical/           # MedicalServices, MedicalBooking
│       ├── cars/              # CarRental, CarBooking
│       ├── esim/              # ESIMPlans, ESIMPurchase
│       ├── recharge/          # RechargePage
│       ├── paybill/           # PayBillPage
│       ├── booking/           # BookingConfirmation
│       ├── static/            # About, Contact, Blog, FAQ, Terms, Privacy, etc.
│       ├── dashboard/         # 12 user dashboard pages
│       └── admin/             # 17 admin panel modules
├── public/                   # Static assets
│   ├── images/               # Logo, hero images
│   ├── videos/               # Hero video
│   ├── sitemap.xml           # SEO sitemap
│   ├── robots.txt            # Crawler rules
│   └── favicon.png           # App icon
├── BACKEND_API_SPEC.md       # 90+ API endpoint spec
├── CHANGELOG.md              # Version history (v1.0–v3.5)
├── Deployment.md             # VPS deployment guide
└── developer_documentation.md # Dev handbook
```

---

## 🎯 Features (100% Complete — Audited 2026-03-12 v3.5)

### Public Site (10 Services)
- **Homepage** — 11 CMS-driven sections with parallax hero video, animated counters, and section reordering
- **Flight Search** — One-way, round-trip, multi-city (2-5 segments), domestic/international toggle, 740+ airports, cabin class, passenger count, fare types (Regular/Student/Umrah). **Real-time GDS via TTI/ZENITH API (Air Astra) + BDFare** + local database results merged via `Promise.allSettled`. Google Flights-style cards with airline logos (60+ airlines via Kiwi CDN), timeline segments, layover badges, and advanced filters (stops, price, time, airline). **Round-trip results split into Outbound/Return sections with paired selection and sticky total bar.**
- **Flight Booking** — Enterprise 4-step mandatory flow: (1) Itinerary Review → (2) Passenger Info + Special Services (16 meal types, 3 wheelchair levels, medical/blind/deaf, UMNR, pet transport, frequent flyer, destination address, free-text OSI — all per-passenger, sent to GDS via REST PNR) → (3) Seat Selection (SOAP EnhancedSeatMapRQ v6.0.0 with real-time pricing) + Extra Baggage & Meals (SOAP GetAncillaryOffersRQ v3.0.0) → (4) Review & Pay with real-time fare breakdown using actual GDS tax data. Auth gate for unauthenticated users. Real PNR creation via TTI/Sabre REST API.
- **Seat Map** — Interactive aircraft-aware seat selection (narrowbody 3-3, widebody 3-3-3, ATR 2-2). Per-passenger seat assignment with auto-advance. Seat types: standard, window, aisle, exit row, extra legroom, front row, premium. Pricing integrated into fare total.
- **E-Ticket PDF** — Professional airline-standard PDF with company branding, airline logos, segment boxes (Terminal/Aircraft/Flight No), passenger names in LAST/FIRST format, generated via jsPDF
- **Invoice PDF** — Multi-line item invoice matching professional format with QR code, grand total in words, auto-pagination for large invoices
- **Money Receipt PDF** — Professional receipt matching banking format with line items, totals, "received with gratitude" text, signature area, QR code verification
- **Hotel Search** — Location, dates, guests, grid/list view, wishlist hearts, star rating & price filters
- **Visa Services** — 20 countries, step-by-step application, document upload
- **Holiday Packages** — Tour grid with detail pages, pricing, itineraries
- **Medical Tourism** — Hospital search, specialist booking
- **Car Rental** — Vehicle type selection, date-based booking
- **eSIM Plans** — Country-based international data plans
- **Mobile Recharge** — Operator selection, amount, prepaid/postpaid
- **Utility Bill Payment** — Category-based bill processing
- **Blog** — 16+ managed articles with search & category filters
- **Static Pages** — About, Contact (with form), FAQ, Careers, Terms, Privacy, Refund Policy

### Authentication System
- **Email/Password** — Register with mandatory NID/Passport upload
- **Google Sign-In** — OAuth 2.0 via Google Identity Services (admin-configurable)
- **Facebook Login** — OAuth via Facebook SDK v19.0 (admin-configurable)
- **Post-social-signup ID verification** — Mandatory NID/Passport upload modal
- **OTP-based password reset** — Email → OTP → Reset flow
- **JWT tokens** — 15min access + 7-day refresh with auto-rotation
- **Role-based routing** — Admin ↔ Customer strict separation
- **AuthGateModal** — Inline auth popup during booking flow (no page redirect)

### User Dashboard (12 pages)
| Page | Features |
|------|----------|
| Overview | Stats cards, recent bookings, quick actions |
| Bookings | 12-status lifecycle, filters, detail view |
| E-Tickets | PDF download via jsPDF, print |
| Transactions | Running balance ledger with debit/credit |
| E-Transactions | Digital gateway fee tracking |
| Payments | Receipt upload for manual payment verification |
| Invoices | Auto-generated Invoice PDF + Money Receipt PDF with QR codes |
| Pay Later | Due management & reminders |
| Travellers | Saved passenger profiles for faster booking |
| Wishlist | Saved hotels |
| Search History | Past flight/hotel searches |
| Settings | Profile, password, notifications, 2FA toggle, delete account |

### Admin Panel (17 modules)
| Module | Features |
|--------|----------|
| Dashboard | Revenue charts (Recharts), booking stats, recent activity |
| Bookings | All bookings, status management, notes, **real-time GDS operations** (Ticket/Cancel/Void via TTI, BDFare, FlyHub, Sabre). TTI ticketing handled manually with admin warning. |
| Users | User list, role assignment, ID verification status |
| Payments | Payment tracking & history |
| Payment Approvals | Receipt image viewer, approve/reject workflow |
| Discounts & Pricing | Coupon codes, seasonal pricing rules, price rule management (DB-backed via `system_settings`) |
| Markup & Revenue | Per-service markup config (base fare, tax, SSR, min/max markup, ticket issue charge) |
| Currency Management | Multi-currency exchange rates with markup, auto-update toggle, converter |
| Invoices | Invoice management, Money Receipt download, payment reminders (email notification) |
| Reports | Revenue, booking, user analytics with export |
| Visa | Application management, status updates |
| CMS: All Pages | 40+ page content management with defaults |
| CMS: Homepage | Section reordering, visibility toggles, text/image editing |
| CMS: Booking Forms | Dynamic form field builder per service |
| CMS: Popups & Banners | Exit-intent popups, announcement banners, push templates |
| CMS: Blog | Visual WYSIWYG + HTML editor, 16 default posts |
| CMS: SEO, Footer, Media, Destinations, Email Templates | Full CMS suite |
| Settings | General, payments, bank accounts, **19 API Integrations** (TTI GDS, BDFare, FlyHub, Sabre, HotelBeds, Airalo, SSL Wireless, SSLCommerz, bKash, Nagad, BulkSMSBD, Resend, Stripe, WhatsApp, Google Maps), **Social Login OAuth** (Google + Facebook), Google Drive |

### GDS & API Integrations (All Admin-Panel Configurable)
| Integration | File | Description |
|-------------|------|-------------|
| **TTI/ZENITH (Air Astra)** | `tti-flights.js` | Real-time flight search + booking (PNR creation). Cancel via `Cancel` method. Ticketing = manual (no API). |
| **BDFare** | `bdf-flights.js` | Bangladesh flight aggregator (US-Bangla, Novoair, Biman) |
| **FlyHub** | `flyhub-flights.js` | 450+ airline flight aggregator with token auth |
| **Sabre GDS (REST)** | `sabre-flights.js` | International flights via Bargain Finder Max V5, PNR creation with SSR injection, ticketing, cancellation |
| **Sabre GDS (SOAP)** | `sabre-soap.js` | Enhanced Seat Map (v6.0.0) + Ancillary Offers (v3.0.0) via BinarySecurityToken session |
| **Ancillaries Engine** | `ancillaries.js` | Priority chain: Sabre SOAP → TTI → Standard fallback for seat maps, baggage, meals |
| **HotelBeds** | `hotelbeds.js` | 180,000+ hotels worldwide with SHA256 signature |
| **Airalo** | `airalo.js` | eSIM for 200+ countries with QR delivery |
| **SSL Wireless** | `ssl-recharge.js` | Mobile recharge (GP/Robi/BL/TT) + bill payments |
| **SSLCommerz** | `sslcommerz.js` | Card + mobile payments (IPN callback + auto-confirm) |
| **bKash** | `bkash.js` | Tokenized checkout with grant token auth |
| **Nagad** | `nagad.js` | Payment gateway with verify callback |
| **BulkSMSBD** | `services/sms.js` | SMS notifications (OTP, booking, visa) |
| **Resend** | `services/email.js` | Transactional emails (10+ branded templates) |

> All APIs read credentials from the `system_settings` DB table. **No API keys in code or .env.** Toggle on/off from Admin → Settings → API Integrations.

### SEO & Performance
- OpenGraph + Twitter Cards meta tags
- JSON-LD structured data (TravelAgency schema)
- `sitemap.xml` (20 pages) + `robots.txt` (admin/dashboard blocked)
- Code splitting via React.lazy (every page lazy-loaded)
- Image lazy loading with `loading="lazy"` + `decoding="async"`
- Font preloading (Plus Jakarta Sans critical weights)
- Hero image preloaded for fast LCP
- Scroll progress bar + animated scroll-to-top button
- Dark/light theme with system preference detection

---

## 🚀 Deployment

```bash
# SSH into VPS
ssh root@187.77.137.249

# Use tmux
tmux new -s deploy

# Pull, build, deploy frontend
cd ~/projects/all-stars-atlas
git pull && npm install && npm run build
sudo cp -r dist/* /var/www/seventrip/

# Deploy backend
cd backend && npm install && pm2 restart all

# Run migrations (first time only)
mysql -u seventrip_user -p seventrip < database/migration.sql
mysql -u seventrip_user -p seventrip < database/social-auth-migration.sql
```

See **[Deployment.md](./Deployment.md)** for full VPS setup guide with Nginx, PM2, firewall, and SSL.

---

## 🔧 Local Development

```bash
# Frontend
npm install && npm run dev     # → http://localhost:5173

# Backend (separate terminal)
cd backend && npm install && npm start  # → http://localhost:3001

# Tests
npm test
```

### Environment Variables

| File | Variable | Description |
|------|----------|-------------|
| `.env` | `VITE_API_BASE_URL` | Backend API URL (default: `http://localhost:3001/api`) |
| `backend/.env` | `DB_HOST`, `DB_PASSWORD`, etc. | MySQL connection |
| `backend/.env` | `JWT_SECRET` | Token signing key |
| `backend/.env` | `FRONTEND_URL` | CORS origin |

> **Note:** API keys (TTI, bKash, Resend, BulkSMSBD, etc.) are stored in the database `system_settings` table and managed via Admin → Settings → API Integrations. They are NOT in `.env` files.

---

## 📦 Dependencies

### Frontend
React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (40+ components), Framer Motion, React Query, React Router v6, React Hook Form, Zod, jsPDF, qrcode, Recharts, date-fns

### Backend
Express, mysql2, bcryptjs, jsonwebtoken, multer, uuid, cors, helmet, morgan, express-rate-limit, dotenv

---

## 📄 Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | This file — project overview |
| [CHANGELOG.md](./CHANGELOG.md) | Version history (v1.0–v3.2) |
| [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md) | 90+ API endpoints with request/response schemas |
| [Deployment.md](./Deployment.md) | VPS deployment automation guide (Ubuntu 24.04, Nginx, PM2, SSL) |
| [developer_documentation.md](./developer_documentation.md) | Developer handbook (architecture, patterns, conventions) |
| [.lovable/plan.md](./.lovable/plan.md) | Project plan and phase completion tracking |

---

## 📄 License

Proprietary — Evan International (Seven Trip). All rights reserved.

---

## 📞 Contact

**Seven Trip** — A concern of Evan International  
📞 +880 1749-373748  
📧 support@seven-trip.com  
📍 Beena Kanon, Flat-4A, House-03, Road-17, Block-E, Banani, Dhaka-1213  
🌐 www.seven-trip.com
