# Supabase SQL to run manually

Run each block in the Supabase **SQL Editor** (Dashboard → SQL → New query) if that migration is not already applied.

## 011 — Use my location (GPS every 3 hours, PIN 3 days)

Adds `use_my_location`, `gps_updated_at`, and `pin_updated_at` on `profiles`.

**Matching rules (app logic):**

| Use my location | PIN | Effective coords |
|-----------------|-----|------------------|
| ON | — | GPS; refresh/fetch every **3 hours** |
| OFF | none | Empty (location unavailable) |
| OFF | saved ≤ 3 days | PIN coordinates |
| OFF | saved > 3 days | Empty until PIN saved again |

```sql
-- Location mode: GPS refresh every 3 hours; PIN valid 3 days.

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
```

Also in repo: `supabase/migrations/011_profile_use_my_location.sql`.
