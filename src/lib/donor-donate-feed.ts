import type { SupabaseClient } from "@supabase/supabase-js";
import type { BloodGroup } from "@/lib/constants";
import { MATCH_RADIUS_KM } from "@/lib/constants";
import { type DonorHomeCard, getDonorHomeFeed } from "@/lib/donor-feed";
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
  distanceKm: number;
  isReplacementMatch: boolean;
  inviteResponse?: string;
};

export function splitCardsByRadius(cards: DonorHomeCard[]) {
  const nearby = cards.filter((c) => c.distanceKm <= MATCH_RADIUS_KM);
  const other = cards.filter((c) => c.distanceKm > MATCH_RADIUS_KM);
  return { nearby, other };
}

export async function getDonorDonatePreview(
  supabase: SupabaseClient,
  profile: { id: string; latitude: number | null; longitude: number | null },
  donorProfile: Parameters<typeof getDonorHomeFeed>[2]
) {
  const feed = await getDonorHomeFeed(supabase, profile, donorProfile);
  const { nearby, other } = splitCardsByRadius(feed.cards);
  return { nearby, other, feed };
}

export async function getDonorActiveRequestsForSection(
  supabase: SupabaseClient,
  profile: { id: string; latitude: number | null; longitude: number | null },
  donorProfile: {
    blood_group: BloodGroup;
    willing_to_donate: boolean;
    is_available: boolean;
    last_donation_date: string | null;
  },
  section: "nearby" | "other"
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
        distance_km: i.distance_km,
        is_replacement_match: i.is_replacement_match,
        response: i.response,
      },
    ])
  );

  const { data: openRequests } = await supabase
    .from("blood_requests")
    .select("id, patient_name, primary_blood_group, priority, units_filled, units_needed, deadline, latitude, longitude, accepts_replacement, status")
    .in("status", ["open", "partially_filled"])
    .order("deadline", { ascending: true })
    .limit(100);

  const openIds = (openRequests ?? []).map((r) => r.id);
  const { data: replacementGroups } = openIds.length
    ? await supabase.from("request_replacement_groups").select("request_id, blood_group").in("request_id", openIds)
    : { data: [] as { request_id: string; blood_group: string }[] };

  const replacementMap = new Map<string, BloodGroup[]>();
  for (const rg of replacementGroups ?? []) {
    const list = replacementMap.get(rg.request_id) ?? [];
    list.push(rg.blood_group as BloodGroup);
    replacementMap.set(rg.request_id, list);
  }

  const rows: DonorActiveRequestRow[] = [];

  for (const req of openRequests ?? []) {
    if (req.units_filled >= req.units_needed) continue;

    const isPrimary = donorProfile.blood_group === req.primary_blood_group;
    const replacements = replacementMap.get(req.id) ?? [];
    const isReplacement =
      req.accepts_replacement && replacements.includes(donorProfile.blood_group);
    if (!isPrimary && !isReplacement) continue;

    const inv = inviteByRequest.get(req.id);
    let distanceKm = inv?.distance_km ?? 0;
    if (!inv && profile.latitude != null && profile.longitude != null) {
      distanceKm = Math.round(haversineKm(req.latitude, req.longitude, profile.latitude, profile.longitude) * 10) / 10;
    }

    const inNearby = distanceKm <= MATCH_RADIUS_KM;
    if (section === "nearby" && !inNearby) continue;
    if (section === "other" && inNearby) continue;

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
