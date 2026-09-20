import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DonorProfile, Profile } from "@/lib/types";

export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data as Profile | null;
});

export const getDonorProfile = cache(async (userId: string): Promise<DonorProfile | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as DonorProfile | null;
});

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Single auth round-trip per request (layout + page share this cache). */
export const requireActiveProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  if (!user.email_confirmed_at) redirect("/verify-email");

  if (profile.status === "profile_incomplete") redirect("/onboarding");
  if (profile.status === "pending_approval") redirect("/pending-approval");
  if (profile.status === "rejected") redirect("/rejected");

  return { user, profile: profile as Profile };
});

export async function requireAdmin() {
  const { user, profile } = await requireActiveProfile();
  if (profile.role !== "admin") redirect("/home");
  return { user, profile };
}
