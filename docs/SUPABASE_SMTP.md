# Supabase email / SMTP setup (BloodLink)

## Why signup showed "Error sending email"

Supabase’s **built-in** mail is for demos only (low limits, often fails). BloodLink signup used to call `signUp()`, which sends a confirmation email. When SMTP fails, Supabase returns:

`Error sending confirmation email`

## What we do in the app (default)

By default, signup uses the **Admin API** with `email_confirm: true`, so **no confirmation email is sent**. Users sign up → sign in → **onboarding**.

To turn verification emails back on:

1. Configure **custom SMTP** in Supabase (below).
2. Set server env: `BLOODLINK_USE_EMAIL_CONFIRMATION=true`
3. Switch signup back to client `signUp()` (or extend `registerUser` to use it).

## Configure custom SMTP (production)

1. Open [Supabase → Authentication → Emails → SMTP](https://supabase.com/dashboard/project/zpfdfccrwxyrfroogucq/auth/smtp).
2. Enable **Custom SMTP**.
3. Use a provider (Resend, Brevo, SendGrid, Amazon SES, etc.):
   - Host: e.g. `smtp.resend.com` (no `https://` prefix)
   - Port: **587** (STARTTLS) in most cases
   - Username / password from the provider
   - **Sender email** must be on a **verified domain**
4. Under **URL Configuration**, keep redirect URLs including:
   - `http://127.0.0.1:43147/auth/callback` (Cloud Agent preview)
   - Your Vercel URL `/auth/callback`
5. Check **Auth logs** in Supabase if mail still fails — the log shows the real SMTP error.

## References

- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Not receiving auth emails](https://supabase.com/docs/guides/troubleshooting/not-receiving-auth-emails-from-the-supabase-project-OFSNzw)
