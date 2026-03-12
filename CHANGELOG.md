# Changelog — Seven Trip

All notable changes to this project are documented in this file.

## [3.9.3] — 2026-03-12 — Sabre DOCS Schema Fix for PNR Creation

### Fixed
- **Sabre CreatePNR validation error**: Removed unsupported fields (`DateOfBirth`, `FirstName`, `LastName`, `Gender`) from `AdvancePassenger.Document` in `CreatePassengerNameRecordRQ`
- **DOCS payload hardening**: `AdvancePassenger.Document` now sends schema-safe passport fields only (`Type`, `Number`, `IssueCountry`, `NationalityCountry`, optional `ExpirationDate`)
- **PNR pipeline stability**: Prevents Sabre NotProcessed responses caused by invalid DOCS object shape, allowing proper PNR creation flow

---

## [3.9.2] — 2026-03-12 — Sabre PNR DateTime Schema Fix

### Fixed
- **Sabre CreatePNR NotProcessed**: `EnhancedAirBookRQ` segment datetimes were sent with timezone offsets (e.g., `2026-04-15T21:55:00+06:00`), which violates Sabre schema validation
- **DateTime normalization**: Added `toSabreDateTime()` in `sabre-flights.js` to convert segment datetimes into schema-safe values without timezone suffix before CreatePassengerNameRecordRQ submission
- **Flight segment normalization**: Hardened numeric flight number extraction and party size fallback to prevent malformed segment payloads

---

## [3.9.1] — 2026-03-12 — Sabre Compressed Response Fix

### Fixed
- **Sabre BFM returning 0 flights**: Sabre's `CompressResponse: true` flag caused the API to return a `compressedResponse` (base64 gzip blob) instead of plain JSON. The normalizer didn't handle this, resulting in 0 flights for all searches
- **Removed `CompressResponse`**: Disabled compressed response in BFM request body so Sabre returns plain `groupedItineraryResponse`
- **Added gzip decompression fallback**: If Sabre still returns `compressedResponse`, the backend now decompresses it via `zlib.gunzipSync` before normalization

---

## [3.9.0] — 2026-03-12 — Auto-Ticketing, API-Only Deadlines & Post-Booking Ancillaries

### Changed
- **Pay Later deadlines**: Removed all hardcoded fallback calculations (48h domestic / 7d international). Payment deadlines now come exclusively from the airline's GDS `timeLimit` / `LastTicketingDate`. If no deadline is provided by the API, the booking stays open until the airline auto-cancels the PNR
- **Frontend `resolveDeadlineInfo`**: Simplified to only use `flight.timeLimit` — no departure-based fallback logic
- **Backend `resolvePaymentDeadline`**: Now takes only `airlineTimeLimit` parameter, returns `null` if no GDS deadline

### Added
- **Auto-ticketing on payment**: Created `backend/src/services/auto-ticket.js` — when payment is confirmed via SSLCommerz, bKash, or Nagad, the system automatically:
  - Issues real GDS tickets via Sabre `issueTicket` or BDFare `issueTicket` APIs
  - For TTI/Air Astra: creates a `pending_issue` ticket record (manual ticketing by admin)
  - For international flights: checks passport/visa uploads before issuing tickets; defers ticketing if docs missing
  - Updates booking status to `ticketed` (if GDS succeeded) or `confirmed` (if manual needed)
- **SSLCommerz IPN auto-ticket**: Replaced manual ticket generation with `autoTicketAfterPayment()` call
- **bKash callback auto-ticket**: Replaced simple status update with `autoTicketAfterPayment()` call
- **Nagad callback auto-ticket**: Replaced simple status update with `autoTicketAfterPayment()` call
- **Post-booking ancillaries page**: New `PostBookingExtras` dashboard page at `/dashboard/bookings/:id/extras` — fetches real Sabre GAO (GetAncillaryOffersRQ) meal and baggage offers using the booking's PNR
- **Dashboard "Buy Extras" action**: Confirmed/Ticketed flight bookings with a PNR now show a "Buy Extras (Meals/Baggage)" dropdown action
- **Backend ancillary endpoint**: `GET /dashboard/bookings/:id/ancillaries` — loads PNR from booking, calls Sabre SOAP GAO in stateful mode, returns purchasable meals and baggage

