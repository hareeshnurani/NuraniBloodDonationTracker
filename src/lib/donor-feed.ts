import type { SupabaseClient } from "@supabase/supabase-js";
import type { BloodGroup } from "@/lib/constants";
import { isDonorEligible } from "@/lib/utils";

export type DonorHomeCard = {
  invitationId: string;
  requestId: string;
  patientName: string;
  primaryBloodGroup: BloodGroup;
  priority: string;
  unitsFilled: number;
  unitsNeeded: number;
  distanceKm: number;
  isReplacementMatch: boolean;
  deadline: string;
};

const INVITE_SELECT =
  "id, distance_km, is_replacement_match, blood_requests(id, patient_name, primary_blood_group, priority, units_filled, units_needed, status, deadline)";

export async function getDonorHomeFeed(
  supabase: SupabaseClient,
  profile: { id: string },
  donorProfile: {
    blood_group: BloodGroup;
    willing_to_donate: boolean;
    is_available: boolean;
    last_donation_date: string | null;
  }
): Promise<{ cards: DonorHomeCard[]; matchingActiveCount: number; pendingCount: number }> {
  const eligible =
    donorProfile.willing_to_donate && isDonorEligible(donorProfile.last_donation_date);

  const pendingPromise = supabase
    .from("donor_invitations")
    .select(INVITE_SELECT)
    .eq("donor_id", profile.id)
    .eq("response", "pending")
    .order("created_at", { ascending: false })
    .limit(15);

  const openRequestsPromise = eligible
    ? supabase
        .from("blood_requests")
        .select("id, primary_blood_group, accepts_replacement, units_filled, units_needed")
        .in("status", ["open", "partially_filled"])
        .limit(80)
    : Promise.resolve({ data: [] as never[] });

  const [{ data: pendingInvites }, { data: openRequests }] = await Promise.all([
    pendingPromise,
    openRequestsPromise,
  ]);

  const pendingCards: DonorHomeCard[] = [];
  for (const inv of pendingInvites ?? []) {
    const req = inv.blood_requests as unknown as {
      id: string;
      patient_name: string;
      primary_blood_group: BloodGroup;
      priority: string;
      units_filled: number;
      units_needed: number;
      status: string;
      deadline: string;
    } | null;
    if (!req || !["open", "partially_filled"].includes(req.status)) continue;
    if (req.units_filled >= req.units_needed) continue;
    pendingCards.push({
      invitationId: inv.id,
      requestId: req.id,
      patientName: req.patient_name,
      primaryBloodGroup: req.primary_blood_group,
      priority: req.priority,
      unitsFilled: req.units_filled,
      unitsNeeded: req.units_needed,
      distanceKm: inv.distance_km ?? 0,
      isReplacementMatch: !!inv.is_replacement_match,
      deadline: req.deadline,
    });
  }

  let matchingActiveCount = 0;

  if (eligible && openRequests?.length) {
    const openIds = openRequests.map((r) => r.id);
    const { data: replacementGroups } = await supabase
      .from("request_replacement_groups")
      .select("request_id, blood_group")
      .in("request_id", openIds);

    const replacementMap = new Map<string, BloodGroup[]>();
    for (const rg of replacementGroups ?? []) {
      const list = replacementMap.get(rg.request_id) ?? [];
      list.push(rg.blood_group as BloodGroup);
      replacementMap.set(rg.request_id, list);
    }

    for (const req of openRequests) {
      if (req.units_filled >= req.units_needed) continue;
      const isPrimary = donorProfile.blood_group === req.primary_blood_group;
      const replacements = replacementMap.get(req.id) ?? [];
      const isReplacement =
        req.accepts_replacement && replacements.includes(donorProfile.blood_group);
      if (!isPrimary && !isReplacement) continue;
      matchingActiveCount += 1;
    }
  }

  return {
    cards: pendingCards,
    matchingActiveCount,
    pendingCount: pendingCards.length,
  };
}
