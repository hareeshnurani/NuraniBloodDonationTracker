import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncProfileEffectiveLocation } from "@/lib/profile-location-sync";
import type { DonorProfile, Profile } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!data) return null;

  await syncProfileEffectiveLocation(user.id);
  const { data: refreshed } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (refreshed ?? data) as Profile;
}

export async function getDonorProfile(userId: string): Promise<DonorProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as DonorProfile | null;
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireActiveProfile() {
  const user = await requireAuth();
  const profile = await getProfile();
  if (!profile) redirect("/login");

  if (!user.email_confirmed_at) redirect("/verify-email");

  if (profile.status === "profile_incomplete") redirect("/onboarding");
  if (profile.status === "pending_approval") redirect("/pending-approval");
  if (profile.status === "rejected") redirect("/rejected");
  if (profile.status === "suspended") redirect("/suspended");

  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireActiveProfile();
  if (profile.role !== "admin") redirect("/home");
  return { user, profile };
}
