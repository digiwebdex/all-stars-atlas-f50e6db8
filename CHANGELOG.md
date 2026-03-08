# Changelog — Seven Trip

All notable changes to this project are documented in this file.

---

## [2.2.0] — 2026-03-08 — Full Production Audit & Final Fixes

### Comprehensive Audit (0-to-100 review of ALL 70+ pages)

**Verified Complete & Working:**
- ✅ Homepage (11 CMS-driven sections, parallax hero, animated counters)
- ✅ All 10 service pages (Flights, Hotels, Holidays, Visa, Medical, Cars, eSIM, Recharge, PayBill, Contact)
- ✅ All 8 static pages (About, Blog, BlogPost, FAQ, Careers, Terms, Privacy, Refund Policy)
- ✅ All 4 auth pages (Login, Register, ForgotPassword, VerifyOTP with 6-digit input)
- ✅ All 12 user dashboard pages (Overview, Bookings, E-Tickets, Transactions, E-Transactions, Payments, Invoices, Pay Later, Travellers, Wishlist, Search History, Settings)
- ✅ All 17 admin modules (Dashboard, Bookings, Users, Payments, Payment Approvals, Discounts, Invoices, Reports, Visa, CMS suite, Settings)
- ✅ Header (responsive, transparent-on-home, user dropdown, mobile sheet)
- ✅ Footer (newsletter subscribe, social links, services/company links, payment methods)
- ✅ SearchWidget (10-tab search with all service types)
- ✅ AuthGateModal (inline auth during booking flow)
- ✅ IdUploadModal (NID/Passport verification)
- ✅ Dark/Light theme with system preference
- ✅ SEO (meta tags, JSON-LD, sitemap, robots.txt)

### Fixed (This Release)
- **DashboardETransactions** — Fixed field mapping: backend returns `method`/`fee`/`date`, UI expected `entryType`/`gatewayFee`/`createdOn`. Now auto-normalizes both formats
- **DashboardSearchHistory** — Fixed missing `summary` and `resultsCount` fields: auto-generates summary from `origin → destination` when not present
- **DashboardPayLater** — Fixed data key priority: now reads `data` first (backend standard), falls back to `items`; formats due dates
- **DashboardHome pie chart** — Fixed: backend returns raw counts, now auto-converts to percentage for the donut chart
- **Newsletter subscribe** — Added backend route `POST /contact/subscribe` (was 404)
- **Booking confirmation email** — Added backend route `POST /dashboard/bookings/send-confirmation`

### Backend Routes Added
- `POST /contact/subscribe` — Newsletter email subscription
- `POST /dashboard/bookings/send-confirmation` — Email booking confirmation to user

---

## [2.1.0] — 2026-03-08 — API Response Alignment & Zero Mock Data

### Critical Fixes
- **All listing pages (Flights, Hotels, Holidays, eSIM, Cars, Medical, Recharge, PayBill)** — Fixed API response shape mismatch: frontend expected `.flights`, `.hotels`, `.packages` etc. but backend returns `.data`. All pages now correctly read `apiData.data || apiData.flights || []`
- **Admin Dashboard** — Mapped backend flat response (`totalUsers`, `totalBookings`, `totalRevenue`) to UI `stats[]` array format
- **User Dashboard** — Fixed `.bookings`, `.transactions`, `.travellers`, `.tickets`, `.wishlist`, `.invoices`, `.payments` to fallback to `.data`
- **Backend: SQL GROUP BY** — Fixed `only_full_group_by` error in `admin.js` and `dashboard.js` monthly revenue queries
- **Backend: JSON.parse crashes** — Created `safeJsonParse()` utility; applied across `hotels.js`, `services.js` for all JSON columns (images, amenities, features, specialties, etc.)
- **eSIM Plans** — Fixed `plan.data` → `plan.dataAmount` field name mismatch
- **AdminVisa** — Removed last `mockAdminVisa` import; now fully API-driven

### Removed
- All mock data imports removed from entire codebase (`mock-data.ts` no longer imported anywhere)

### Performance
- Server warm-up on first visitor load (parallel `/health` + CMS prefetch)
- Route prefetching on nav link hover via `requestIdleCallback`
- CSS `content-visibility: auto` on images/video, `optimizeSpeed` text rendering

---

## [2.0.0] — 2026-03-08 — Full Production Hardening & Audit

### Fixed
- **BlogPost.tsx** — Removed mock data dependency; now uses CMS API via `useCmsPageContent("/blog")`
- **HotelDetail.tsx** — Removed hardcoded fallback hotel data; proper error via `DataLoader`
- **Header.tsx** — Fixed wrong mobile nav icons; added missing "Pay Bill" link
- **BookingConfirmation.tsx** — Fixed fake success toast on API failure

### Changed
- All 18+ dashboard/admin pages: Removed mock data fallbacks; API errors now display descriptive messages
- `DataLoader.tsx` — Enhanced with status-specific error icons and retry buttons
- `api.ts` — Network errors now throw structured `NETWORK_ERROR` code

---

## [1.9.0] — 2026-03-08 — SMS + Email Notification System & Production Hardening

