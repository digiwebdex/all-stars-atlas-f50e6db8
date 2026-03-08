# Seven Trip — Bangladesh's #1 Travel Platform

> Full-stack travel booking platform built with React + TypeScript. Self-hosted on Ubuntu VPS with a separate Node.js REST API backend.

---

## 🌐 What is Seven Trip?

Seven Trip is a complete travel booking platform (like Booking.com or MakeMyTrip) built for the Bangladesh market. It supports:

- ✈️ **Flight Search & Booking** — GDS integration, multi-city, fare comparison
- 🏨 **Hotel Search & Booking** — Filter by stars, amenities, room types
- 🏖️ **Holiday Packages** — Curated tours with day-by-day itinerary
- 📋 **Visa Application & Tracking** — 40+ countries, document upload, admin processing
- 🏥 **Medical Tourism** — Hospital search, treatment booking
- 🚗 **Car Rental** — Pickup/dropoff, daily rates
- 📱 **eSIM Data Plans** — International data by country
- 📞 **Mobile Recharge** — All BD operators (GP, Banglalink, Robi, Airtel, Teletalk)
- 💡 **Utility Bill Payment** — DESCO, DPDC, gas, water, internet
- 👤 **Customer Dashboard** — 12 pages: bookings, e-tickets, transactions, e-transactions, payments, invoices, pay later, travellers, wishlist, search history, settings
- 🔐 **Super Admin Panel** — 16 enterprise modules: analytics dashboard, user management, booking management, payment management, payment approvals, invoices, reports, visa processing, discounts & pricing, system settings, and full CMS (homepage, pages, blog, promotions, media, email templates, SEO, footer, destinations, booking forms)

---

## 🧰 Tech Stack

| Layer        | Technology                                                      |
| ------------ | --------------------------------------------------------------- |
| **Frontend** | React 18, TypeScript, Vite 5                                    |
| **Styling**  | Tailwind CSS 3, shadcn/ui (Radix UI), Framer Motion            |
| **State**    | React Query (TanStack), React Context (Auth)                    |
| **Forms**    | React Hook Form + Zod validation                                |
| **Routing**  | React Router DOM v6 (60+ routes)                                |
| **Charts**   | Recharts (bar, line, pie, area)                                 |
| **PDF**      | jsPDF (e-tickets, invoices, visa applications)                  |
| **CSV**      | Custom UTF-8 BOM export (Excel-compatible)                      |
| **Backend**  | Node.js + Express REST API (separate repo)                      |
| **Database** | MySQL 8 / MariaDB 10.6+                                        |
| **Hosting**  | Ubuntu VPS (Nginx for static files, PM2 for Node.js API)        |

> ⚠️ **No Lovable, Supabase, Firebase, or cloud vendor dependencies.** This is fully self-contained.

---

## 📁 Project Structure

