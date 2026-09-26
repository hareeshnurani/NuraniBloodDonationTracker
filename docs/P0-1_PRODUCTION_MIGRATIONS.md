# P0-1 — Bring production Supabase to schema **012**

Use this runbook when production lags behind app code on **`main`**.  
Apply migrations **in order** on your **production** Supabase project (not staging unless you are testing there first).

**Sources:** full SQL in `supabase/migrations/008_*.sql` … `012_*.sql`  
**Summary doc:** [SUPABASE_SQL_TO_RUN.md](./SUPABASE_SQL_TO_RUN.md)

---

## Before you start

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your **production** project.
2. Confirm Vercel production deploy is from the same **`main`** commit that expects schema 012.
3. Pick a **quiet window** (migrations are quick; RLS changes affect live users immediately).
4. Optional but recommended: **Database → Backups** — note last backup time or trigger a backup if your plan allows.

---

## Step 1 — See what is already applied

In **SQL Editor → New query**, run:

```sql
-- Columns from 010 / 011 / 012
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'home_pincode', 'location_label',
    'use_my_location', 'gps_updated_at', 'pin_updated_at',
    'terms_accepted_at', 'verified_donor'
  )
ORDER BY column_name;

-- Tables from 012
SELECT to_regclass('public.pincode_cache') AS pincode_cache,
       to_regclass('public.content_reports') AS content_reports;

-- Function from 008 (community request visibility)
SELECT proname FROM pg_proc
WHERE proname IN ('is_community_linked_request', 'shares_community_with');

-- Enum value from 012
SELECT enumlabel FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'user_status' AND enumlabel = 'suspended';
```

**How to read results**

| You see | Action |
|--------|--------|
| Missing `home_pincode` | Run **010** |
| Missing `use_my_location` | Run **011** |
| `pincode_cache` / `content_reports` null | Run **012** |
| No `is_community_linked_request` | Run **008** |
| No `suspended` enum label | Run **012** (or full 012 if nothing from 012 applied) |

If **007** was never applied (request create shows RLS recursion), stop and run **`007_fix_rls_recursion.sql`** first, then continue from **008**.

---

## Step 2 — Apply migration **008** (communities + linked requests)

1. **SQL Editor → New query**
2. Copy **entire** file: `supabase/migrations/008_community_membership_fixes.sql`
3. **Run**
4. Expect **Success**. If you see **policy already exists**, 008 was likely applied before — continue to Step 3.

**What it fixes:** private community create, member names on community page, members opening **community-linked** blood requests (no app 404 when RLS allows read).

---

## Step 3 — Apply migration **009** (`accept_invitation` RPC)

1. New query
2. Copy **entire** `supabase/migrations/009_accept_invitation_enum_cast.sql`
3. **Run**

**What it fixes:** donor **Accept** on invites (PostgreSQL enum cast in `accept_invitation`).

**Quick check:**

```sql
SELECT pg_get_functiondef(oid) LIKE '%fulfilled%::request_status%' AS has_enum_cast
FROM pg_proc WHERE proname = 'accept_invitation';
-- should be true
```

---

## Step 4 — Apply migration **010** (PIN display fields)

1. New query
2. Copy **entire** `supabase/migrations/010_profile_home_location.sql`
3. **Run**

**What it adds:** `profiles.home_pincode`, `profiles.location_label`.

---

## Step 5 — Apply migration **011** (Use my location)

1. New query
2. Copy **entire** `supabase/migrations/011_profile_use_my_location.sql`
3. **Run**

**What it adds:** `use_my_location`, `gps_updated_at`, `pin_updated_at` + backfill for existing rows.

---

## Step 6 — Apply migration **012** (gap remediation)

1. New query
2. Copy **entire** `supabase/migrations/012_gap_remediation.sql`
3. **Run**

**What it adds:** `pincode_cache`, `content_reports`, `suspended` status, `terms_accepted_at`, `verified_donor`, `communities.is_archived`, performance indexes.

If **`ALTER TYPE user_status ADD VALUE`** fails because `suspended` already exists, run the rest of the file manually (skip that one line) or confirm Step 1 already showed `suspended`.

---

## Step 7 — Final verification (production)

Run this once after Steps 2–6:

```sql
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'profiles' AND column_name = 'use_my_location') AS has_use_my_location,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'profiles' AND column_name = 'verified_donor') AS has_verified_donor,
  to_regclass('public.pincode_cache') IS NOT NULL AS has_pincode_cache,
  to_regclass('public.content_reports') IS NOT NULL AS has_content_reports,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_community_linked_request') AS has_community_request_rls;
```

All five values should be **1** / **true**.

---

## Step 8 — Smoke test in the live app

With a normal test account (and admin if you use reports):

1. **Home** — loads without server error; donor toggles **Available** / **Use my location**.
2. **Profile** — save PIN or GPS once.
3. **Communities** — open a community you belong to; open an **active request** linked to that community (no 404).
4. **Donor** — accept a pending invite (exercises **009**).
5. **Admin → Reports** — page loads (empty queue is OK).

---

## Step 9 — Record schema version (close P0-1)

1. In your runbook or [GAP_REMEDIATION_TRACKER.md](./GAP_REMEDIATION_TRACKER.md), note:  
   **`Production Supabase schema: 012 — applied YYYY-MM-DD`**
2. Check off **P0-1** in the tracker.
3. Ensure Vercel has **`CRON_SECRET`** and (for email alerts) **`RESEND_API_KEY`** if you use those features — they depend on app code, not SQL.

---

## If something fails

| Error | Likely cause |
|-------|----------------|
| `infinite recursion detected in policy for relation "blood_requests"` | Run **007** first |
| `policy "..." already exists` | That migration already applied — verify Step 1 and continue |
| `column "..." already exists` | That part applied — safe to continue with later migrations |
| App still 404 on community request | **008** not applied or user not a member of linked community |
| Accept invite fails | **009** not applied |

Need help on a specific error message? Paste the **exact** SQL error from the Supabase editor.
