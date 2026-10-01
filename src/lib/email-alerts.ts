type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type SendEmailResult = { ok: true } | { ok: false; error: string; skipped?: boolean };

function parseResendFailure(status: number, body: string): string {
  let message = "";
  try {
    const json = JSON.parse(body) as { message?: string; name?: string };
    message = json.message ?? "";
  } catch {
    message = body.slice(0, 200);
  }
  const lower = message.toLowerCase();
  if (status === 429 || lower.includes("quota")) {
    return "Email limit reached for today. Please try again after midnight UTC or contact support.";
  }
  if (status === 403 || lower.includes("not verified") || lower.includes("domain")) {
    return "Email sender is not verified. The site operator must verify nsbloodlink.in in Resend and set BLOODLINK_ALERT_FROM on Vercel.";
  }
  if (lower.includes("invalid") && lower.includes("from")) {
    return "Email sender address is misconfigured (BLOODLINK_ALERT_FROM on Vercel). Contact support.";
  }
  if (status === 401 || lower.includes("api key")) {
    return "Email service is misconfigured. Contact support.";
  }
  console.error("[email-alerts] Resend error:", status, body);
  return "We could not send the email. Try again in a few minutes or contact support.";
}

/** Resend HTTP API (no SDK). Set RESEND_API_KEY and optional BLOODLINK_ALERT_FROM. */
export async function sendEmailAlert(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, skipped: true, error: "Email is not configured." };
  }

  const from =
    process.env.BLOODLINK_ALERT_FROM?.trim() || "BloodLink Alerts <alerts@bloodlink.app>";

  if (!process.env.BLOODLINK_ALERT_FROM?.trim() && process.env.NODE_ENV === "production") {
    console.warn(
      "[email-alerts] BLOODLINK_ALERT_FROM is unset; default alerts@bloodlink.app is usually rejected by Resend. Set BloodLink <noreply@nsbloodlink.in> after domain verify."
    );
  }

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
      return { ok: false, error: parseResendFailure(res.status, body) };
    }

    return { ok: true };
  } catch (err) {
    console.error("[email-alerts]", err);
    return { ok: false, error: "We could not send the email. Check your connection and try again." };
  }
}

export function appBaseUrl(): string {
  const explicit = process.env.BLOODLINK_APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://127.0.0.1:43147";
}