```
seven-trip/
├── public/                    # Static assets (favicon, logo, robots.txt, videos)
│   ├── images/
│   │   └── seven-trip-logo.png
│   └── videos/
│       ├── hero-beach.mp4
│       └── hero-beach-alt.mp4
├── backend/                   # Node.js REST API (included in same repo)
│   ├── server.js              # Express entry point
│   ├── src/
│   │   ├── config/            # DB connection, media config
│   │   ├── middleware/        # JWT auth, admin guard
│   │   └── routes/            # auth, flights, hotels, services, dashboard, admin, visa, cms
│   ├── database/
│   │   └── migration.sql      # Full 20-table MySQL schema
│   ├── package.json
│   ├── setup.sh               # Quick setup script
│   └── full-setup.sh          # Complete VPS setup script
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── layout/            # Header, Footer, PublicLayout
│   │   ├── search/            # SearchWidget (9-tab search form)
│   │   ├── ui/                # 50+ shadcn/ui components
│   │   ├── AdminRoute.tsx     # Route guard — admin only
│   │   ├── AuthGateModal.tsx  # Login gate for booking flows
│   │   ├── DataLoader.tsx     # Loading/error/skeleton wrapper
│   │   ├── ErrorBoundary.tsx  # Global error handler
│   │   ├── ProtectedRoute.tsx # Route guard — logged-in users
│   │   ├── ThemeProvider.tsx  # Dark/light mode provider
│   │   └── ThemeToggle.tsx    # Dark/light toggle button
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication state (login, register, tokens)
│   ├── hooks/
│   │   ├── useApiData.ts      # 40+ React Query hooks for all endpoints
│   │   ├── useAuth.ts         # Hook to access AuthContext
│   │   ├── useCmsContent.ts   # CMS page content hooks with fallbacks
│   │   ├── use-mobile.tsx     # Responsive breakpoint hook
│   │   └── use-toast.ts      # Toast notification hook
│   ├── lib/
│   │   ├── api.ts             # HTTP client (fetch wrapper with JWT, refresh, interceptors)
│   │   ├── airports.ts        # BD airport data for search autocomplete
│   │   ├── cms-defaults.ts    # Fallback CMS content for all 40+ pages
│   │   ├── config.ts          # App config (API URL, currency, support info)
│   │   ├── constants.ts       # API endpoints, enums, static data
│   │   ├── content-data.ts    # Static content for homepage sections
│   │   ├── csv-export.ts      # CSV download utility (UTF-8 BOM)
│   │   ├── homepage-store.ts  # CMS homepage sync store
│   │   ├── local-store.ts     # Generic localStorage CRUD helpers
│   │   ├── mock-data.ts       # Fallback data for all pages when API is down
│   │   ├── pdf-generator.ts   # PDF generation for tickets, invoices (with logo)
│   │   ├── google-drive.ts    # Google Drive API integration (OAuth2 + upload)
│   │   └── utils.ts           # Utility functions (cn helper)
│   ├── pages/
│   │   ├── admin/             # 16 admin modules
│   │   │   ├── cms/           # 10 CMS pages
│   │   │   ├── AdminBookings.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminDiscounts.tsx
│   │   │   ├── AdminInvoices.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AdminPaymentApprovals.tsx
│   │   │   ├── AdminPayments.tsx
│   │   │   ├── AdminReports.tsx
│   │   │   ├── AdminSettings.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   └── AdminVisa.tsx
│   │   ├── auth/              # Login, Register, Forgot Password, OTP
│   │   ├── booking/           # Booking confirmation
│   │   ├── cars/              # Car rental listing + booking
│   │   ├── dashboard/         # 12 customer dashboard pages
│   │   ├── esim/              # eSIM plans + purchase
│   │   ├── flights/           # Flight search results + booking
│   │   ├── holidays/          # Holiday packages + detail
│   │   ├── hotels/            # Hotel results + detail
│   │   ├── medical/           # Medical tourism listing + booking
│   │   ├── paybill/           # Bill payment
│   │   ├── recharge/          # Mobile recharge
│   │   ├── static/            # About, Contact, Terms, Privacy, FAQ, Careers, Refund, Blog
│   │   ├── visa/              # Visa services + application
│   │   ├── Index.tsx          # Homepage
│   │   └── NotFound.tsx       # 404 page
│   ├── App.tsx                # Root component (all routes defined here)
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles + Tailwind + CSS variables
├── .env.example               # Environment variable template
├── .lovable/plan.md           # Development plan & status tracking
├── BACKEND_API_SPEC.md        # Complete 87+ endpoint API specification
├── CHANGELOG.md               # Version history and release notes
├── Deployment.md              # Step-by-step VPS deployment guide
├── developer_documentation.md # Architecture & developer reference
├── package.json               # Dependencies and scripts
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build configuration
└── vitest.config.ts           # Test configuration
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** 18+ (use [nvm](https://github.com/nvm-sh/nvm) to install)
- **npm** or **bun** package manager

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/seven-trip.git
cd seven-trip
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` and set your API URL:

```env
VITE_API_BASE_URL=http://localhost:3001/api

# Optional: Google Drive integration for admin visa document management
# Get from https://console.cloud.google.com/apis/credentials (OAuth 2.0 Client ID)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Step 4: Start Development Server

```bash
npm run dev
```

The app will start at `http://localhost:8080`

### Step 5: Build for Production

```bash
npm run build
```

The output will be in the `dist/` folder — these are static files you serve with Nginx.

---

