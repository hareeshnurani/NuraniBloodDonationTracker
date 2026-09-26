# Backup, staging, and monitoring (gap P2-6, P2-7, P0-7)

## Staging (P2-7)

1. Create a **second Supabase project** (or Supabase branch if on Pro).
2. Apply migrations **001–012** identical to production.
3. Point Vercel **Preview** deployments to staging env vars (`NEXT_PUBLIC_SUPABASE_*`, service role).
4. Run smoke tests (`npm test`, manual signup → request → invite) on preview before merging to `main`.

## Backup & DR (P2-6)

1. Enable **Point-in-time recovery (PITR)** on the production Supabase project (paid tier).
2. Document quarterly **restore drill**: clone project → verify login + one request row.
3. Optional: scheduled export of `profiles`, `blood_requests`, `donation_confirmations` via Supabase dashboard or pg_dump.

## Monitoring (P0-7)

1. **Automated:** `npm test` in CI (Vitest smoke for location rules); extend with Playwright against staging when ready.
2. **Production errors:** add [Sentry](https://sentry.io) or Vercel Log Drains; alert on `/home` and `/api/cron/expire-requests` 5xx.
3. **Cron:** confirm Vercel Cron runs every 15 minutes; check logs after a request passes deadline.

## SMS / phone (P2-1, P0-2 phase 2)

Email alerts ship in app code via Resend. SMS/WhatsApp (MSG91/Twilio) remains a follow-up integration — do not block pilot on it if email + in-app work.
