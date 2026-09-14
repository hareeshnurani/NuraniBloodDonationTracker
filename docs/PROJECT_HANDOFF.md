# BloodLink — Project Handoff & AI Context Guide

> **Purpose:** Read this file at the start of any new Cursor / AI session before making changes.
> This document captures product decisions, architecture, migration state, and how the app should evolve.

**Repository:** https://github.com/sridushiva-dev/NuraniBloodDonationTracker  
**App name:** BloodLink  
**Last updated:** September 2026

---

## 1. What This App Is

BloodLink is a **blood donation request management platform** for India. Users can:

- **Request blood** for a patient (hospital/blood bank location, blood group, units, deadline)
- **Donate** when matched by blood group, eligibility, and location/community rules
- **Join communities** (groups like colleges, neighborhoods, organizations) to share and respond to requests
- **Chat in-app** after a donor accepts (no phone numbers exposed)

The product owner is building this for real-world use (Palakkad / Kerala focus initially, with hospitals across 8 cities).

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 16** (App Router) — read `node_modules/next/dist/docs/` before changing Next APIs; this version has breaking changes vs training data |
| UI | React 19, Tailwind CSS v4, Apple-inspired design system |
| Database / Auth | **Supabase** (Postgres + RLS + Auth) |
| Hosting | **Vercel** (recommended) |
| Icons | lucide-react |

