# Option A: Cloudflare DNS + Vercel (nsbloodlink.in)

Use **Cloudflare only for DNS** (free). The Next.js app stays on **Vercel**. Do not deploy to Cloudflare Pages unless you intentionally migrate hosting.

See also: [CUSTOM_DOMAIN_NSBLOODLINK_IN.md](./CUSTOM_DOMAIN_NSBLOODLINK_IN.md) for env vars, Supabase, Resend, and smoke tests.

---

## Before you start

- [ ] Domain **nsbloodlink.in** is registered and you can log in to that **registrar** (where you paid for `.in`).
- [ ] Vercel project is linked to GitHub and **Production** deploy succeeds.
- [ ] Free [Cloudflare](https://dash.cloudflare.com/sign-up) account.

---

## Step 1 — Add domains in Vercel (get target records)

1. [Vercel Dashboard](https://vercel.com) → your BloodLink project → **Settings → Domains**.
2. **Add** `nsbloodlink.in` and `www.nsbloodlink.in`.
3. Vercel shows **Invalid Configuration** until DNS is correct — that is expected.
4. Write down what Vercel asks for (usually):

   | Type | Name | Value |
   |------|------|--------|
   | **A** | `@` | `76.76.21.21` |
   | **CNAME** | `www` | `cname.vercel-dns.com` |

   Always prefer the **exact** values shown in your Vercel UI if they differ.

---

## Step 2 — Add the site in Cloudflare

1. Cloudflare dashboard → **Add a site** → enter `nsbloodlink.in`.
2. Choose the **Free** plan.
3. Cloudflare scans existing DNS records (may be empty). Continue.
4. Cloudflare shows **two nameservers**, e.g. `xxx.ns.cloudflare.com` and `yyy.ns.cloudflare.com`. **Copy both** — you need them in Step 3.

Do **not** enable Cloudflare Pages or move the app off Vercel in this flow.

---

## Step 3 — Point the domain to Cloudflare (registrar)

At the place where you **bought** `nsbloodlink.in` (not Vercel):

1. Open **DNS / Nameservers** (sometimes “Custom nameservers”).
2. Replace the registrar’s default nameservers with Cloudflare’s **two** nameservers from Step 2.
3. Save.

Propagation often takes **15 minutes to a few hours**; `.in` can take up to **24 hours**. Cloudflare shows **Active** when nameservers have switched.

Until Step 3 completes, changes in Cloudflare DNS have **no effect** on the live internet.

---

## Step 4 — DNS records in Cloudflare (point to Vercel)

Cloudflare → **nsbloodlink.in** → **DNS → Records**.

1. Remove conflicting **A** / **CNAME** for `@` and `www` that point to old hosting or parking pages.
2. Add (match Vercel Step 1):

   - **A** — Name `@` — IPv4 `76.76.21.21`
   - **CNAME** — Name `www` — Target `cname.vercel-dns.com`

3. **Proxy status** (cloud icon):

   - **Grey cloud (DNS only)** — simplest with Vercel; recommended if you are unsure.
   - **Orange cloud (Proxied)** — OK if **SSL/TLS → Overview** is set to **Full** (not “Flexible”). “Full (strict)” works once Vercel has issued its certificate.

4. Leave other records alone unless you know you need them (see Step 7 for email).

Return to Vercel **Domains** — status should become **Valid** with HTTPS after DNS and certificate provisioning (often 5–30 minutes after Cloudflare is Active).

---

## Step 5 — Canonical domain in Vercel

In **Settings → Domains**:

1. Set **primary** domain to `https://nsbloodlink.in` (apex).
2. Enable redirect so `www.nsbloodlink.in` → `nsbloodlink.in` (or the reverse — pick one public URL and stick to it).

---

## Step 6 — Vercel environment variables + redeploy

**Settings → Environment Variables → Production**:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://nsbloodlink.in` |
| `BLOODLINK_APP_URL` | `https://nsbloodlink.in` |

Redeploy: **Deployments → latest → … → Redeploy**.

Full list (Supabase, Resend, cron): [CUSTOM_DOMAIN_NSBLOODLINK_IN.md](./CUSTOM_DOMAIN_NSBLOODLINK_IN.md).

---

## Step 7 — Supabase auth URLs

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://nsbloodlink.in`
- **Redirect URLs:**  
  `https://nsbloodlink.in/auth/callback`  
  `https://www.nsbloodlink.in/auth/callback`  
  (keep `http://localhost:3000/auth/callback` for local dev if needed)

---

## Step 8 — Resend email DNS (in Cloudflare, not the registrar)

After nameservers are on Cloudflare, **all** DNS for `nsbloodlink.in` is edited in Cloudflare only.

1. [Resend](https://resend.com) → **Domains → Add** `nsbloodlink.in`.
2. Add each **TXT / CNAME / MX** record Resend shows as new records in **Cloudflare DNS**.
3. Wait for **Verified** in Resend.
4. On Vercel: `BLOODLINK_ALERT_FROM=BloodLink <noreply@nsbloodlink.in>` and redeploy.

---

## Step 9 — Smoke test

- [ ] https://nsbloodlink.in opens with a valid padlock  
- [ ] Login / signup / forgot password  
- [ ] Shared request link host is `nsbloodlink.in`  
- [ ] Private communities work (Supabase migration **013** applied — see [SUPABASE_SQL_TO_RUN.md](./SUPABASE_SQL_TO_RUN.md))

---

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| Vercel stuck on Invalid Configuration | Nameservers still at registrar? Only Cloudflare NS listed via [whatsmydns.net](https://www.whatsmydns.net)? Records `@` and `www` match Vercel? |
| Redirect loop or SSL error | Cloudflare orange cloud + **Flexible** SSL — change to **Full**. Or use grey cloud on `@` and `www`. |
| Email not verifying in Resend | Records added in **Cloudflare**, not old registrar DNS panel. |
| Site shows old parking page | Wrong A record or nameservers not updated. |

---

## What you pay

- **Domain renewal** at registrar (~₹500–900/yr typical for `.in`).
- **Cloudflare DNS** on Free plan: **₹0**.
- **Vercel Hobby**: **₹0** unless you upgrade.

WhatsApp/SMS vendors are separate; Cloudflare does not replace those costs.
