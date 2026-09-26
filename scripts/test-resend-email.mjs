#!/usr/bin/env node
/**
 * Send a one-off test email through Resend (same API as production alerts).
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx BLOODLINK_ALERT_FROM="BloodLink <onboarding@resend.dev>" \
 *     node scripts/test-resend-email.mjs you@example.com
 *
 * With onboarding@resend.dev, "you@example.com" must be your Resend account email.
 */

const to = process.argv[2];
if (!to || !to.includes("@")) {
  console.error("Usage: node scripts/test-resend-email.mjs recipient@email.com");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY?.trim();
if (!apiKey) {
  console.error("Missing RESEND_API_KEY");
  process.exit(1);
}

const from =
  process.env.BLOODLINK_ALERT_FROM?.trim() || "BloodLink Alerts <onboarding@resend.dev>";

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject: "[BloodLink] Test alert (P0-2)",
    text: "If you received this, Resend is configured correctly for BloodLink emergency alerts.",
  }),
});

const body = await res.text();
if (!res.ok) {
  console.error("Resend error", res.status, body);
  process.exit(1);
}

console.log("Sent OK:", body);
