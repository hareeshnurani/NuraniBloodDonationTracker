import type { BloodGroup } from "@/lib/constants";
import { haversineKm, isDonorEligible } from "@/lib/utils";
import type { DonorProfile, Profile } from "@/lib/types";

type RequestLike = {
  id: string;
  requester_id: string;
  status: string;
  units_filled: number;
  units_needed: number;
  primary_blood_group: BloodGroup;
  accepts_replacement: boolean;
  latitude: number;
  longitude: number;
  request_replacement_groups?: { blood_group: BloodGroup }[];
};

function isBloodMatch(
  donorBloodGroup: BloodGroup,
  primaryBloodGroup: BloodGroup,
  acceptsReplacement: boolean,
  replacementGroups: BloodGroup[]
) {
  const isPrimary = donorBloodGroup === primaryBloodGroup;
  const isReplacement = acceptsReplacement && replacementGroups.includes(donorBloodGroup);
  return isPrimary || isReplacement;
}

export function distanceKmToRequest(profile: Profile, request: RequestLike) {
  if (profile.latitude == null || profile.longitude == null) return 0;
  return Math.round(
    haversineKm(
      request.latitude,
      request.longitude,
      profile.latitude,
      profile.longitude
    ) * 10
  ) / 10;
}

export function canDonorRespondToRequest(
  profile: Profile,
  donor: DonorProfile | null,
  request: RequestLike
) {
  if (!donor?.willing_to_donate) return false;
  if (!isDonorEligible(donor.last_donation_date)) return false;
  if (request.requester_id === profile.id) return false;
  if (!["open", "partially_filled"].includes(request.status)) return false;
  if (request.units_filled >= request.units_needed) return false;

  const replacementGroups =
    request.request_replacement_groups?.map((g) => g.blood_group) ?? [];

  return isBloodMatch(
    donor.blood_group,
    request.primary_blood_group,
    request.accepts_replacement,
    replacementGroups
  );
}
