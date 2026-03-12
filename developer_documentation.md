# Seven Trip — Developer Documentation

> This document explains **how the codebase works**, how to add features, and how every part connects. Written for developers who may be new to React or this project.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [How the Frontend Connects to the Backend](#how-the-frontend-connects-to-the-backend)
3. [API Client (`src/lib/api.ts`)](#api-client)
4. [Authentication System](#authentication-system)
5. [Route Guards](#route-guards)
6. [Routing Structure](#routing-structure)
7. [Component Architecture](#component-architecture)
8. [Styling System](#styling-system)
9. [State Management](#state-management)
10. [Forms & Validation](#forms--validation)
11. [Search Widget (Homepage Tabs)](#search-widget)
12. [Adding a New Page](#adding-a-new-page)
13. [Adding a New API Endpoint](#adding-a-new-api-endpoint)
14. [Adding a New Dashboard Page](#adding-a-new-dashboard-page)
15. [Adding a New Admin Page](#adding-a-new-admin-page)
16. [Dark Mode / Theming](#dark-mode--theming)
17. [Error Handling](#error-handling)
18. [Testing](#testing)
19. [Environment Variables](#environment-variables)
20. [Backend API Contract](#backend-api-contract)

---

## 1. Architecture Overview <a name="architecture-overview"></a>

```
┌─────────────────────────────────────────────────────┐
│                   USER'S BROWSER                     │
│                                                      │
│  ┌───────────────────────────────────────────────┐   │
│  │            React Frontend (Vite)               │   │
│  │                                                │   │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────────┐  │   │
│  │  │  Pages   │  │  Comps  │  │  Contexts     │  │   │
│  │  │ (60+)    │  │ (UI)    │  │ (Auth, Theme) │  │   │
│  │  └────┬─────┘  └────┬────┘  └──────┬───────┘  │   │
│  │       │              │              │          │   │
│  │       └──────────────┼──────────────┘          │   │
│  │                      │                         │   │
│  │              ┌───────▼────────┐                │   │
│  │              │   API Client   │                │   │
│  │              │  (src/lib/api) │                │   │
│  │              └───────┬────────┘                │   │
│  └──────────────────────┼────────────────────────┘   │
│                         │ HTTP (fetch)                │
└─────────────────────────┼────────────────────────────┘
                          │
                ┌─────────▼──────────┐
                │  Node.js REST API  │  ← Your backend (separate project)
                │  (Express/Fastify) │
                └─────────┬──────────┘
                          │
                ┌─────────▼──────────┐
                │  MySQL / MariaDB   │
                └────────────────────┘
```

**Key principle:** The frontend is a pure static SPA (Single Page Application). It communicates with the backend ONLY through HTTP API calls. There is NO server-side rendering.

---

## 2. How the Frontend Connects to the Backend <a name="how-the-frontend-connects-to-the-backend"></a>

### The Environment Variable

In your `.env` file (created from `.env.example`):

```env
VITE_API_BASE_URL=https://api.seventrip.com.bd/api
```

This is read by `src/lib/config.ts`:

```typescript
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  // ...
};
```

**For local development:** Point to `http://localhost:3001/api` (where your backend runs).
**For production:** Point to `https://api.seventrip.com.bd/api`.

### How API Calls Work

Every API call goes through the centralized client in `src/lib/api.ts`:

```typescript
import { api } from '@/lib/api';

// GET request
const flights = await api.get('/flights/search', { from: 'DAC', to: 'CXB' });

// POST request
const booking = await api.post('/flights/book', { flightId: '123', passengers: [...] });

// File upload
const result = await api.upload('/media/upload', formData);
```

---

## 3. API Client (`src/lib/api.ts`) <a name="api-client"></a>

The `ApiClient` class handles:

| Feature              | How it works                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| **Base URL**         | Reads from `VITE_API_BASE_URL` env var                                    |
| **JSON Headers**     | Automatically sets `Content-Type: application/json`                       |
| **Auth Token**       | Reads `auth_token` from localStorage, adds `Authorization: Bearer <token>`|
| **Token Refresh**    | On 401 error, tries `POST /auth/refresh` with refresh token              |
| **Auto Logout**      | If refresh fails, clears tokens and fires `auth:logout` event            |
| **Query Params**     | `api.get('/search', { q: 'hello' })` → `/search?q=hello`                |
| **Error Handling**   | Throws `{ message, status, errors }` on non-2xx responses               |
| **File Upload**      | `api.upload()` sends FormData without Content-Type (browser sets it)     |

### Methods

```typescript
api.get<T>(endpoint, params?)        // GET
api.post<T>(endpoint, body?)         // POST
api.put<T>(endpoint, body?)          // PUT
api.patch<T>(endpoint, body?)        // PATCH
api.delete<T>(endpoint)              // DELETE
api.upload<T>(endpoint, formData)    // POST with FormData
```

---

## 4. Authentication System <a name="authentication-system"></a>

### Files Involved

| File                          | Purpose                                      |
| ----------------------------- | -------------------------------------------- |
| `src/contexts/AuthContext.tsx` | React Context that holds user state + methods |
| `src/hooks/useAuth.ts`        | Hook to access auth state in any component    |
| `src/lib/api.ts`              | Sends tokens with requests, handles refresh   |

### AuthContext provides:

```typescript
interface AuthContextType {
  // State
  user: User | null;           // Current logged-in user object
  isAuthenticated: boolean;    // true if user is logged in
  isLoading: boolean;          // true while checking stored session
  isAdmin: boolean;            // true if user.role is admin or super_admin

  // Actions
  login(payload: { email, password }): Promise<void>;
  adminLogin(payload: { email, password }): Promise<void>;
  register(payload: { firstName, lastName, email, phone, password }): Promise<void>;
  logout(): void;
  forgotPassword(email: string): Promise<void>;
  verifyOtp(email: string, otp: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
  updateProfile(data: Partial<User>): Promise<void>;
}
```

### Using in a Component

```tsx
import { useAuth } from '@/hooks/useAuth';

const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <p>Please log in</p>;

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
};
```

### Token Storage (localStorage)

| Key              | Value                           |
| ---------------- | ------------------------------- |
| `auth_token`     | JWT access token                |
| `refresh_token`  | JWT refresh token               |
| `user`           | JSON string of the User object  |

---

## 5. Route Guards <a name="route-guards"></a>

### ProtectedRoute (for customer dashboard)

```tsx
// In App.tsx:
<Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
```

- If NOT logged in → redirects to `/auth/login`
- Passes `location` so user returns after login

### AdminRoute (for admin panel)

```tsx
// In App.tsx:
<Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
```

- If NOT logged in → redirects to `/admin/login`
- If logged in but NOT admin → shows "Access Denied"

---

## 6. Routing Structure <a name="routing-structure"></a>

All routes are defined in `src/App.tsx`. Three layout groups:

1. **`<PublicLayout />`** — Header + Footer + `<Outlet />` → all public pages
2. **`<DashboardLayout />`** — Sidebar + top bar + `<Outlet />` → customer dashboard
3. **`<AdminLayout />`** — Admin sidebar + `<Outlet />` → admin panel

Auth pages (`/auth/*`) and admin login have NO layout wrapper (standalone full-screen).

---

## 7. Component Architecture <a name="component-architecture"></a>

### Component Hierarchy

```
ErrorBoundary
  └── ThemeProvider
       └── AuthProvider
            └── QueryClientProvider
                 └── BrowserRouter
                      └── Routes
                           ├── PublicLayout (Header + Footer)
                           │    └── Page components
                           ├── DashboardLayout (Sidebar)
                           │    └── Dashboard page components
                           └── AdminLayout (Admin sidebar)
                                └── Admin page components
```

### shadcn/ui Components (`src/components/ui/`)

These are pre-built, accessible UI components. **Do NOT modify these files directly.** They are generated by shadcn/ui.

Common ones you'll use:

| Component    | Import                                    | Use for                    |
| ------------ | ----------------------------------------- | -------------------------- |
| `Button`     | `@/components/ui/button`                  | All buttons                |
| `Card`       | `@/components/ui/card`                    | Content containers         |
| `Input`      | `@/components/ui/input`                   | Text inputs                |
| `Dialog`     | `@/components/ui/dialog`                  | Modals / popups            |
| `Badge`      | `@/components/ui/badge`                   | Status labels              |
| `Select`     | `@/components/ui/select`                  | Dropdown selects           |
| `Tabs`       | `@/components/ui/tabs`                    | Tab navigation             |
| `Table`      | `@/components/ui/table`                   | Data tables                |
| `Skeleton`   | `@/components/ui/skeleton`                | Loading placeholders       |
| `Toast`      | `@/hooks/use-toast`                       | Notifications              |

---

## 8. Styling System <a name="styling-system"></a>

### Rules

1. **NEVER use raw color values** in components (no `text-blue-500`, `bg-red-100`)
2. **ALWAYS use semantic tokens**: `text-foreground`, `bg-card`, `text-primary`, `bg-muted`, etc.
3. Colors are defined as CSS variables in `src/index.css` using HSL
4. Tailwind maps them in `tailwind.config.ts`

### Available Tokens

| Token                  | Usage                              |
| ---------------------- | ---------------------------------- |
| `bg-background`        | Page background                    |
| `bg-card`              | Card backgrounds                   |
| `bg-muted`             | Subtle backgrounds                 |
| `bg-primary`           | Primary brand color (buttons, etc) |
| `bg-secondary`         | Secondary accent                   |
| `bg-accent`            | Accent highlights                  |
| `bg-destructive`       | Error / danger                     |
| `text-foreground`      | Main text                          |
| `text-muted-foreground`| Secondary text                     |
| `text-primary`         | Brand-colored text                 |
| `border-border`        | Default borders                    |

### Adding a New Color

1. Add the CSS variable in `src/index.css` (in both `:root` and `.dark`):
   ```css
   :root {
     --success: 142 76% 36%;
   }
   .dark {
     --success: 142 70% 45%;
   }
   ```

2. Add to `tailwind.config.ts`:
   ```ts
   colors: {
     success: \"hsl(var(--success))\",
   }
   ```

3. Use in components: `bg-success text-success`

---

## 9. State Management <a name="state-management"></a>

| Type            | Tool                  | Where                           |
| --------------- | --------------------- | ------------------------------- |
| **Auth state**  | React Context         | `AuthContext.tsx`                |
| **Server data** | React Query           | `useQuery` / `useMutation`      |
| **Form state**  | React Hook Form       | Inside form components          |
| **UI state**    | `useState` / `useRef` | Local component state           |
| **Theme**       | React Context         | `ThemeProvider.tsx`              |

### React Query Example (fetching data from API)

```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const MyPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get('/dashboard/bookings'),
  });

  if (isLoading) return <Skeleton />;
  if (error) return <p>Error loading bookings</p>;

  return <BookingList bookings={data} />;
};
```

---

## 10. Forms & Validation <a name="forms--validation"></a>

Forms use **React Hook Form** with **Zod** schemas:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be 8+ characters'),
});

type FormData = z.infer<typeof schema>;

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    // call API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}
      {/* ... */}
    </form>
  );
};
```

---

## 11. Search Widget (Homepage Tabs) <a name="search-widget"></a>

The main search widget on the homepage (`src/components/search/SearchWidget.tsx`) has **9 tabs**:

1. **Flight** — From, To, Dates, Passengers, Class
2. **Hotel** — Destination, Check-in, Check-out, Rooms, Guests
3. **Holiday** — Destination, Month, Budget, Travellers
4. **Visa** — Country, Visa Type, Travel Date
5. **Medical** — Destination, Treatment, Hospital, Dates, Patients
6. **Cars** — Pickup/Dropoff Location, Dates
7. **eSIM** — Country, Data Plan, Activation Date
8. **Recharge** — Operator, Phone, Amount, Type
9. **Pay Bill** — Category, Biller, Account, Amount

Each tab navigates to its respective page with query params:
```typescript
navigate(`/flights?from=${from}&to=${to}&date=${date}`);
```

### Flight Scope & Route Validation

The flight tab includes a **Domestic / International** scope toggle that enforces strict routing rules:

- **Domestic**: Both FROM and TO must be Bangladesh (BD) airports. Only BD airports appear in dropdowns.
- **International**: At least one airport must be outside Bangladesh. If FROM is BD, the TO dropdown only shows non-BD airports. If FROM is non-BD, all airports are available as TO.

**Centralized validation** is handled by two shared functions:
- `getScopedDestinationAirports(from)` — Returns the filtered airport list based on scope and origin country.
- `isScopeInvalidRoute(from, to)` — Returns `true` if the route violates scope rules (same airport, both BD on international, non-BD on domestic).

These functions are used consistently across:
- **Dropdown filtering** — `scopedToAirports`, `getMultiCityToAirports`
- **Swap button** — Blocks swap if swapped route would be invalid, shows toast error
- **Live FROM/TO change** — Auto-clears TO if it becomes invalid after FROM change
- **Scope switch** — Resets airports that don't match the new scope (single + multi-city)
- **Search submit** — Final validation before navigation for both single and multi-city
- **Multi-city segment updates** — Auto-clears TO if changing FROM makes the route invalid

---

## 12. Adding a New Page <a name="adding-a-new-page"></a>

### Step-by-Step

1. **Create the file:** `src/pages/myfeature/MyPage.tsx`

```tsx
const MyPage = () => {
  return (
    <div className="min-h-screen bg-muted/30">
      <section className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">My New Page</h1>
      </section>
    </div>
  );
};

export default MyPage;
```

2. **Add the route in `src/App.tsx`:**

```tsx
import MyPage from "@/pages/myfeature/MyPage";

// Inside <Routes>, under the PublicLayout:
<Route path="/my-page" element={<MyPage />} />
```

3. **Add navigation link** in Header or Footer if needed.

---

## 13. Adding a New API Endpoint <a name="adding-a-new-api-endpoint"></a>

1. **Add the endpoint URL to `src/lib/constants.ts`:**

```typescript
export const API_ENDPOINTS = {
  // ...existing endpoints
  MY_FEATURE_LIST: '/my-feature/list',
  MY_FEATURE_CREATE: '/my-feature/create',
};
```

2. **Use in your component:**

```typescript
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

const data = await api.get(API_ENDPOINTS.MY_FEATURE_LIST);
await api.post(API_ENDPOINTS.MY_FEATURE_CREATE, { name: 'Test' });
```

---

## 14. Adding a New Dashboard Page <a name="adding-a-new-dashboard-page"></a>

1. Create `src/pages/dashboard/DashboardMyPage.tsx`
2. Add route in `App.tsx` inside the `/dashboard` route group:
   ```tsx
   <Route path="my-page" element={<DashboardMyPage />} />
   ```
3. Add sidebar item in `src/pages/dashboard/DashboardLayout.tsx`:
   ```typescript
   { label: \"My Page\", href: \"/dashboard/my-page\", icon: SomeIcon },
   ```

---

## 15. Adding a New Admin Page <a name="adding-a-new-admin-page"></a>

Same as dashboard but:
1. Create in `src/pages/admin/`
2. Add route inside `/admin` route group in `App.tsx`
3. Add sidebar item in `src/pages/admin/AdminLayout.tsx`

---

## 16. Dark Mode / Theming <a name="dark-mode--theming"></a>

- `ThemeProvider` reads user preference from `localStorage` key `"theme"`
- Values: `"light"`, `"dark"`, `"system"`
- Adds `.dark` class to `<html>` element
- All CSS variables in `src/index.css` have both `:root` and `.dark` values
- `ThemeToggle` component provides the UI button

---

## 17. Error Handling <a name="error-handling"></a>

### Global Error Boundary

`src/components/ErrorBoundary.tsx` wraps the entire app. If any component throws during render, it shows a friendly error page instead of a blank screen.

### API Error Handling

```typescript
try {
  await api.post('/auth/login', credentials);
} catch (err: any) {
  // err = { message: string, status: number, errors?: Record<string, string[]> }
  toast({
    title: \"Error\",
    description: err.message,
    variant: \"destructive\"
  });
}
```

### Toast Notifications

```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

// Success
toast({ title: \"Success\", description: \"Booking created!\" });

// Error
toast({ title: \"Error\", description: \"Something went wrong\", variant: \"destructive\" });
```

---

## 18. Testing <a name="testing"></a>

Tests use **Vitest** + **React Testing Library**.

```bash
npm run test          # Run all tests once
npm run test:watch    # Watch mode
```

Test files go in `src/test/` or next to the component as `MyComponent.test.tsx`.

---

## 19. Environment Variables <a name="environment-variables"></a>

| Variable              | Required | Description                              | Example                               |
| --------------------- | -------- | ---------------------------------------- | ------------------------------------- |
| `VITE_API_BASE_URL`   | Yes      | Your backend API base URL                | `https://api.seventrip.com.bd/api`    |

> All `VITE_*` variables are embedded at build time. Changing them requires a rebuild.

---

## 20. Backend API Contract <a name="backend-api-contract"></a>

Your Node.js backend must implement these endpoints. All are defined in `src/lib/constants.ts`.

### Authentication

| Method | Endpoint              | Body                                                    | Response                                   |
| ------ | --------------------- | ------------------------------------------------------- | ------------------------------------------ |
| POST   | `/auth/login`         | `{ email, password }`                                   | `{ user, accessToken, refreshToken }`      |
| POST   | `/auth/register`      | `{ firstName, lastName, email, phone, password }`       | `{ user, accessToken, refreshToken }`      |
| POST   | `/auth/logout`        | `{ refreshToken }`                                      | `{}`                                       |
| POST   | `/auth/refresh`       | `{ refreshToken }`                                      | `{ accessToken, refreshToken }`            |
| POST   | `/auth/forgot-password`| `{ email }`                                            | `{ message }`                              |
| POST   | `/auth/verify-otp`    | `{ email, otp }`                                        | `{ token }` (for password reset)           |
| POST   | `/auth/reset-password`| `{ token, password }`                                   | `{ message }`                              |

### User Object Shape

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+8801234567890",
  "avatar": "https://...",
  "role": "customer",
  "emailVerified": true,
  "phoneVerified": false,
  "createdAt": "2026-01-15T10:30:00Z"
}
```

### All Endpoints

```
POST   /auth/login
POST   /auth/register
POST   /auth/logout
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/verify-otp
POST   /auth/reset-password

GET    /flights/search?from=DAC&to=CXB&date=2026-03-01&passengers=2&class=Economy
GET    /flights/:id
POST   /flights/book
POST   /flights/upload-travel-docs
GET    /flights/travel-docs/:bookingId
GET    /flights/ancillaries?airlineCode=FZ&origin=DAC&destination=DXB&flightNumber=8508&departureDate=2026-03-14
GET    /flights/seat-map?airlineCode=FZ&origin=DAC&destination=DXB&aircraft=7M8&cabinClass=Economy

GET    /hotels/search?destination=Cox%27s+Bazar&checkin=2026-03-01&checkout=2026-03-05
GET    /hotels/:id
POST   /hotels/book

GET    /holidays/search?destination=Maldives
GET    /holidays/:id
POST   /holidays/book

GET    /visa/countries
POST   /visa/apply
GET    /visa/applications

GET    /medical/search
GET    /medical/hospitals
POST   /medical/book

GET    /cars/search
GET    /cars/:id
POST   /cars/book

GET    /esim/plans?country=Thailand
POST   /esim/purchase

GET    /recharge/operators
POST   /recharge/submit

GET    /paybill/categories
GET    /paybill/billers?category=Electricity
POST   /paybill/submit

GET    /dashboard/stats
GET    /dashboard/bookings
GET    /dashboard/transactions
GET    /dashboard/travellers
PATCH  /dashboard/travellers/:id
DELETE /dashboard/travellers/:id
POST   /dashboard/travellers
GET    /dashboard/payments
GET    /dashboard/tickets
GET    /dashboard/wishlist
POST   /dashboard/wishlist
DELETE /dashboard/wishlist/:id
GET    /dashboard/settings
PATCH  /dashboard/settings/profile
PATCH  /dashboard/settings/password

POST   /admin/auth/login
GET    /admin/dashboard
GET    /admin/users
GET    /admin/users/:id
PATCH  /admin/users/:id
DELETE /admin/users/:id
GET    /admin/bookings
GET    /admin/bookings/:id
PATCH  /admin/bookings/:id
PATCH  /admin/bookings/:id/archive
DELETE /admin/bookings/:id
GET    /admin/payments
GET    /admin/reports
GET    /admin/settings
PATCH  /admin/settings
GET    /admin/visa
PATCH  /admin/visa/:id

GET    /admin/cms/pages
POST   /admin/cms/pages
PATCH  /admin/cms/pages/:id
DELETE /admin/cms/pages/:id
GET    /admin/cms/blog
POST   /admin/cms/blog
PATCH  /admin/cms/blog/:id
DELETE /admin/cms/blog/:id
GET    /admin/cms/promotions
POST   /admin/cms/promotions
PATCH  /admin/cms/promotions/:id
DELETE /admin/cms/promotions/:id
GET    /admin/cms/destinations
POST   /admin/cms/destinations
PATCH  /admin/cms/destinations/:id
DELETE /admin/cms/destinations/:id
GET    /admin/cms/media
POST   /admin/cms/media (multipart)
DELETE /admin/cms/media/:id
GET    /admin/cms/email-templates
PATCH  /admin/cms/email-templates/:id

POST   /contact/submit

GET    /rewards/balance
GET    /rewards/history?page=1&limit=20
GET    /rewards/coupons
POST   /rewards/redeem              { points }
POST   /rewards/validate-coupon     { code }
POST   /rewards/apply-coupon        { code, bookingId }
GET    /rewards/earn-rate
```

### Standard API Response Format

**Success:**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

**Error:**
```json
{
  "message": "Validation failed",
  "errors": {
    "email": ["Email is required"],
    "password": ["Must be 8+ characters"]
  }
}
```

---

## Common Patterns

### Loading Skeleton Pattern

```tsx
import { Skeleton } from "@/components/ui/skeleton";

if (isLoading) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
```

### Empty State Pattern

```tsx
import { PackageOpen } from "lucide-react";

if (data.length === 0) {
  return (
    <div className="py-16 text-center">
      <PackageOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
      <h3 className="font-bold">No items found</h3>
      <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
    </div>
  );
}
```

### Toast After Action Pattern

```tsx
const handleDelete = async (id: string) => {
  try {
    await api.delete(`/items/${id}`);
    toast({ title: \"Deleted\", description: \"Item removed successfully\" });
    queryClient.invalidateQueries({ queryKey: ['items'] }); // refresh list
  } catch (err: any) {
    toast({ title: \"Error\", description: err.message, variant: \"destructive\" });
  }
};
```

---

## Flight Search & Booking Architecture

### Trip Types

The search widget supports three trip types: **One-way**, **Round-trip**, and **Multi-city** (2–5 segments).

### 4-Step Mandatory Booking Flow

| Step | Content | API Source |
|------|---------|------------|
| **1. Flight Details** | Itinerary summary with segment cards | Already fetched from search |
| **2. Passenger Info + SSR** | Traveler forms (Title, Name, DOB, Passport, Nationality) + Special Services card (expandable per-passenger accordion) | SSR injected into **REST** `CreatePassengerNameRecordRQ` at booking |
| **3. Seat & Extras** | Interactive seat map + tabbed extra baggage/meal selection | **SOAP** `EnhancedSeatMapRQ` + `GetAncillaryOffersRQ` via `sabre-soap.js` |
| **4. Review & Pay** | Full summary: itinerary, passengers, seats, extras, SSR, fare breakdown | Aggregated client-side |

### Sabre Hybrid Architecture

Sabre uses a **hybrid REST + SOAP** approach:
- **REST API** (`sabre-flights.js`): OAuth v3 authentication, BFM flight search, PNR creation with SSR/DOCS/DOCA segments, ticketing, cancellation
- **SOAP API** (`sabre-soap.js`): SessionCreateRQ → BinarySecurityToken (14-min cache) → EnhancedSeatMapRQ (v6.0.0) + GetAncillaryOffersRQ (v3.0.0) → SessionCloseRQ
- **CreatePNR DateTime rule (critical)**: `EnhancedAirBookRQ.FlightSegment.DepartureDateTime/ArrivalDateTime` must be sent without timezone offsets. Backend normalizes ISO values (e.g., `2026-04-15T21:55:00+06:00`) to schema-safe Sabre format before `CreatePassengerNameRecordRQ`
- **CreatePNR DOCS schema rule (critical)**: In `SpecialReqDetails.SpecialService.SpecialServiceInfo.AdvancePassenger.Document`, Sabre rejects identity fields like `DateOfBirth`, `FirstName`, `LastName`, `Gender`. Only schema-safe document fields are sent (`Type`, `Number`, `IssueCountry`, `NationalityCountry`, optional `ExpirationDate`)

### Ancillaries Priority Chain

The `ancillaries.js` route queries providers in priority order:
1. **Sabre SOAP** — Real-time seat map + baggage/meal offers
2. **TTI** — Air Astra/S2 specific ancillaries
3. **Standard Fallback** — In-memory generic options

### Special Services (SSR) System

Per-passenger SSR options (sent as REST PNR segments):
- **Meals**: 16 IATA codes (AVML, VGML, MOML, KSML, DBML, CHML, BBML, GFML, LFML, LCML, NLML, SFML, FPML, RVML, SPML)
- **Wheelchair**: WCHR (door), WCHS (seat), WCHC (immobile)
- **Medical**: MEDA, BLND, DEAF toggles
- **UMNR**: Unaccompanied minor (child passengers only)
- **Pets**: PETC (cabin), AVIH (cargo)
- **FF#**: Airline code + frequent flyer number
- **DOCA**: Destination address (international)
- **OSI**: Free-text special request (70 chars)

### Seat Map Component (`src/components/flights/SeatMap.tsx`)

Interactive seat selection with:
- Aircraft-aware layout: narrowbody 3-3, widebody 3-3-3, ATR/Dash 2-2
- Per-passenger selection with auto-advance
- Seat types: standard, window, aisle, exit-row, extra-legroom, front-row, premium
- Color-coded legend and tooltip pricing
- Total seat cost integrated into fare sidebar

### Multi-City Search Flow

1. User adds 2–5 segments in `SearchWidget.tsx`, each with origin/destination/date.
2. Date validation enforces chronological order — segment N+1 date cannot be before segment N.
3. Search navigates to `/flights?tripType=multicity&segments=[JSON]`.
4. `FlightResults.tsx` detects `tripType=multicity`, parses segments, and sends a **single API call** to `/flights/search?tripType=multicity&segments=[JSON]`.
5. Backend sends all segments as multiple `OriginDestinationInformation` entries in a **single Sabre BFM request** — returns combined itineraries priced as one unit (matching BDFare behavior).
6. Results display as combined itinerary cards (`MultiCityFlightCard`) showing all segments in one card with a single total price and "Book Now" button.
7. Each card has an expandable "Flight Details" panel (`MultiCityExpandedDetails`) with 4 tabs: Flight Details, Fare Summary, Baggage, and Cancellation.
8. Only Sabre provider is used for multi-city searches; other providers (DB, TTI, BDF, FlyHub, Galileo, NDC, LCC) are skipped.

### Cabin Class Handling

- Cabin class (Economy/Business/First/Premium Economy) is sent to all GDS providers (TTI, BDFare, FlyHub, Sabre, etc.).
- The UI displays the **searched cabin class**, not the raw GDS fare basis code.

### Passenger Validation (FlightBooking.tsx)

- Per-passenger indexed error keys: `firstName_${index}`, `dob_${index}`, etc.
- Bangladesh phone regex: `/^01[3-9]\d{8}$/`
- Passport expiry must be 6+ months from departure for international flights.
- Max 9 total passengers; infants cannot exceed adults.
- Multi-city booking passes the combined flight object to the API.

### GDS Providers

| Provider | Route File | Notes |
|----------|-----------|-------|
| TTI/ZENITH | `backend/src/routes/tti-flights.js` | Air Astra, 5-min cache |
| BDFare | `backend/src/routes/bdf-flights.js` | BDFare API v2: `Response.Results[]` with `segments[].Airline/Origin/Destination`, `Fares[].BaseFare/Tax` |
| FlyHub | `backend/src/routes/flyhub-flights.js` | — |
| Sabre (REST) | `backend/src/routes/sabre-flights.js` | BFM search, PNR+SSR, ticketing |
| Sabre (SOAP) | `backend/src/routes/sabre-soap.js` | Seat maps, ancillaries |
| Galileo | `backend/src/routes/galileo-flights.js` | Travelport Universal API |
| NDC | `backend/src/routes/ndc-flights.js` | IATA NDC 21.3 |
| LCC | `backend/src/routes/lcc-flights.js` | Air Arabia, IndiGo, etc. |

All providers are searched in parallel via `Promise.allSettled` with deduplication.

### Deduplication Key (Critical)

The backend dedup key in `flights.js` must include ALL leg-level data to avoid collapsing valid round-trip combinations:

```
key = flightNumber + departureTime + arrivalTime + destination + stops + stopCodes + direction + [all legs' flightNumber@departureTime]
```

Previous bug: using only first-leg data caused all round-trip combos sharing the same outbound (e.g., 14 Gulf Air DAC→JED combos with different returns) to collapse into 1 result.

### Branded Fares (Sabre)

Sabre BFM returns multiple `pricingInformation[]` entries per itinerary when branded fares are available. Each entry represents a different fare brand (e.g., "Economy Light", "Economy Smart") with its own pricing, baggage, refund/rebooking policies. The normalizer extracts brand names from `fareComponentDescs` and passes them as `fareDetails[]` with `brandName`, `brandCode`, `baggage`, `handBaggage`, `mealIncluded`, `seatSelection`, `rebookingAllowed`, `cancellationAllowed` fields. The frontend `FareOptionsPanel` renders these as scrollable columns with the cheapest marked "Best Value".

### Sabre Compressed Response Handling

Sabre BFM supports a `CompressResponse` flag that returns results as a base64-encoded gzip blob under the key `compressedResponse` instead of plain JSON. This caused a critical bug (v3.9.0) where the normalizer saw 0 itineraries because it only handles `groupedItineraryResponse` or `OTA_AirLowFareSearchRS`. **Fix (v3.9.1):** The `CompressResponse` flag is removed from the BFM request body. As a safety fallback, if `compressedResponse` is still detected in the response, the backend decompresses it via `zlib.gunzipSync(Buffer.from(data, 'base64'))` before passing to the normalizer.

### NDC Fares

The BFM request includes `DataSources: { NDC: 'Enable' }`, but NDC content requires the Sabre agency PCC to have active NDC carrier agreements. Contact Sabre support to enable NDC content for your PCC if NDC fares are not appearing.

### Preferred Airline Filter

The search widget includes an optional airline dropdown. When selected, the `carrier` IATA code is passed as a query parameter to `GET /flights/search`. The backend applies a post-aggregation filter (`airlineCode === carrier`) after all providers return results, ensuring only flights from the selected airline are returned regardless of source provider.

### Zero-Mock Cabin Class Rule

The frontend NEVER overrides the cabin class returned by the API. If a user searches for Business class but the GDS returns only Economy fares (e.g., Air Astra ATR 72-600 has 70 Economy seats only — no Business class), the results will correctly show "Economy" with an amber info banner: **"Business class is not available on this route — showing available Economy class fares instead."** The `flight.cabinClass` field from the API is the single source of truth for display.

---

## 21. Reward Points System <a name="reward-points-system"></a>

### Overview

Users earn points on every confirmed booking and can redeem them for discount coupons applied during checkout.

- **Earning**: 1% of fare amount (configurable per service type in `points_rules` table)
- **Redemption**: 1 point = 1 BDT, redeemed as coupon codes (valid 90 days)
- **Services**: flight, hotel, holiday, visa, medical, car, esim, recharge

### Database Tables

| Table | Purpose |
|-------|---------|
| `user_points` | Per-user balance, total earned/redeemed |
| `point_transactions` | Ledger of earn/redeem/expire/adjust entries |
| `reward_coupons` | Generated coupons with status (active/used/expired) |
| `points_rules` | Admin-configurable earn rates per service type |

> ID compatibility: rewards tables use `CHAR(36)` for `user_id`/`booking_id` to match UUID primary keys in `users.id` and `bookings.id`.

Migration: `backend/database/reward-points-migration.sql`

### API Routes (`backend/src/routes/rewards.js`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/rewards/balance` | Yes | Current points balance |
| GET | `/rewards/history` | Yes | Transaction history (paginated) |
| GET | `/rewards/coupons` | Yes | User's coupons list |
| POST | `/rewards/redeem` | Yes | Convert points → coupon code |
| POST | `/rewards/validate-coupon` | Yes | Check coupon validity at checkout |
| POST | `/rewards/apply-coupon` | Yes | Apply coupon to a booking |
| GET | `/rewards/earn-rate` | No | Public earn rates for display |

> Middleware note: rewards endpoints use `authenticate` from `backend/src/middleware/auth.js` (not `authenticateToken`).

### Frontend

- **Flight cards**: Show estimated reward points badge (🪙 +XXX pts) based on 1% of fare
- **Dashboard**: `/dashboard/rewards` — balance, redeem form, coupon list, transaction history
- **Flight card info row**: Displays baggage (hand/checked), available seats, and fare class (e.g., Class: Q)

### Internal Helper

`awardBookingPoints(userId, bookingId, fareAmount, serviceType)` — called from booking routes after confirmation to credit points.
