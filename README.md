# BloodLink

Professional blood donation request management system built with Next.js and Supabase.

> **Continuing this project?** Read **[docs/PROJECT_HANDOFF.md](docs/PROJECT_HANDOFF.md)** first — full product spec, migrations, architecture, and owner decisions.
>
> **PDF download** (GitHub preview often fails — use one of these):
> - [Release download](https://github.com/sridushiva-dev/NuraniBloodDonationTracker/releases/tag/v1.0-handoff) ← **recommended**
> - [Direct PDF link](https://raw.githubusercontent.com/sridushiva-dev/NuraniBloodDonationTracker/main/docs/PROJECT_HANDOFF.pdf) (right-click → Save as)
> - See [docs/DOWNLOAD_HANDOFF.md](docs/DOWNLOAD_HANDOFF.md) for all options

## Features

- Email authentication with auto-approve onboarding
- Blood requests with hospital/blood bank picker (230+ facilities) or custom PIN code location
- Communities: public/private groups, multi-community posting, community-wide donor matching
- GPS-based generic donor matching within 50 km; community members matched at any distance
- Broadcast to eligible donors; strict first-come unit acceptance
- In-app notifications and mediated chat (no phone numbers exposed)
- Donor eligibility based on 90-day cooldown and manual availability toggle
- Post-accept donation confirmation, donation history, and "lives saved" welcome
- Light app admin dashboard: user monitoring, requests, audit logs

## Tech stack

- **Frontend:** Next.js 16, React, Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, RLS)
- **Hosting:** Vercel (recommended)

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run **all** SQL migrations in `supabase/migrations/` (001 through 007) in order via the SQL Editor — see [docs/PROJECT_HANDOFF.md](docs/PROJECT_HANDOFF.md) for details
3. Enable email confirmation under **Authentication → Providers → Email** (optional if using default BloodLink signup without SMTP — see [docs/SUPABASE_SMTP.md](docs/SUPABASE_SMTP.md))

### 2. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Create an admin user

After signing up and completing your profile:

```sql
UPDATE profiles SET role = 'admin', status = 'active' WHERE email = 'your@email.com';
```

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add the same environment variables
4. Set `NEXT_PUBLIC_APP_URL` to your production URL
5. Add the production URL to Supabase **Authentication → URL Configuration → Redirect URLs**

## Workflow summary

1. User signs up → verifies email → completes profile → **auto-approved**
2. Requester creates blood request (optionally shares with communities) → matching donors notified
3. Donors accept/reject → strict first-come for units (1 donor = 1 unit)
4. Donor confirms donation completion on home (yes + date, or no + reason)
5. Requester chats with confirmed donors via in-app messaging
6. Requester can close early with reason if donors found offline
