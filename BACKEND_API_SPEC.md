# Seven Trip — Complete Backend API Specification

> **Purpose**: This document is the ONLY reference your backend developer needs. It defines every API endpoint, database table, authentication logic, request/response schema, and business rule. The frontend is already 100% built and expects these exact endpoints and response shapes.

---

## Table of Contents

1. [Tech Stack & Setup](#1-tech-stack--setup)
2. [Database Schema (MySQL)](#2-database-schema-mysql)
3. [Authentication System](#3-authentication-system)
4. [API Response Format](#4-api-response-format)
5. [API Endpoints — Auth](#5-api-endpoints--auth)
6. [API Endpoints — Flights](#6-api-endpoints--flights)
7. [API Endpoints — Hotels](#7-api-endpoints--hotels)
8. [API Endpoints — Holidays](#8-api-endpoints--holidays)
9. [API Endpoints — Visa](#9-api-endpoints--visa)
10. [API Endpoints — Medical Tourism](#10-api-endpoints--medical-tourism)
11. [API Endpoints — Car Rental](#11-api-endpoints--car-rental)
12. [API Endpoints — eSIM](#12-api-endpoints--esim)
13. [API Endpoints — Mobile Recharge](#13-api-endpoints--mobile-recharge)
14. [API Endpoints — Bill Payment](#14-api-endpoints--bill-payment)
15. [API Endpoints — Customer Dashboard](#15-api-endpoints--customer-dashboard)
16. [API Endpoints — Admin](#16-api-endpoints--admin)
17. [API Endpoints — CMS](#17-api-endpoints--cms)
18. [API Endpoints — Contact](#18-api-endpoints--contact)
19. [Error Handling](#19-error-handling)
20. [Environment Variables](#20-environment-variables)
21. [Deployment Checklist](#21-deployment-checklist)

---

## 1. Tech Stack & Setup

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Framework | NestJS or Express.js |
| Database | MySQL 8 / MariaDB 10.6+ |
| ORM | Prisma / TypeORM / Sequelize |
| Auth | JWT (Access + Refresh tokens) |
| Email | Nodemailer (SMTP) |
| File Upload | Multer → local disk or S3 |
| Process Manager | PM2 |
| Server | Ubuntu 24.04 VPS + Nginx reverse proxy |

**Base URL**: `https://api.seventrip.com.bd/api`

All endpoints below are relative to this base. For example, `/auth/login` means `POST https://api.seventrip.com.bd/api/auth/login`.

---

## 2. Database Schema (MySQL)

### 2.1 `users`

```sql
CREATE TABLE users (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  avatar        VARCHAR(500),
  role          ENUM('customer','admin','super_admin') DEFAULT 'customer',
  email_verified TINYINT(1) DEFAULT 0,
  phone_verified TINYINT(1) DEFAULT 0,
  otp_code      VARCHAR(6),
  otp_expires   DATETIME,
  reset_token   VARCHAR(255),
  reset_expires DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);
```

### 2.2 `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    CHAR(36) NOT NULL,
  token      VARCHAR(500) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
);
```

### 2.3 `bookings`

```sql
CREATE TABLE bookings (
  id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id         CHAR(36) NOT NULL,
  booking_type    ENUM('flight','hotel','holiday','visa','medical','car') NOT NULL,
  booking_ref     VARCHAR(20) NOT NULL UNIQUE,
  status          ENUM('pending','confirmed','cancelled','completed','refunded','failed',
                       'on_hold','void','exchange','no_show','partially_refunded','processing') DEFAULT 'pending',
  total_amount    DECIMAL(12,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'BDT',
  payment_method  ENUM('bkash','nagad','rocket','card','bank_transfer'),
  payment_status  ENUM('unpaid','paid','partial','refunded') DEFAULT 'unpaid',
  details         JSON,  -- type-specific booking data
  passenger_info  JSON,  -- array of passenger objects
  contact_info    JSON,  -- { email, phone, name }
  notes           TEXT,
  booked_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_type (booking_type),
  INDEX idx_ref (booking_ref)
);
```

### 2.4 `transactions`

```sql
CREATE TABLE transactions (
  id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id        CHAR(36) NOT NULL,
  booking_id     CHAR(36),
  type           ENUM('payment','refund','recharge','bill_payment','esim_purchase') NOT NULL,
  amount         DECIMAL(12,2) NOT NULL,
  currency       VARCHAR(3) DEFAULT 'BDT',
  status         ENUM('pending','completed','failed','reversed') DEFAULT 'pending',
  payment_method ENUM('bkash','nagad','rocket','card','bank_transfer'),
  reference      VARCHAR(100),
  description    TEXT,
  meta           JSON,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_type (type)
);
```

### 2.5 `travellers`

```sql
CREATE TABLE travellers (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id       CHAR(36) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255),
  phone         VARCHAR(20),
  date_of_birth DATE,
  gender        ENUM('male','female','other'),
  nationality   VARCHAR(100),
  passport_no   VARCHAR(50),
  passport_expiry DATE,
  document_type ENUM('passport','nid','driving_license') DEFAULT 'passport',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);
```

### 2.6 `tickets`

```sql
CREATE TABLE tickets (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  booking_id  CHAR(36) NOT NULL,
  user_id     CHAR(36) NOT NULL,
  ticket_no   VARCHAR(50) NOT NULL,
  pnr         VARCHAR(10),
  status      ENUM('active','used','cancelled','expired') DEFAULT 'active',
  pdf_url     VARCHAR(500),
  details     JSON,
  issued_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id)
);
```

### 2.7 `wishlist`

```sql
CREATE TABLE wishlist (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id     CHAR(36) NOT NULL,
  item_type   ENUM('flight','hotel','holiday','medical','car') NOT NULL,
  item_id     VARCHAR(100) NOT NULL,
  item_data   JSON NOT NULL,  -- snapshot of the item at time of save
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wish (user_id, item_type, item_id)
);
```

### 2.8 `visa_applications`

```sql
CREATE TABLE visa_applications (
  id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id        CHAR(36) NOT NULL,
  country        VARCHAR(100) NOT NULL,
  visa_type      VARCHAR(50) NOT NULL,
  status         ENUM('draft','submitted','processing','approved','rejected') DEFAULT 'draft',
  applicant_info JSON NOT NULL,
  documents      JSON,  -- array of file URLs
  processing_fee DECIMAL(10,2),
  submitted_at   DATETIME,
  processed_at   DATETIME,
  notes          TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id),
  INDEX idx_status (status)
);
```

### 2.9 `flights` (cached/sourced from GDS or manual entry)

```sql
CREATE TABLE flights (
  id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  airline         VARCHAR(100) NOT NULL,
  airline_code    VARCHAR(10),
  airline_logo    VARCHAR(500),
  flight_number   VARCHAR(20),
  origin          VARCHAR(10) NOT NULL,
  origin_city     VARCHAR(100),
  destination     VARCHAR(10) NOT NULL,
  destination_city VARCHAR(100),
  departure_time  DATETIME NOT NULL,
  arrival_time    DATETIME NOT NULL,
  duration        VARCHAR(20),
  stops           INT DEFAULT 0,
  cabin_class     ENUM('Economy','Premium Economy','Business','First') DEFAULT 'Economy',
  price           DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'BDT',
  seats_available INT DEFAULT 0,
  baggage         VARCHAR(50),
  refundable      TINYINT(1) DEFAULT 0,
  meta            JSON,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_route (origin, destination),
  INDEX idx_departure (departure_time)
);
```

### 2.10 `hotels`

```sql
CREATE TABLE hotels (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name          VARCHAR(255) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  country       VARCHAR(100),
  address       TEXT,
  star_rating   TINYINT DEFAULT 3,
  user_rating   DECIMAL(2,1),
  review_count  INT DEFAULT 0,
  price_per_night DECIMAL(10,2) NOT NULL,
  currency      VARCHAR(3) DEFAULT 'BDT',
  images        JSON,  -- array of URLs
  amenities     JSON,  -- array of strings
  description   TEXT,
  latitude      DECIMAL(10,8),
  longitude     DECIMAL(11,8),
  available     TINYINT(1) DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_city (city)
);
```

### 2.11 `holiday_packages`

```sql
CREATE TABLE holiday_packages (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title         VARCHAR(255) NOT NULL,
  destination   VARCHAR(100) NOT NULL,
  country       VARCHAR(100),
  duration      VARCHAR(50),
  price         DECIMAL(10,2) NOT NULL,
  currency      VARCHAR(3) DEFAULT 'BDT',
  discount_pct  INT DEFAULT 0,
  images        JSON,
  highlights    JSON,  -- array of strings
  itinerary     JSON,  -- array of { day, title, description }
  inclusions    JSON,
  exclusions    JSON,
  category      ENUM('beach','adventure','cultural','luxury','family','honeymoon') DEFAULT 'cultural',
  rating        DECIMAL(2,1),
  review_count  INT DEFAULT 0,
  available     TINYINT(1) DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_destination (destination)
);
```

### 2.12 `medical_hospitals`

```sql
CREATE TABLE medical_hospitals (
  id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name            VARCHAR(255) NOT NULL,
  city            VARCHAR(100) NOT NULL,
  country         VARCHAR(100) NOT NULL,
  specialties     JSON,  -- array of treatment types
  accreditations  JSON,
  rating          DECIMAL(2,1),
  price_range     VARCHAR(50),
  description     TEXT,
  images          JSON,
  contact         JSON,
  available       TINYINT(1) DEFAULT 1,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.13 `cars`

```sql
CREATE TABLE cars (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(255) NOT NULL,
  type        ENUM('Economy','Compact','Sedan','SUV','Luxury','Van','Minibus') NOT NULL,
  brand       VARCHAR(100),
  model       VARCHAR(100),
  year        INT,
  seats       INT DEFAULT 4,
  transmission ENUM('automatic','manual') DEFAULT 'automatic',
  fuel_type   VARCHAR(50),
  price_per_day DECIMAL(10,2) NOT NULL,
  currency    VARCHAR(3) DEFAULT 'BDT',
  images      JSON,
  features    JSON,
  city        VARCHAR(100),
  available   TINYINT(1) DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.14 `esim_plans`

```sql
CREATE TABLE esim_plans (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  country     VARCHAR(100) NOT NULL,
  region      VARCHAR(100),
  data_amount VARCHAR(20) NOT NULL,
  duration    VARCHAR(20) NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  currency    VARCHAR(3) DEFAULT 'BDT',
  provider    VARCHAR(100),
  features    JSON,
  available   TINYINT(1) DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.15 `recharge_operators`

```sql
CREATE TABLE recharge_operators (
  id          VARCHAR(50) PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  logo        VARCHAR(500),
  type        ENUM('prepaid','postpaid') DEFAULT 'prepaid',
  active      TINYINT(1) DEFAULT 1
);
```

### 2.16 `bill_categories`

```sql
CREATE TABLE bill_categories (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(100) NOT NULL,
  icon        VARCHAR(50),
  billers     JSON,  -- array of { id, name, logo }
  active      TINYINT(1) DEFAULT 1
);
```

### 2.17 `contact_submissions`

```sql
CREATE TABLE contact_submissions (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(200) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  subject     VARCHAR(255),
  message     TEXT NOT NULL,
  status      ENUM('new','read','replied') DEFAULT 'new',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.18 CMS Tables

```sql
-- Pages
CREATE TABLE cms_pages (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title       VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL UNIQUE,
  content     LONGTEXT,
  status      ENUM('draft','published') DEFAULT 'draft',
  author_id   CHAR(36),
  meta        JSON,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Blog posts
CREATE TABLE cms_blog_posts (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title       VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL UNIQUE,
  excerpt     TEXT,
  content     LONGTEXT,
  cover_image VARCHAR(500),
  category    VARCHAR(100),
  tags        JSON,
  status      ENUM('draft','published') DEFAULT 'draft',
  author_id   CHAR(36),
  views       INT DEFAULT 0,
  published_at DATETIME,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Promotions
CREATE TABLE cms_promotions (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title       VARCHAR(255) NOT NULL,
  code        VARCHAR(50) UNIQUE,
  description TEXT,
  discount_type ENUM('percentage','fixed') DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_order   DECIMAL(10,2) DEFAULT 0,
  max_uses    INT,
  used_count  INT DEFAULT 0,
  valid_from  DATETIME,
  valid_until DATETIME,
  status      ENUM('active','inactive','expired') DEFAULT 'active',
  applicable_to JSON,  -- { types: ['flight','hotel'], ... }
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Destinations
CREATE TABLE cms_destinations (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(255) NOT NULL,
  country     VARCHAR(100),
  description TEXT,
  images      JSON,
  highlights  JSON,
  best_time   VARCHAR(100),
  featured    TINYINT(1) DEFAULT 0,
  status      ENUM('active','inactive') DEFAULT 'active',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Media
CREATE TABLE cms_media (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  filename    VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type   VARCHAR(100),
  size        INT,
  url         VARCHAR(500) NOT NULL,
  alt_text    VARCHAR(255),
  folder      VARCHAR(100) DEFAULT 'general',
  uploaded_by CHAR(36),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Email Templates
CREATE TABLE cms_email_templates (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(255) NOT NULL,
  subject     VARCHAR(255) NOT NULL,
  body        LONGTEXT NOT NULL,
  variables   JSON,  -- array of {{ variable_name }} used in template
  category    VARCHAR(50),
  active      TINYINT(1) DEFAULT 1,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin system settings (key-value)
CREATE TABLE system_settings (
  setting_key   VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  category      VARCHAR(50) DEFAULT 'general',
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 3. Authentication System

### How It Works

1. **Registration**: User sends name/email/phone/password → server hashes password (bcrypt, 12 rounds), creates user, generates JWT pair, returns user + tokens.
2. **Login**: User sends email/password → server verifies → returns user + tokens.
3. **Access Token**: JWT, expires in 15 minutes. Sent as `Authorization: Bearer <token>`.
4. **Refresh Token**: Opaque token stored in `refresh_tokens` table, expires in 7 days.
5. **Token Refresh**: Frontend sends expired access token → gets 401 → calls `/auth/refresh` with refresh token → gets new access token.
6. **OTP Flow**: Forgot password → server generates 6-digit OTP, stores hash + expiry in `users` table, sends via email → user verifies OTP → gets reset token → resets password.

### JWT Payload

```json
{
  "sub": "user-uuid",
  "email": "user@email.com",
  "role": "customer",
  "iat": 1700000000,
  "exp": 1700000900
}
```

### Password Rules

- Minimum 8 characters
- Hashed with bcrypt (12 salt rounds)
- Never returned in any API response

---

## 4. API Response Format

### Success Response

```json
// Single object
{
  "id": "uuid",
  "name": "...",
  ...
}

// List with pagination
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### Error Response

```json
{
  "message": "Human-readable error message",
  "status": 400,
  "errors": {
    "email": ["Email is already registered"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

**HTTP Status Codes Used:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (delete success) |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (wrong role) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Internal Server Error |

---

## 5. API Endpoints — Auth

### `POST /auth/register`

**Request:**
```json
{
  "firstName": "Rahim",
  "lastName": "Uddin",
  "email": "rahim@example.com",
  "phone": "+8801712345678",
  "password": "securePass123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Rahim Uddin",
    "email": "rahim@example.com",
    "phone": "+8801712345678",
    "avatar": null,
    "role": "customer",
    "emailVerified": false,
    "phoneVerified": false,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**Validation:**
- `firstName`: required, 1-100 chars
- `lastName`: required, 1-100 chars
- `email`: required, valid email, unique
- `phone`: required, valid BD phone format
- `password`: required, min 8 chars

---

### `POST /auth/login`

**Request:**
```json
{
  "email": "rahim@example.com",
  "password": "securePass123"
}
```

**Response (200):** Same shape as register response.

**Errors:**
- 401: `{ "message": "Invalid email or password" }`

---

### `POST /admin/auth/login`

Same request/response as `/auth/login`. The frontend checks that `user.role` is `admin` or `super_admin` and rejects otherwise. The backend should also verify the role.

---

### `POST /auth/refresh`

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**Response (200):**
```json
{
  "accessToken": "new-eyJhbG...",
  "refreshToken": "new-refresh-token..."
}
```

**Errors:**
- 401: `{ "message": "Invalid or expired refresh token" }`

---

### `POST /auth/forgot-password`

**Request:**
```json
{
  "email": "rahim@example.com"
}
```

**Response (200):**
```json
{
  "message": "OTP sent to your email"
}
```

**Backend Logic:**
1. Generate 6-digit random OTP
2. Store hashed OTP + expiry (10 minutes) in `users` table
3. Send email with OTP using email template

---

### `POST /auth/verify-otp`

**Request:**
```json
{
  "email": "rahim@example.com",
  "otp": "482916"
}
```

**Response (200):**
```json
{
  "message": "OTP verified",
  "resetToken": "temp-reset-token-uuid"
}
```

---

### `POST /auth/reset-password`

**Request:**
```json
{
  "token": "temp-reset-token-uuid",
  "password": "newSecurePass456"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### `POST /auth/logout`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "message": "Logged out"
}
```

**Backend Logic:** Delete the user's refresh token from `refresh_tokens` table.

---

## 6. API Endpoints — Flights

### `GET /flights/search`

**Query Params:**
| Param | Type | Required | Example |
|-------|------|----------|---------|
| origin | string | yes | DAC |
| destination | string | yes | CXB |
| departDate | string (YYYY-MM-DD) | yes | 2025-03-15 |
| returnDate | string | no | 2025-03-20 |
| adults | number | yes | 2 |
| children | number | no | 1 |
| infants | number | no | 0 |
| cabinClass | string | no | Economy |
| tripType | string | no | roundtrip |

**Response (200):**
```json
{
  "data": [
    {
      "id": "flight-uuid",
      "airline": "Biman Bangladesh",
      "airlineCode": "BG",
      "airlineLogo": "https://...",
      "flightNumber": "BG-435",
      "origin": "DAC",
      "originCity": "Dhaka",
      "destination": "CXB",
      "destinationCity": "Cox's Bazar",
      "departureTime": "2025-03-15T08:00:00Z",
      "arrivalTime": "2025-03-15T09:05:00Z",
      "duration": "1h 5m",
      "stops": 0,
      "cabinClass": "Economy",
      "price": 5500,
      "currency": "BDT",
      "seatsAvailable": 12,
      "baggage": "20 KG",
      "refundable": true
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### `GET /flights/:id`

**Response (200):** Single flight object (same shape as search result item, plus additional `meta` field).

### `POST /flights/book`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "flightId": "flight-uuid",
  "passengers": [
    {
      "firstName": "Rahim",
      "lastName": "Uddin",
      "dateOfBirth": "1990-05-15",
      "gender": "male",
      "passportNo": "AB1234567",
      "passportExpiry": "2028-12-31",
      "nationality": "Bangladeshi"
    }
  ],
  "contactInfo": {
    "name": "Rahim Uddin",
    "email": "rahim@example.com",
    "phone": "+8801712345678"
  },
  "paymentMethod": "bkash"
}
```

**Response (201):**
```json
{
  "id": "booking-uuid",
  "bookingRef": "ST-FL-20250315-001",
  "status": "confirmed",
  "totalAmount": 5500,
  "currency": "BDT",
  "bookingType": "flight",
  "details": { ... },
  "createdAt": "2025-03-10T14:30:00Z"
}
```

---

## 7. API Endpoints — Hotels

### `GET /hotels/search`

**Query Params:**
| Param | Type | Required | Example |
|-------|------|----------|---------|
| city | string | yes | Cox's Bazar |
| checkIn | string | yes | 2025-03-15 |
| checkOut | string | yes | 2025-03-18 |
| guests | number | no | 2 |
| rooms | number | no | 1 |
| minPrice | number | no | 1000 |
| maxPrice | number | no | 15000 |
| starRating | number | no | 4 |

**Response (200):**
```json
{
  "data": [
    {
      "id": "hotel-uuid",
      "name": "Royal Tulip Sea Pearl",
      "city": "Cox's Bazar",
      "country": "Bangladesh",
      "address": "Inani Beach Road, Cox's Bazar",
      "starRating": 5,
      "userRating": 4.5,
      "reviewCount": 320,
      "pricePerNight": 8500,
      "currency": "BDT",
      "images": ["https://..."],
      "amenities": ["WiFi", "Pool", "Spa", "Restaurant", "Gym"],
      "description": "Luxury beachfront hotel..."
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "totalPages": 2
}
```

### `GET /hotels/:id`

**Response:** Single hotel object with full details including `latitude`, `longitude`, room types in `meta`.

### `POST /hotels/book`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "hotelId": "hotel-uuid",
  "checkIn": "2025-03-15",
  "checkOut": "2025-03-18",
  "rooms": 1,
  "guests": [{ "firstName": "Rahim", "lastName": "Uddin" }],
  "contactInfo": { "name": "Rahim", "email": "r@e.com", "phone": "+880..." },
  "paymentMethod": "card",
  "specialRequests": "Late check-in"
}
```

**Response (201):** Same shape as flight booking response with `bookingType: "hotel"`.

---

## 8. API Endpoints — Holidays

### `GET /holidays/search`

**Query Params:** `destination`, `minPrice`, `maxPrice`, `duration`, `category`, `page`, `limit`

**Response (200):**
```json
{
  "data": [
    {
      "id": "pkg-uuid",
      "title": "Cox's Bazar Beach Getaway",
      "destination": "Cox's Bazar",
      "country": "Bangladesh",
      "duration": "3 Days 2 Nights",
      "price": 12000,
      "currency": "BDT",
      "discountPct": 15,
      "images": ["https://..."],
      "highlights": ["Beach visit", "Seafood dinner", "Island hopping"],
      "category": "beach",
      "rating": 4.7,
      "reviewCount": 89
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### `GET /holidays/:id`

**Response:** Single package with `itinerary`, `inclusions`, `exclusions` arrays.

### `POST /holidays/book`

**Request:** `{ packageId, travellers: [...], contactInfo, paymentMethod }`
**Response (201):** Booking object.

---

## 9. API Endpoints — Visa

### `GET /visa/countries`

**Response (200):**
```json
{
  "data": [
    {
      "code": "TH",
      "name": "Thailand",
      "visaTypes": [
        { "type": "tourist", "label": "Tourist Visa", "processingDays": 5, "fee": 4500 },
        { "type": "business", "label": "Business Visa", "processingDays": 10, "fee": 8000 }
      ],
      "requiredDocuments": ["Passport", "Photo", "Bank Statement", "Hotel Booking"],
      "processingTime": "5-10 working days"
    }
  ]
}
```

### `POST /visa/apply`

**Headers:** `Authorization: Bearer <token>`

**Request:** `multipart/form-data` with JSON `applicantInfo` + file uploads for documents.

**Response (201):**
```json
{
  "id": "visa-app-uuid",
  "country": "Thailand",
  "visaType": "tourist",
  "status": "submitted",
  "processingFee": 4500,
  "submittedAt": "2025-03-10T14:30:00Z"
}
```

### `GET /visa/applications`

**Headers:** `Authorization: Bearer <token>`

**Response:** Paginated list of the user's visa applications.

---

## 10. API Endpoints — Medical Tourism

### `GET /medical/hospitals`

**Query Params:** `country`, `specialty`, `minRating`, `page`, `limit`

**Response (200):**
```json
{
  "data": [
    {
      "id": "hosp-uuid",
      "name": "Apollo Hospital",
      "city": "Chennai",
      "country": "India",
      "specialties": ["Cardiac Surgery", "Orthopedic", "Cancer Treatment"],
      "accreditations": ["JCI", "NABH"],
      "rating": 4.8,
      "priceRange": "$$",
      "description": "...",
      "images": ["https://..."]
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### `GET /medical/search`

**Query Params:** `treatment`, `country`, `page`, `limit`

**Response:** Same as hospitals list filtered by treatment type.

### `POST /medical/book`

**Request:** `{ hospitalId, treatmentType, patientInfo, travelDates, contactInfo, paymentMethod }`
**Response (201):** Booking object with `bookingType: "medical"`.

---

## 11. API Endpoints — Car Rental

### `GET /cars/search`

**Query Params:** `city`, `pickupDate`, `returnDate`, `type`, `minPrice`, `maxPrice`, `page`, `limit`

**Response (200):**
```json
{
  "data": [
    {
      "id": "car-uuid",
      "name": "Toyota Corolla 2024",
      "type": "Sedan",
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2024,
      "seats": 5,
      "transmission": "automatic",
      "fuelType": "Petrol",
      "pricePerDay": 3500,
      "currency": "BDT",
      "images": ["https://..."],
      "features": ["AC", "GPS", "Bluetooth"],
      "city": "Dhaka"
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### `GET /cars/:id`

**Response:** Single car with full details.

### `POST /cars/book`

**Request:** `{ carId, pickupDate, returnDate, driverInfo, contactInfo, paymentMethod }`
**Response (201):** Booking object with `bookingType: "car"`.

---

## 12. API Endpoints — eSIM

### `GET /esim/plans`

**Query Params:** `country`, `region`, `page`, `limit`

**Response (200):**
```json
{
  "data": [
    {
      "id": "esim-uuid",
      "country": "Thailand",
      "region": "Southeast Asia",
      "dataAmount": "5 GB",
      "duration": "30 Days",
      "price": 2000,
      "currency": "BDT",
      "provider": "eSIM Go",
      "features": ["4G/LTE", "Instant activation", "No roaming fees"]
    }
  ],
  "total": 20,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### `POST /esim/purchase`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "planId": "esim-uuid",
  "email": "user@example.com",
  "paymentMethod": "bkash"
}
```

**Response (201):**
```json
{
  "id": "purchase-uuid",
  "qrCode": "https://...",
  "activationCode": "LPA:1$...",
  "instructions": "Scan QR or enter code manually...",
  "transactionId": "txn-uuid"
}
```

---

## 13. API Endpoints — Mobile Recharge

### `GET /recharge/operators`

**Response (200):**
```json
{
  "data": [
    { "id": "grameenphone", "name": "Grameenphone", "logo": "https://...", "type": "prepaid" },
    { "id": "robi", "name": "Robi", "logo": "https://...", "type": "prepaid" },
    { "id": "banglalink", "name": "Banglalink", "logo": "https://...", "type": "prepaid" },
    { "id": "airtel", "name": "Airtel", "logo": "https://...", "type": "prepaid" },
    { "id": "teletalk", "name": "Teletalk", "logo": "https://...", "type": "prepaid" }
  ]
}
```

### `POST /recharge/submit`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "operator": "grameenphone",
  "phoneNumber": "01712345678",
  "amount": 100,
  "type": "prepaid",
  "paymentMethod": "bkash"
}
```

**Response (201):**
```json
{
  "id": "recharge-uuid",
  "status": "completed",
  "transactionId": "txn-uuid",
  "message": "Recharge of ৳100 to 01712345678 successful"
}
```

---

## 14. API Endpoints — Bill Payment

### `GET /paybill/categories`

**Response (200):**
```json
{
  "data": [
    {
      "id": "electricity",
      "name": "Electricity",
      "icon": "zap",
      "billers": [
        { "id": "dpdc", "name": "DPDC", "logo": "https://..." },
        { "id": "desco", "name": "DESCO", "logo": "https://..." }
      ]
    },
    {
      "id": "gas",
      "name": "Gas",
      "icon": "flame",
      "billers": [
        { "id": "titas", "name": "Titas Gas", "logo": "https://..." }
      ]
    }
  ]
}
```

### `GET /paybill/billers`

**Query Params:** `category`

**Response:** Array of billers for that category.

### `POST /paybill/submit`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "billerId": "dpdc",
  "accountNumber": "1234567890",
  "amount": 2500,
  "paymentMethod": "bkash",
  "month": "2025-03"
}
```

**Response (201):**
```json
{
  "id": "bill-uuid",
  "status": "completed",
  "transactionId": "txn-uuid",
  "message": "Bill payment of ৳2500 to DPDC successful"
}
```

---

## 15. API Endpoints — Customer Dashboard

> All endpoints require `Authorization: Bearer <token>` header.

### `GET /dashboard/stats`

**Response (200):**
```json
{
  "totalBookings": 12,
  "upcomingTrips": 2,
  "totalSpent": 145000,
  "savedTravellers": 4,
  "recentBookings": [
    {
      "id": "booking-uuid",
      "bookingRef": "ST-FL-20250315-001",
      "bookingType": "flight",
      "status": "confirmed",
      "totalAmount": 5500,
      "booked_at": "2025-03-10T14:30:00Z",
      "details": { "origin": "DAC", "destination": "CXB", "departureTime": "..." }
    }
  ],
  "monthlySpending": [
    { "month": "Jan", "amount": 12000 },
    { "month": "Feb", "amount": 8500 }
  ]
}
```

### `GET /dashboard/bookings`

**Query Params:** `status`, `type`, `page`, `limit`, `search`

**Response (200):** Paginated list of user's bookings.

### `GET /dashboard/transactions`

**Query Params:** `type`, `status`, `page`, `limit`, `dateFrom`, `dateTo`

**Response (200):**
```json
{
  "data": [
    {
      "id": "txn-uuid",
      "type": "payment",
      "amount": 5500,
      "currency": "BDT",
      "status": "completed",
      "paymentMethod": "bkash",
      "reference": "BK-2025031001",
      "description": "Flight booking DAC→CXB",
      "createdAt": "2025-03-10T14:30:00Z"
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 20,
  "totalPages": 2,
  "summary": {
    "totalInflow": 5000,
    "totalOutflow": 145000,
    "balance": -140000
  }
}
```

### `GET /dashboard/travellers`

**Response (200):**
```json
{
  "data": [
    {
      "id": "traveller-uuid",
      "firstName": "Rahim",
      "lastName": "Uddin",
      "email": "rahim@example.com",
      "phone": "+8801712345678",
      "dateOfBirth": "1990-05-15",
      "gender": "male",
      "nationality": "Bangladeshi",
      "passportNo": "AB1234567",
      "passportExpiry": "2028-12-31",
      "documentType": "passport"
    }
  ]
}
```

### `POST /dashboard/travellers`

**Request:** Traveller object (without id).
**Response (201):** Created traveller with id.

### `DELETE /dashboard/travellers/:id`

**Response (204):** No content.

### `GET /dashboard/payments`

**Response (200):** List of user's payment methods and payment history.

### `POST /dashboard/payments`

**Request:** `{ method, details }` — save a payment method.
**Response (201):** Saved payment method.

### `GET /dashboard/tickets`

**Query Params:** `status`, `page`, `limit`

**Response (200):**
```json
{
  "data": [
    {
      "id": "ticket-uuid",
      "bookingId": "booking-uuid",
      "ticketNo": "098-1234567890",
      "pnr": "ABC123",
      "status": "active",
      "pdfUrl": "https://api.seventrip.com.bd/tickets/download/ticket-uuid",
      "details": {
        "airline": "Biman Bangladesh",
        "flightNumber": "BG-435",
        "origin": "DAC",
        "destination": "CXB",
        "departureTime": "2025-03-15T08:00:00Z",
        "passenger": "Rahim Uddin",
        "seat": "12A",
        "class": "Economy"
      },
      "issuedAt": "2025-03-10T14:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### `GET /dashboard/wishlist`

**Response (200):**
```json
{
  "data": [
    {
      "id": "wish-uuid",
      "itemType": "hotel",
      "itemId": "hotel-uuid",
      "itemData": {
        "name": "Royal Tulip Sea Pearl",
        "city": "Cox's Bazar",
        "pricePerNight": 8500,
        "starRating": 5,
        "image": "https://..."
      },
      "createdAt": "2025-03-08T10:00:00Z"
    }
  ]
}
```

### `DELETE /dashboard/wishlist/:id`

**Response (204):** No content.

### `GET /dashboard/settings`

**Response (200):** User profile object (same as `user` in auth response).

### `PUT /dashboard/settings`

**Request:** `{ firstName, lastName, phone, avatar }` (partial update)
**Response (200):** Updated user object.

### `POST /dashboard/settings/password`

**Request:**
```json
{
  "currentPassword": "oldPass123",
  "newPassword": "newPass456"
}
```

**Response (200):** `{ "message": "Password updated successfully" }`

### `PATCH /dashboard/settings/profile`

**Request:** Partial user fields.
**Response (200):** Updated user object.

---

## 16. API Endpoints — Admin

> All endpoints require `Authorization: Bearer <token>` with `role = admin | super_admin`.

### `GET /admin/dashboard`

**Response (200):**
```json
{
  "totalUsers": 15420,
  "totalBookings": 8350,
  "totalRevenue": 45200000,
  "activeVisaApplications": 124,
  "monthlyRevenue": [
    { "month": "Jan 2025", "revenue": 3200000, "bookings": 580 }
  ],
  "bookingsByType": {
    "flight": 4200,
    "hotel": 2100,
    "holiday": 1050,
    "visa": 600,
    "medical": 250,
    "car": 150
  },
  "recentBookings": [...],
  "recentUsers": [...]
}
```

### `GET /admin/users`

**Query Params:** `search`, `role`, `status`, `page`, `limit`, `sortBy`, `sortOrder`

**Response (200):** Paginated user list with all fields (except password_hash).

### `GET /admin/users/:id`

**Response (200):** Single user with booking history.

### `PUT /admin/users/:id`

**Request:** `{ role, emailVerified, phoneVerified, ... }`
**Response (200):** Updated user.

### `DELETE /admin/users/:id`

**Response (204):** No content.

### `GET /admin/bookings`

**Query Params:** `status`, `type`, `search`, `dateFrom`, `dateTo`, `page`, `limit`

**Response (200):** Paginated booking list with user info attached.

### `PUT /admin/bookings/:id`

**Request:** `{ status, notes }`
**Response (200):** Updated booking.

### `GET /admin/payments`

**Query Params:** `status`, `method`, `dateFrom`, `dateTo`, `page`, `limit`

**Response (200):** Paginated transaction list with user + booking info.

### `GET /admin/reports`

**Query Params:** `type` (revenue|bookings|users|services), `dateFrom`, `dateTo`, `groupBy` (day|week|month)

**Response (200):**
```json
{
  "type": "revenue",
  "dateFrom": "2025-01-01",
  "dateTo": "2025-03-31",
  "data": [
    { "period": "2025-01", "revenue": 3200000, "bookings": 580, "users": 320 },
    { "period": "2025-02", "revenue": 4100000, "bookings": 720, "users": 410 }
  ],
  "summary": {
    "totalRevenue": 12500000,
    "totalBookings": 2100,
    "averageOrderValue": 5952,
    "growthRate": 12.5
  }
}
```

### `GET /admin/settings`

**Response (200):**
```json
{
  "siteName": "Seven Trip",
  "supportEmail": "support@seventrip.com.bd",
  "defaultCurrency": "BDT",
  "defaultLanguage": "en",
  "paymentGateways": [
    { "id": "bkash", "name": "bKash", "enabled": true },
    { "id": "nagad", "name": "Nagad", "enabled": true },
    { "id": "card", "name": "Credit/Debit Card", "enabled": true }
  ],
  "smtpSettings": {
    "host": "smtp.example.com",
    "port": 587,
    "username": "noreply@seventrip.com.bd"
  },
  "notifications": [
    { "id": "new_booking", "label": "New Booking Alert", "enabled": true },
    { "id": "payment_received", "label": "Payment Received", "enabled": true }
  ]
}
```

### `PUT /admin/settings`

**Request:** Full or partial settings object.
**Response (200):** Updated settings.

### `GET /admin/visa`

**Query Params:** `status`, `country`, `page`, `limit`

**Response (200):** Paginated visa applications with user info.

### `PUT /admin/visa/:id`

**Request:** `{ status, notes }`
**Response (200):** Updated visa application.

---

## 17. API Endpoints — CMS

> All require admin auth.

### Pages: `GET /admin/cms/pages`, `POST`, `PUT /:id`, `DELETE /:id`

**Page Object:**
```json
{
  "id": "uuid",
  "title": "About Us",
  "slug": "about",
  "content": "<h1>About Seven Trip</h1>...",
  "status": "published",
  "author": { "id": "uuid", "name": "Admin" },
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Blog: `GET /admin/cms/blog`, `POST`, `PUT /:id`, `DELETE /:id`

**Blog Post Object:**
```json
{
  "id": "uuid",
  "title": "Top 10 Beaches in Bangladesh",
  "slug": "top-10-beaches-bangladesh",
  "excerpt": "Discover the most beautiful...",
  "content": "...",
  "coverImage": "https://...",
  "category": "Travel Tips",
  "tags": ["beach", "bangladesh", "travel"],
  "status": "published",
  "author": { "id": "uuid", "name": "Admin" },
  "views": 1250,
  "publishedAt": "2025-02-20T10:00:00Z"
}
```

### Promotions: `GET /admin/cms/promotions`, `POST`, `PUT /:id`, `DELETE /:id`

**Promotion Object:**
```json
{
  "id": "uuid",
  "title": "Summer Sale 2025",
  "code": "SUMMER25",
  "description": "Get 25% off on all beach holidays",
  "discountType": "percentage",
  "discountValue": 25,
  "minOrder": 5000,
  "maxUses": 500,
  "usedCount": 123,
  "validFrom": "2025-06-01T00:00:00Z",
  "validUntil": "2025-08-31T23:59:59Z",
  "status": "active",
  "applicableTo": { "types": ["holiday"] }
}
```

### Destinations: `GET /admin/cms/destinations`, `POST`, `PUT /:id`, `DELETE /:id`

**Destination Object:**
```json
{
  "id": "uuid",
  "name": "Cox's Bazar",
  "country": "Bangladesh",
  "description": "World's longest natural sea beach...",
  "images": ["https://..."],
  "highlights": ["Longest beach", "Seafood", "Buddhist temples"],
  "bestTime": "November - March",
  "featured": true,
  "status": "active"
}
```

### Media: `GET /admin/cms/media`, `POST` (multipart), `DELETE /:id`

**Upload Request:** `multipart/form-data` with `file` field + optional `alt_text`, `folder`.

**Media Object:**
```json
{
  "id": "uuid",
  "filename": "beach-sunset-abc123.jpg",
  "originalName": "beach-sunset.jpg",
  "mimeType": "image/jpeg",
  "size": 245000,
  "url": "https://api.seventrip.com.bd/uploads/beach-sunset-abc123.jpg",
  "altText": "Sunset at Cox's Bazar beach",
  "folder": "destinations",
  "uploadedBy": { "id": "uuid", "name": "Admin" },
  "createdAt": "..."
}
```

### Email Templates: `GET /admin/cms/email-templates`, `POST`, `PUT /:id`, `DELETE /:id`

**Template Object:**
```json
{
  "id": "uuid",
  "name": "Booking Confirmation",
  "subject": "Your Booking {{bookingRef}} is Confirmed!",
  "body": "<html>...<p>Dear {{customerName}},</p>...",
  "variables": ["bookingRef", "customerName", "totalAmount", "bookingDate"],
  "category": "booking",
  "active": true
}
```

---

## 18. API Endpoints — Contact

### `POST /contact/submit`

**No auth required.**

**Request:**
```json
{
  "name": "Karim Ahmed",
  "email": "karim@example.com",
  "subject": "Booking inquiry",
  "message": "I'd like to know about group discounts..."
}
```

**Response (201):**
```json
{
  "id": "submission-uuid",
  "message": "Thank you! We'll get back to you within 24 hours."
}
```

---

## 19. Error Handling

### Validation Errors (400)
```json
{
  "message": "Validation failed",
  "status": 400,
  "errors": {
    "email": ["Email is required", "Must be a valid email"],
    "password": ["Must be at least 8 characters"]
  }
}
```

### Not Found (404)
```json
{
  "message": "Flight not found",
  "status": 404
}
```

### Unauthorized (401)
```json
{
  "message": "Invalid or expired token",
  "status": 401
}
```

### Forbidden (403)
```json
{
  "message": "Access denied. Admin privileges required.",
  "status": 403
}
```

### Internal Error (500)
```json
{
  "message": "Something went wrong. Please try again later.",
  "status": 500
}
```

---

## 20. Environment Variables

Create a `.env` file in your backend project root:

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=seventrip_user
DB_PASSWORD=your_strong_password_here
DB_DATABASE=seventrip_db

# JWT
JWT_SECRET=your-256-bit-secret-here-change-this
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@seventrip.com.bd
SMTP_PASS=your-smtp-app-password
SMTP_FROM="Seven Trip <noreply@seventrip.com.bd>"

# Frontend URL (for CORS and email links)
FRONTEND_URL=https://seventrip.com.bd

# File uploads
UPLOAD_DIR=/var/www/seventrip-api/uploads
MAX_FILE_SIZE=10485760

# Optional: External APIs
# AMADEUS_API_KEY=...
# AMADEUS_API_SECRET=...
```

---

## 21. Deployment Checklist

### Before Going Live

- [ ] All 50+ endpoints implemented and tested
- [ ] MySQL database created with all tables from Section 2
- [ ] Default admin user seeded: `admin@seventrip.com.bd` / `role: super_admin`
- [ ] JWT secrets are strong (256-bit random)
- [ ] SMTP configured and sending emails
- [ ] CORS configured for frontend domain only
- [ ] Rate limiting on auth endpoints (5 req/min)
- [ ] Input validation on all endpoints (use class-validator or Joi)
- [ ] SQL injection prevention (use parameterized queries / ORM)
- [ ] File upload validation (type + size)
- [ ] PM2 ecosystem file configured
- [ ] Nginx reverse proxy configured for `/api` → port 3001
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall: only ports 80, 443, 22 open
- [ ] Database backups scheduled (daily cron)
- [ ] Error logging configured (Winston / Pino)
- [ ] Health check endpoint: `GET /api/health` → `{ "status": "ok" }`

### Seed Data

```sql
-- Create super admin
INSERT INTO users (id, first_name, last_name, email, password_hash, role, email_verified)
VALUES (UUID(), 'Super', 'Admin', 'admin@seventrip.com.bd', '$2b$12$...hashed...', 'super_admin', 1);

-- Insert BD recharge operators
INSERT INTO recharge_operators (id, name, logo, type, active) VALUES
('grameenphone', 'Grameenphone', '/images/operators/gp.png', 'prepaid', 1),
('robi', 'Robi', '/images/operators/robi.png', 'prepaid', 1),
('banglalink', 'Banglalink', '/images/operators/bl.png', 'prepaid', 1),
('airtel', 'Airtel', '/images/operators/airtel.png', 'prepaid', 1),
('teletalk', 'Teletalk', '/images/operators/teletalk.png', 'prepaid', 1);

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, category) VALUES
('site_name', 'Seven Trip', 'general'),
('support_email', 'support@seventrip.com.bd', 'general'),
('default_currency', 'BDT', 'general'),
('default_language', 'en', 'general');
```

---

## Quick Reference: Endpoint Summary

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | POST | /auth/register | No | Register new user |
| 2 | POST | /auth/login | No | User login |
| 3 | POST | /admin/auth/login | No | Admin login |
| 4 | POST | /auth/refresh | No | Refresh access token |
| 5 | POST | /auth/forgot-password | No | Send OTP email |
| 6 | POST | /auth/verify-otp | No | Verify OTP code |
| 7 | POST | /auth/reset-password | No | Reset password |
| 8 | POST | /auth/logout | Yes | Logout |
| 9 | GET | /flights/search | No | Search flights |
| 10 | GET | /flights/:id | No | Flight details |
| 11 | POST | /flights/book | Yes | Book flight |
| 12 | GET | /hotels/search | No | Search hotels |
| 13 | GET | /hotels/:id | No | Hotel details |
| 14 | POST | /hotels/book | Yes | Book hotel |
| 15 | GET | /holidays/search | No | Search packages |
| 16 | GET | /holidays/:id | No | Package details |
| 17 | POST | /holidays/book | Yes | Book package |
| 18 | GET | /visa/countries | No | Visa countries list |
| 19 | POST | /visa/apply | Yes | Submit visa app |
| 20 | GET | /visa/applications | Yes | User's visa apps |
| 21 | GET | /medical/hospitals | No | List hospitals |
| 22 | GET | /medical/search | No | Search medical |
| 23 | POST | /medical/book | Yes | Book medical |
| 24 | GET | /cars/search | No | Search cars |
| 25 | GET | /cars/:id | No | Car details |
| 26 | POST | /cars/book | Yes | Book car |
| 27 | GET | /esim/plans | No | List eSIM plans |
| 28 | POST | /esim/purchase | Yes | Purchase eSIM |
| 29 | GET | /recharge/operators | No | List operators |
| 30 | POST | /recharge/submit | Yes | Submit recharge |
| 31 | GET | /paybill/categories | No | Bill categories |
| 32 | GET | /paybill/billers | No | List billers |
| 33 | POST | /paybill/submit | Yes | Pay bill |
| 34 | GET | /dashboard/stats | Yes | User stats |
| 35 | GET | /dashboard/bookings | Yes | User bookings |
| 36 | GET | /dashboard/transactions | Yes | User transactions |
| 37 | GET | /dashboard/travellers | Yes | Saved travellers |
| 38 | POST | /dashboard/travellers | Yes | Add traveller |
| 39 | DELETE | /dashboard/travellers/:id | Yes | Remove traveller |
| 40 | GET | /dashboard/payments | Yes | Payment methods |
| 41 | POST | /dashboard/payments | Yes | Add payment method |
| 42 | GET | /dashboard/tickets | Yes | E-tickets |
| 43 | GET | /dashboard/wishlist | Yes | Wishlist items |
| 44 | DELETE | /dashboard/wishlist/:id | Yes | Remove wish item |
| 45 | GET | /dashboard/settings | Yes | Profile settings |
| 46 | PUT | /dashboard/settings | Yes | Update profile |
| 47 | POST | /dashboard/settings/password | Yes | Change password |
| 48 | PATCH | /dashboard/settings/profile | Yes | Partial update |
| 49 | GET | /admin/dashboard | Admin | Admin stats |
| 50 | GET | /admin/users | Admin | List users |
| 51 | GET | /admin/users/:id | Admin | User detail |
| 52 | PUT | /admin/users/:id | Admin | Update user |
| 53 | DELETE | /admin/users/:id | Admin | Delete user |
| 54 | GET | /admin/bookings | Admin | All bookings |
| 55 | PUT | /admin/bookings/:id | Admin | Update booking |
| 56 | GET | /admin/payments | Admin | All payments |
| 57 | GET | /admin/reports | Admin | Reports data |
| 58 | GET | /admin/settings | Admin | System settings |
| 59 | PUT | /admin/settings | Admin | Update settings |
| 60 | GET | /admin/visa | Admin | Visa applications |
| 61 | PUT | /admin/visa/:id | Admin | Update visa app |
| 62 | GET | /admin/cms/pages | Admin | CMS pages |
| 63 | POST | /admin/cms/pages | Admin | Create page |
| 64 | PUT | /admin/cms/pages/:id | Admin | Update page |
| 65 | DELETE | /admin/cms/pages/:id | Admin | Delete page |
| 66 | GET | /admin/cms/blog | Admin | Blog posts |
| 67 | POST | /admin/cms/blog | Admin | Create post |
| 68 | PUT | /admin/cms/blog/:id | Admin | Update post |
| 69 | DELETE | /admin/cms/blog/:id | Admin | Delete post |
| 70 | GET | /admin/cms/promotions | Admin | Promotions |
| 71 | POST | /admin/cms/promotions | Admin | Create promo |
| 72 | PUT | /admin/cms/promotions/:id | Admin | Update promo |
| 73 | DELETE | /admin/cms/promotions/:id | Admin | Delete promo |
| 74 | GET | /admin/cms/destinations | Admin | Destinations |
| 75 | POST | /admin/cms/destinations | Admin | Create dest |
| 76 | PUT | /admin/cms/destinations/:id | Admin | Update dest |
| 77 | DELETE | /admin/cms/destinations/:id | Admin | Delete dest |
| 78 | GET | /admin/cms/media | Admin | Media library |
| 79 | POST | /admin/cms/media | Admin | Upload file |
| 80 | DELETE | /admin/cms/media/:id | Admin | Delete file |
| 81 | GET | /admin/cms/email-templates | Admin | Email templates |
| 82 | POST | /admin/cms/email-templates | Admin | Create template |
| 83 | PUT | /admin/cms/email-templates/:id | Admin | Update template |
| 84 | DELETE | /admin/cms/email-templates/:id | Admin | Delete template |
| 85 | POST | /contact/submit | No | Contact form |
| 86 | GET | /api/health | No | Health check |

---

**Total: 86 endpoints. Your backend developer builds these, the frontend is already wired and waiting.**