## 🔗 All Routes (70+ Pages)

### Public Pages

| Route                    | Description                      |
| ------------------------ | -------------------------------- |
| `/`                      | Homepage with 9-tab search       |
| `/flights`               | Flight search results + filters  |
| `/flights/book`          | Multi-step flight booking        |
| `/hotels`                | Hotel search results + filters   |
| `/hotels/:id`            | Hotel detail + room selection    |
| `/holidays`              | Holiday packages listing         |
| `/holidays/:id`          | Package detail + itinerary       |
| `/visa`                  | Visa services by country         |
| `/visa/apply`            | Multi-step visa application      |
| `/medical`               | Medical tourism hospitals        |
| `/medical/book`          | Medical booking form             |
| `/cars`                  | Car rental listing + filters     |
| `/cars/book`             | Car booking form                 |
| `/esim`                  | eSIM data plans by country       |
| `/esim/purchase`         | eSIM purchase form               |
| `/recharge`              | Mobile recharge (all operators)  |
| `/paybill`               | Utility bill payment             |
| `/booking/confirmation`  | Booking confirmation + PDF       |
| `/about`                 | About us                         |
| `/contact`               | Contact form (API-wired)         |
| `/blog`                  | Travel blog with categories      |
| `/terms`                 | Terms of service                 |
| `/privacy`               | Privacy policy                   |
| `/refund-policy`         | Refund policy                    |
| `/faq`                   | FAQ with category filter         |
| `/careers`               | Job listings with apply          |

### Auth Pages (No Header/Footer)

| Route                   | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `/auth/login`           | Customer login                                 |
| `/auth/register`        | Customer registration (with NID/Passport upload) |
| `/auth/forgot-password` | Password reset request                         |
| `/auth/verify-otp`      | OTP verification                               |
| `/admin/login`          | Admin login (hidden)                           |

### Customer Dashboard (Protected — Login Required)

| Route                          | Description                         |
| ------------------------------ | ----------------------------------- |
| `/dashboard`                   | Overview with charts & stats        |
| `/dashboard/bookings`          | My bookings (12 status filters)     |
| `/dashboard/tickets`           | E-Tickets (view + PDF download)     |
| `/dashboard/transactions`      | Transaction ledger + export         |
| `/dashboard/e-transactions`    | Electronic payment transactions     |
| `/dashboard/payments`          | Make payment (7 methods + receipt)  |
| `/dashboard/invoices`          | Invoices (view + PDF + CSV export)  |
| `/dashboard/pay-later`         | Outstanding dues & pay now          |
| `/dashboard/travellers`        | Saved traveller profiles (CRUD)    |
| `/dashboard/wishlist`          | Saved flights/hotels/holidays      |
| `/dashboard/search-history`    | Past searches with repeat action   |
| `/dashboard/settings`          | Profile, password, notifications   |

### Admin Panel (Admin Role Required)

| Route                          | Description                               |
| ------------------------------ | ----------------------------------------- |
| `/admin`                       | Analytics dashboard + revenue charts      |
| `/admin/bookings`              | Manage all bookings + status transitions  |
| `/admin/users`                 | User management (add/suspend/delete/verify ID) |
| `/admin/payments`              | All payment transactions + export         |
| `/admin/payment-approvals`     | Approve/reject manual payments            |
| `/admin/invoices`              | Create, download, print, remind invoices  |
| `/admin/reports`               | Revenue reports + charts + CSV export     |
| `/admin/discounts`             | Discount codes + price rules              |
| `/admin/visa`                  | Visa apps (process/approve/PDF/Google Drive) |
| `/admin/settings`              | System settings + API keys + Google Drive |
| `/admin/cms/homepage`          | CMS — Homepage sections                  |
| `/admin/cms/pages`             | CMS — Static pages                       |
| `/admin/cms/blog`              | CMS — Blog posts                         |
| `/admin/cms/promotions`        | CMS — Promotions                         |
| `/admin/cms/media`             | CMS — Media library                      |
| `/admin/cms/email-templates`   | CMS — Email templates                    |
| `/admin/cms/destinations`      | CMS — Destinations                       |
| `/admin/cms/booking-forms`     | CMS — Booking form editor                |
| `/admin/cms/footer`            | CMS — Footer content                     |
| `/admin/cms/seo`               | CMS — SEO meta tags                      |

