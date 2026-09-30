# Supabase SQL to run manually

Run each block in the Supabase **SQL Editor** (Dashboard → SQL → New query) if that migration is not already applied.

See also numbered files under `supabase/migrations/` (001–013).

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

---

## 012 — Gap remediation (PIN cache, reports, suspended users)

Run when deploying gap-remediation code. **Copy the full migration:** `supabase/migrations/012_gap_remediation.sql`.

Includes:

- `pincode_cache` — survives India Post / Nominatim outages after first lookup
- `content_reports` — chat/community moderation queue (`/admin/reports`)
- `user_status` value **`suspended`**
- `profiles.terms_accepted_at`, `profiles.verified_donor`
- `communities.is_archived`
- Indexes for expiry cron and broadcasts

After applying, set **Vercel** env:

- `CRON_SECRET` — Vercel Cron calls `/api/cron/expire-requests` with `Authorization: Bearer <CRON_SECRET>`
- `RESEND_API_KEY` and optional `BLOODLINK_ALERT_FROM` — email alerts for emergency invites
- Optional `BLOODLINK_EMAIL_ALL_INVITES=true` — email on every invite, not only emergencies
- Optional `BLOODLINK_MAX_REQUESTS_PER_DAY=5` — rate limit request creation

**Prod checklist (P0-1):** Record “schema at **013**” in your runbook after 008–012 are also applied.

---

## 013 — Private community creation (RLS SELECT for creator)

**Symptom:** Creating a **private** community fails with  
`new row violates row-level security policy for table "communities"`. Public communities work.

**Cause:** `INSERT … RETURNING` needs SELECT; private rows were not visible until the founder joined `community_members`.

Run in SQL Editor (or apply `supabase/migrations/013_private_community_creator_select.sql`):

```sql
CREATE POLICY "Creators view own communities" ON communities FOR SELECT
  USING (creator_id = auth.uid());
```

If the policy already exists, skip.
