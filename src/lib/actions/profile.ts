"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import type { BloodGroup } from "@/lib/constants";

export async function completeProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const willingToDonate = formData.get("willing_to_donate") === "true";
  const name = formData.get("name") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      name,
      latitude,
      longitude,
      status: "active",
    })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  if (willingToDonate) {
    const bloodGroup = formData.get("blood_group") as BloodGroup;
    const lastDonationDate = (formData.get("last_donation_date") as string) || null;

    const { error: donorError } = await supabase.from("donor_profiles").upsert({
      user_id: user.id,
      blood_group: bloodGroup,
      last_donation_date: lastDonationDate,
      willing_to_donate: true,
      is_available: false,
    });

    if (donorError) return { error: donorError.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function updateDonorProfile(formData: FormData) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const updates: Record<string, unknown> = {};

  if (formData.has("last_donation_date")) {
    updates.last_donation_date = formData.get("last_donation_date") || null;
  }
  if (formData.has("is_available")) {
    updates.is_available = formData.get("is_available") === "true";
  }
  if (formData.has("blood_group")) {
    updates.blood_group = formData.get("blood_group");
  }
  if (formData.has("notify_community_only")) {
    updates.notify_community_only = formData.get("notify_community_only") === "true";
  }

  const { error } = await supabase
    .from("donor_profiles")
    .update(updates)
    .eq("user_id", profile.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/home");
  return { success: true };
}

export async function updateLocation(latitude: number, longitude: number) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ latitude, longitude })
    .eq("id", profile.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function confirmDonation(
  invitationId: string,
  donated: boolean,
  donatedDate?: string
) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();

  const { data: invitation } = await supabase
    .from("donor_invitations")
    .select("id, donor_id")
    .eq("id", invitationId)
    .eq("donor_id", profile.id)
    .single();

  if (!invitation) return { error: "Invitation not found" };

  if (!donated) {
    await supabase.from("donation_confirmations").upsert({
      invitation_id: invitationId,
      status: "not_donated",
      answered_at: new Date().toISOString(),
    });
  } else {
    if (!donatedDate) return { error: "Donation date required" };
    await supabase.from("donation_confirmations").upsert({
      invitation_id: invitationId,
      status: "donated",
      donated_date: donatedDate,
      answered_at: new Date().toISOString(),
    });
    await supabase
      .from("donor_profiles")
      .update({ last_donation_date: donatedDate, is_available: false })
      .eq("user_id", profile.id);
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  return { success: true };
}