---

## 🔐 Authentication Flow

1. User submits email + password on `/auth/login`
2. Frontend sends `POST /api/auth/login` to your backend
3. Backend returns `{ user, accessToken, refreshToken }`
4. Tokens stored in `localStorage` (`auth_token`, `refresh_token`, `user`)
5. All subsequent API calls include `Authorization: Bearer <token>` header
6. If a 401 is received, the client automatically tries to refresh the token via `POST /api/auth/refresh`
7. If refresh fails, user is logged out and redirected

### User Roles

| Role          | Access                                        |
| ------------- | --------------------------------------------- |
| `customer`    | Public site + Customer Dashboard              |
| `admin`       | Public site + Customer Dashboard + Admin Panel |
| `super_admin` | Full access including system settings          |

---

## 💰 Currency & Localization

- **Currency:** BDT (৳) — Bangladeshi Taka
- **Language:** English (default), বাংলা (configurable)
- **Phone Format:** +880 1XXX-XXXXXX
- **Support:** support@seventrip.com.bd
- **Payment Methods:** bKash, Nagad, Rocket, Bank Deposit, Bank Transfer, Cheque, Visa/Mastercard

All configurable in `src/lib/config.ts`.

---

## 🔌 API Integrations (Admin-Configurable)

All 3rd-party API keys are managed via Admin → Settings → API Integrations:

| Integration               | Category        | Purpose                              |
| ------------------------- | --------------- | ------------------------------------ |
| Flight GDS (BDFare)       | Travel          | Real-time flight search & booking    |
| Hotel Supplier API        | Travel          | Hotel inventory & rates              |
| eSIM Provider             | Digital         | International eSIM provisioning      |
| Mobile Recharge Gateway   | Digital         | BD telecom operator recharge         |
| Bill Payment Gateway      | Digital         | Utility bill processing              |
| bKash Payment Gateway     | Payment         | Mobile payment integration           |
| Nagad Payment Gateway     | Payment         | Mobile payment integration           |
| SSLCommerz (Cards)        | Payment         | Visa/Mastercard/AMEX processing      |
| SMS Gateway               | Communication   | OTP & transactional SMS              |
| **Google Drive**          | **Cloud Storage** | **One-click visa doc upload to Drive** |

### Google Drive Setup (Admin → Settings → Google Drive)

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Set Application Type to **"Web application"**
4. Add your domain to **"Authorized JavaScript origins"** (e.g. `https://seventrip.com.bd`)
5. Copy the **Client ID** and paste it into Admin → Settings → Google Drive
6. Enable the **[Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com)** in your project
7. Done! The "Save to Google Drive" button in Visa Management will now work

> **Note:** The Client ID is a public/publishable key and is safe to store in the browser.

---

## 📜 Available Scripts

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Start dev server (port 8080, hot reload)      |
| `npm run build`      | Build for production → `dist/` folder         |
| `npm run preview`    | Preview production build locally              |
| `npm run lint`       | Run ESLint                                    |
| `npm run test`       | Run tests once                                |
| `npm run test:watch` | Run tests in watch mode                       |

---

## 🚀 Deployment

See [Deployment.md](./Deployment.md) for the complete step-by-step VPS deployment guide.

### Quick Deploy Command

```bash
cd ~/projects/all-stars-atlas && git pull && npm install && npm run build && sudo cp -r dist/* /var/www/seventrip/ && cd backend && npm install && pm2 restart all
```

---

## 📚 Documentation

| Document                                          | Description                                |
| ------------------------------------------------- | ------------------------------------------ |
| [README.md](./README.md)                          | This file — project overview               |
| [Deployment.md](./Deployment.md)                  | VPS deployment guide (Ubuntu/Nginx/PM2)    |
| [developer_documentation.md](./developer_documentation.md) | Architecture & developer reference |
| [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md)      | Full 86-endpoint backend API contract      |
| [.lovable/plan.md](./.lovable/plan.md)            | Development roadmap & status               |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

Proprietary — Seven Trip © 2026. All rights reserved.
