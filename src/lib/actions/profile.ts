"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { onDonorMarkedDonated } from "@/lib/chat-cleanup";
import { lookupPincode } from "@/lib/pincode";
import { syncProfileEffectiveLocation } from "@/lib/profile-location-sync";
import { getEffectiveLocationState, locationUnavailableMessage } from "@/lib/profile-location";
import type { BloodGroup } from "@/lib/constants";

export async function completeProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const willingToDonate = formData.get("willing_to_donate") === "true";
  const name = formData.get("name") as string;
  const latitudeRaw = formData.get("latitude") as string;
  const longitudeRaw = formData.get("longitude") as string;
  const latitude = parseFloat(latitudeRaw);
  const longitude = parseFloat(longitudeRaw);
  const useMyLocation = formData.get("use_my_location") === "true";
  const homePincode = (formData.get("home_pincode") as string)?.trim() || null;
  const now = new Date().toISOString();

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return {
      error: "Please set your location using GPS or your 6-digit PIN code before continuing.",
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      name,
      latitude,
      longitude,
      home_pincode: useMyLocation ? null : homePincode,
      location_label:
        (formData.get("location_label") as string) ||
        (useMyLocation
          ? `GPS · ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
          : null),
      use_my_location: useMyLocation,
      gps_updated_at: useMyLocation ? now : null,
      pin_updated_at: !useMyLocation && homePincode ? now : null,
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
    const wantsAvailable = formData.get("is_available") === "true";
    if (wantsAvailable) {
      const { data: fullProfile } = await supabase
        .from("profiles")
        .select(
          "use_my_location, latitude, longitude, home_pincode, location_label, gps_updated_at, pin_updated_at"
        )
        .eq("id", profile.id)
        .single();

      if (fullProfile) {
        const loc = getEffectiveLocationState(fullProfile);
        if (!loc.available) {
          return {
            error: locationUnavailableMessage(loc.reason),
          };
        }
      }
    }
    updates.is_available = wantsAvailable;
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

export async function setUseMyLocation(enabled: boolean) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();

  if (!enabled) {
    const { error } = await supabase
      .from("profiles")
      .update({
        use_my_location: false,
        latitude: null,
        longitude: null,
        gps_updated_at: null,
      })
      .eq("id", profile.id);

    if (error) return { error: error.message };
    await syncProfileEffectiveLocation(profile.id);
    revalidatePath("/profile");
    revalidatePath("/home");
    return { success: true, needsGpsRefresh: false };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      use_my_location: true,
      latitude: null,
      longitude: null,
      gps_updated_at: null,
    })
    .eq("id", profile.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/home");
  return { success: true, needsGpsRefresh: true };
}

export async function updateGpsLocation(latitude: number, longitude: number) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      use_my_location: true,
      latitude,
      longitude,
      gps_updated_at: now,
      location_label: `GPS · ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    })
    .eq("id", profile.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/home");
  return { success: true };
}

/** @deprecated Prefer updateGpsLocation */
export async function updateLocation(latitude: number, longitude: number) {
  return updateGpsLocation(latitude, longitude);
}

export async function updateLocationFromPincode(pincode: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const lookup = await lookupPincode(pincode);
  if ("error" in lookup) return { error: lookup.error };

  const { data } = lookup;
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      use_my_location: false,
      latitude: data.latitude,
      longitude: data.longitude,
      home_pincode: data.pincode,
      location_label: data.displayLocation,
      pin_updated_at: now,
      gps_updated_at: null,
    })
    .eq("id", profile.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/home");
  return {
    success: true,
    data: {
      latitude: data.latitude,
      longitude: data.longitude,
      homePincode: data.pincode,
      locationLabel: data.displayLocation,
    },
  };
}

export async function confirmDonation(
  invitationId: string,
  donated: boolean,
  donatedDate?: string,
  notDonatedReason?: string
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
    const reason = notDonatedReason?.trim();
    if (!reason) return { error: "Please enter a reason" };
    await supabase.from("donation_confirmations").upsert({
      invitation_id: invitationId,
      status: "not_donated",
      not_donated_reason: reason,
      answered_at: new Date().toISOString(),
    });
  } else {
    if (!donatedDate) return { error: "Donation date required" };
    await supabase.from("donation_confirmations").upsert({
      invitation_id: invitationId,
      status: "donated",
      donated_date: donatedDate,
      not_donated_reason: null,
      answered_at: new Date().toISOString(),
    });
    await supabase
      .from("donor_profiles")
      .update({ last_donation_date: donatedDate, is_available: false })
      .eq("user_id", profile.id);

    await onDonorMarkedDonated(invitationId);
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/chat");
  return { success: true };
}
