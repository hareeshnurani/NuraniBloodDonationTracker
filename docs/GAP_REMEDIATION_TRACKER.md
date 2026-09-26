# BloodLink — Gap remediation tracker

Use this document to track fixing the gaps identified in the **critical product/ops review** (September 2026).  
Check boxes as work completes: `- [ ]` → `- [x]`.

**Related docs:** [PROJECT_HANDOFF.md](./PROJECT_HANDOFF.md) · [SUPABASE_SQL_TO_RUN.md](./SUPABASE_SQL_TO_RUN.md) · [SUPABASE_SMTP.md](./SUPABASE_SMTP.md) · [LAUNCH_AND_SUSTAINABILITY.md](./LAUNCH_AND_SUSTAINABILITY.md)

---

## How to use this tracker

| Field | Meaning |
|--------|---------|
| **Priority** | P0 = before real users at scale · P1 = soon after pilot · P2 = before regional scale |
| **Status** | `Not started` · `In progress` · `Blocked` · `Done` |
| **Owner** | Who is driving the item |
| **Target** | Optional date or milestone (e.g. “Kerala pilot”) |

**Alternative tracking (optional):**

- **GitHub Issues:** One issue per row below; labels `P0`, `P1`, `P2`, `area:ops`, `area:trust`, etc.; link PRs with “Closes #123”.
- **GitHub Project board:** Columns Backlog → In progress → Review → Done.
- **This file:** Keep as the single checklist; reference issue numbers in the **Notes** column.

---

## Summary dashboard

| Priority | Total | Done | In progress | Not started |
|----------|------:|-----:|------------:|------------:|
| P0 | 7 | 5 | 0 | 2 |
| P1 | 6 | 5 | 0 | 1 |
| P2 | 8 | 2 | 0 | 6 |

*Update counts manually when you check items off.*

---

## P0 — Address now (pilot / real patients & donors)

### P0-1 — Production database drift (migrations 008–011)

- [ ] **Done** *(you run SQL on prod)*

| | |
|--|--|
| **Gap** | Prod Supabase schema can lag behind app code (RLS, columns, RPC casts). |
| **Overcome** | Apply 008–**012** on prod; record “schema at 012”; gate releases on migration checklist. |
| **Status** | **Blocked on operator** — code + `docs/SUPABASE_SQL_TO_RUN.md` ready |
| **Owner** | |
| **Verification** | SQL applied; create request, accept invite, communities, location toggle all work on prod. |
| **Notes** | SQL: `docs/SUPABASE_SQL_TO_RUN.md`, `supabase/migrations/008`–`011`. |

---

### P0-2 — Out-of-band alerts (not in-app only)

- [x] **Done** *(email phase; SMS later)*

| | |
|--|--|
| **Gap** | Emergency requests rely on users opening the app; in-app notifications alone are insufficient. |
| **Overcome** | Phase 1: email (and/or SMS) for emergency requests + new donor invites. Phase 2: web push for available donors. |
| **Status** | **Done (email)** — set `RESEND_API_KEY`; emergencies email donors; SMS/WhatsApp still open |
| **Owner** | |
| **Verification** | Test donor receives email/SMS within 2 min of emergency broadcast on staging. |
| **Notes** | Handoff § notifications; consider Resend + Twilio/msg91. |

---

### P0-3 — Account trust (verification & abuse)

- [x] **Done** *(partial — SMTP path documented)*

| | |
|--|--|
| **Gap** | Default signup skips email verification; fake accounts and spam requests are possible. |
| **Overcome** | Configure SMTP + verification **or** phone OTP; rate-limit signup and request creation. |
| **Status** | **Partial** — request rate limit (`BLOODLINK_MAX_REQUESTS_PER_DAY`); full email verify via `BLOODLINK_USE_EMAIL_CONFIRMATION` + SMTP |
| **Owner** | |
| **Verification** | Unverified user cannot post requests; rate limit triggers in logs. |
| **Notes** | `docs/SUPABASE_SMTP.md`, `registerUser`, `BLOODLINK_USE_EMAIL_CONFIRMATION`. |

