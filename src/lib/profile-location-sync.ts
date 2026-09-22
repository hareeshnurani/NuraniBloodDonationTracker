"use server";

import { createClient } from "@/lib/supabase/server";
import { lookupPincode } from "@/lib/pincode";
import { getEffectiveLocationState } from "@/lib/profile-location";
import type { Profile } from "@/lib/types";

/** Clears stale coords or restores PIN coords (GPS: 3h, PIN: 3 days). */
export async function syncProfileEffectiveLocation(userId: string): Promise<void> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!row) return;

  const profile = row as Profile;
  const state = getEffectiveLocationState(profile);
  const useMyLocation = profile.use_my_location ?? false;

  if (!state.available) {
    if (profile.latitude != null || profile.longitude != null) {
      await supabase
        .from("profiles")
        .update({ latitude: null, longitude: null })
        .eq("id", userId);
    }
    return;
  }

  if (
    !useMyLocation &&
    profile.home_pincode &&
    (profile.latitude == null || profile.longitude == null)
  ) {
    const lookup = await lookupPincode(profile.home_pincode);
    if ("error" in lookup) return;
    await supabase
      .from("profiles")
      .update({
        latitude: lookup.data.latitude,
        longitude: lookup.data.longitude,
        location_label: lookup.data.displayLocation,
      })
      .eq("id", userId);
  }
}
