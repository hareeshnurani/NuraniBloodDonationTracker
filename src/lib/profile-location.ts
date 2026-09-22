import type { Profile } from "@/lib/types";

/** True when the user has GPS coordinates saved (used for matching distance). */
export function profileHasLocation(
  profile: Pick<Profile, "latitude" | "longitude">
): boolean {
  return profile.latitude != null && profile.longitude != null;
}
