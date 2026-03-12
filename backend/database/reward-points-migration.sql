-- ============================================================
-- Reward Points System Migration
-- ============================================================

-- Points balance per user
CREATE TABLE IF NOT EXISTS user_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_earned DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_redeemed DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_points (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Points transaction ledger
CREATE TABLE IF NOT EXISTS point_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type ENUM('earn', 'redeem', 'expire', 'adjust') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  booking_id CHAR(36) DEFAULT NULL,
  coupon_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pt_user (user_id),
  INDEX idx_pt_type (type),
  INDEX idx_pt_booking (booking_id)
);

-- Coupons generated from points
CREATE TABLE IF NOT EXISTS reward_coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  code VARCHAR(20) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  points_used DECIMAL(12,2) NOT NULL,
  status ENUM('active', 'used', 'expired') NOT NULL DEFAULT 'active',
  used_booking_id CHAR(36) DEFAULT NULL,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_coupon_code (code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rc_user (user_id),
  INDEX idx_rc_status (status)
);

-- Points earning rules (admin configurable)
CREATE TABLE IF NOT EXISTS points_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_type ENUM('flight', 'hotel', 'holiday', 'visa', 'medical', 'car', 'esim', 'recharge') NOT NULL,
  earn_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0100 COMMENT 'Fraction of fare e.g. 0.01 = 1%',
  min_fare DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_points_per_booking DECIMAL(12,2) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_points_rule (service_type)
);

-- Insert default rules
INSERT IGNORE INTO points_rules (service_type, earn_rate) VALUES
  ('flight', 0.0100),
  ('hotel', 0.0100),
  ('holiday', 0.0150),
  ('visa', 0.0050),
  ('medical', 0.0100),
  ('car', 0.0050),
  ('esim', 0.0050),
  ('recharge', 0.0020);
