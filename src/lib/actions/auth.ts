"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import { isEmailVerificationRequired } from "@/lib/auth-config";
import { sendSignupVerificationEmail, sendWelcomeEmail } from "@/lib/auth-emails";

export type RegisterResult =
  | { ok: true; needsVerification?: boolean }
  | { ok: false; error: string; code?: "already_exists" };

/**
 * Sign-up with optional email verification (Resend + Supabase generateLink).
 * Set BLOODLINK_REQUIRE_EMAIL_VERIFICATION=true on Vercel when Resend is configured.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  acceptedTerms: boolean
): Promise<RegisterResult> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName) return { ok: false, error: "Name is required" };
  if (!acceptedTerms) {
    return { ok: false, error: "You must accept the Terms and Privacy Policy to sign up." };
  }
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return { ok: false, error: "Enter a valid email address" };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error("[registerUser] SUPABASE_SERVICE_ROLE_KEY is missing");
    return {
      ok: false,
      error: "Sign-up is temporarily unavailable. Please try again later.",
    };
  }

  if (isEmailVerificationRequired()) {
    const sent = await sendSignupVerificationEmail(trimmedEmail, trimmedName, password);
    if (!sent.ok) return { ok: false, error: sent.error };
    return { ok: true, needsVerification: true };
  }

  const admin = createServiceClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: trimmedEmail,
    password,
    email_confirm: true,
    user_metadata: { name: trimmedName },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return {
        ok: false,
        code: "already_exists",
        error:
          "An account with this email already exists. Sign in or reset your password if you forgot it.",
      };
    }
    return { ok: false, error: error.message };
  }

  if (!data.user) {
    return { ok: false, error: "Could not create account. Please try again." };
  }

  await admin
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq("id", data.user.id);

  void sendWelcomeEmail(trimmedEmail, trimmedName).catch((err) =>
    console.error("[registerUser] welcome email", err)
  );

  return { ok: true };
}