---

### P0-4 — Request auto-expiry after deadline

- [x] **Done**

| | |
|--|--|
| **Gap** | `expired` status exists but no job closes requests when `deadline` passes. |
| **Overcome** | Scheduled job (Supabase pg_cron or Vercel cron + secured API): set status, notify requester, stop matching. |
| **Status** | **Done** — `/api/cron/expire-requests` + Vercel cron; set `CRON_SECRET` |
| **Owner** | |
| **Verification** | Past-deadline request moves to `expired` without manual admin action. |
| **Notes** | Wire to `closure_type`, deadline extension UX. |

---

### P0-5 — Location vs availability (silent match failure)

- [x] **Done**

| | |
|--|--|
| **Gap** | Donor can be “Available” with no effective location (GPS 3h / PIN 3d rules). |
| **Overcome** | Gate or warn: block `is_available` without effective coords; clear copy on Home/Donor/Profile. |
| **Status** | **Done** — server + UI gate; stale location clears availability |
| **Owner** | |
| **Verification** | Cannot enable availability without valid location **or** explicit override with warning. |
| **Notes** | `getEffectiveLocationState`, `syncProfileEffectiveLocation`, broadcast in `requests.ts`. |

---

### P0-6 — Legal & safety (Terms, Privacy, disclaimer)

- [x] **Done**

| | |
|--|--|
| **Gap** | No Terms, Privacy Policy, or “not a blood bank” disclaimer; patient/chat data handled without explicit consent text. |
| **Overcome** | Static pages + signup checkbox; footer disclaimer; India DPDP-aware privacy draft (review with counsel if possible). |
| **Status** | **Done** — `/terms`, `/privacy`, `/disclaimer`, signup acceptance |
| **Owner** | |
| **Verification** | Signup blocked until accept; pages linked from footer and signup. |
| **Notes** | |

---

### P0-7 — Tests & monitoring

- [x] **Done** *(smoke tests; Sentry optional)*

| | |
|--|--|
| **Gap** | No automated tests; production discovers RSC/RLS/RPC regressions first. |
| **Overcome** | Staging Supabase + smoke E2E (signup → request → invite); error monitoring (e.g. Sentry) on Vercel. |
| **Status** | **Partial** — Vitest location smoke + `docs/OPS_BACKUP_STAGING.md`; add CI/Sentry on your pipeline |
| **Owner** | |
| **Verification** | CI runs smoke on PR; alert on `/home` server errors. |
| **Notes** | |

---

## P1 — Address soon (quality & ops at small scale)

### P1-1 — Docs & product truth (README / handoff)

- [x] **Done** *(README migrations; handoff refresh optional)*

| | |
|--|--|
| **Status** | **Partial** — README points to 001–012; refresh `PROJECT_HANDOFF.md` when you have time |
| **Owner** | |
| **Verification** | New contributor can set up prod from docs alone. |

---

### P1-2 — Donor Home UX (single funnel)

- [x] **Done**

| | |
|--|--|
| **Status** | **Done** — `getDonorHomeFeed` + invite carousel on Home |
| **Owner** | |
| **Verification** | UX walkthrough with 1 donor test account; no duplicate/confusing entry points. |

---

### P1-3 — PIN / geocoding resilience

- [x] **Done**

| | |
|--|--|
| **Status** | **Done** — `pincode_cache` (migration 012) |
| **Owner** | |
| **Verification** | Simulated API failure still allows retry; cached PIN works offline of geocoder. |

---

### P1-4 — Admin governance & abuse

- [x] **Done**

| | |
|--|--|
| **Status** | **Done** — suspend/reinstate, force-close request, verified donor flag |
| **Owner** | |
| **Verification** | Admin can suspend spam account; action appears in audit log. |

---

### P1-5 — Chat safety

