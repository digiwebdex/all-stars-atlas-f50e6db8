-- =============================================
-- Seven Trip - Complete Database Migration
-- Run: mysql -u seventrip_user -p seventrip < database/migration.sql
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ====== CORE TABLES ======

CREATE TABLE IF NOT EXISTS users (
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
  otp_code      VARCHAR(255),
  otp_expires   DATETIME,
  reset_token   VARCHAR(255),
  reset_expires DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    CHAR(36) NOT NULL,
  token      VARCHAR(500) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
);

CREATE TABLE IF NOT EXISTS bookings (
  id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id         CHAR(36) NOT NULL,
  booking_type    ENUM('flight','hotel','holiday','visa','medical','car') NOT NULL,
  booking_ref     VARCHAR(20) NOT NULL UNIQUE,
  status          ENUM('pending','confirmed','cancelled','completed','refunded','failed','on_hold','void','exchange','no_show','partially_refunded','processing') DEFAULT 'pending',
  total_amount    DECIMAL(12,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'BDT',
  payment_method  ENUM('bkash','nagad','rocket','card','bank_transfer'),
  payment_status  ENUM('unpaid','paid','partial','refunded') DEFAULT 'unpaid',
  details         JSON,
  passenger_info  JSON,
  contact_info    JSON,
  notes           TEXT,
  booked_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_type (booking_type),
  INDEX idx_ref (booking_ref)
);

CREATE TABLE IF NOT EXISTS transactions (
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

CREATE TABLE IF NOT EXISTS travellers (
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

CREATE TABLE IF NOT EXISTS tickets (
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

CREATE TABLE IF NOT EXISTS wishlist (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id     CHAR(36) NOT NULL,
  item_type   ENUM('flight','hotel','holiday','medical','car') NOT NULL,
  item_id     VARCHAR(100) NOT NULL,
  item_data   JSON NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wish (user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS visa_applications (
  id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id        CHAR(36) NOT NULL,
  country        VARCHAR(100) NOT NULL,
  visa_type      VARCHAR(50) NOT NULL,
  status         ENUM('draft','submitted','processing','approved','rejected') DEFAULT 'draft',
  applicant_info JSON NOT NULL,
  documents      JSON,
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

-- ====== PRODUCT TABLES ======

CREATE TABLE IF NOT EXISTS flights (
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

CREATE TABLE IF NOT EXISTS hotels (
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
  images        JSON,
  amenities     JSON,
  description   TEXT,
  latitude      DECIMAL(10,8),
  longitude     DECIMAL(11,8),
  available     TINYINT(1) DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_city (city)
);

CREATE TABLE IF NOT EXISTS holiday_packages (
  id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title         VARCHAR(255) NOT NULL,
  destination   VARCHAR(100) NOT NULL,
  country       VARCHAR(100),
  duration      VARCHAR(50),
  price         DECIMAL(10,2) NOT NULL,
  currency      VARCHAR(3) DEFAULT 'BDT',
  discount_pct  INT DEFAULT 0,
  images        JSON,
  highlights    JSON,
  itinerary     JSON,
  inclusions    JSON,
  exclusions    JSON,
  category      ENUM('beach','adventure','cultural','luxury','family','honeymoon') DEFAULT 'cultural',
  rating        DECIMAL(2,1),
  review_count  INT DEFAULT 0,
  available     TINYINT(1) DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_destination (destination)
);

CREATE TABLE IF NOT EXISTS medical_hospitals (
  id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name            VARCHAR(255) NOT NULL,
  city            VARCHAR(100) NOT NULL,
  country         VARCHAR(100) NOT NULL,
  specialties     JSON,
  accreditations  JSON,
  rating          DECIMAL(2,1),
  price_range     VARCHAR(50),
  description     TEXT,
  images          JSON,
  contact         JSON,
  available       TINYINT(1) DEFAULT 1,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cars (
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

CREATE TABLE IF NOT EXISTS esim_plans (
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

CREATE TABLE IF NOT EXISTS recharge_operators (
  id          VARCHAR(50) PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  logo        VARCHAR(500),
  type        ENUM('prepaid','postpaid') DEFAULT 'prepaid',
  active      TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bill_categories (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(100) NOT NULL,
  icon        VARCHAR(50),
  billers     JSON,
  active      TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(200) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  subject     VARCHAR(255),
  message     TEXT NOT NULL,
  status      ENUM('new','read','replied') DEFAULT 'new',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ====== CMS TABLES ======

CREATE TABLE IF NOT EXISTS cms_pages (
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

CREATE TABLE IF NOT EXISTS cms_blog_posts (
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

CREATE TABLE IF NOT EXISTS cms_promotions (
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
  applicable_to JSON,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_destinations (
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

CREATE TABLE IF NOT EXISTS cms_media (
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

CREATE TABLE IF NOT EXISTS cms_email_templates (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(255) NOT NULL,
  subject     VARCHAR(255) NOT NULL,
  body        LONGTEXT NOT NULL,
  variables   JSON,
  category    VARCHAR(50),
  active      TINYINT(1) DEFAULT 1,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key   VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  category      VARCHAR(50) DEFAULT 'general',
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- SEED DATA
-- =============================================

-- ====== USERS (passwords will be fixed by fix-passwords.js) ======
INSERT IGNORE INTO users (id, first_name, last_name, email, phone, password_hash, role, email_verified) VALUES
('u-admin-001', 'Super', 'Admin', 'admin@seventrip.com.bd', '+8801700000000', 'temp_hash', 'super_admin', 1),
('u-user-001', 'Abdur', 'Rahim', 'rahim@gmail.com', '+8801712345678', 'temp_hash', 'customer', 1),
('u-user-002', 'Fatema', 'Khatun', 'fatema@gmail.com', '+8801798765432', 'temp_hash', 'customer', 1);

-- ====== FLIGHTS ======
INSERT IGNORE INTO flights (id, airline, airline_code, airline_logo, flight_number, origin, origin_city, destination, destination_city, departure_time, arrival_time, duration, stops, cabin_class, price, seats_available, baggage, refundable) VALUES
('fl-001', 'Biman Bangladesh', 'BG', '/images/airlines/biman.png', 'BG-201', 'DAC', 'Dhaka', 'CXB', 'Cox''s Bazar', '2026-04-15 08:00:00', '2026-04-15 09:05:00', '1h 5m', 0, 'Economy', 4500.00, 120, '20kg', 1),
('fl-002', 'US-Bangla Airlines', 'BS', '/images/airlines/usbangla.png', 'BS-141', 'DAC', 'Dhaka', 'CXB', 'Cox''s Bazar', '2026-04-15 10:30:00', '2026-04-15 11:35:00', '1h 5m', 0, 'Economy', 3800.00, 80, '20kg', 0),
('fl-003', 'Novoair', 'VQ', '/images/airlines/novoair.png', 'VQ-901', 'DAC', 'Dhaka', 'CGP', 'Chittagong', '2026-04-15 07:00:00', '2026-04-15 07:55:00', '55m', 0, 'Economy', 3200.00, 60, '20kg', 1),
('fl-004', 'Biman Bangladesh', 'BG', '/images/airlines/biman.png', 'BG-401', 'DAC', 'Dhaka', 'DXB', 'Dubai', '2026-04-16 22:00:00', '2026-04-17 02:30:00', '5h 30m', 0, 'Economy', 32000.00, 200, '30kg', 1),
('fl-005', 'Emirates', 'EK', '/images/airlines/emirates.png', 'EK-585', 'DAC', 'Dhaka', 'DXB', 'Dubai', '2026-04-16 03:00:00', '2026-04-16 07:20:00', '5h 20m', 0, 'Business', 95000.00, 30, '40kg', 1),
('fl-006', 'Singapore Airlines', 'SQ', '/images/airlines/singapore.png', 'SQ-447', 'DAC', 'Dhaka', 'SIN', 'Singapore', '2026-04-17 14:00:00', '2026-04-17 22:30:00', '4h 30m', 0, 'Economy', 28000.00, 150, '30kg', 1),
('fl-007', 'Thai Airways', 'TG', '/images/airlines/thai.png', 'TG-322', 'DAC', 'Dhaka', 'BKK', 'Bangkok', '2026-04-18 09:00:00', '2026-04-18 13:15:00', '2h 15m', 0, 'Economy', 22000.00, 100, '30kg', 1),
('fl-008', 'Qatar Airways', 'QR', '/images/airlines/qatar.png', 'QR-641', 'DAC', 'Dhaka', 'DOH', 'Doha', '2026-04-19 01:30:00', '2026-04-19 04:45:00', '5h 15m', 0, 'Economy', 35000.00, 180, '30kg', 1),
('fl-009', 'IndiGo', '6E', '/images/airlines/indigo.png', '6E-1234', 'DAC', 'Dhaka', 'DEL', 'Delhi', '2026-04-20 06:00:00', '2026-04-20 08:30:00', '2h 30m', 0, 'Economy', 15000.00, 90, '15kg', 0),
('fl-010', 'Biman Bangladesh', 'BG', '/images/airlines/biman.png', 'BG-601', 'DAC', 'Dhaka', 'KUL', 'Kuala Lumpur', '2026-04-20 23:00:00', '2026-04-21 06:30:00', '4h 30m', 0, 'Economy', 26000.00, 160, '30kg', 1),
('fl-011', 'US-Bangla Airlines', 'BS', '/images/airlines/usbangla.png', 'BS-301', 'DAC', 'Dhaka', 'SYL', 'Sylhet', '2026-04-15 14:00:00', '2026-04-15 14:45:00', '45m', 0, 'Economy', 3500.00, 70, '20kg', 0),
('fl-012', 'Air Arabia', 'G9', '/images/airlines/airarabia.png', 'G9-282', 'DAC', 'Dhaka', 'SHJ', 'Sharjah', '2026-04-21 04:00:00', '2026-04-21 08:00:00', '5h 0m', 0, 'Economy', 25000.00, 140, '30kg', 0);

-- ====== HOTELS ======
INSERT IGNORE INTO hotels (id, name, city, country, address, star_rating, user_rating, review_count, price_per_night, images, amenities, description, available) VALUES
('ht-001', 'Royal Tulip Sea Pearl Beach Resort', 'Cox''s Bazar', 'Bangladesh', 'Inani Beach, Cox''s Bazar', 5, 4.5, 320, 12000.00, '["https://placehold.co/800x600?text=SeaPearl"]', '["WiFi","Pool","Spa","Restaurant","Beach Access","Gym"]', 'Luxury beachfront resort with stunning ocean views and world-class amenities.', 1),
('ht-002', 'Long Beach Hotel', 'Cox''s Bazar', 'Bangladesh', 'Kolatoli Road, Cox''s Bazar', 4, 4.2, 210, 6500.00, '["https://placehold.co/800x600?text=LongBeach"]', '["WiFi","Pool","Restaurant","Room Service"]', 'Premium hotel steps from the longest beach in the world.', 1),
('ht-003', 'Pan Pacific Sonargaon', 'Dhaka', 'Bangladesh', '107 Kazi Nazrul Islam Ave, Dhaka', 5, 4.4, 580, 15000.00, '["https://placehold.co/800x600?text=Sonargaon"]', '["WiFi","Pool","Spa","Restaurant","Gym","Business Center","Bar"]', 'Iconic 5-star hotel in the heart of Dhaka with legendary hospitality.', 1),
('ht-004', 'Radisson Blu Chattogram Bay View', 'Chittagong', 'Bangladesh', 'SS Khaled Road, Chittagong', 5, 4.3, 190, 11000.00, '["https://placehold.co/800x600?text=RadissonCTG"]', '["WiFi","Pool","Spa","Restaurant","Gym","Bay View"]', 'Modern luxury hotel overlooking the Chittagong bay.', 1),
('ht-005', 'Grand Sultan Tea Resort & Golf', 'Srimangal', 'Bangladesh', 'Srimangal, Moulvibazar', 5, 4.6, 150, 9500.00, '["https://placehold.co/800x600?text=GrandSultan"]', '["WiFi","Pool","Golf","Spa","Restaurant","Tea Garden Tour"]', 'Sprawling resort surrounded by lush tea gardens.', 1),
('ht-006', 'Hotel Amari Dhaka', 'Dhaka', 'Bangladesh', 'Gulshan 2, Dhaka', 4, 4.1, 340, 8500.00, '["https://placehold.co/800x600?text=Amari"]', '["WiFi","Pool","Restaurant","Gym","Business Center"]', 'Contemporary business hotel in Gulshan.', 1),
('ht-007', 'Sayeman Beach Resort', 'Cox''s Bazar', 'Bangladesh', 'Marine Drive, Cox''s Bazar', 4, 4.0, 250, 5500.00, '["https://placehold.co/800x600?text=Sayeman"]', '["WiFi","Pool","Restaurant","Beach Access"]', 'Popular beach resort with great value.', 1),
('ht-008', 'Le Méridien Dhaka', 'Dhaka', 'Bangladesh', '79/A Commercial Area, Airport Rd', 5, 4.5, 420, 18000.00, '["https://placehold.co/800x600?text=LeMeridien"]', '["WiFi","Pool","Spa","Restaurant","Gym","Bar","Lounge"]', 'Premium international chain hotel near the airport.', 1);

-- ====== HOLIDAY PACKAGES ======
INSERT IGNORE INTO holiday_packages (id, title, destination, country, duration, price, discount_pct, images, highlights, itinerary, inclusions, exclusions, category, rating, review_count) VALUES
('hp-001', 'Cox''s Bazar Beach Escape', 'Cox''s Bazar', 'Bangladesh', '3 Days 2 Nights', 15000.00, 10, '["https://placehold.co/800x600?text=CoxsBazar"]', '["Beach walk","Inani Beach","Himchari Waterfall","Seafood dinner"]', '[{"day":1,"title":"Arrival & Beach","description":"Check in, explore Kolatoli beach"},{"day":2,"title":"Day Trip","description":"Visit Inani Beach and Himchari National Park"},{"day":3,"title":"Departure","description":"Morning swim and checkout"}]', '["Hotel accommodation","Breakfast","Airport transfer","Sightseeing"]', '["Lunch & Dinner","Personal expenses","Travel insurance"]', 'beach', 4.5, 85),
('hp-002', 'Sundarbans Adventure', 'Sundarbans', 'Bangladesh', '4 Days 3 Nights', 22000.00, 0, '["https://placehold.co/800x600?text=Sundarbans"]', '["Royal Bengal Tiger habitat","Boat safari","Kotka beach","Karamjal"]', '[{"day":1,"title":"Mongla to Sundarbans","description":"Board the ship, enter the mangrove forest"},{"day":2,"title":"Deep Forest","description":"Tiger spotting, Kotka wildlife center"},{"day":3,"title":"River Safari","description":"Explore creeks and rivers, bird watching"},{"day":4,"title":"Return","description":"Morning safari and return to Mongla"}]', '["Ship accommodation","All meals","Guide","Forest permit"]', '["Personal expenses","Tips","Camera fees"]', 'adventure', 4.7, 120),
('hp-003', 'Sreemangal Tea Trail', 'Sreemangal', 'Bangladesh', '2 Days 1 Night', 8500.00, 15, '["https://placehold.co/800x600?text=Sreemangal"]', '["Tea garden tour","Lawachara rainforest","7 color tea","Madhabpur Lake"]', '[{"day":1,"title":"Tea Country","description":"Visit tea estates and try 7-layer tea"},{"day":2,"title":"Rainforest & Lake","description":"Lawachara trek and Madhabpur Lake"}]', '["Resort stay","Breakfast & Lunch","Transport","Guide"]', '["Dinner","Personal expenses"]', 'cultural', 4.3, 65),
('hp-004', 'Sajek Valley Cloud Paradise', 'Sajek Valley', 'Bangladesh', '3 Days 2 Nights', 18000.00, 5, '["https://placehold.co/800x600?text=Sajek"]', '["Cloud watching","Tribal villages","Konglak Para","Sunset viewpoint"]', '[{"day":1,"title":"Journey to Sajek","description":"Scenic drive through hills, evening sunset"},{"day":2,"title":"Explore Sajek","description":"Trek to Konglak Para, tribal culture"},{"day":3,"title":"Morning Clouds","description":"Sunrise over clouds, return journey"}]', '["Cottage stay","All meals","Army permit","Jeep transfer"]', '["Personal expenses","Extra activities"]', 'adventure', 4.6, 95),
('hp-005', 'Bangkok Shopping Spree', 'Bangkok', 'Thailand', '5 Days 4 Nights', 45000.00, 20, '["https://placehold.co/800x600?text=Bangkok"]', '["Grand Palace","Chatuchak Market","Floating Market","Thai massage","Street food"]', '[{"day":1,"title":"Arrival","description":"Airport pickup, hotel check-in, night market"},{"day":2,"title":"Temples & Palace","description":"Grand Palace, Wat Pho, Wat Arun"},{"day":3,"title":"Markets","description":"Chatuchak and Floating Market tour"},{"day":4,"title":"Free Day","description":"Shopping at Siam Paragon and MBK"},{"day":5,"title":"Departure","description":"Last minute shopping, airport transfer"}]', '["Flight tickets","Hotel 4-star","Airport transfer","City tour","Breakfast"]', '["Visa fee","Lunch & Dinner","Shopping expenses","Travel insurance"]', 'cultural', 4.8, 200),
('hp-006', 'Maldives Honeymoon Package', 'Maldives', 'Maldives', '5 Days 4 Nights', 120000.00, 0, '["https://placehold.co/800x600?text=Maldives"]', '["Water villa","Snorkeling","Sunset cruise","Spa for two","Candlelight dinner"]', '[{"day":1,"title":"Paradise Arrival","description":"Speedboat to resort, villa check-in"},{"day":2,"title":"Ocean Adventures","description":"Snorkeling, dolphin watching"},{"day":3,"title":"Relaxation","description":"Couple spa, beach time"},{"day":4,"title":"Romance","description":"Sunset cruise, candlelight dinner on beach"},{"day":5,"title":"Farewell","description":"Breakfast and departure"}]', '["Water villa","All meals","Speedboat transfer","Snorkeling","Sunset cruise","Spa"]', '["Flight tickets","Visa","Personal expenses","Tips"]', 'honeymoon', 4.9, 75);

-- ====== MEDICAL HOSPITALS ======
INSERT IGNORE INTO medical_hospitals (id, name, city, country, specialties, accreditations, rating, price_range, description, images, contact) VALUES
('mh-001', 'Apollo Hospitals', 'Chennai', 'India', '["Cardiology","Oncology","Orthopedics","Neurology","Transplant"]', '["JCI","NABH","ISO 9001"]', 4.7, '৳50,000 - ৳5,00,000', 'Asia''s largest integrated healthcare group with world-class facilities.', '["https://placehold.co/800x600?text=Apollo"]', '{"phone":"+914428290200","email":"contact@apollohospitals.com"}'),
('mh-002', 'Bumrungrad International Hospital', 'Bangkok', 'Thailand', '["Cardiology","Cosmetic Surgery","Orthopedics","Dental","Eye Care"]', '["JCI","ISO 9001"]', 4.8, '৳40,000 - ৳4,00,000', 'Southeast Asia''s leading international hospital serving over 1M patients yearly.', '["https://placehold.co/800x600?text=Bumrungrad"]', '{"phone":"+6620667888","email":"info@bumrungrad.com"}'),
('mh-003', 'Fortis Hospital', 'Kolkata', 'India', '["Cardiology","Gastroenterology","Kidney","Liver Transplant"]', '["NABH","JCI"]', 4.5, '৳30,000 - ৳3,00,000', 'Renowned multi-specialty hospital with excellent patient care.', '["https://placehold.co/800x600?text=Fortis"]', '{"phone":"+913366284444","email":"enquiry@fortishealthcare.com"}'),
('mh-004', 'Mount Elizabeth Hospital', 'Singapore', 'Singapore', '["Oncology","Cardiology","Neurosurgery","Fertility","Transplant"]', '["JCI","ISO"]', 4.9, '৳1,00,000 - ৳10,00,000', 'Singapore''s premier private hospital known for complex medical procedures.', '["https://placehold.co/800x600?text=MountElizabeth"]', '{"phone":"+6567372666","email":"info@mountelizabeth.com.sg"}');

-- ====== CARS ======
INSERT IGNORE INTO cars (id, name, type, brand, model, year, seats, transmission, fuel_type, price_per_day, images, features, city) VALUES
('car-001', 'Toyota Corolla', 'Sedan', 'Toyota', 'Corolla', 2024, 5, 'automatic', 'Petrol', 3500.00, '["https://placehold.co/800x600?text=Corolla"]', '["AC","USB Charging","Bluetooth","Airbags"]', 'Dhaka'),
('car-002', 'Toyota Noah', 'Van', 'Toyota', 'Noah', 2023, 7, 'automatic', 'Hybrid', 5500.00, '["https://placehold.co/800x600?text=Noah"]', '["AC","7 Seats","USB Charging","Sliding Doors"]', 'Dhaka'),
('car-003', 'Toyota Hiace', 'Minibus', 'Toyota', 'Hiace', 2023, 12, 'manual', 'Diesel', 8000.00, '["https://placehold.co/800x600?text=Hiace"]', '["AC","12 Seats","Luggage Space","PA System"]', 'Dhaka'),
('car-004', 'Honda CR-V', 'SUV', 'Honda', 'CR-V', 2024, 5, 'automatic', 'Petrol', 6000.00, '["https://placehold.co/800x600?text=CRV"]', '["AC","Sunroof","Navigation","Leather Seats"]', 'Dhaka'),
('car-005', 'Toyota Allion', 'Sedan', 'Toyota', 'Allion', 2022, 5, 'automatic', 'Petrol', 2800.00, '["https://placehold.co/800x600?text=Allion"]', '["AC","USB Charging","Bluetooth"]', 'Chittagong'),
('car-006', 'Mitsubishi Pajero', 'SUV', 'Mitsubishi', 'Pajero Sport', 2024, 7, 'automatic', 'Diesel', 9000.00, '["https://placehold.co/800x600?text=Pajero"]', '["AC","4WD","Navigation","Leather Seats","Roof Rack"]', 'Cox''s Bazar');

-- ====== ESIM PLANS ======
INSERT IGNORE INTO esim_plans (id, country, region, data_amount, duration, price, provider, features) VALUES
('esim-001', 'Thailand', 'Asia', '5GB', '7 days', 800.00, 'AIS', '["4G/5G","Hotspot","Instant activation"]'),
('esim-002', 'Singapore', 'Asia', '3GB', '5 days', 650.00, 'Singtel', '["4G/5G","Hotspot","Instant activation"]'),
('esim-003', 'Malaysia', 'Asia', '10GB', '15 days', 1200.00, 'Celcom', '["4G/5G","Hotspot","Calls included"]'),
('esim-004', 'India', 'Asia', '5GB', '10 days', 500.00, 'Airtel', '["4G","Hotspot","Instant activation"]'),
('esim-005', 'UAE', 'Middle East', '3GB', '7 days', 900.00, 'Du', '["5G","Hotspot","Instant activation"]'),
('esim-006', 'Turkey', 'Europe', '10GB', '15 days', 1500.00, 'Turkcell', '["4G/5G","Hotspot","EU roaming"]'),
('esim-007', 'USA', 'North America', '10GB', '30 days', 2500.00, 'T-Mobile', '["5G","Hotspot","Calls & SMS"]'),
('esim-008', 'UK', 'Europe', '5GB', '10 days', 1100.00, 'EE', '["4G/5G","Hotspot","EU roaming"]');

-- ====== RECHARGE OPERATORS ======
INSERT IGNORE INTO recharge_operators (id, name, logo, type) VALUES
('grameenphone', 'Grameenphone', '/images/operators/gp.png', 'prepaid'),
('robi', 'Robi', '/images/operators/robi.png', 'prepaid'),
('banglalink', 'Banglalink', '/images/operators/bl.png', 'prepaid'),
('airtel', 'Airtel', '/images/operators/airtel.png', 'prepaid'),
('teletalk', 'Teletalk', '/images/operators/teletalk.png', 'prepaid');

-- ====== BILL CATEGORIES ======
INSERT IGNORE INTO bill_categories (id, name, icon, billers) VALUES
(UUID(), 'Electricity', 'Zap', '[{"id":"dpdc","name":"DPDC","logo":"/images/billers/dpdc.png"},{"id":"desco","name":"DESCO","logo":"/images/billers/desco.png"},{"id":"nesco","name":"NESCO","logo":"/images/billers/nesco.png"}]'),
(UUID(), 'Gas', 'Flame', '[{"id":"titas","name":"Titas Gas","logo":"/images/billers/titas.png"},{"id":"bakhrabad","name":"Bakhrabad Gas","logo":"/images/billers/bakhrabad.png"}]'),
(UUID(), 'Internet', 'Wifi', '[{"id":"link3","name":"Link3","logo":"/images/billers/link3.png"},{"id":"amber","name":"Amber IT","logo":"/images/billers/amber.png"},{"id":"carnival","name":"Carnival","logo":"/images/billers/carnival.png"}]'),
(UUID(), 'Water', 'Droplets', '[{"id":"dwasa","name":"DWASA","logo":"/images/billers/dwasa.png"},{"id":"cwasa","name":"CWASA","logo":"/images/billers/cwasa.png"}]');

-- ====== CMS SEED DATA ======

-- System Settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, category) VALUES
('site_name', 'Seven Trip', 'general'),
('site_tagline', 'Your Journey, Our Passion', 'general'),
('contact_email', 'info@seventrip.com.bd', 'contact'),
('contact_phone', '+880 1700-000000', 'contact'),
('contact_address', 'House 42, Road 11, Banani, Dhaka 1213, Bangladesh', 'contact'),
('facebook_url', 'https://facebook.com/seventrip', 'social'),
('instagram_url', 'https://instagram.com/seventrip', 'social'),
('youtube_url', 'https://youtube.com/seventrip', 'social'),
('currency', 'BDT', 'general'),
('timezone', 'Asia/Dhaka', 'general');

-- Email Templates
INSERT IGNORE INTO cms_email_templates (id, name, subject, body, variables, category) VALUES
(UUID(), 'Welcome Email', 'Welcome to Seven Trip, {{name}}!', '<h1>Welcome {{name}}!</h1><p>Thank you for joining Seven Trip. Start exploring amazing destinations today.</p>', '["name","email"]', 'auth'),
(UUID(), 'Booking Confirmation', 'Booking Confirmed - {{bookingRef}}', '<h1>Booking Confirmed</h1><p>Dear {{name}}, your booking {{bookingRef}} has been confirmed. Total: {{amount}} {{currency}}</p>', '["name","bookingRef","amount","currency"]', 'booking'),
(UUID(), 'Password Reset', 'Reset Your Password - Seven Trip', '<h1>Password Reset</h1><p>Hi {{name}}, use the following OTP to reset your password: <strong>{{otp}}</strong>. Valid for 10 minutes.</p>', '["name","otp"]', 'auth');

-- Sample Blog Posts
INSERT IGNORE INTO cms_blog_posts (id, title, slug, excerpt, content, category, tags, status, published_at) VALUES
(UUID(), 'Top 10 Beaches in Cox''s Bazar', 'top-10-beaches-coxs-bazar', 'Discover the most stunning beaches along the world''s longest natural sea beach.', '<p>Cox''s Bazar is home to the world''s longest natural sea beach stretching 120km. Here are the top spots you must visit...</p>', 'Travel', '["cox''s bazar","beach","bangladesh","tourism"]', 'published', NOW()),
(UUID(), 'Essential Guide to Thai Visa for Bangladeshis', 'thai-visa-guide-bangladeshis', 'Everything you need to know about getting a Thailand visa from Bangladesh.', '<p>Planning a trip to Thailand? Here''s your complete guide to the visa application process from Bangladesh...</p>', 'Visa', '["thailand","visa","guide","bangladesh"]', 'published', NOW()),
(UUID(), 'Budget Travel Tips for Southeast Asia', 'budget-travel-southeast-asia', 'Travel across Southeast Asia without breaking the bank.', '<p>Southeast Asia remains one of the most affordable regions for travelers. Here''s how to make the most of your budget...</p>', 'Tips', '["budget","southeast asia","tips","backpacking"]', 'published', NOW());

-- Featured Destinations
INSERT IGNORE INTO cms_destinations (id, name, country, description, images, highlights, best_time, featured) VALUES
(UUID(), 'Cox''s Bazar', 'Bangladesh', 'The world''s longest natural sea beach, stretching 120km along the Bay of Bengal.', '["https://placehold.co/800x600?text=CoxsBazar"]', '["Longest beach in the world","Inani Beach","Himchari Falls","Marine Drive"]', 'November - March', 1),
(UUID(), 'Bangkok', 'Thailand', 'A vibrant city of temples, street food, and endless shopping opportunities.', '["https://placehold.co/800x600?text=Bangkok"]', '["Grand Palace","Street food","Night markets","Temples"]', 'November - February', 1),
(UUID(), 'Maldives', 'Maldives', 'Crystal clear waters and overwater villas in the Indian Ocean paradise.', '["https://placehold.co/800x600?text=Maldives"]', '["Water villas","Snorkeling","White sand beaches","Sunset cruises"]', 'November - April', 1),
(UUID(), 'Singapore', 'Singapore', 'A futuristic city-state blending nature, culture, and world-class attractions.', '["https://placehold.co/800x600?text=Singapore"]', '["Marina Bay Sands","Sentosa Island","Gardens by the Bay","Hawker food"]', 'Year-round', 1);

-- Sample Bookings for demo user
INSERT IGNORE INTO bookings (id, user_id, booking_type, booking_ref, status, total_amount, currency, payment_method, payment_status, details, booked_at) VALUES
('bk-001', 'u-user-001', 'flight', 'ST-FL-240001', 'confirmed', 9000.00, 'BDT', 'bkash', 'paid', '{"flightNumber":"BG-201","origin":"DAC","destination":"CXB","passengers":2}', '2026-03-01 10:00:00'),
('bk-002', 'u-user-001', 'hotel', 'ST-HT-240002', 'pending', 24000.00, 'BDT', NULL, 'unpaid', '{"hotelName":"Royal Tulip Sea Pearl","checkIn":"2026-04-15","checkOut":"2026-04-17","rooms":1}', '2026-03-05 14:00:00');

-- Transactions for demo bookings
INSERT IGNORE INTO transactions (id, user_id, booking_id, type, amount, currency, status, payment_method, reference, description, created_at) VALUES
(UUID(), 'u-user-001', 'bk-001', 'payment', 9000.00, 'BDT', 'completed', 'bkash', 'BK-TXN-001', 'Flight booking payment - BG-201', '2026-03-01 10:05:00');

-- Sample travellers
INSERT IGNORE INTO travellers (id, user_id, first_name, last_name, email, phone, date_of_birth, gender, nationality, passport_no, passport_expiry) VALUES
(UUID(), 'u-user-001', 'Abdur', 'Rahim', 'rahim@gmail.com', '+8801712345678', '1990-05-15', 'male', 'Bangladeshi', 'BD1234567', '2028-12-31'),
(UUID(), 'u-user-001', 'Ayesha', 'Rahim', 'ayesha@gmail.com', '+8801712345679', '1992-08-20', 'female', 'Bangladeshi', 'BD7654321', '2029-06-30');

SELECT '✅ Migration complete! All 20 tables created and seeded.' AS result;
