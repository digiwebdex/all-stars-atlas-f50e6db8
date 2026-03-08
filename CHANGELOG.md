# Changelog — Seven Trip

All notable changes to this project are documented in this file.

---

## [1.0.0] — 2026-03-08

### 🚀 Initial Production Release

#### Public Website (15 Pages)
- **Homepage** with hero video, search widget (6 tabs), featured destinations, airlines, hotels, packages, testimonials
- **Flights**: Search → Results (sortable, filterable) → Booking form → Confirmation
- **Hotels**: Search → Results (grid/list) → Detail with rooms → Booking
- **Holiday Packages**: Browse → Detail with itinerary → Booking
- **Visa Services**: Countries grid → Multi-step application with document upload
- **Medical Tourism**: Hospital browse with country/treatment filters → Booking
- **Car Rental**: Vehicle browse → Booking form
- **eSIM Plans**: Country-based plan selection → Purchase flow
- **Mobile Recharge**: Operator selection → Amount → Submit
- **Bill Payment**: Category → Biller → Account → Pay
- **Static Pages**: About, Contact (with form), FAQ, Blog, Careers, Terms, Privacy, Refund Policy

#### User Dashboard (12 Pages)
- Dashboard overview with charts (spending, booking breakdown)
- Bookings management (12-status lifecycle, e-ticket PDF download)
- E-Tickets viewer with PDF generation and print
- Transactions ledger with running balance
- E-Transactions (digital gateway logs)
- Payments (multi-method: bank deposit, wire transfer, cheque, bKash/Nagad/Rocket, card) with receipt upload
- Invoices with PDF download
- Pay Later (due management with payment links)
- Travellers (CRUD for frequent traveller profiles)
- Wishlist (save/remove flights, hotels, packages)
- Search History (view, filter, repeat search)
- Settings (profile edit, password change, notification preferences with persistence, security)

#### Super Admin Panel (16 Modules)
- Dashboard analytics (users, bookings, revenue, visa stats, charts)
- User management (add, suspend, activate, delete, view details, **ID verification approve/reject**)
- Bookings management (status transitions: confirm, complete, cancel)
- Payments overview
- Payment Approvals (approve/reject with receipt viewer)
- Invoices (create, PDF download, print, CSV export, remind)
- Reports & Analytics (KPIs, revenue trend, booking charts, export)
- Discounts & Pricing (discount codes CRUD, price rules CRUD)
- Visa management (applications table, status updates, document ZIP download, **one-click Google Drive upload**, PDF export, form settings CMS)
- **CMS Suite**:
  - Homepage editor (sections, visibility, ordering)
  - Footer editor
  - SEO settings (meta, robots.txt, JSON-LD schema)
  - Blog posts CRUD
  - Promotions CRUD
  - Destinations CRUD
  - Media library (upload, delete, preview)
  - Email templates CRUD
  - Service-specific settings (Visa form, Booking forms)
- Admin Settings (API integrations with setup guides, **Google Drive OAuth setup**, notification toggles, payment method management, bank accounts, SMTP config, danger zone)

#### Architecture & Infrastructure
- React 18 + TypeScript + Vite + Tailwind CSS
- shadcn/ui component library with custom design tokens
- Dark/Light theme with system preference detection
- API-first architecture with `src/lib/api.ts` client (JWT auth, auto-refresh, 401 retry)
- React Query for server state management
- Resilient mock-data fallback system for offline/demo mode
- CMS-driven content via `useCmsPageContent` hook with fallback defaults
- PDF generation (invoices, e-tickets) via jsPDF
- CSV export utility for all data tables
- Role-based routing (ProtectedRoute, AdminRoute)
- Authentication via Email + Phone OTP
- Framer Motion animations throughout

#### Backend (Node.js + Express + MySQL)
- 86 REST API endpoints
- JWT authentication with refresh tokens
- 20+ MySQL tables with full migration script
- File upload (Multer) for visa documents and payment receipts
- CORS, Helmet, rate limiting security
- PM2 process management

#### Documentation
- `README.md` — Project overview, tech stack, route map, setup guide
- `developer_documentation.md` — Architecture deep-dive, adding features guide
- `Deployment.md` — Step-by-step VPS deployment (Nginx, SSL, PM2)
- `BACKEND_API_SPEC.md` — Full API contract (86 endpoints, schemas, auth flow)
- `CHANGELOG.md` — This file

---

## Links

- **Live Site**: https://seventrip.com.bd
- **API Health**: https://api.seventrip.com.bd/api/health
- **Admin Panel**: https://seventrip.com.bd/admin/login
