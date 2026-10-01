"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/auth-emails";

export async function requestPasswordReset(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const result = await sendPasswordResetEmail(trimmed);
  if ("useSupabaseMail" in result && result.useSupabaseMail) {
    return { useClientReset: true as const };
  }
  if (!result.ok) {
    return { error: "error" in result ? result.error : "Could not send reset email." };
  }

  return {
    success: true as const,
    message: "If an account exists for that email, we sent password reset instructions.",
  };
}

export async function updateAccountPassword(newPassword: string) {
  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: true, message: "Password updated." };
}

export async function updateAccountEmail(newEmail: string) {
  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const profile = await getProfile();
  if (!profile) return { error: "Not signed in." };
  if (trimmed === profile.email.toLowerCase()) {
    return { error: "That is already your email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) return { error: error.message };

  return {
    success: true,
    message:
      "We sent a confirmation link to your new email address. The email you use to sign in updates after you confirm.",
  };
}
