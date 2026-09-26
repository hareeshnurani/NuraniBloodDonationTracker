import type { SupabaseClient } from "@supabase/supabase-js";
import type { BloodGroup } from "@/lib/constants";
import { MATCH_RADIUS_KM } from "@/lib/constants";
import { haversineKm, isDonorEligible } from "@/lib/utils";

export type DonorActiveRequestRow = {
  requestId: string;
  invitationId?: string;
  patientName: string;
  primaryBloodGroup: BloodGroup;
  priority: string;
  unitsFilled: number;
  unitsNeeded: number;
  deadline: string;
  /** null when donor location is unknown */
  distanceKm: number | null;
  isReplacementMatch: boolean;
  inviteResponse?: string;
};

export function splitRequestsByRadius(rows: DonorActiveRequestRow[]) {
  const nearby = rows.filter(
    (r) => r.distanceKm !== null && r.distanceKm <= MATCH_RADIUS_KM
  );
  const other = rows.filter(
    (r) => r.distanceKm === null || r.distanceKm > MATCH_RADIUS_KM
  );
  return { nearby, other };
}

type DonorProfileSlice = {
  blood_group: BloodGroup;
  willing_to_donate: boolean;
  last_donation_date: string | null;
};

/** Public wall: every open matching request (blood group), not limited to invites or communities. */
export async function getMatchingActiveRequests(
  supabase: SupabaseClient,
  profile: { id: string; latitude: number | null; longitude: number | null },
  donorProfile: DonorProfileSlice
): Promise<DonorActiveRequestRow[]> {
  if (!donorProfile.willing_to_donate || !isDonorEligible(donorProfile.last_donation_date)) {
    return [];
  }

  const { data: invites } = await supabase
    .from("donor_invitations")
    .select("id, request_id, distance_km, is_replacement_match, response")
    .eq("donor_id", profile.id);

  const inviteByRequest = new Map(
    (invites ?? []).map((i) => [
      i.request_id,
      {
        id: i.id,
        distance_km: i.distance_km as number | null,
        is_replacement_match: i.is_replacement_match,
        response: i.response,
      },
    ])
  );

  const { data: openRequests } = await supabase
    .from("blood_requests")
    .select(
      "id, patient_name, primary_blood_group, priority, units_filled, units_needed, deadline, latitude, longitude, accepts_replacement, status"
    )
    .in("status", ["open", "partially_filled"])
    .order("deadline", { ascending: true })
    .limit(150);

  const openIds = (openRequests ?? []).map((r) => r.id);
  const { data: replacementGroups } = openIds.length
    ? await supabase
        .from("request_replacement_groups")
        .select("request_id, blood_group")
        .in("request_id", openIds)
    : { data: [] as { request_id: string; blood_group: string }[] };

  const replacementMap = new Map<string, BloodGroup[]>();
  for (const rg of replacementGroups ?? []) {
    const list = replacementMap.get(rg.request_id) ?? [];
    list.push(rg.blood_group as BloodGroup);
    replacementMap.set(rg.request_id, list);
  }

  const hasDonorCoords = profile.latitude != null && profile.longitude != null;
  const rows: DonorActiveRequestRow[] = [];

  for (const req of openRequests ?? []) {
    if (req.units_filled >= req.units_needed) continue;

    const isPrimary = donorProfile.blood_group === req.primary_blood_group;
    const replacements = replacementMap.get(req.id) ?? [];
    const isReplacement =
      req.accepts_replacement && replacements.includes(donorProfile.blood_group);
    if (!isPrimary && !isReplacement) continue;

    const inv = inviteByRequest.get(req.id);
    let distanceKm: number | null = null;
    if (inv?.distance_km != null) {
      distanceKm = inv.distance_km;
    } else if (hasDonorCoords) {
      distanceKm =
        Math.round(
          haversineKm(req.latitude, req.longitude, profile.latitude!, profile.longitude!) * 10
        ) / 10;
    }

    rows.push({
      requestId: req.id,
      invitationId: inv?.id,
      patientName: req.patient_name,
      primaryBloodGroup: req.primary_blood_group as BloodGroup,
      priority: req.priority,
      unitsFilled: req.units_filled,
      unitsNeeded: req.units_needed,
      deadline: req.deadline,
      distanceKm,
      isReplacementMatch: !!inv?.is_replacement_match || (isReplacement && !isPrimary),
      inviteResponse: inv?.response,
    });
  }

  return rows;
}

export async function getDonorDonateWall(
  supabase: SupabaseClient,
  profile: { id: string; latitude: number | null; longitude: number | null },
  donorProfile: DonorProfileSlice
) {
  const all = await getMatchingActiveRequests(supabase, profile, donorProfile);
  return splitRequestsByRadius(all);
}

export async function getDonorActiveRequestsForSection(
  supabase: SupabaseClient,
  profile: { id: string; latitude: number | null; longitude: number | null },
  donorProfile: DonorProfileSlice & { is_available: boolean },
  section: "nearby" | "other"
): Promise<DonorActiveRequestRow[]> {
  const all = await getMatchingActiveRequests(supabase, profile, donorProfile);
  const { nearby, other } = splitRequestsByRadius(all);
  return section === "nearby" ? nearby : other;
}