### Environment variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000   # or production URL
```

### Key Supabase clients

- `src/lib/supabase/server.ts` — user-scoped (RLS)
- `src/lib/supabase/admin.ts` — service role (broadcasts, notifications, admin actions)
- `src/lib/supabase/client.ts` — browser client

---

## 3. Branch & Deployment State

| Branch | Status |
|--------|--------|
| `main` | Stable base: Apple UI, hospital picker, facilities, PIN code location |
| `cursor/communities-feature-4b23` | **Latest work** — communities, auto-approve, donation history, RLS fix |

**Before continuing development:** merge `cursor/communities-feature-4b23` into `main` (or work from that branch).

**Open PRs (may change):** check GitHub for PR #5 / #6 on the communities branch.

---

## 4. Database Migrations — RUN IN ORDER

All migrations live in `supabase/migrations/`. Run each in the **Supabase SQL Editor** in numeric order:

| # | File | What it does |
|---|------|--------------|
| 001 | `001_initial_schema.sql` | Core schema: profiles, donor_profiles, blood_requests, invitations, chat, notifications, RLS, `accept_invitation` RPC |
| 002 | `002_fix_signup_trigger.sql` | Fix auth signup trigger |
| 003 | `003_promote_hareesh_admin.sql` | Promote `hareesh.nurani96@gmail.com` to app admin |
| 004 | `004_facilities_and_custom_location.sql` | `facilities` table (234 hospitals), custom hospital + PIN fields on requests |
| 005 | `005_communities.sql` | Communities, members, invites, request_communities, pins, `notify_community_only`, auto-approve pending users |
| 006 | `006_donation_history.sql` | `not_donated_reason` column on donation_confirmations |
| 007 | `007_fix_rls_recursion.sql` | **Required** — fixes `infinite recursion detected in policy for relation "blood_requests"` when creating requests |

> ⚠️ If request creation fails with RLS recursion, migration **007** has not been applied.

---

## 5. Product Rules (Confirmed by Owner)

### 5.1 Users & onboarding

- **Anyone can sign up** — no global admin approval gate
- Onboarding sets status to **`active`** immediately (not `pending_approval`)
- Community membership is **optional**
- Light **app admin** remains: `hareesh.nurani96@gmail.com` (role `admin` in `profiles`)

### 5.2 Blood requests

- Requester selects **hospital from list** (230+ facilities across 8 cities) OR **custom hospital name + 6-digit PIN code**
- Donor location still uses **GPS on profile/onboarding**
- **50 km radius** for generic donor matching and generic notifications
- Blood group match required; optional **replacement blood groups**
- **90-day cooldown** after donation (`DONOR_COOLDOWN_DAYS = 90`)
- **First-come unit acceptance** — 1 accepted donor = 1 unit (atomic `accept_invitation` RPC)
- In-app chat opens after donor accepts

### 5.3 Communities

| Rule | Detail |
|------|--------|
| Who can create | Any active user |
| Visibility | Creator chooses **public** (open join) or **private** (invite link / admin add-by-email) |
| Posting | Requester must be a **member** to post to a community; can select **multiple communities** |
| Generic wall | **All requests always appear on the generic request wall**, regardless of communities selected |
| Community response | Any community member donor can see/respond — **no distance limit** |
| Notifications | **One notification per donor per request** (even if posted to multiple communities) |
| Generic notifications | Only donors within **50 km** |
| Community notifications | All eligible community member donors (any distance) |
| Donor preference | `notify_community_only` on `donor_profiles` — skips generic notifications outside their communities; **still sees all requests** in Active Requests list |
| Distance popup | If donor accepts a request **>50 km** away, show confirmation: "Are you sure? Location is more than 50 km away" |
| Pinning | Unlimited community pins on home; **long-press drag to reorder** |
| Admin | Community creator = default admin; can add/remove admins and members |

### 5.4 Donor donation tracking

- After **accepting** a request, home shows: **"Have you completed the donation to [Patient name]?"**
  - **Yes** → pick date → saved as `last_donation_date`, availability turned off
  - **No** → must enter a **reason in words** (`not_donated_reason`)
- **Donation history** on Profile page (all past confirmations)
- **Welcome message on home:**
  - If donated: `You have saved N lives through your donations`
  - If zero donations: motivational message (never show "0 lives")

### 5.5 Unchanged core rules

- Blood group matching, 90-day cooldown, first-come units, in-app chat — all unchanged from original spec

---

## 6. Architecture Overview

```
src/
├── app/
│   ├── (auth)/          login, signup, verify-email
│   ├── (app)/           protected app (requireActiveProfile)
│   │   ├── home/        dashboard, communities feed, lives saved, donation prompts
│   │   ├── communities/ list, create, detail, join-by-code
│   │   ├── donor/       invites + all active requests browse
│   │   ├── requests/    create, detail
│   │   ├── profile/     account, donor settings, donation history
│   │   ├── notifications/
│   │   └── chat/
│   ├── admin/           light app admin (users, requests, audit)
│   └── onboarding/      profile completion
├── components/
│   ├── communities/     selector, pins, admin panel, join/leave
│   ├── donor/           availability, invites, confirmations, history
│   ├── layout/          app-nav, mobile tabs, more sheet
│   └── ui/              Apple-style primitives (button, card, grouped-list, switch)
├── lib/
│   ├── actions/         server actions (requests, profile, communities, admin, chat)
│   ├── facilities/      static hospital data per city (8 cities)
│   ├── auth.ts          requireActiveProfile, requireAdmin
│   ├── types.ts
│   └── utils.ts         haversine, eligibility helpers
└── supabase/migrations/
```

### Auth gating (`src/lib/auth.ts`)

- `requireActiveProfile()` — used in `(app)/layout.tsx`
- Redirects: unverified email → `/verify-email`, incomplete → `/onboarding`, rejected → `/rejected`
- `pending_approval` redirect still exists but users are auto-approved on onboarding

### Request broadcast (`src/lib/actions/requests.ts` → `broadcastRequest`)

1. Find eligible donors (willing, available, active, blood match, cooldown OK)
2. **Generic match:** within 50 km → create invitation + notify (unless `notify_community_only` and not in posted community)
3. **Community match:** members of posted communities at any distance → invitation + notify
4. Deduplicate: one invitation and one notification per donor

### Service role vs user client

| Operation | Client |
|-----------|--------|
| User CRUD under RLS | `createClient()` |
| Broadcast, notifications, audit, community linking on create | `createServiceClient()` |

---

## 7. Database Tables (Key)

| Table | Purpose |
|-------|---------|
| `profiles` | User account, location, status, role |
| `donor_profiles` | Blood group, last donation, availability, `notify_community_only` |
| `blood_requests` | Patient requests with location (facility or custom PIN) |
| `donor_invitations` | Match records with distance_km, accept/reject status |
| `donation_confirmations` | Post-donation yes/no + date or reason |
| `communities` | Groups (public/private) |
| `community_members` | Membership + `is_admin` |
| `community_invites` | Invite codes for private communities |
| `request_communities` | Links requests to communities |
| `user_community_pins` | Home screen pin order |
| `facilities` | 234 seeded hospitals/blood banks |
| `notifications` | In-app only (no push/email yet) |
| `chat_threads` / `chat_messages` | Mediated chat |

### Important RPC

- `accept_invitation(p_invitation_id, p_donor_id)` — atomic unit allocation + chat thread creation

### RLS helpers (SECURITY DEFINER — avoid removing)

- `is_admin()`
- `is_community_member()`, `is_community_admin()`
- `is_request_owner()`, `is_invited_donor()` — **prevent blood_requests ↔ donor_invitations recursion**

---

## 8. Facilities / Location

- **Static data:** `src/lib/facilities/*.ts` (palakkad, coimbatore, kochi, chennai, bangalore, mumbai, pune, delhi)
- **DB seed:** migration 004 populates `facilities` table
- **Custom location:** hospital name + 6-digit PIN → `src/lib/pincode.ts` (India Post API + Nominatim geocoding)
- **Request form:** `src/components/hospital-location-picker.tsx`

---

## 9. UI / Navigation

- **Mobile-first** with bottom tab bar: Home | Donor | Alerts | Chat | More
- **Desktop** nav includes Groups (communities), Profile, Admin (if admin)
- Design tokens in `src/app/globals.css` (iOS-inspired colors, shadows, system fonts)
- Reusable: `GroupedSection`, `GroupedRow`, `PageHeader`, `Switch`

---

## 10. Known Issues & Fixes Applied

| Issue | Fix |
|-------|-----|
| Request creation: `infinite recursion detected in policy for relation "blood_requests"` | Run migration **007** |
| Hospital picker not visible on mobile | Fixed overflow/z-index in request form |
| Features not visible after deploy | Ensure `main` is deployed / branch merged to main on Vercel |
| `pending_approval` page still exists | Legacy route; new users skip it (auto-approved) |

---

## 11. What Is NOT Built Yet (Potential Next Steps)

These were discussed or implied but not fully implemented — confirm with product owner before building:

- [ ] Push / email notifications (currently in-app only)
- [ ] Community feed sorting by "unread since last visit" (currently by active request count)
- [ ] Transfer community ownership before creator leaves
- [ ] Admin dashboard updates for community moderation
- [ ] Remove or repurpose `/pending-approval` page and admin user-approval UI (legacy)
- [ ] Merge `cursor/communities-feature-4b23` → `main` and redeploy Vercel
- [ ] `.env.example` file (referenced in README but may be missing from repo)

---

## 12. How to Start a New AI Session

Paste this into Cursor when resuming:

```
Read docs/PROJECT_HANDOFF.md in the BloodLink repo before doing anything.
That file has the full product spec, migration order, architecture, and confirmed owner decisions.
Current branch with latest features: cursor/communities-feature-4b23 (or main if merged).
All Supabase migrations 001–007 must be applied in order.
App admin: hareesh.nurani96@gmail.com
```

### Local dev

```bash
npm install
npm run dev
# http://localhost:3000
```

### Verify build

```bash
npm run build
```

---

## 13. Owner Decisions Log (Communities Q&A — September 2026)

1. Anyone can join, create requests, browse; generic posting/donating for all
2. Any user can create a community
3. Public = open join; private = admin add or invite links; users can leave
4. Must be community member to post; multi-community select; always on generic wall
5. Community members respond with no distance limit; >50 km accept shows popup
6. One notification per request; generic notify ≤50 km only; all requests visible in active list
7. Community-only notification toggle; never hide requests
8. Light app admin: hareesh.nurani96@gmail.com
9. Existing blood rules unchanged
10. Unlimited pinning with reorder (long-press)
11. Auto-approve; communities not mandatory

---

## 14. File Quick Reference

| Task | Start here |
|------|------------|
| Create request | `src/app/(app)/requests/new/page.tsx`, `src/lib/actions/requests.ts` |
| Donor matching | `broadcastRequest()` in `requests.ts` |
| Accept invite | `acceptInvitation()`, `accept_invitation` RPC |
| Communities CRUD | `src/lib/actions/communities.ts` |
| Donation confirm | `src/lib/actions/profile.ts` → `confirmDonation()` |
| Home dashboard | `src/app/(app)/home/page.tsx` |
| Profile / history | `src/app/(app)/profile/page.tsx`, `src/components/donor/donation-history.tsx` |
| Auth gates | `src/lib/auth.ts` |
| Constants | `src/lib/constants.ts` (`MATCH_RADIUS_KM = 50`, `DONOR_COOLDOWN_DAYS = 90`) |
| Types | `src/lib/types.ts` |

---

*This document should be updated whenever major product decisions or schema changes are made.*
