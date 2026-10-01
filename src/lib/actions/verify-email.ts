"use server";

import { createClient } from "@/lib/supabase/server";
import { sendSignupVerificationResend } from "@/lib/auth-emails";

export async function resendVerificationEmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Sign in again, then return here to resend verification." };
  }

  if (user.email_confirmed_at) {
    return { success: true, message: "Your email is already confirmed." };
  }

  const result = await sendSignupVerificationResend(user.email);
  if (!result.ok) return { error: result.error };

  return { success: true, message: "Verification email sent — check your inbox and spam folder." };
}

/** Resend when user is not signed in yet (after sign-up). Does not reveal whether the address exists. */
export async function resendVerificationEmailForAddress(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const result = await sendSignupVerificationResend(trimmed);
  if (!result.ok) {
    console.error("[verify-email] resend for address:", result.error);
  }

  return {
    success: true,
    message: "If an account exists for that email, we sent a new verification link.",
  };
}
