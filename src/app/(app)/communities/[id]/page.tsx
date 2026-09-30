import { notFound } from "next/navigation";
import { requireActiveProfile, getDonorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/page-header";
import { GroupedSection } from "@/components/ui/grouped-list";
import {
  CommunityRequestRow,
  type CommunityRequestRowData,
} from "@/components/communities/community-request-row";
import { CommunityDetailHeader } from "@/components/communities/community-detail-header";
import { CommunityAdminCollapsible } from "@/components/communities/community-admin-collapsible";
import {
  CommunityBottomActions,
  CommunityMembersEntry,
} from "@/components/communities/community-bottom-actions";
import { Droplets } from "lucide-react";
import type { BloodGroup } from "@/lib/constants";
import {
  canDonorRespondToRequest,
  distanceKmToRequest,
} from "@/lib/donor-request-response";

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("id", id)
    .single();

  if (!community) notFound();

  const { data: membership } = await supabase
    .from("community_members")
    .select("is_admin")
    .eq("community_id", id)
    .eq("user_id", profile.id)
    .maybeSingle();

  const isMember = !!membership;
  const isAdmin = membership?.is_admin ?? false;

  if (community.visibility === "private" && !isMember && profile.role !== "admin") {
    notFound();
  }

  const [{ count: memberCount }, { data: requestLinks, error: requestsError }] = await Promise.all([
    supabase
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("community_id", id),
    supabase
      .from("request_communities")
      .select(
        "request_id, blood_requests(id, status, requester_id, patient_name, primary_blood_group, priority, units_filled, units_needed, deadline, accepts_replacement, latitude, longitude, hospital_notes, location_district, location_state, pincode, request_replacement_groups(blood_group))"
      )
      .eq("community_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (requestsError) {
    console.error("community requests load failed", requestsError.message);
  }

  type ActiveRequest = CommunityRequestRowData & {
    requester_id: string;
    accepts_replacement: boolean;
    latitude: number;
    longitude: number;
    request_replacement_groups?: { blood_group: string }[];
  };

  const activeRequests: ActiveRequest[] =
    requestLinks
      ?.map((rl) => rl.blood_requests as unknown as ActiveRequest | null)
      .filter(
        (r): r is ActiveRequest =>
          !!r && ["open", "partially_filled"].includes(r.status)
      ) ?? [];

  const donorProfile = await getDonorProfile(profile.id);
  const requestIds = activeRequests.map((r) => r.id);
  const inviteByRequest = new Map<
    string,
    { id: string; response: string; is_confirmed: boolean; distance_km: number }
  >();

  if (requestIds.length > 0) {
    const { data: invites } = await supabase
      .from("donor_invitations")
      .select("id, request_id, response, is_confirmed, distance_km")
      .eq("donor_id", profile.id)
      .in("request_id", requestIds);

    for (const inv of invites ?? []) {
      inviteByRequest.set(inv.request_id, {
        id: inv.id,
        response: inv.response,
        is_confirmed: inv.is_confirmed,
        distance_km: inv.distance_km,
      });
    }
  }

  const { data: pin } = isMember
    ? await supabase
        .from("user_community_pins")
        .select("community_id")
        .eq("user_id", profile.id)
        .eq("community_id", id)
        .maybeSingle()
    : { data: null };

  const visibilityLabel = community.visibility === "public" ? "Public group" : "Private group";

  return (
    <div className="space-y-5 pb-8">
      <CommunityDetailHeader
        communityId={id}
        name={community.name}
        description={community.description}
        visibilityLabel={visibilityLabel}
        memberCount={memberCount ?? 0}
        isMember={isMember}
        isPinned={!!pin}
      />

      <div>
        <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--label-tertiary)]">
          Active requests
        </p>
        {activeRequests.length > 0 ? (
          <GroupedSection>
            {activeRequests.map((req) => {
              const invite = inviteByRequest.get(req.id);
              const requestLike = {
                ...req,
                primary_blood_group: req.primary_blood_group as BloodGroup,
                request_replacement_groups: req.request_replacement_groups?.map((g) => ({
                  blood_group: g.blood_group as BloodGroup,
                })),
              };
              const showDonorActions =
                invite?.response !== "rejected" &&
                (canDonorRespondToRequest(profile, donorProfile, requestLike) ||
                  invite?.response === "pending" ||
                  invite?.is_confirmed ||
                  invite?.response === "accepted");
              const distanceKm =
                invite?.distance_km ?? distanceKmToRequest(profile, requestLike);

              return (
                <CommunityRequestRow
                  key={req.id}
                  request={req}
                  donorActions={
                    showDonorActions
                      ? {
                          invitationId: invite?.id ?? null,
                          distanceKm,
                          inviteResponse: invite?.response,
                          isConfirmed: invite?.is_confirmed,
                        }
                      : undefined
                  }
                />
              );
            })}
          </GroupedSection>
        ) : (
          <EmptyState
            icon={<Droplets className="h-6 w-6" />}
            title="No active requests"
            description="When someone posts a request to this group, it will show here first."
          />
        )}
      </div>

      {isMember && (
        <>
          <CommunityMembersEntry communityId={id} memberCount={memberCount ?? 0} />
          {isAdmin && (
            <CommunityAdminCollapsible communityId={id} visibility={community.visibility} />
          )}
          <CommunityBottomActions communityId={id} />
        </>
      )}
    </div>
  );
}
