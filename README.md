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
│   │   └── routes/
│   │       ├── auth.js        # Register, login, OTP, password reset
│   │       ├── social-auth.js # Google & Facebook OAuth
│   │       ├── flights.js     # Flight search & booking
│   │       ├── hotels.js      # Hotel search & booking
│   │       ├── services.js    # Holidays, medical, cars, eSIM, recharge, paybill
│   │       ├── visa.js        # Visa applications
│   │       ├── dashboard.js   # User dashboard APIs
│   │       ├── admin.js       # Admin panel APIs
│   │       └── cms.js         # CMS CRUD (public + admin)
│   ├── database/
│   │   ├── migration.sql            # Full schema (20 tables)
│   │   └── social-auth-migration.sql # Social login columns
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
│   │   ├── pdf-generator.ts  # E-ticket PDF generation
│   │   └── cms-defaults.ts   # CMS page defaults
│   └── pages/                # Route pages
│       ├── Index.tsx          # Homepage (CMS-driven, 11 sections)
│       ├── auth/              # Login, Register, ForgotPassword, VerifyOTP
│       ├── flights/           # FlightResults, FlightBooking
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
└── docs
    ├── BACKEND_API_SPEC.md   # 86 API endpoint spec
    ├── CHANGELOG.md          # Version history
    ├── Deployment.md         # VPS deployment guide
    └── developer_documentation.md # Dev handbook
```

---

## 🎯 Features (100% Complete — Audited 2026-03-09)

### Public Site (10 Services)
- **Homepage** — 11 CMS-driven sections with parallax hero video, animated counters, and section reordering
- **Flight Search** — One-way, round-trip, multi-city (2-5 segments), 740+ airports, cabin class, passenger count. **Real-time GDS via TTI/ZENITH API (Air Astra)** + local database results merged. Google Flights-style cards with airline logos (40+ airlines), timeline segments, layover badges, and advanced filters (stops, price, time, airline)
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
| Invoices | Auto-generated PDF invoices |
| Pay Later | Due management & reminders |
| Travellers | Saved passenger profiles for faster booking |
| Wishlist | Saved hotels |
| Search History | Past flight/hotel searches |
| Settings | Profile, password, notifications, 2FA toggle, delete account |

### Admin Panel (17 modules)
| Module | Features |
|--------|----------|
| Dashboard | Revenue charts (Recharts), booking stats, recent activity |
| Bookings | All bookings, status management, notes |
| Users | User list, role assignment, ID verification status |
| Payments | Payment tracking & history |
| Payment Approvals | Receipt image viewer, approve/reject workflow |
| Discounts & Pricing | Coupon codes, seasonal pricing rules (DB-backed) |
| Invoices | Invoice management & reminders |
| Reports | Revenue, booking, user analytics with export |
| Visa | Application management, status updates |
| CMS: All Pages | 40+ page content management with defaults |
| CMS: Homepage | Section reordering, visibility toggles, text/image editing |
| CMS: Booking Forms | Dynamic form field builder per service |
| CMS: Popups & Banners | Exit-intent popups, announcement banners, push templates |
| CMS: Blog | Visual WYSIWYG + HTML editor, 16 default posts |
| CMS: SEO, Footer, Media, Destinations, Email Templates | Full CMS suite |
| Settings | General, payments, bank accounts, **API Integrations** (TTI GDS, BDFare, HotelBeds, bKash, Nagad, SSLCommerz, BulkSMSBD, Resend), **Social Login OAuth** (Google + Facebook), Google Drive |

### GDS & API Integrations
| Integration | Status | Description |
|-------------|--------|-------------|
| **TTI/ZENITH (Air Astra)** | ✅ Live | Real-time flight search via Agency ID 10000240 |
| **BDFare / Amadeus** | 🔧 Configurable | Additional GDS slot in admin settings |
| **HotelBeds** | 🔧 Configurable | Hotel supplier API slot |
| **bKash** | 🔧 Configurable | Mobile payment gateway |
| **Nagad** | 🔧 Configurable | Mobile payment gateway |
| **SSLCommerz** | 🔧 Configurable | Card payment gateway |
| **BulkSMSBD** | ✅ Live | SMS notifications (OTP, booking, visa) |
| **Resend** | ✅ Live | Transactional emails (10 templates) |

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
React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (40+ components), Framer Motion, React Query, React Router v6, React Hook Form, Zod, jsPDF, Recharts, date-fns

### Backend
Express, mysql2, bcryptjs, jsonwebtoken, multer, uuid, cors, helmet, morgan, express-rate-limit, dotenv

---

## 📄 Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | This file — project overview |
| [CHANGELOG.md](./CHANGELOG.md) | Version history (v1.0–v2.5) |
| [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md) | 90+ API endpoints with request/response schemas |
| [Deployment.md](./Deployment.md) | VPS deployment automation guide |
| [developer_documentation.md](./developer_documentation.md) | Developer handbook (architecture, patterns, conventions) |

---

## 📄 License

Proprietary — Seven Trip Bangladesh Ltd. All rights reserved.