### Security
- International flight auto-ticketing is gated behind document verification — tickets are NOT issued until passport uploads are confirmed

---

## [3.8.0] — 2026-03-12 — Animated Flight Timeline

### Enhanced
- **Flight timeline airplane animation**: Compact card now shows a glowing teal plane gliding along a gradient dashed track with accent-themed origin/destination dots and ring indicators
- **Expanded detail arc animation**: Plane traces the curved arc path with pulsing origin/destination dots, soft glow trail, and animated dashed stroke using SVG gradients
- **CSS keyframe `flight-dash`**: Smooth infinite scrolling dash pattern on the compact flight track

---

## [3.7.9] — 2026-03-12 — Branded Fares & Dedup Fix

### Added
- **Sabre branded fares**: BFM request now includes `DiversityParameters` and `CompressResponse` for richer fare options. Normalizer extracts brand names (e.g., "Economy Light", "Economy Smart") from `fareComponentDescs` and maps per-brand baggage, refund, rebooking, and cancellation policies
- **Fare Options panel brand labels**: Shows real brand names from GDS instead of generic "Fare Option 1/2". Each branded fare shows its own baggage, meal, seat selection, and policy data with "Best Value" badge on cheapest

### Fixed
- **Round-trip combinations collapsed to 1 result**: Backend dedup key now includes ALL leg flight numbers, arrival time, direction, and per-leg departure times — preserving every unique outbound+return combination
- **Fare options "Best Value" badge**: Now uses API-driven `isBestValue` flag instead of array index

### Notes
- **NDC fares**: `NDC: 'Enable'` is set in BFM request, but NDC content requires active airline NDC agreements on your Sabre PCC (J4YL). Contact Sabre to enable NDC carrier content for your agency
- **Base fare differences vs BDFare**: BDFare shows net/agent fares; Sabre shows published fares. Different commission models explain price differences on the same flight

---

## [3.7.8] — 2026-03-12 — Round-Trip Deduplication Fix

