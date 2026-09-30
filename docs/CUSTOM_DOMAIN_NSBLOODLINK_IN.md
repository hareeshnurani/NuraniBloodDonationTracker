# Host **nsbloodlink.in** on Vercel

The app is already built for Vercel. You do **not** need separate web hosting — connect your domain to the existing Vercel project.

Production site URL: **https://nsbloodlink.in**

---

## 1. Vercel — add the domain

1. Open [Vercel Dashboard](https://vercel.com) → your **Nurani Blood Donation Tracker** project.
2. **Settings → Domains → Add**  
   - `nsbloodlink.in`  
   - `www.nsbloodlink.in` (recommended)
3. Vercel shows **DNS records** to add at your registrar. Typical setup:

| Host | Type | Value |
|------|------|--------|
| `@` (apex) | **A** | `76.76.21.21` |
| `www` | **CNAME** | `cname.vercel-dns.com` |

(Some registrars use ANAME/ALIAS for apex — follow Vercel’s exact instructions in the UI.)

4. Wait for DNS (often 5–30 minutes; `.in` can take up to 24h). Vercel shows **Valid** when ready.
5. Set **primary domain** to `nsbloodlink.in` and redirect `www` → apex (or the opposite — pick one canonical URL).

---

## 2. Vercel — environment variables

**Settings → Environment Variables → Production** (update or add):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://nsbloodlink.in` |
| `BLOODLINK_APP_URL` | `https://nsbloodlink.in` |

Optional (email links & auth):

| Variable | Example |
|----------|---------|
| `BLOODLINK_ALERT_FROM` | `BloodLink <noreply@nsbloodlink.in>` (after Resend domain verify) |
| `RESEND_API_KEY` | your Resend key |
| `CRON_SECRET` | long random string |

**Redeploy** after changing env vars (Deployments → … → Redeploy).

---

## 3. Supabase — auth URLs

**Authentication → URL Configuration**

- **Site URL:** `https://nsbloodlink.in`
- **Redirect URLs** (add each):

```
https://nsbloodlink.in/auth/callback
https://nsbloodlink.in/**
https://www.nsbloodlink.in/auth/callback
```

(Keep `http://localhost:3000/auth/callback` for local dev if you use it.)

---

## 4. Resend (welcome, password reset, emergency alerts)

1. [Resend](https://resend.com) → **Domains → Add** `nsbloodlink.in`
2. Add the **DNS records** Resend shows (SPF/DKIM) at your domain registrar.
3. After verified, set on Vercel:

   `BLOODLINK_ALERT_FROM=BloodLink <noreply@nsbloodlink.in>`

---

## 5. Database migration (if not done)

Private community creation needs migration **013** — see [SUPABASE_SQL_TO_RUN.md](./SUPABASE_SQL_TO_RUN.md).

---

## 6. Smoke test after go-live

- [ ] https://nsbloodlink.in loads (HTTPS padlock)
- [ ] Sign up / sign in
- [ ] **Forgot password** email arrives
- [ ] Create request → share link uses `https://nsbloodlink.in/share/request/...`
- [ ] Cron: Vercel hobby uses `GET /api/cron/expire-requests?secret=...` — see [P0-4_VERCEL_HOBBY.md](./P0-4_VERCEL_HOBBY.md)

---

## Registrar tips (.in)

- Turn on **auto-renew** for `nsbloodlink.in`.
- If the registrar offers **free DNS**, you can point records there; or move DNS to **Cloudflare** (free) and point to Vercel from Cloudflare.

You only pay for the **domain renewal** (~₹500–900/yr typical for `.in`) plus free Vercel hobby tier unless you upgrade.
