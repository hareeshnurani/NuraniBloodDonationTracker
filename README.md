# BloodLink

Professional blood donation request management system built with Next.js and Supabase.

## Features

- Email authentication with verification before admin approval
- Blood requests with patient name, priority, deadline, and replacement blood groups
- GPS-based donor matching within 50 km radius
- Broadcast to all eligible donors; strict first-come unit acceptance
- In-app notifications and mediated chat (no phone numbers exposed)
- Donor eligibility based on 90-day cooldown and manual availability toggle
- Post-donation confirmation flow with calendar date picker
- Admin dashboard: user approvals, request monitoring, audit logs

## Tech stack

- **Frontend:** Next.js 16, React, Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, RLS)
- **Hosting:** Vercel (recommended)

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor
3. Enable email confirmation under **Authentication → Providers → Email**

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

1. User signs up → verifies email → completes profile → admin approves
2. Requester creates blood request → all matching donors within 50 km notified
3. Donors accept/reject → strict first-come for units (1 donor = 1 unit)
4. Requester chats with confirmed donors via in-app messaging
5. After request ends, donors confirm if they donated (updates 90-day cooldown)
6. Requester can close early with reason if donors found offline
