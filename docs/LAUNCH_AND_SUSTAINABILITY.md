# BloodLink — Launch & sustainability guide

This document complements **[GAP_REMEDIATION_TRACKER.md](./GAP_REMEDIATION_TRACKER.md)** (technical/product fixes) with **how to launch**, **how to stay reachable in emergencies**, and **how to fund the app without harming users in crisis**.

**Last updated:** September 2026

---

## 1. Product goal (north star)

BloodLink should become the **first place people go when they need blood coordination**—connecting requesters, verified donors, and communities—not a payments or fundraising app.

Success metrics for early launch:

- Time from **request posted** → **first donor invite**
- Time from **invite** → **accept** → **chat**
- **Confirmed donations** (`donation_confirmations` with status `donated`)
- Repeat use in the same geography (word of mouth)

Downloads and signups are secondary until matches happen reliably.

---

## 2. Practical difficulties (expect these)

| Difficulty | What it means | Mitigation |
|------------|---------------|------------|
| **Cold start** | No donors online = empty experience | Seed donors via partners (colleges, NGOs, clubs) before marketing |
| **Trust** | Fake or exaggerated requests | Verification, partners, admin tools, Terms/disclaimer (see gap tracker P0-3, P0-6) |
| **Urgency** | Users don’t open apps daily | Multi-channel alerts (SMS/WhatsApp/push), not in-app only |
| **Ops** | Emergencies at odd hours | Simple runbook: who responds to spam, no-match, abuse |
| **Legal/medical** | You coordinate; hospitals transfuse | Clear “not a blood bank” messaging; no medical advice |
| **Tech ops** | Migrations/deploys break prod | P0-1, staging, monitoring (gap tracker) |
| **Local fit** | PIN/GPS, language, hospital names | Pilot one region; curate facilities (P1-6) |

---

## 3. Launch strategy (phased)

### Phase A — Pilot (one geography)

**Target:** One city/region (e.g. Palakkad + nearby) where you can visit partners in person.

1. Complete **P0** items in [GAP_REMEDIATION_TRACKER.md](./GAP_REMEDIATION_TRACKER.md) (minimum: migrations, alerts path, trust, expiry, location gating, legal pages, smoke tests).
2. **Anchor partner:** One hospital, blood bank, or NGO that **refers** requesters (poster/QR at desk, WhatsApp group pin).
3. **Seed donors:** 200–500 willing donors with location set and availability understood—not only organic signup.
4. **Communities:** 2–3 real groups (college, company CSR, local donor club) with admins you know.
5. **Runbook:** Named contact for emergency posts, fake posts, and “zero donors in 30 minutes.”
6. **Review weekly:** Count confirmed donations; fix bottlenecks before expanding.

### Phase B — Expand

- Replicate Phase A in the next city using the same partner playbook.
- Reuse product; customize **facilities list** and **community** names locally.

### Phase C — “Go-to” reputation

- Public stories (with consent): “Request → match → donation confirmed.”
- Hospital/NGO co-branding only where relationship is real.
- Consider regional language copy in UI (Malayalam/Hindi) when pilot is stable.

---

## 4. Web app vs PWA vs native apps

| Approach | When to use | Pros | Cons |
|----------|-------------|------|------|
| **Web (current)** | Now — pilot & iteration | One codebase, instant deploy (Vercel), works via link/WhatsApp | Weak alerts if user never returns |
| **PWA** | After P0 alerts foundation | Add to home screen, icon, **Web Push** (good on Android; iOS 16.4+ for installed PWAs) | iOS install friction; not App Store discovery |
| **Native (Android/iOS)** | After proven demand + budget | Best push (FCM/APNs), store presence | Cost, two platforms, store review, slower releases |

**Recommendation**

1. **Stay web-first** through pilot and early expansion.
2. Add **PWA** (manifest + service worker + push) once **SMS/email/push strategy** is designed (gap P0-2).
3. **Native apps** when iPhone push + store credibility are blockers **and** you can maintain releases.

For India, **WhatsApp/SMS for emergency** often beats “download our app” for the requester in panic.

---

## 5. Notifications — will web be enough?

**No—not for emergencies if you rely on in-app alone.**

Today BloodLink stores notifications in the **`notifications`** table (in-app). That is fine for history, not for “wake up a donor at 2 AM.”

