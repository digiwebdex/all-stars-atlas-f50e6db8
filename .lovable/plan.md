

# Complete Seven Trip Platform -- Zero to 100%

## Current State Assessment

The frontend has a solid UI shell with ~50 pages/components, but everything runs on **hardcoded mock data** with **zero backend**, **no authentication**, **no database**, and **5 search tabs showing "Coming Soon"**. No buttons actually perform actions (create, edit, delete, save, search). It's a static prototype.

## What Needs to Be Built

Since you're hosting on your own Ubuntu VPS with no Lovable/Supabase dependencies, the architecture will be:

- **Frontend**: React + TypeScript (current stack, fully self-contained)
- **Backend**: Node.js REST API (separate project you'll deploy alongside)
- **Database**: MySQL/MariaDB

However, **Lovable can only build the frontend**. The backend (Node.js + MySQL) must be built separately outside Lovable. What we CAN do is build a **complete, production-ready frontend** that:

1. Has full UI for every feature (no "Coming Soon")
2. Uses a centralized API service layer ready to connect to your backend
3. Has proper state management, form validation, error handling
4. Has working client-side auth flow (login/register/logout with token management)

---

## Phase 1: Eliminate All "Coming Soon" Tabs

Build full search forms for the 5 missing SearchWidget tabs:

- **Medical Tourism**: Destination country, treatment type, hospital preference, travel dates, patients count
- **Cars**: Pickup/drop-off location, dates/times, car type preference
- **eSIM**: Destination country, data plan duration, activation date
- **Recharge**: Operator selection, phone number, amount, recharge type (prepaid/postpaid)
- **Pay Bill**: Biller category, biller name, account/subscriber number, amount

---

## Phase 2: API Service Layer + Auth System

Create a centralized API client and auth context:

- **`src/lib/api.ts`**: Base HTTP client with interceptors, token management, error handling -- configured to point at your VPS backend URL (environment variable)
- **`src/contexts/AuthContext.tsx`**: Full auth state (login, register, logout, OTP verify, forgot password, token refresh)
- **`src/hooks/useAuth.ts`**: Hook for accessing auth state anywhere
- Protected route wrapper components for dashboard and admin routes
- Login/Register forms wired to auth context with proper validation (Zod + react-hook-form)

---

## Phase 3: Wire All Forms and Actions

Make every button, form, and action functional with the API layer:

**Public Site:**
- All search forms submit to API and navigate to results pages with query params
- Flight/Hotel/Holiday/Visa results pages read search params and call API
- Booking flows submit real form data through multi-step state
- Contact form submits messages

**Customer Dashboard:**
- Bookings list fetches from API with real filtering/pagination
- Traveller CRUD (add/edit/delete) fully wired
- Payment submission with file upload for receipts
- Transaction history with real API calls
- Settings forms (profile update, password change) submit to API
- Notification preferences save to API

**Admin Panel:**
- All CRUD operations (users, bookings, payments) wired
- CMS pages/blog/promotions/destinations/media -- full create/edit/delete modals
- Email template editor with preview
- Visa management (approve/reject applications, manage countries)
- Reports with date range filtering via API
- Settings (site config, payment gateways, SMTP) save to API
- Admin auth with role-based access

---

## Phase 4: Missing Pages and Features

Build pages that don't exist yet:

- **`/auth/forgot-password`**: Password reset request form
- **`/auth/verify-otp`**: OTP verification page
- **`/dashboard/tickets`**: E-ticket management with download/print
- **`/dashboard/wishlist`**: Saved flights/hotels/packages
- **FAQ page** (`/faq`)
- **Careers page** (`/careers`)
- **Medical tourism results/booking pages**
- **Car rental results/booking pages**
- **eSIM purchase flow page**
- **Recharge confirmation page**
- **Bill payment confirmation page**
- **Admin CMS page editor** (rich text/markdown editor modal)
- **Admin blog post editor** (full create/edit form with content)
- **Admin user detail/edit page**
- **Admin booking detail page** (with status change workflow)

---

## Phase 5: State Management + Data Flow

- React Query for all server state (caching, background refetch, optimistic updates)
- Toast notifications on all actions (success/error feedback)
- Loading skeletons on all data-fetching pages
- Empty states for all lists
- Pagination components wired to API responses
- Global error boundary

---

## Technical Details

### New Files to Create (~30+ files)

```text
src/lib/api.ts                          -- HTTP client
src/lib/constants.ts                    -- API URLs, enums
src/contexts/AuthContext.tsx            -- Auth provider
src/hooks/useAuth.ts                   -- Auth hook
src/components/ProtectedRoute.tsx      -- Route guard
src/components/AdminRoute.tsx          -- Admin route guard
src/pages/auth/ForgotPassword.tsx      -- Password reset
src/pages/auth/VerifyOTP.tsx           -- OTP verification
src/pages/dashboard/DashboardTickets.tsx
src/pages/dashboard/DashboardWishlist.tsx
src/pages/medical/MedicalServices.tsx
src/pages/medical/MedicalBooking.tsx
src/pages/cars/CarRental.tsx
src/pages/cars/CarBooking.tsx
src/pages/esim/ESIMPlans.tsx
src/pages/esim/ESIMPurchase.tsx
src/pages/recharge/RechargePage.tsx
src/pages/paybill/PayBillPage.tsx
src/pages/static/FAQ.tsx
src/pages/static/Careers.tsx
src/pages/admin/AdminBookingDetail.tsx
src/pages/admin/AdminUserDetail.tsx
src/pages/admin/cms/CMSPageEditor.tsx
src/pages/admin/cms/CMSBlogEditor.tsx
```

### Files to Modify (~40+ files)

- Every existing page will be updated to use the API layer instead of hardcoded data
- SearchWidget.tsx -- add 5 new tab forms
- App.tsx -- add new routes + protected route wrappers
- All dashboard pages -- wire to React Query + API
- All admin pages -- wire CRUD operations
- Login/Register -- wire to AuthContext
- Header -- show user state (logged in/out)

### Environment Configuration

```text
src/lib/config.ts -- reads VITE_API_BASE_URL from .env
.env.example      -- template for API URL configuration
```

This approach keeps the frontend 100% self-contained with zero Lovable or Supabase dependencies. You just set `VITE_API_BASE_URL=https://api.seventrip.com.bd` in your `.env` and deploy the built static files via Nginx on your VPS.

