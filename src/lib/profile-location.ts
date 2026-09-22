import type { Profile } from "@/lib/types";

/** GPS ("use my location") is refreshed every 3 hours. */
export const GPS_LOCATION_TTL_HOURS = 3;
export const GPS_LOCATION_TTL_MS = GPS_LOCATION_TTL_HOURS * 60 * 60 * 1000;

/** PIN fallback stays valid for 3 days after save. */
export const PIN_LOCATION_TTL_DAYS = 3;
export const PIN_LOCATION_TTL_MS = PIN_LOCATION_TTL_DAYS * 24 * 60 * 60 * 1000;

/** @deprecated Use PIN_LOCATION_TTL_DAYS */
export const LOCATION_TTL_DAYS = PIN_LOCATION_TTL_DAYS;

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

function isWithinTtl(iso: string | null | undefined, ttlMs: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < ttlMs;
}

export function isGpsTimestampFresh(iso: string | null | undefined): boolean {
  return isWithinTtl(iso, GPS_LOCATION_TTL_MS);
}

export function isPinTimestampFresh(iso: string | null | undefined): boolean {
  return isWithinTtl(iso, PIN_LOCATION_TTL_MS);
}

/** @deprecated Use isGpsTimestampFresh or isPinTimestampFresh */
export function isLocationTimestampFresh(iso: string | null | undefined): boolean {
  return isPinTimestampFresh(iso);
}

/** Effective coords for matching and UI (does not mutate the profile row). */
export function getEffectiveLocationState(profile: LocationProfile): EffectiveLocationState {
  const useMyLocation = profile.use_my_location ?? false;

  if (useMyLocation) {
    const fresh = isGpsTimestampFresh(profile.gps_updated_at);
    if (fresh && profile.latitude != null && profile.longitude != null) {
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

  if (!isPinTimestampFresh(profile.pin_updated_at)) {
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
      return `Your GPS location is older than ${GPS_LOCATION_TTL_HOURS} hours. Keep “Use my location” on so we can refresh it, or save your PIN code.`;
    case "gps_pending":
      return "Turn on “Use my location” and allow GPS so we can match you to nearby requests.";
    case "pin_stale":
      return `Your PIN location is older than ${PIN_LOCATION_TTL_DAYS} days. Save your PIN code again in Profile.`;
    case "gps_off_no_pin":
    default:
      return "Location unavailable. Turn on “Use my location” or save a 6-digit PIN code in Profile.";
  }
}
