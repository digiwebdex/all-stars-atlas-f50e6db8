# Seven Trip — Bangladesh's #1 Travel Platform

> Full-stack travel booking platform built with React + TypeScript. Self-hosted on Ubuntu VPS with a separate Node.js REST API backend.

---

## 🌐 What is Seven Trip?

Seven Trip is a complete travel booking platform (like Booking.com or MakeMyTrip) built for the Bangladesh market. It supports:

- ✈️ **Flight Search & Booking**
- 🏨 **Hotel Search & Booking**
- 🏖️ **Holiday Packages**
- 📋 **Visa Application & Tracking**
- 🏥 **Medical Tourism**
- 🚗 **Car Rental**
- 📱 **eSIM Data Plans**
- 📞 **Mobile Recharge**
- 💡 **Utility Bill Payment**
- 👤 **Customer Dashboard** (bookings, tickets, travellers, payments, wishlist)
- 🔐 **Admin Panel** (full CMS, user management, reports, visa processing)

---

## 🧰 Tech Stack

| Layer        | Technology                                                      |
| ------------ | --------------------------------------------------------------- |
| **Frontend** | React 18, TypeScript, Vite 5                                    |
| **Styling**  | Tailwind CSS 3, shadcn/ui (Radix UI), Framer Motion            |
| **State**    | React Query (TanStack), React Context (Auth)                    |
| **Forms**    | React Hook Form + Zod validation                               |
| **Routing**  | React Router DOM v6                                             |
| **Charts**   | Recharts                                                        |
| **Backend**  | Node.js REST API (separate project, not included in this repo)  |
| **Database** | MySQL / MariaDB                                                 |
| **Hosting**  | Ubuntu VPS (Nginx for static files, PM2 for Node.js API)        |

> ⚠️ **No Lovable, Supabase, Firebase, or cloud vendor dependencies.** This is fully self-contained.

---

## 📁 Project Structure

