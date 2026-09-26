type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/** Resend HTTP API (no SDK). Set RESEND_API_KEY and optional BLOODLINK_ALERT_FROM. */
export async function sendEmailAlert(params: SendEmailParams): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: true, skipped: true };
  }

  const from =
    process.env.BLOODLINK_ALERT_FROM?.trim() || "BloodLink Alerts <alerts@bloodlink.app>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        text: params.text,
        html: params.html ?? params.text.replace(/\n/g, "<br/>"),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email-alerts] Resend error:", res.status, body);
      return { ok: false, error: "Email delivery failed" };
    }

    return { ok: true };
  } catch (err) {
    console.error("[email-alerts]", err);
    return { ok: false, error: "Email delivery failed" };
  }
}

export function appBaseUrl(): string {
  const explicit = process.env.BLOODLINK_APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://127.0.0.1:43147";
}
