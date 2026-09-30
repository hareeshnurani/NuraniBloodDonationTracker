"use server";

import { createClient } from "@/lib/supabase/server";
import { lookupPincode } from "@/lib/pincode";
import { getEffectiveLocationState } from "@/lib/profile-location";
import type { Profile } from "@/lib/types";

/** Clears stale coords or restores PIN coords (GPS: 3h, PIN: 3 days). Returns true if profile/donor rows may have changed. */
export async function syncProfileEffectiveLocation(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!row) return false;

  const profile = row as Profile;
  const state = getEffectiveLocationState(profile);
  const useMyLocation = profile.use_my_location ?? false;

  if (state.available) {
    const needsPinGeocode =
      !useMyLocation &&
      profile.home_pincode &&
      (profile.latitude == null || profile.longitude == null);
    if (!needsPinGeocode) return false;
  }

  if (!state.available) {
    if (profile.latitude != null || profile.longitude != null) {
      await supabase
        .from("profiles")
        .update({ latitude: null, longitude: null })
        .eq("id", userId);
    }
    await supabase
      .from("donor_profiles")
      .update({ is_available: false })
      .eq("user_id", userId)
      .eq("is_available", true);
    return true;
  }

  if (
    !useMyLocation &&
    profile.home_pincode &&
    (profile.latitude == null || profile.longitude == null)
  ) {
    const lookup = await lookupPincode(profile.home_pincode);
    if ("error" in lookup) return false;
    await supabase
      .from("profiles")
      .update({
        latitude: lookup.data.latitude,
        longitude: lookup.data.longitude,
        location_label: lookup.data.displayLocation,
      })
      .eq("id", userId);
    return true;
  }

  return false;
}
