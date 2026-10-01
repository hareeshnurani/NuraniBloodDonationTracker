import { createServiceClient } from "@/lib/supabase/admin";
import { appBaseUrl, sendEmailAlert } from "@/lib/email-alerts";

function authCallbackUrl(next: string) {
  return `${appBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function sendWelcomeEmail(email: string, name: string) {
  const loginUrl = `${appBaseUrl()}/login`;
  const resetUrl = `${appBaseUrl()}/forgot-password`;
  return sendEmailAlert({
    to: email,
    subject: "Welcome to BloodLink — your account is ready",
    text: [
      `Hi ${name},`,
      "",
      "Your BloodLink account was created successfully.",
      "",
      `Sign in anytime: ${loginUrl}`,
      "",
      "If you forgot your password, reset it here:",
      resetUrl,
      "",
      "Thank you for helping connect blood donors with those in need.",
    ].join("\n"),
  });
}

/** Sends recovery link via Resend (uses Supabase generateLink — no Supabase SMTP required). */
export async function sendPasswordResetEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) {
    return { ok: false as const, error: "Enter a valid email address." };
  }

  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: trimmed,
    options: { redirectTo: authCallbackUrl("/reset-password") },
  });

  if (error) {
    console.error("[auth-emails] generateLink recovery:", error.message);
    return { ok: false as const, error: "Could not start password reset. Try again later." };
  }

  const link = data.properties?.action_link;
  if (!link) {
    return { ok: false as const, error: "Could not create reset link." };
  }

  const sent = await sendEmailAlert({
    to: trimmed,
    subject: "Reset your BloodLink password",
    text: [
      "We received a request to reset your BloodLink password.",
      "",
      "Open this link to choose a new password (expires soon):",
      link,
      "",
      "If you did not ask for this, you can ignore this email.",
    ].join("\n"),
  });

  if (sent.skipped) {
    return { ok: false as const, useSupabaseMail: true as const };
  }
  if (!sent.ok) {
    return { ok: false as const, error: sent.error ?? "Email delivery failed." };
  }

  return { ok: true as const };
}
