# P0-7 — Tests & monitoring

Checklist for pilot readiness: automated checks on every PR, optional error monitoring, staging before risky merges.

Related: [OPS_BACKUP_STAGING.md](./OPS_BACKUP_STAGING.md) · [GAP_REMEDIATION_TRACKER.md](./GAP_REMEDIATION_TRACKER.md)

---

## Checklist

- [ ] Merge PR with **GitHub Actions CI** (`.github/workflows/ci.yml`)
- [ ] GitHub → **Actions** tab shows green on `main` and on PRs
- [ ] (Recommended) **Staging Supabase** + Vercel Preview env — see § Staging below
- [ ] (Optional) **Sentry** or Vercel log alerts for production 5xx
- [ ] Mark **P0-7** done in gap tracker when CI is green on `main`

---

## 1. Automated CI (included in repo)

### Add the workflow file (one-time)

If CI is not on `main` yet, add this file in GitHub (**Add file → Create new file**):

**Path:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://ci-placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.ci-placeholder
          SUPABASE_SERVICE_ROLE_KEY: ci-placeholder-service-role-key-for-build-only
```

Or merge branch `cursor/p0-7-ci-monitoring-8267` and add this file in the same PR from your machine (`git push` with **`workflow`** scope on your PAT).

On every **pull request** and push to **`main`**, GitHub runs:

| Step | Command | Purpose |
|------|---------|---------|
| Unit tests | `npm test` | Location rules, email skip without Resend key |
| Build | `npm run build` | Catches TypeScript / Next.js regressions |

Lint (`npm run lint`) is run locally when fixing UI code; not gated in CI until existing warnings are cleaned up.

**You do nothing** after merge except open **GitHub → Actions** and confirm jobs pass.

Run locally before opening a PR:

```bash
npm ci
npm test
npm run lint
npm run build
```

---

## 2. Staging environment (recommended with P0-7)

Avoid testing migrations and RLS only on production.

1. Create a **second Supabase project** (e.g. `bloodlink-staging`).
2. Run migrations **001–012** (same as prod — [P0-1_PRODUCTION_MIGRATIONS.md](./P0-1_PRODUCTION_MIGRATIONS.md)).
3. **Vercel** → Project → **Settings → Environment Variables**:
   - Add staging `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY` scoped to **Preview** only.
4. Open a **Preview** deployment from a PR and manually smoke:
   - Signup → onboarding → Home
   - Create request → donor invite → accept

Production keeps its own Supabase vars on **Production** only.

---

## 3. Production monitoring (optional but valuable)

### Option A — Vercel (no code)

- **Vercel → Project → Logs** — filter errors on `/home`, `/api/cron/expire-requests`.
- Enable **Observability** / notifications on your plan if available.

### Option B — Sentry (recommended when you have time)

1. Create a project at [sentry.io](https://sentry.io) (Next.js).
2. Add to Vercel **Production**:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_AUTH_TOKEN` (for source maps upload, optional)
3. Install `@sentry/nextjs` in a follow-up PR and wire `instrumentation` (not required for CI).

Until Sentry is wired, CI + Vercel logs are enough for pilot.

---

## 4. Cron health (P0-4 tie-in)

On **Vercel Hobby**, expiry cron runs **once daily** ([P0-4_VERCEL_HOBBY.md](./P0-4_VERCEL_HOBBY.md)).

- After deploy, spot-check **Vercel → Cron** (daily job listed).
- Use manual expire URL if you need immediate cleanup between runs.

---

## 5. What CI does *not* cover yet

| Gap | Follow-up |
|-----|-----------|
| Full browser E2E | Playwright against staging Preview |
| RLS / Supabase | Manual or staging smoke on PR preview |
| Email delivery | Resend dashboard after P0-2 domain |

Add Playwright in a later PR when staging is stable.

---

## Change log

| Date | Change |
|------|--------|
| 2026-09-26 | Initial P0-7 runbook + GitHub Actions workflow |
