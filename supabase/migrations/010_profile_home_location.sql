-- Optional display fields when user sets location via PIN code (coords still stored for matching).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS home_pincode TEXT,
  ADD COLUMN IF NOT EXISTS location_label TEXT;
