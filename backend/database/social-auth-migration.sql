-- Social Authentication Migration
-- Run: mysql seventrip < backend/database/social-auth-migration.sql

-- Add social login columns (ignore error if already exists)
ALTER TABLE users ADD COLUMN social_provider VARCHAR(20) DEFAULT NULL COMMENT 'google, facebook, or NULL for email';
ALTER TABLE users ADD COLUMN social_provider_id VARCHAR(255) DEFAULT NULL COMMENT 'Provider user ID';

-- Add index for faster social lookups (drop first to avoid duplicate)
DROP INDEX IF EXISTS idx_users_social ON users;
CREATE INDEX idx_users_social ON users(social_provider, social_provider_id);

-- Ensure system_settings has social OAuth config rows
INSERT IGNORE INTO system_settings (setting_key, setting_value, created_at, updated_at)
VALUES
  ('social_oauth_google', '{}', NOW(), NOW()),
  ('social_oauth_facebook', '{}', NOW(), NOW());

SELECT '✅ Social auth migration complete' AS status;
