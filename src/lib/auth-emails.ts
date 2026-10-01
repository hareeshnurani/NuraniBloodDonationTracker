import { createServiceClient } from "@/lib/supabase/admin";
import { appBaseUrl, sendEmailAlert } from "@/lib/email-alerts";

function authCallbackUrl(next: string) {
  return `${appBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

async function sendAuthLinkEmail(params: {
  to: string;
  subject: string;
  intro: string;
  link: string;
  footer?: string;
}) {
  return sendEmailAlert({
    to: params.to,
    subject: params.subject,
    text: [
      params.intro,
      "",
      params.link,
      "",
      params.footer ?? "If you did not request this, you can ignore this email.",
    ].join("\n"),
  });
}

/** Signup / email confirmation link (Resend; no Supabase SMTP). */
export async function sendSignupVerificationEmail(
  email: string,
  name: string,
  password: string
) {
  const trimmed = email.trim().toLowerCase();
  const admin = createServiceClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: trimmed,
    password,
    options: {
      redirectTo: authCallbackUrl("/onboarding"),
      data: { name: name.trim() },
    },
  });

  if (error) {
    console.error("[auth-emails] generateLink signup:", error.message);
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return {
        ok: false as const,
        error:
          "An account with this email already exists. Sign in or reset your password if you forgot it.",
      };
    }
    return { ok: false as const, error: "Could not start sign-up. Please try again later." };
  }

  const userId = data.user?.id;
  if (userId) {
    await admin
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("id", userId);
  }

  const link = data.properties?.action_link;
  if (!link) {
    return { ok: false as const, error: "Could not create verification link." };
  }

  const sent = await sendAuthLinkEmail({
    to: trimmed,
    subject: "Confirm your BloodLink email",
    intro: `Hi ${name.trim()},\n\nThanks for signing up. Open this link to confirm your email and continue setting up your profile (link expires soon):`,
    link,
  });

  if (!sent.ok) {
    if (userId) {
      await admin.auth.admin.deleteUser(userId).catch((err) =>
        console.error("[auth-emails] rollback user after send failure:", err)
      );
    }
    return { ok: false as const, error: sent.error ?? "We could not send the email." };
  }

  return { ok: true as const };
}

/** Resend confirmation for a signed-in but unverified user. */
export async function sendSignupVerificationResend(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) {
    return { ok: false as const, error: "Enter a valid email address." };
  }

  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: trimmed,
    options: { redirectTo: authCallbackUrl("/onboarding") },
  });

  if (error) {
    console.error("[auth-emails] generateLink magiclink:", error.message);
    return { ok: false as const, error: "Could not resend verification. Try again later." };
  }

  const link = data.properties?.action_link;
  if (!link) {
    return { ok: false as const, error: "Could not create verification link." };
  }

  const sent = await sendAuthLinkEmail({
    to: trimmed,
    subject: "Confirm your BloodLink email",
    intro: "Open this link to confirm your email and continue on BloodLink (expires soon):",
    link,
  });

  if (!sent.ok) {
    return { ok: false as const, error: sent.error ?? "We could not send the email." };
  }

  return { ok: true as const };
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

  if (!sent.ok && "skipped" in sent && sent.skipped) {
    return { ok: false as const, useSupabaseMail: true as const };
  }
  if (!sent.ok) {
    return { ok: false as const, error: sent.error ?? "We could not send the email." };
  }

  return { ok: true as const };
}
