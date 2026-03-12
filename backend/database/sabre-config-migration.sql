-- =============================================
-- Seven Trip - Sabre GDS Configuration Seed
-- Run: cd ~/projects/all-stars-atlas && mysql -u seventrip_user -p'YourStrongPassword123!' seventrip < backend/database/sabre-config-migration.sql
-- =============================================

INSERT INTO system_settings (setting_key, setting_value, updated_at)
VALUES ('api_sabre', JSON_OBJECT(
  'enabled', 'true',
  'environment', 'prod',
  'pcc', 'J4YL',
  'epr', '631470',
  'cert_client_id', '5B0K-JvBdOta',
  'cert_client_secret', 'Pl67azTy',
  'cert_basic_auth', 'NUIwSy1KdkJkT3RhOlBsNjdhelR5',
  'prod_client_id', '5B0K-JvBdOta',
  'prod_client_secret', 'M1uty91x',
  'prod_basic_auth', 'NUIwSy1KdkJkT3RhOk0xdXR5OTF4',
  'agencyPassword', '01uepwzc',
  'prodPassword', 'j3ms2a1p',
  'ptr', 'A9618A',
  'tamPool', 'ABBDJ4YL',
  'scCode', 'J4YL'
), CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  setting_value = JSON_OBJECT(
    'enabled', 'true',
    'environment', 'prod',
    'pcc', 'J4YL',
    'epr', '631470',
    'cert_client_id', '5B0K-JvBdOta',
    'cert_client_secret', 'Pl67azTy',
    'cert_basic_auth', 'NUIwSy1KdkJkT3RhOlBsNjdhelR5',
    'prod_client_id', '5B0K-JvBdOta',
    'prod_client_secret', 'M1uty91x',
    'prod_basic_auth', 'NUIwSy1KdkJkT3RhOk0xdXR5OTF4',
    'agencyPassword', '01uepwzc',
    'prodPassword', 'j3ms2a1p',
    'ptr', 'A9618A',
    'tamPool', 'ABBDJ4YL',
    'scCode', 'J4YL'
  ),
  updated_at = CURRENT_TIMESTAMP;

SELECT '✅ Sabre GDS config inserted/updated (CERT+PROD secrets separated)' AS status;
