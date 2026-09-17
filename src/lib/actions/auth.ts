"use server";

import { createServiceClient } from "@/lib/supabase/admin";

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Creates a user without sending Supabase confirmation email.
 * Use when custom SMTP is not configured (built-in Supabase mail often returns
 * "Error sending confirmation email"). Set BLOODLINK_USE_EMAIL_CONFIRMATION=true
 * and configure SMTP in Supabase to restore email verification flow.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<RegisterResult> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName) return { ok: false, error: "Name is required" };
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return { ok: false, error: "Enter a valid email address" };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }

  if (process.env.BLOODLINK_USE_EMAIL_CONFIRMATION === "true") {
    return {
      ok: false,
      error:
        "Email verification is enabled in server config. Configure SMTP in Supabase or unset BLOODLINK_USE_EMAIL_CONFIRMATION.",
    };
  }

  const admin = createServiceClient();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return {
      ok: false,
      error:
        "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing. Add it in Vercel environment variables and redeploy.",
    };
  }

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
        error: "An account with this email already exists. Try signing in.",
      };
    }
    return { ok: false, error: error.message };
  }

  if (!data.user) {
    return { ok: false, error: "Could not create account. Please try again." };
  }

  return { ok: true };
}