### Recommended channel mix

| Priority | Channel | Use case |
|----------|---------|----------|
| 1 | **SMS or WhatsApp** (transactional) | Emergency requests; new invite to available donors |
| 2 | **Web Push** (PWA) or **native push** | Donors with “Available” ON; routine invites |
| 3 | **Email** | Backup, digest, account/security |
| 4 | **In-app** | Inbox, read state, detail links |

### Implementation notes (when you build P0-2)

- Respect **opt-in** and quiet hours where possible; **never** opt-out of legal/security email.
- Template messages in plain language; link deep into `/donor/invites` or `/notifications`.
- Log delivery failures; retry SMS for `emergency` priority only.
- Cost SMS into **sustainability** budget (CSR/grants/institutional fee)—not charged to patient.

---

## 6. Ethical sustainability (money without exploiting need)

**Principles**

- **Emergency blood requests are always free** to post and fulfill through the platform.
- **Donors never pay** to accept, chat, or be matched.
- **No ads** on emergency flows.
- **No selling** personal health or location data.

### Revenue models that fit BloodLink

| Model | Who pays | What they get |
|-------|----------|----------------|
| **Institutional subscription** | Hospital, blood bank, NGO, corporate CSR | Admin seats, branded community, reports for CSR, verified listing |
| **Sponsored donor network** | Sponsor funds SMS/infra | Named community (“XYZ Palakkad Donors”); sponsor logo on **non-emergency** screens only |
| **Grants & CSR** | Foundations, government schemes | Operating budget |
| **Optional supporter tier** | Individual champions (not patients) | Badge, no functional paywall on core flows |
| **Verified facility listing** | Blood bank (optional) | “Verified” badge, correct contact in picker—transparent fee, not pay-to-get-blood |

### What to avoid

- Paywall to create or boost emergency requests.
- Paid “priority” that jumps the queue over another patient.
- Charging requesters in crisis.

### When to introduce revenue

After **documented pilot outcomes** (confirmed donations, partner letter). First ask: **cover SMS + hosting + one part-time ops**—not profit-maximization.

---

## 7. Operating costs (planning)

Rough categories to budget (India pilot scale):

- **Supabase + Vercel** — tier by MAU and DB size
- **Transactional SMS/WhatsApp** — per message; dominant variable cost at scale
- **Email (SMTP)** — low at pilot volume
- **Geocoding/APIs** — cache PIN lookups to minimize (gap P1-3)
- **Your time / part-time ops** — abuse review, partner onboarding

Track monthly burn; tie institutional sponsors to **cost coverage**, not user fees.

---

## 8. Link to engineering work

| Launch/sustainability need | Gap tracker ID |
|----------------------------|----------------|
| Schema stable on prod | P0-1 |
| SMS/email/push alerts | P0-2 |
| Verified accounts | P0-3 |
| Stale requests closed | P0-4 |
| Donors matchable (location) | P0-5 |
| Terms / Privacy / disclaimer | P0-6 |
| Staging, tests, monitoring | P0-7, P2-7 |
| Accurate hospitals (pilot) | P1-6 |
| Admin abuse tools | P1-4 |
| Brand / store (later) | P2-8 |

Start gap implementation in tracker order; use **this doc** for partner conversations and funding narrative.

---

## 9. Pre-launch checklist (partner-ready)

- [ ] P0 gaps closed or explicitly accepted risk documented
- [ ] Prod Supabase at migration **011** (see [SUPABASE_SQL_TO_RUN.md](./SUPABASE_SQL_TO_RUN.md))
- [ ] `SUPABASE_SERVICE_ROLE_KEY` + SMTP or SMS provider configured on Vercel
- [ ] Terms + Privacy live; signup acceptance recorded
- [ ] Pilot partner MOU or informal agreement (referral + disclaimer)
- [ ] Donor seeding session completed (location + availability explained)
- [ ] Emergency runbook shared with admin phone/email
- [ ] One successful **end-to-end drill** on staging (request → invite → accept → confirm)

---

## 10. Document maintenance

When you change notification providers, launch region, or monetization approach, update this file and add a row to the **Change log** below.

| Date | Change |
|------|--------|
| 2026-09-22 | Initial launch & sustainability guide created. |
