# P0-2 — Out-of-band alerts (email via Resend)

BloodLink always writes to the in-app **`notifications`** table. **P0-2 Phase 1** adds **email** for time-sensitive events so donors/requesters do not have to open the app.

SMS / WhatsApp / Web Push = **Phase 2** (not in this runbook).

---

## What sends email today (after env is set)

| Event | Who gets email | When |
|--------|----------------|------|
| **Emergency** blood request broadcast | Matched donors (same rules as in-app invite) | Priority = **Emergency** on publish/broadcast |
| **Routine** invite | Matched donors | Only if `BLOODLINK_EMAIL_ALL_INVITES=true` |
| Request **expired** (cron) | Requester | After deadline passes |
| **Account suspended** | User | Admin suspend |
| **Admin force-close** request | Requester | Admin closes request |

Everything else (deadline reminder, invite accepted, donation confirm, etc.) stays **in-app only**.

---

## Step 1 — Create a Resend account

1. Go to [https://resend.com](https://resend.com) and sign up.
2. Open **API Keys** → **Create API Key** (e.g. `bloodlink-production`).
3. Copy the key (`re_...`) — you will only see it once.

---

## Step 2 — Choose a “From” address

**Option A — Quick test (no domain yet)**  
Resend allows sending from `onboarding@resend.dev` **only to the email address on your Resend account**.

Use:

```text
BLOODLINK_ALERT_FROM=BloodLink <onboarding@resend.dev>
```

Test with a donor profile whose **`profiles.email`** matches your Resend login email.

**Option B — Production (recommended)**  
1. Resend → **Domains** → add your domain (e.g. `yourdomain.com`).  
2. Add the DNS records Resend shows (SPF/DKIM).  
3. After verified:

```text
BLOODLINK_ALERT_FROM=BloodLink Alerts <alerts@yourdomain.com>
```

Then any user’s real email can receive alerts.

---

## Step 3 — Set Vercel environment variables

In **Vercel** → your BloodLink project → **Settings → Environment Variables** (Production, and Preview if you test there):

| Variable | Required | Example |
|----------|----------|---------|
| `RESEND_API_KEY` | Yes | `re_xxxxxxxx` |
| `BLOODLINK_ALERT_FROM` | Strongly recommended | `BloodLink <onboarding@resend.dev>` or your domain |
| `BLOODLINK_APP_URL` | Yes for correct links | `https://your-app.vercel.app` |
| `BLOODLINK_EMAIL_ALL_INVITES` | No | `true` to email on **routine** invites too |
| `NEXT_PUBLIC_APP_URL` | Fallback | Same as `BLOODLINK_APP_URL` if you already use it |

Also ensure existing vars are still set: `SUPABASE_*`, `CRON_SECRET` (for expiry emails).

**Redeploy** production after saving env vars (Deployments → Redeploy).

---

## Step 4 — Cloud Agent / local (optional)

If you test from Cursor Cloud Agent, add the same secrets to your **Environment secrets** (see `docs/CLOUD_AGENT_SECRETS.md` if present).

---

## Step 5 — Staging test (recommended)

1. Use a **donor** account with:
   - `donor_profiles.is_available = true`
   - Valid location (GPS or PIN)
   - Email = an inbox you can read (and Resend allows for your From setup)
2. As a **requester**, create and **publish** a request:
   - Priority: **Emergency**
   - Location + blood group that match the test donor
3. Within **1–2 minutes** the donor should get:
   - In-app notification (**Alerts**)
   - Email with subject like `[BloodLink] 🚨 Emergency blood request`

If no email:

- Check **Vercel → Logs** (function logs) for `[email-alerts] Resend error`
- Confirm `RESEND_API_KEY` on **Production**
- With `onboarding@resend.dev`, donor email must be your Resend account email

---

## Step 6 — Verify Resend dashboard

Resend → **Emails** → you should see delivered (or bounced) messages with timestamps.

---

## Step 7 — Close P0-2 (Phase 1)

In [GAP_REMEDIATION_TRACKER.md](./GAP_REMEDIATION_TRACKER.md):

- Check **P0-2** when emergency donor email works in production.
- Note: **Phase 2** (SMS / push) still open if you need 2 AM wake-ups without email.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| In-app alert only, no email | `RESEND_API_KEY` missing or wrong env; redeploy |
| Resend 403 / domain | Use verified domain in `BLOODLINK_ALERT_FROM` |
| Test email never arrives | Using `onboarding@resend.dev` but donor email ≠ Resend account |
| Link in email goes to wrong site | Set `BLOODLINK_APP_URL` to production URL |
| Too many emails | Do **not** set `BLOODLINK_EMAIL_ALL_INVITES` unless you want routine invite email |

---

## Next (Phase 2 — optional later)

- Transactional **SMS** (MSG91 / Twilio) for emergency + invite
- **PWA Web Push** for donors with Availability ON
- Per-user email opt-out column (not implemented yet)
