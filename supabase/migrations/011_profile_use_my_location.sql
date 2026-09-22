-- Location mode: GPS ("use my location") vs PIN fallback, with 3-day freshness.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS use_my_location BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gps_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pin_updated_at TIMESTAMPTZ;

UPDATE profiles
SET
  use_my_location = CASE
    WHEN home_pincode IS NOT NULL AND btrim(home_pincode) <> '' THEN FALSE
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN TRUE
    ELSE FALSE
  END,
  pin_updated_at = CASE
    WHEN home_pincode IS NOT NULL AND btrim(home_pincode) <> ''
    THEN COALESCE(pin_updated_at, updated_at, created_at, NOW())
    ELSE pin_updated_at
  END,
  gps_updated_at = CASE
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL
      AND (home_pincode IS NULL OR btrim(home_pincode) = '')
    THEN COALESCE(gps_updated_at, updated_at, created_at, NOW())
    ELSE gps_updated_at
  END;