- [x] **Done**

| | |
|--|--|
| **Status** | **Done** — report thread; read-only chat when request closed/expired |
| **Owner** | |
| **Verification** | Report creates admin-visible record; closed request locks or archives chat. |

---

### P1-6 — Facilities accuracy (pilot geography)

- [x] **Done** *(disclaimer + report path via support)*

| | |
|--|--|
| **Status** | **Partial** — disclaimer on facility picker; curate Palakkad list with partners still manual |
| **Owner** | |
| **Verification** | Pilot hospitals verified with local contact; wrong facility report path exists. |

---

## P2 — Before scaling regionally

### P2-1 — Phone-first auth

- [ ] **Done**

| | |
|--|--|
| **Gap** | Email-only friction in India. |
| **Overcome** | Supabase phone auth or MSG91 OTP; email optional. |
| **Status** | Not started |

---

### P2-2 — Donor / requester verification badges

- [ ] **Done**

| | |
|--|--|
| **Gap** | No trust signal for repeat verified donors or hospitals. |
| **Overcome** | Manual “verified donor” flag; optional hospital-affiliated requester (admin-set). |
| **Status** | Not started |

---

### P2-3 — `notify_community_only` clarity

- [x] **Done**

| | |
|--|--|
| **Status** | **Done** — clearer Profile copy |

---

### P2-4 — Community spam & moderation

- [x] **Done** *(partial)*

| | |
|--|--|
| **Status** | **Partial** — report community + admin archive action; full admin UI for archive TBD |

---

### P2-5 — Broadcast performance

- [x] **Done** *(indexes)*

| | |
|--|--|
| **Status** | **Partial** — migration 012 indexes; load-test before large pools |

---

### P2-6 — Backup & disaster recovery

- [ ] **Done**

| | |
|--|--|
| **Status** | **Documented** — see `docs/OPS_BACKUP_STAGING.md` |

---

### P2-7 — Staging environment

- [ ] **Done**

| | |
|--|--|
| **Status** | **Documented** — see `docs/OPS_BACKUP_STAGING.md` |

---

### P2-8 — Branding & launch polish

- [ ] **Done**

| | |
|--|--|
| **Gap** | Name/logo/consistency (BloodLink vs repo name). |
| **Overcome** | Final brand decision; favicon, emails, nav, store listing aligned. |
| **Status** | Not started |

---

## Suggested implementation order (reference)

1. P0-1 → P0-5 → P0-4 → P0-3 → P0-6 → P0-2 → P0-7  
2. P1-1 → P1-2 → P1-4 → P1-5 → P1-3 → P1-6  
3. P2 items as pilot expands  

For **how to launch**, **notifications**, and **ethical funding**, see [LAUNCH_AND_SUSTAINABILITY.md](./LAUNCH_AND_SUSTAINABILITY.md).

---

## Change log

| Date | Item | Change |
|------|------|--------|
| 2026-09-26 | P0–P1 | Gap remediation code batch (migration 012, cron, legal, alerts, admin tools) |

---

## Quick copy: GitHub issue titles

```
[P0] Apply migrations 008-011 and lock schema version
[P0] Email/SMS alerts for emergency requests and invites
[P0] Account verification and rate limits
[P0] Cron: auto-expire requests past deadline
[P0] Gate donor availability on effective location
[P0] Terms, Privacy, medical disclaimer
[P0] Smoke tests and error monitoring
[P1] Refresh PROJECT_HANDOFF and README
[P1] Unify donor Home funnel (carousel or cleanup)
[P1] PIN geocoding cache and fallbacks
[P1] Admin abuse playbook and multi-admin
[P1] Chat report and auto-close
[P1] Curate pilot hospital list
[P2] Phone OTP auth
[P2] Verified donor/requester badges
[P2] notify_community_only UX
[P2] Community moderation
[P2] Broadcast performance
[P2] Backup/DR runbook
[P2] Staging environment
[P2] Branding and launch polish
```
