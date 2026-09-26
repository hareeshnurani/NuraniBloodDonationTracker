# P0-4 on Vercel Hobby (free plan)

## Why deploy failed

`vercel.json` had a cron schedule **`*/15 * * * *`** (every 15 minutes).  
**Vercel Hobby** only allows cron jobs that run **at most once per day**.

Error you saw:

> Hobby accounts are limited to daily cron jobs. This cron expression would run more than once per day.

## What we changed (PR to `main`)

- Cron schedule → **`0 4 * * *`** (once daily, 04:00 UTC).
- Past-deadline requests are expired on that run (not every 15 minutes on Hobby).

## Expire sooner without Pro

### Option A — Manual (immediate)

Open in browser (use your real secret):

```text
https://nurani-blood-donation-tracker.vercel.app/api/cron/expire-requests?secret=YOUR_CRON_SECRET
```

Run after you notice overdue requests, or once after deploy.

### Option B — External scheduler (every 15 min, free)

1. Remove the `crons` block from `vercel.json` entirely (deploy still works).
2. Use [cron-job.org](https://cron-job.org) or GitHub Actions `schedule:` to **GET** the URL above with your secret daily/hourly.

### Option C — Vercel Pro

Keep **`*/15 * * * *`** in `vercel.json` and upgrade the project to **Pro**.

## Create Deployment in Vercel UI

In **Branch, Commit, or URL**, type:

```text
main
```

Not the full GitHub tree URL.

After merge, confirm Production shows commit **`c048a46`** or newer (not only `71756dc`).

## Env vars (Production)

- `CRON_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
