import { notFound } from "next/navigation";
import Link from "next/link";
import { requireActiveProfile, getDonorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, SectionHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Badge } from "@/components/ui/card";
import { Users, Droplets, Globe, Lock } from "lucide-react";
import { CommunityAdminPanel } from "@/components/communities/community-admin-panel";
import { CommunityActiveRequestCard } from "@/components/communities/community-active-request-card";
import { PinButton } from "@/components/communities/pin-button";
import { LeaveCommunityButton } from "@/components/communities/leave-community-button";
import { ReportCommunityButton } from "@/components/communities/report-community-button";
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

  const [
    { data: members, error: membersError },
    { data: requestLinks, error: requestsError },
  ] = await Promise.all([
    isMember
      ? supabase
          .from("community_members")
          .select("user_id, is_admin, joined_at, profiles(name, email)")
          .eq("community_id", id)
          .order("joined_at", { ascending: true })
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("request_communities")
      .select(
        "request_id, blood_requests(id, status, requester_id, patient_name, primary_blood_group, priority, units_filled, units_needed, deadline, accepts_replacement, latitude, longitude, request_replacement_groups(blood_group))"
      )
      .eq("community_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (membersError) {
    console.error("community members load failed", membersError.message);
  }
  if (requestsError) {
    console.error("community requests load failed", requestsError.message);
  }

  const activeRequests =
    requestLinks
      ?.map(
        (rl) =>
          rl.blood_requests as unknown as {
            id: string;
            status: string;
            requester_id: string;
            patient_name: string;
            primary_blood_group: string;
            priority: string;
            units_filled: number;
            units_needed: number;
            deadline: string;
            accepts_replacement: boolean;
            latitude: number;
            longitude: number;
            request_replacement_groups?: { blood_group: string }[];
          } | null
      )
      .filter((r) => r && ["open", "partially_filled"].includes(r.status)) ?? [];

  const donorProfile = await getDonorProfile(profile.id);
  const requestIds = activeRequests.map((r) => r!.id);
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

  const { data: pin } = await supabase
    .from("user_community_pins")
    .select("community_id")
    .eq("user_id", profile.id)
    .eq("community_id", id)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <Link href="/communities" className="text-sm text-[var(--accent)] hover:underline">
        ← Communities
      </Link>

      <PageHeader
        title={community.name}
        subtitle={community.description ?? undefined}
        action={
          isMember ? (
            <div className="flex items-center gap-2">
              <PinButton communityId={id} isPinned={!!pin} />
              <ReportCommunityButton communityId={id} />
              <LeaveCommunityButton communityId={id} />
            </div>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>
          {community.visibility === "public" ? (
            <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Public</span>
          ) : (
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>
          )}
        </Badge>
        <Badge>{members?.length ?? 0} members</Badge>
      </div>

      {isAdmin && <CommunityAdminPanel communityId={id} visibility={community.visibility} />}

      <section>
        <SectionHeader title="Active Requests" />
        {activeRequests.length > 0 ? (
          <GroupedSection>
            {activeRequests.map((r) => {
              const req = r!;
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
                <CommunityActiveRequestCard
                  key={req.id}
                  request={req}
                  showDonorActions={showDonorActions}
                  invitationId={invite?.id ?? null}
                  distanceKm={distanceKm}
                  inviteResponse={invite?.response}
                  isConfirmed={invite?.is_confirmed}
                />
              );
            })}
          </GroupedSection>
        ) : (
          <EmptyState
            icon={<Droplets className="h-6 w-6" />}
            title="No active requests"
            description="Requests shared with this community will appear here."
          />
        )}
      </section>

      {isMember && (
        <section>
          <SectionHeader title="Members" />
          <GroupedSection>
            {members?.map((m) => {
              const p = m.profiles as unknown as { name: string; email: string };
              return (
                <GroupedRow key={m.user_id}>
                  <GroupedRowIcon color="blue">
                    <Users className="h-4 w-4" />
                  </GroupedRowIcon>
                  <div className="flex-1">
                    <span className="text-[15px] font-medium text-[var(--label)]">{p.name}</span>
                    {m.is_admin && <Badge className="ml-2">Admin</Badge>}
                    <p className="text-[13px] text-[var(--label-secondary)]">{p.email}</p>
                  </div>
                </GroupedRow>
              );
            })}
          </GroupedSection>
        </section>
      )}
    </div>
  );
}
