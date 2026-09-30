import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncProfileEffectiveLocation } from "@/lib/profile-location-sync";
import type { DonorProfile, Profile } from "@/lib/types";

export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!data) return null;

  const mutated = await syncProfileEffectiveLocation(user.id);
  if (!mutated) return data as Profile;

  const { data: refreshed } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (refreshed ?? data) as Profile;
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

export const requireAuth = cache(async () => {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
});

export const requireActiveProfile = cache(async () => {
  const user = await requireAuth();
  const profile = await getProfile();
  if (!profile) redirect("/login");

  if (!user.email_confirmed_at) redirect("/verify-email");

  if (profile.status === "profile_incomplete") redirect("/onboarding");
  if (profile.status === "pending_approval") redirect("/pending-approval");
  if (profile.status === "rejected") redirect("/rejected");
  if (profile.status === "suspended") redirect("/suspended");

  return { user, profile };
});

/** Layout shell: one auth pass + unread count (parallel). */
export const getAppShellContext = cache(async () => {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);

  return {
    profile,
    unreadAlerts: count ?? 0,
  };
});

export async function requireAdmin() {
  const { user, profile } = await requireActiveProfile();
  if (profile.role !== "admin") redirect("/home");
  return { user, profile };
}
