-- Social Authentication Migration
-- Run: mysql seventrip < backend/database/social-auth-migration.sql

-- Add social login columns (will error harmlessly if already exist)
SET @col1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='social_provider');
SET @sql1 = IF(@col1=0, "ALTER TABLE users ADD COLUMN social_provider VARCHAR(20) DEFAULT NULL COMMENT 'google, facebook, or NULL for email'", 'SELECT 1');
PREPARE stmt1 FROM @sql1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

SET @col2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='social_provider_id');
SET @sql2 = IF(@col2=0, "ALTER TABLE users ADD COLUMN social_provider_id VARCHAR(255) DEFAULT NULL COMMENT 'Provider user ID'", 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- Add index (safe: check first)
SET @idx = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND INDEX_NAME='idx_users_social');
SET @sql3 = IF(@idx=0, 'CREATE INDEX idx_users_social ON users(social_provider, social_provider_id)', 'SELECT 1');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

-- Social OAuth settings
INSERT IGNORE INTO system_settings (setting_key, setting_value)
VALUES
  ('social_oauth_google', '{}'),
  ('social_oauth_facebook', '{}');

SELECT '✅ Social auth migration complete' AS status;