### Added
- **BulkSMSBD SMS Integration** (`backend/src/services/sms.js`) — OTP, booking confirmations, payment receipts, visa updates, welcome SMS to BD numbers
- **Resend Email Integration** (`backend/src/services/email.js`) — 10 beautifully styled HTML email templates: OTP, welcome, booking confirm, booking status, payment receipt, visa update, contact auto-reply, admin alert, password reset
- **Unified Notification Dispatcher** (`backend/src/services/notify.js`) — Sends both SMS + Email in parallel for every trigger
- **Admin Panel: SMS & Email Config** — Admin → Settings → API Integrations → Communication tab (BulkSMSBD + Resend API keys)
- **DB-first API key resolution** — Services read keys from `system_settings` table first, fallback to `.env`
- **Vite manual chunks** — Code-splitting for vendor, UI, charts, PDF, motion (eliminates 500KB+ chunk warning)

### Notification Triggers
| Event | SMS | Email | Admin Alert |
|-------|-----|-------|-------------|
| User registers | ✅ | ✅ | ✅ |
| Password reset OTP | ✅ | ✅ | — |
| Flight/Hotel/Holiday/Medical/Car booked | ✅ | ✅ | ✅ |
| Admin updates booking status | ✅ | ✅ | — |
| Admin approves payment | ✅ | ✅ | — |
| Admin updates visa status | ✅ | ✅ | — |
| Contact form submitted | — | ✅ | ✅ |

### Changed
- `backend/src/routes/auth.js` — Integrated `notifyWelcome` + `notifyPasswordReset`
- `backend/src/routes/flights.js`, `hotels.js`, `services.js` — Integrated `notifyBookingConfirm`
- `backend/src/routes/visa.js` — Integrated `notifyVisaStatus`
- `backend/src/routes/admin.js` — Integrated `notifyBookingStatus` + `notifyPayment`
- Admin Settings — Replaced SMTP config with Resend, updated SMS Gateway to BulkSMSBD
- `.env` / `.env.example` — Added `RESEND_API_KEY`, `BULKSMS_API_KEY`, `BULKSMS_SENDER_ID`

---

## [1.8.0] — 2026-03-08 — Social Login & Full Production Audit

### Added
- **Google Sign-In** — Full OAuth 2.0 integration via Google Identity Services (GSI)
- **Facebook Login** — OAuth via Facebook SDK v19.0
- **Social Login Admin Config** — Admin → Settings → Social Login panel (Google Client ID/Secret + Facebook App ID/Secret)
- **Mandatory ID Upload Modal** (`IdUploadModal.tsx`) — Shown after social signup; users must upload NID/Passport before booking
- **Backend social-auth routes** (`backend/src/routes/social-auth.js`) — Server-side token verification for Google & Facebook
- **Social auth DB migration** (`backend/database/social-auth-migration.sql`) — `social_provider` + `social_provider_id` columns
- **Social config API** (`GET /auth/social/config`) — Returns public client IDs for frontend SDK init
- **`sitemap.xml`** — Full SEO sitemap with 20 pages

### Changed
- Login, Register, and AuthGateModal now have real working Google/Facebook buttons
- `AuthContext` — Added `socialLogin(provider)` method
- Admin Settings PUT route handles `social_oauth` section persistence
- `server.js` — Mounted `/api/auth/social` route group

### Fixed
- Homepage `trustStrip` section double-render bug (was rendering twice: in sortedSections loop AND explicitly after hero)

---

## [1.7.0] — 2026-03-08 — CMS Blog Editor & Popups Module

### Added
- **Popups & Banners CMS** — Exit-intent popups, announcement banners, push notification templates with live preview
- **Blog Visual Editor** — Full WYSIWYG + HTML editor tabs with 16 default articles
- Centralized Discounts & Pricing (removed redundant Promotions sidebar link)

### Fixed
- Flight Booking Step 3 (payment) now renders when `fields.length === 0`
- Blog CMS initialized with structured HTML content

---

## [1.6.0] — 2026-03-07 — Enterprise CMS Suite

### Added
- 40+ CMS-managed pages via `useCmsPageContent` hook
- Homepage CMS: section reordering, visibility toggles, text/image editing
- Dynamic booking form builder
- SEO, Footer, Media, Email Templates, Destinations management
- Admin Payment Approvals with receipt viewer
- Discounts & Pricing module
- Google Drive integration for visa documents

---

## [1.5.0] — 2026-03-06 — Complete User Dashboard

### Added
- 12 fully functional user dashboard pages (zero "Coming Soon")
- E-Tickets with PDF download (jsPDF)
- E-Transactions, Pay Later, Invoices, Search History
- Traveller profiles, Wishlist, Payment receipt upload
- 2FA toggle, notification preferences, account deletion

---

## [1.4.0] — 2026-03-05 — Search Widget & Booking Flow

### Added
- 10-tab unified search widget
- Multi-city flight search (2-5 segments)
- 740+ airports database
- 3-step flight booking form
- Hotel results (grid/list + wishlist)
- AuthGateModal for unauthenticated booking
- Booking confirmation with PDF/print/email

---

## [1.3.0] — 2026-03-04 — Admin Panel

### Added
- 17 admin modules
- Revenue analytics (Recharts)
- User/booking/payment management
- Hidden admin login (`/admin/login`)

---

## [1.2.0] — 2026-03-03 — Authentication

### Added
- JWT auth (15min access + 7-day refresh)
- Email registration with mandatory NID/Passport
- OTP password reset
- Role-based routing

---

## [1.1.0] — 2026-03-02 — Service Pages

### Added
- All 10 service pages
- Static pages (About, Contact, Blog, FAQ, etc.)
- Responsive header/footer
- Dark/light theme

---

## [1.0.0] — 2026-03-01 — Initial Release

### Added
- React + TypeScript + Vite scaffolding
- Tailwind CSS + shadcn/ui design system
- Homepage with hero video & parallax
- Basic routing & error handling