### Fixed
- **Round-trip combinations collapsed to 1 result**: Backend deduplication key only used first-leg flight number + departure time, causing all round-trip combos sharing the same outbound to be treated as duplicates. Now includes ALL leg flight numbers, arrival time, direction, and per-leg departure times — preserving every unique outbound+return combination (matching BDFare's 731 results vs our previous 1)

---

## [3.7.7] — 2026-03-12 — BDFare Normalizer Rewrite & Carrier Filter Fix

### Fixed
- **BDFare results not appearing**: Rewrote `normalizeBDFareResponse` to match actual BDFare API v2 response structure (`Response.Results[]`, `segments[].Airline`, `segments[].Origin/Destination`, `Fares[].BaseFare/Tax/Currency/PassengerCount`)
- **Preferred airline filter not working**: Search widget's airline dropdown (`carrier` param) was not passed to backend — now extracted from query params and applied as post-aggregation IATA code filter
- **Cabin class always showing Economy**: BDFare `productClass` and Sabre cabin codes now correctly mapped to display labels; UI shows real API cabin class instead of defaulting to Economy

### Changed
- **BDFare date/duration parsing**: Added robust parsers for BDFare-specific formats (`"02 Apr, Thu"` → ISO date, `"17h 50m"` → minutes)
- **Flight search route**: Added `carrier` query parameter support with case-insensitive airline code filtering across all providers
- **FlightResults.tsx**: Extracts `carrier` from URL search params and passes to backend API call

---

## [3.7.6] — 2026-03-12 — Multi-City Detail Parity & Airline Filter Bar

### Fixed
- **Multi-city airline filter bar**: Was hidden for multi-city results (`!isMultiCity` condition) — removed exclusion so airline carousel now appears for all trip types
- **Multi-city Flight Details panel**: Replaced minimal detail view with full system matching one-way/round-trip cards:
  - **Flight Details tab**: Full airport names, arc timeline visualization, "Change of planes" layover badges, seats left, aircraft type, cabin class display
  - **Fare Summary tab**: Full table with Pax Type, Base Fare, Tax, Other, Discount, AIT VAT, Pax Count, Amount columns + Total Payable
  - **Baggage tab**: Sector/Checkin/Cabin table per segment
  - **Cancellation tab**: Sector-based tables with timeframe and fee info + important disclaimer
  - **Date Change tab**: Added (was missing), sector-based tables matching other trip types

---

## [3.7.5] — 2026-03-12 — Multi-City Combined Search & UI Fixes

### Fixed
- **Multi-city Flight Details**: "Flight Details" button on multi-city cards was non-functional — added `MultiCityExpandedDetails` component with 4 tabs (Flight Details, Fare Summary, Baggage, Cancellation)

### Changed
- **Dark mode softened**: Replaced pure black backgrounds (`6% lightness`) with softer dark grays (`14% lightness`) across background, card, popover, muted, border, input, and sidebar tokens
- **Multi-city search architecture**: Changed from per-segment parallel searches to single Sabre BFM request with all `OriginDestinationInformation` entries — returns combined itineraries priced as one unit (matching BDFare behavior)
- **Multi-city flight cards**: Now display all segments in a single card with combined pricing instead of per-segment selection mode
- **Backend normalizer**: Multi-city results emit `isMultiCity: true` with `segments[]` array containing per-leg details

---

## [3.7.3] — 2026-03-12 — White Search Bar Redesign

### Changed
- **Search modification bar**: Redesigned from dark (`bg-foreground`) to white/light (`bg-card`) with muted chip backgrounds, primary-colored icons, and larger text/padding for better readability
- **Search chips**: Increased padding, font size (`text-xs` → `text-sm`), and icon sizes for improved touch targets and visibility

---

## [3.7.2] — 2026-03-12 — Reward Points System, Flight Card Enhancements & Responsiveness

### Added — Reward Points System
- **Backend**: `backend/src/routes/rewards.js` — balance, history, coupons, redeem (points→coupon), validate/apply coupon at checkout, earn-rate endpoint
- **Database**: `backend/database/reward-points-migration.sql` — `user_points`, `point_transactions`, `reward_coupons`, `points_rules` tables (all using `CHAR(36)` FKs for UUID compatibility)
- **Dashboard**: `/dashboard/rewards` page — points balance card, redeem form, coupon list, transaction history
- **Flight cards**: 🪙 reward points badge showing estimated earn (1% of fare)
- **Flight card info row**: BDFare-style baggage (hand/checked), available seats, fare class (e.g., Class: Q)

### Fixed
- **502 crash**: `rewards.js` imported `authenticateToken` (undefined) — fixed to `authenticate`
- **Migration FK error 3780**: rewards tables used `INT` user_id but `users.id` is `CHAR(36)` UUID — fixed
- **Flight card overflow**: round-trip cards overflowed on 1024–1280px screens — reduced airline column (`sm:w-36 lg:w-40`), price column (`sm:w-40 lg:w-48`), added `min-w-0` overflow prevention, scaled LegMini fonts
- **Round-trip price filter**: slider used per-direction prices while filter checked total round-trip prices — now both use `roundTripPairs.totalPrice`

---

## [3.7.0] — 2026-03-12 — Zero-Mock Enforcement: 100% API-Driven Ancillaries & Seat Maps

### Changed — Complete Mock Data Elimination
- **Seat Map**: Removed `generateSeatLayout()` mock function (random 30% occupancy, hardcoded prices ₹300-800). SeatMap component now exclusively renders real data from Sabre SOAP `EnhancedSeatMapRQ` or TTI `GetSeatMap`. If no real data available, shows "Seat Selection Not Available" with airline check-in guidance.
- **Extra Baggage**: Removed `STANDARD_BAGGAGE` hardcoded array (8 fake options). Ancillaries endpoint returns empty array when Sabre SOAP and TTI APIs don't provide baggage data.
- **Meal Options**: Removed `STANDARD_MEALS` hardcoded array (9 fake meals). Same zero-mock enforcement — empty when no API data.
- **Baggage Display**: Removed all "As per airline policy" fallback text. If GDS doesn't return baggage allowance, UI now shows "Not provided by airline booking system" or hides the field entirely.
- **Backend `ancillaries.js`**: Complete rewrite — removed all fallback arrays, `generateSeatLayout()`, and domestic price adjustment on mock data.
- **Frontend `SeatMap.tsx`**: Complete rewrite — accepts real API data via props (`seatMapData`, `seatMapSource`, `seatMapLoading`), parses rows/columns/occupancy from Sabre SOAP XML-parsed response.
- **Source badges**: Show "Live Sabre Data" or "Live Airline Data" only when real data is present.

### Technical
- Backend seat-map endpoint returns `{ available: false }` when no real seat map exists (no generated fallback)
- Backend ancillaries endpoint returns `{ source: 'none', meals: [], baggage: [] }` when no real API provides data
- `includedBaggage.checked` returns `null` instead of "As per airline policy" when search API didn't provide baggage data
- Frontend SeatMap hooks restructured to comply with React Rules of Hooks (all hooks before conditional returns)

---

## [3.6.0] — 2026-03-12 — Deferred Document Verification & MRZ Auto-Validation

### Changed — International Flight Document Upload Flow (Major Rearchitecture)
- **Before**: Passport and visa copies were required during booking (Step 2/4), blocking the entire flow
- **After**: Users can complete booking freely without uploading documents
- **Document upload moved to Dashboard**: When users click "Pay Now" on an international flight booking (Reserved/On Hold), the `TravelDocVerificationModal` opens
- **MRZ Auto-Verification**: Passport uploads are automatically processed through OCR (Google Vision) to extract Machine Readable Zone data
- **Auto-Correction**: If MRZ data differs from passenger info (name, passport number, expiry, DOB, gender, nationality), the system automatically corrects passenger data from passport (trusted ICAO 9303 source)
- **Verification Results**: Shows confidence percentage, lists all corrected fields with old→new values
- **Gate Logic**: International flights require all passport + visa copies uploaded before proceeding to payment; domestic flights go straight to payment
- Review step shows an info banner explaining the document requirement for ticketing
- New component: `TravelDocVerificationModal.tsx`



## [3.5.1] — 2026-03-12 — Flight Search Route Validation Hardening

### Fixed — International Scope Allowing Domestic Routes After Swap
- **Bug**: Selecting International scope, then swapping airports (e.g., DAC→BOM becomes BOM→DAC, then changing FROM back to CXB) allowed domestic BD→BD routes to persist under International scope
- **Root cause**: Swap function blindly swapped without re-validating against scope rules; FROM change didn't re-validate existing TO selection
- **Fix**: Introduced centralized `isScopeInvalidRoute()` and `getScopedDestinationAirports()` validators used across all paths:
  - Swap button now blocks invalid swaps with toast error
  - FROM/TO useEffect auto-clears TO when route becomes invalid
  - Multi-city segment updates auto-clear TO on invalid FROM change
  - Search submit validates all segments (single + multi-city) before navigation

### Changed — Multi-City Segment Validation
- `updateSegment()` now checks destination validity when FROM changes mid-segment
- Multi-city search submit validates every segment against scope rules before navigating

---

## [3.5.0] — 2026-03-12 — Sabre SOAP Integration & Enterprise Booking Flow

### Added — Sabre SOAP Session Manager (`backend/src/routes/sabre-soap.js`)
- **SessionCreateRQ**: Creates and caches BinarySecurityToken (14-minute TTL) using Sabre PROD credentials
- **EnhancedSeatMapRQ (v6.0.0)**: Real-time seat map with row/column parsing, availability, exit rows, aisle detection, and per-seat pricing
- **GetAncillaryOffersRQ (v3.0.0)**: Queries paid baggage (GroupCode BG) and meal offers (GroupCode ML), categorized and priced
- **SessionCloseRQ**: Proper session termination and cache invalidation
- Session caching prevents redundant SOAP calls within 14-minute window

### Added — Enterprise Special Services (SSR) System
- 16 meal type codes (AVML, VGML, MOML, KSML, DBML, CHML, BBML, GFML, LFML, LCML, NLML, SFML, FPML, RVML, SPML + No Preference)
- 3 wheelchair levels (WCHR, WCHS, WCHC) per IATA standard
- Medical assistance (MEDA), blind (BLND), deaf (DEAF) toggles
- Unaccompanied minor (UMNR) for child passengers with age input
- Pet transport: in-cabin (PETC) or cargo hold (AVIH) with details
- Frequent flyer number input (airline code + FF number)
- Destination address (DOCA) for international immigration
- Free-text special request (OSI) up to 70 characters
- All SSR per-passenger — each traveler gets independent SSR selections
- SSR data injected into REST PNR `CreatePassengerNameRecordRQ` at booking time

### Added — 4-Step Mandatory Booking Flow
- **Step 1: Flight Details** — Itinerary summary with segment cards
- **Step 2: Passenger Info + Special Services** — Traveler forms with SSR card (expandable per-passenger accordion)
- **Step 3: Seat & Extras** — SOAP-powered interactive seat map + tabbed extra baggage/meal purchase
- **Step 4: Review & Pay** — Full summary of itinerary, passengers, selected seats, extras, SSR, and fare breakdown
- Stepper always shows all 4 steps with icons (Plane, Users, Armchair, CreditCard)

### Added — Interactive Seat Map Component (`src/components/flights/SeatMap.tsx`)
- Aircraft-aware layout generation (narrowbody 3-3, widebody 3-3-3, ATR/Dash 2-2)
- Per-passenger seat selection with auto-advance to next unassigned passenger
- Seat type color coding: standard, window, aisle, exit row, extra legroom, front row, premium
- Tooltip with seat details and pricing
- Selected seats summary with per-passenger breakdown and total cost
- Seat cost integrated into fare sidebar grand total

### Changed — Ancillaries Priority Chain (`backend/src/routes/ancillaries.js`)
- Priority: Sabre SOAP → TTI (Air Astra/S2) → Standard in-memory fallback
- Seat map endpoint: Sabre SOAP → TTI → Aircraft-based layout generator
- Frontend no longer filters out "standard" source — shows all available data

### Fixed — Critical Variable Ordering Bug
- `paxTypes` was referenced in `useState` initializer before its declaration (temporal dead zone)
- Moved `searchParams`, `paxTypes`, `passengers` declarations before any state that depends on them
- This bug caused the entire booking component to crash, hiding steps 3-4

---

## [3.3.0] — 2026-03-11 — Multi-Provider Flight Engine & OCR v7

---



### Fixed — Flight Booking Tax Calculation
- **Taxes now use real GDS data**: `outboundFlight.taxes` and `returnFlight.taxes` from TTI/BDFare/FlyHub/Sabre responses are used directly instead of a hardcoded 12% calculation
- **Service charge**: Now reads from flight object (`outboundFlight.serviceCharge`) with `0` fallback instead of hardcoded `৳250`
- Base fare calculation uses `baseFare` field from GDS when available, falling back to `price` field

### Fixed — Backend Admin Settings
- **Markup config**: Admin Settings PUT endpoint now properly handles `markup_config` JSON persistence to `system_settings` table
- **Currency rates**: Admin Settings PUT endpoint now properly handles `currency_rates` JSON persistence
- **Settings GET response**: Now returns parsed `markup_config` and `currency_rates` in the `settings` object instead of raw strings
- **Invoice payment reminders**: `POST /admin/invoices/:id/remind` now sends real email notification via the notification service instead of returning a placeholder response

### Removed — Dead Code (Zero-Mock Policy)
- Removed `defaultDiscounts` array (7 hardcoded discount entries) from `AdminDiscounts.tsx` — data is fetched from `/admin/discounts` API
- Removed `defaultPriceRules` array (7 hardcoded price rule entries) from `AdminDiscounts.tsx`
- Added `PAY_LATER` to `PAYMENT_METHODS` constant for completeness

### Documentation
- Updated `README.md` with v3.2 audit status, Sabre GDS in integrations table, markup/currency admin modules, corrected domain references
- Updated `CHANGELOG.md` with full v3.2 changes

---

## [3.1.0] — 2026-03-10 — Enterprise Booking Management & Full Audit

### Added — Admin Booking Lifecycle
- **Archive Booking** (`PATCH /admin/bookings/:id/archive`): Soft-archive bookings to hide from all dashboards while preserving DB records
- **Delete Booking** (`DELETE /admin/bookings/:id`): Permanently delete bookings with related tickets and transactions, with confirmation dialog
- Archive/delete options added to admin booking dropdown menu with destructive action confirmation
- Archived bookings are excluded from all dashboard stats, counts, and listing queries (admin + customer)

### Fixed — Status Filter Tabs
- Customer dashboard booking tabs ("On Hold", "In Progress", "Un-Confirmed") now correctly map to backend snake_case format (`on_hold`, `in_progress`, `un_confirmed`)

### Fixed — E-Ticket PDF
- Logo aspect ratio preserved (no longer stretched/squished) using dynamic `getImageProperties` sizing
- 4-column flight segment layout with full details: Aircraft, Terminal, Baggage, Meals, Distance, CO2 emissions
- Robust TTI date parsing (`/Date(ms+offset)/` format) preventing "Invalid Date" errors

### Fixed — Archived Booking Filtering
- All 8 booking-related SQL queries now filter `(archived IS NULL OR archived = 0)`:
  - Admin: dashboard stats, bookings list, recent bookings, bookings by type
  - Customer: dashboard stats, upcoming trips, booking breakdown, recent bookings, booking list

---

## [3.0.0] — 2026-03-10 — Complete Platform Audit v2 & Production Finalization

### Fixed — Booking Flows Now Call Real APIs
- **eSIM Purchase**: Now calls `POST /esim/purchase` instead of just navigating to confirmation
- **Holiday Booking**: Now calls `POST /holidays/book` with package details and returns bookingRef
- **Medical Booking**: Now calls `POST /medical/book` with hospital and form data
- **Car Booking**: Now calls `POST /cars/book` with car, dates, and form data
- All 4 booking flows now persist bookings in the database and return real booking references

### Fixed — Hardcoded Data Removal (Zero-Mock Policy v2)
- **BookingConfirmation**: Removed hardcoded fallbacks for route (`"Dhaka → Cox's Bazar"`), flightNo (`"BG-435"`), departTime (`"07:30"`), arriveTime (`"08:35"`), stops (`"Non-stop"`), and ticketNo (random `997-xxx`)
- **AdminCurrency**: Removed 5 hardcoded default exchange rates — now shows empty state when no rates configured
- **ESIMPlans**: Removed 4 hardcoded fallback country filters — now uses CMS data only
- **MedicalServices**: Removed 5+6 hardcoded country/treatment fallback arrays
- **HolidayPackages**: Removed 5+4 hardcoded includes/filter fallback arrays
- **Dashboard stats**: Removed fake `"+0%"` change indicator — now only shows change when API provides it
- **Admin Dashboard**: Same fix for stat change indicators

### Fixed — Previous Audit (v2.9.0)
- Baggage fallbacks: `"20kg"` → `"As per airline policy"` (7 locations)
- Meal fallbacks: `"Meals"` → empty (5 locations)
- Dashboard stats: Removed fake `"+12%"`, `"+8%"` growth indicators
- Admin reports: Real calculated growth rate instead of `12.5`
- Admin discounts: No hardcoded default discount codes

### Improved — TTI/ZENITH GDS Integration
- Enhanced seat availability extraction from `AirCoupons[]`, segment-level, and `ETCouponFares[]`
- Enhanced baggage extraction from AirCoupon level and segment level (weight + piece formats)
- Added `[TTI DEBUG]` logging for field-name discovery when data is null

### Improved — GDS Flight Operations (Admin)
- Real-time GDS API calls for ticket issuance, cancellation, and voiding across TTI, BDFare, FlyHub, Sabre
- Ticket records auto-created in DB upon successful GDS issuance
- GDS action results persisted in booking `details.lastGdsAction`

---


## [2.8.0] — 2026-03-09 — Company Rebrand, Invoice & Money Receipt PDFs

### Changed — Company Info System-Wide Update
- **Parent Company**: All references updated to "Evan International" (Seven Trip is a concern of Evan International)
- **Phone**: Updated to +880 1749-373748 across Header (top bar + mobile), Footer (contact section), CMS defaults (/about, /contact, /privacy, FAQ), SEO schema, CMS Footer admin, PDF generator
- **Address**: Updated to "Beena Kanon, Flat-4A, House-03, Road-17, Block-E, Banani, Dhaka-1213" across all pages
- **Footer copyright**: "Seven Trip — A concern of Evan International"
- **PDF headers**: All PDFs now show parent company and updated contact info

### Added — Money Receipt PDF Generator
- **New `generateMoneyReceiptPDF()`** — Matches professional banking receipt format
- Line item table (No, Description, Pax, Unit Price, Total Price)
- Totals section (Total Fair, Due, Discount, Grand Total with amount in words)
- "Received with gratitude" acknowledgment text
- Signature area with date
- **QR Code** verification (via `qrcode` library)
- Available in User Dashboard → Invoices and Admin → Invoices

### Improved — Invoice PDF Revamp
- **Multi-line item support** — Handles 50+ items with auto-pagination
- **Dynamic columns** — Extra columns (Visa, BRN, Transport) rendered automatically
- **QR Code** on every invoice for verification
- **Grand total in words** (Bangladeshi numbering: Lakh, Crore)
- **Company header** with logo, address, phone matching uploaded format

### Fixed
- Removed all hardcoded old phone numbers (+880 1234-567890)
- Removed all hardcoded old addresses (123 Travel Street)
- Fixed duplicate import identifiers in DashboardInvoices
- Updated AdminUsers phone placeholder

---

## [2.7.0] — 2026-03-09 — Enterprise Flight Booking & Mobile Responsive Overhaul

### Fixed — Critical Mobile Responsive Issues
- **White space on right (mobile)** — Fixed oversized logo images (h-36/h-44/h-48 = 144-192px) across Header, Footer, DashboardLayout, and mobile sidebar. Normalized to h-10/h-12 (40-48px)
- **Horizontal overflow** — Added `overflow-x: hidden` to html root element and PublicLayout wrapper
- **Broken CSS class names** — Fixed corrupted Tailwind classes in Header mobile sidebar logo

### Added — Enterprise 4-Step Flight Booking
- **Step 1: Itinerary Review** — Full outbound + return flight details with airline logos
- **Step 2: Passenger Info** — Title, Full Name, Passport Number, DOB, Nationality per passenger
- **Step 3: Extras** — Meal selection (7 options: Standard/Vegetarian/Vegan/Halal/Kosher/Child/Diabetic), Extra Baggage (5-30kg), Seat selection (Window/Aisle/Middle)
- **Step 4: Review & Pay** — Real-time fare breakdown, payment method selection, terms acceptance
- **Auth Gate** — Unauthenticated users prompted to login/register before booking completion

### Added — Round-Trip Flight Selection
- **Outbound/Return sections** — Round-trip results split into two groups with separate selection
- **Paired selection** — Sticky bottom bar shows total when both outbound + return selected
- **Flight data passed via navigation state** — No API dependency for booking page (works offline with TTI results)

### Added — Professional E-Ticket PDF Generator
- **Company branding header** — Dark header with Seven Trip logo, phone, email
- **Airline logos** — Fetched from Kiwi CDN for 60+ carriers
- **Segment boxes** — Origin/Destination with Terminal, Aircraft, Flight Number
- **Passenger list** — LAST/FIRST format with passport numbers
- **Booking reference** — Auto-generated with QR code placeholder

### Updated — Documentation
- **README.md** — Updated feature list with enterprise booking, e-ticket PDF, round-trip pairing
- **CHANGELOG.md** — Added v2.7 release notes
- **.lovable/plan.md** — Updated plan status

---


## [2.5.0] — 2026-03-09 — TTI/ZENITH GDS Integration & Database-Backed Config

### Added — TTI/ZENITH Air Astra Flight API
- **Real-time GDS flight search** via TTI/ZENITH Reservation System (Agency ID 10000240)
- **Backend proxy** (`backend/src/routes/tti-flights.js`) — calls TTI `SearchFlights`, normalizes WCF JSON responses into standard format
- **Parallel data merge** — Local DB flights + TTI API results combined in `flights.js`
- **Google Flights-style UI** — Completely redesigned `FlightResults.tsx` with compact cards, airline logos (40+ airlines mapped), timeline segments, layover badges, and expandable detail panels
- **Advanced flight filters** — Stops (Non-stop / 1 / 2+), price range slider, departure time range, airline checkboxes, sort by price/duration/departure

### Changed — Database-Backed API Configuration (Security Hardening)
- **All API keys moved from `.env` to database** — `system_settings` table stores encrypted configs for TTI, payment gateways, SMS, email, OAuth
- **TTI reads from DB** with 5-minute cache (`getTTIConfig()`) — no env vars needed
- **Admin Settings** — New "Air Astra TTI/ZENITH (Flight GDS)" card in API Integrations tab with URL, key, and agency ID fields
- **Config cache invalidation** — `clearTTIConfigCache()` called when admin saves TTI settings
- **Removed** `TTI_API_URL` and `TTI_API_KEY` from `backend/.env`

### Changed — AdminDiscounts Migrated to API
- **Discounts & Price Rules** — Migrated from localStorage to backend API (`GET/PUT /admin/discounts`)
- Added `discounts` and `price_rules` keys in `system_settings` table
- Full CRUD via React Query mutations with optimistic cache invalidation

---

## [2.4.0] — 2026-03-09 — Complete Data Flow Audit & Mandatory Validations

### Fixed — Search Validation (ALL services now require dates)
- **Holiday Search** — Now requires travel date before searching. Shows toast error if missing.
- **Visa Search** — Now requires both travel date AND return date. Shows toast error if missing.
- **Medical Search** — Now requires travel date for appointment. Shows toast error if missing.
- **eSIM Search** — Now requires activation date. Shows toast error if missing.
- **Recharge** — Now validates operator, phone number, and amount before navigating.
- **Pay Bill** — Now validates category, biller, account number, and amount before navigating.

### Fixed — Results Pages (ALL read URL params + show "No Criteria" guard)
- **HolidayPackages** — Now reads `destination` and `date` from URL. Shows "No Search Criteria" empty state when params missing. Displays destination and date in hero.
- **CarRental** — Now reads `pickupDate` and `dropoffDate` from URL. Shows "No Search Criteria" when dates missing. Passes dates to API. Book buttons include date params in link.
- **MedicalServices** — Now reads `country`, `treatment`, and `date` from URL. Shows "No Search Criteria" when date missing. Passes date to enquiry links.
- **ESIMPlans** — Now reads `country` and `activation` from URL. Shows "No Search Criteria" when activation date missing. Passes activation date to purchase links.
- **VisaServices** — Now reads `country`, `type`, `date`, `return`, and `travellers` from URL. Shows "No Search Criteria" when travel date missing. Passes all params to Apply Now links. Filters countries by URL country if provided.

### Fixed — Data Flow Continuity
- All search handlers in SearchWidget now pass dates in URL params.
- All results pages now read those dates and pass them to the API.
- All "Book Now" / "Apply Now" / "Enquire" buttons pass full context (dates, IDs, locations) to booking pages.
- Booking pages pass complete data to BookingConfirmation via `location.state`.

---

## [2.3.0] — 2026-03-09 — Critical Logic Fixes & Enterprise Flight Cards

### Fixed
- **Mandatory Date Validation** — Flight departure date, hotel check-in/check-out, car pickup/drop-off dates now required before search. Toast errors shown for missing dates. Round-trip requires return date.
- **Hotel Search Param Mismatch** — SearchWidget sends `destination`, HotelResults now reads both `destination` and `location` params correctly.
- **Hotel Results Guard** — Shows "No Search Criteria" empty state when no check-in/check-out dates provided instead of empty list.
- **FlightBooking Hardcoded Data** — Was showing static "07:30 DAC → 08:35 CXB". Now fetches actual flight details via `useFlightDetails(flightId)` and displays real data.
- **Booking Confirmation Data** — FlightBooking, HotelDetail, HolidayDetail, CarBooking, MedicalBooking, and ESIMPurchase now ALL pass complete booking data (route, price, taxes, totals, type) via `location.state` to the confirmation page.
- **CarBooking Hardcoded Data** — Was showing static "Toyota Corolla — Sedan". Now reads car ID from URL params.
- **BookingConfirmation Dynamic Icons** — Shows correct service icon (Plane/Building2/Car/Stethoscope/Smartphone/Globe) based on booking type instead of always showing Plane.
- **HotelDetail Book Now** — Passes hotel name, room price, and calculated taxes to confirmation page.
- **HolidayDetail Book Package** — Passes package destination, price, and taxes to confirmation page.

### Added
- **Enterprise-grade Flight Result Cards** — Airline logo mapping for 15+ airlines (Biman, US-Bangla, Novoair, Emirates, Qatar Airways, Singapore Airlines, etc.), proper time formatting, clock icons, gradient flight path lines, refundable badges, price range filtering.
- **FlightResults "No Criteria" Guard** — Shows empty state when required params (from, to, depart) are missing.

### Refactored
- **FlightResults.tsx** — Extracted `FlightCard` and `FilterPanel` into separate components for maintainability.
- **SearchWidget** — Added `sonner` toast import for validation feedback.

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