```
seven-trip/
├── public/                    # Static assets (favicon, logo, robots.txt)
│   └── images/
│       └── seven-trip-logo.png
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── layout/            # Header, Footer, PublicLayout
│   │   ├── search/            # SearchWidget (9-tab search form)
│   │   ├── ui/                # shadcn/ui components (button, card, dialog, etc.)
│   │   ├── AdminRoute.tsx     # Route guard — admin only
│   │   ├── ErrorBoundary.tsx  # Global error handler
│   │   ├── ProtectedRoute.tsx # Route guard — logged-in users
│   │   ├── ThemeProvider.tsx  # Dark/light mode provider
│   │   └── ThemeToggle.tsx    # Dark/light toggle button
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication state (login, register, tokens)
│   ├── hooks/
│   │   ├── useAuth.ts         # Hook to access AuthContext
│   │   ├── use-mobile.tsx     # Responsive breakpoint hook
│   │   └── use-toast.ts      # Toast notification hook
│   ├── lib/
│   │   ├── api.ts             # HTTP client (fetch wrapper with JWT, refresh, interceptors)
│   │   ├── config.ts          # App config (API URL, currency, support info)
│   │   ├── constants.ts       # API endpoints, enums, static data
│   │   └── utils.ts           # Utility functions (cn helper)
│   ├── pages/
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── cms/           # CMS pages (blog, media, promotions, etc.)
│   │   │   ├── AdminBookings.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AdminPayments.tsx
│   │   │   ├── AdminReports.tsx
│   │   │   ├── AdminSettings.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   └── AdminVisa.tsx
│   │   ├── auth/              # Login, Register, Forgot Password, OTP
│   │   ├── booking/           # Booking confirmation
│   │   ├── cars/              # Car rental listing + booking
│   │   ├── dashboard/         # Customer dashboard (8 sub-pages)
│   │   ├── esim/              # eSIM plans + purchase
│   │   ├── flights/           # Flight search results + booking
│   │   ├── holidays/          # Holiday packages + detail
│   │   ├── hotels/            # Hotel results + detail
│   │   ├── medical/           # Medical tourism listing + booking
│   │   ├── paybill/           # Bill payment
│   │   ├── recharge/          # Mobile recharge
│   │   ├── static/            # About, Contact, Terms, Privacy, FAQ, Careers, Refund
│   │   ├── visa/              # Visa services + application
│   │   ├── Index.tsx          # Homepage
│   │   └── NotFound.tsx       # 404 page
│   ├── App.tsx                # Root component (all routes defined here)
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles + Tailwind + CSS variables
├── .env.example               # Environment variable template
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

## 🔗 All Routes (60+ Pages)

### Public Pages

| Route                    | Description              |
| ------------------------ | ------------------------ |
| `/`                      | Homepage with search     |
| `/flights`               | Flight search results    |
| `/flights/book`          | Flight booking flow      |
| `/hotels`                | Hotel search results     |
| `/hotels/:id`            | Hotel detail page        |
| `/holidays`              | Holiday packages         |
| `/holidays/:id`          | Holiday detail page      |
| `/visa`                  | Visa services            |
| `/visa/apply`            | Visa application form    |
| `/medical`               | Medical tourism listing  |
| `/medical/book`          | Medical booking form     |
| `/cars`                  | Car rental listing       |
| `/cars/book`             | Car booking form         |
| `/esim`                  | eSIM data plans          |
| `/esim/purchase`         | eSIM purchase form       |
| `/recharge`              | Mobile recharge          |
| `/paybill`               | Utility bill payment     |
| `/booking/confirmation`  | Booking confirmation     |
| `/about`                 | About us                 |
| `/contact`               | Contact form             |
| `/terms`                 | Terms of service         |
| `/privacy`               | Privacy policy           |
| `/refund-policy`         | Refund policy            |
| `/faq`                   | FAQ                      |
| `/careers`               | Careers / Job listings   |

### Auth Pages (No Header/Footer)

| Route                  | Description            |
| ---------------------- | ---------------------- |
| `/auth/login`          | Customer login         |
| `/auth/register`       | Customer registration  |
| `/auth/forgot-password`| Password reset request |
| `/auth/verify-otp`     | OTP verification       |
| `/admin/login`         | Admin login (hidden)   |

### Customer Dashboard (Protected — Login Required)

| Route                      | Description          |
| -------------------------- | -------------------- |
| `/dashboard`               | Overview / stats     |
| `/dashboard/bookings`      | My bookings          |
| `/dashboard/tickets`       | E-Tickets (download) |
| `/dashboard/transactions`  | Transaction history  |
| `/dashboard/payments`      | Make a payment       |
| `/dashboard/travellers`    | Manage travellers    |
| `/dashboard/wishlist`      | Saved items          |
| `/dashboard/settings`      | Profile settings     |

### Admin Panel (Admin Role Required)

| Route                          | Description             |
| ------------------------------ | ----------------------- |
| `/admin`                       | Admin dashboard         |
| `/admin/bookings`              | Manage all bookings     |
| `/admin/users`                 | User management         |
| `/admin/payments`              | Payment management      |
| `/admin/reports`               | Reports & analytics     |
| `/admin/visa`                  | Visa applications       |
| `/admin/settings`              | System settings         |
| `/admin/cms/pages`             | CMS — Static pages      |
| `/admin/cms/blog`              | CMS — Blog posts        |
| `/admin/cms/promotions`        | CMS — Promotions        |
| `/admin/cms/media`             | CMS — Media library     |
| `/admin/cms/email-templates`   | CMS — Email templates   |
| `/admin/cms/destinations`      | CMS — Destinations      |

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
- **Language:** English (default)
- **Phone Format:** +880 1XXX-XXXXXX
- **Support:** support@seventrip.com.bd

All configurable in `src/lib/config.ts`.

---

## 📜 Available Scripts

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `npm run dev`    | Start dev server (port 8080, hot reload)      |
| `npm run build`  | Build for production → `dist/` folder         |
| `npm run preview`| Preview production build locally              |
| `npm run lint`   | Run ESLint                                    |
| `npm run test`   | Run tests once                                |
| `npm run test:watch` | Run tests in watch mode                   |

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
