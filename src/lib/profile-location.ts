import type { Profile } from "@/lib/types";

export const LOCATION_TTL_DAYS = 3;
export const LOCATION_TTL_MS = LOCATION_TTL_DAYS * 24 * 60 * 60 * 1000;

export type LocationUnavailableReason =
  | "gps_off_no_pin"
  | "pin_stale"
  | "gps_stale"
  | "gps_pending";

export type EffectiveLocationState = {
  available: boolean;
  reason?: LocationUnavailableReason;
  latitude: number | null;
  longitude: number | null;
  label: string | null;
};

type LocationProfile = Pick<
  Profile,
  | "use_my_location"
  | "latitude"
  | "longitude"
  | "home_pincode"
  | "location_label"
  | "gps_updated_at"
  | "pin_updated_at"
>;

export function isLocationTimestampFresh(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < LOCATION_TTL_MS;
}

/** Effective coords for matching and UI (does not mutate the profile row). */
export function getEffectiveLocationState(profile: LocationProfile): EffectiveLocationState {
  const useMyLocation = profile.use_my_location ?? false;

  if (useMyLocation) {
    const fresh = isLocationTimestampFresh(profile.gps_updated_at);
    if (
      fresh &&
      profile.latitude != null &&
      profile.longitude != null
    ) {
      return {
        available: true,
        latitude: profile.latitude,
        longitude: profile.longitude,
        label: profile.location_label,
      };
    }
    return {
      available: false,
      reason: profile.gps_updated_at ? "gps_stale" : "gps_pending",
      latitude: null,
      longitude: null,
      label: null,
    };
  }

  const pin = profile.home_pincode?.trim();
  if (!pin) {
    return {
      available: false,
      reason: "gps_off_no_pin",
      latitude: null,
      longitude: null,
      label: null,
    };
  }

  if (!isLocationTimestampFresh(profile.pin_updated_at)) {
    return {
      available: false,
      reason: "pin_stale",
      latitude: null,
      longitude: null,
      label: null,
    };
  }

  if (profile.latitude != null && profile.longitude != null) {
    return {
      available: true,
      latitude: profile.latitude,
      longitude: profile.longitude,
      label: profile.location_label,
    };
  }

  return {
    available: false,
    reason: "gps_off_no_pin",
    latitude: null,
    longitude: null,
    label: null,
  };
}

export function profileHasEffectiveLocation(profile: LocationProfile): boolean {
  return getEffectiveLocationState(profile).available;
}

/** @deprecated Use profileHasEffectiveLocation */
export function profileHasLocation(
  profile: Pick<Profile, "latitude" | "longitude">
): boolean {
  return profile.latitude != null && profile.longitude != null;
}

export function locationUnavailableMessage(
  reason: LocationUnavailableReason | undefined
): string {
  switch (reason) {
    case "gps_stale":
      return `Your GPS location is older than ${LOCATION_TTL_DAYS} days. Turn on “Use my location” and refresh, or save your PIN code again.`;
    case "gps_pending":
      return "Turn on “Use my location” and allow GPS so we can match you to nearby requests.";
    case "pin_stale":
      return `Your PIN location is older than ${LOCATION_TTL_DAYS} days. Save your PIN code again in Profile.`;
    case "gps_off_no_pin":
    default:
      return "Location unavailable. Turn on “Use my location” or save a 6-digit PIN code in Profile.";
  }
}
