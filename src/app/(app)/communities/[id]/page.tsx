import { notFound } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Badge } from "@/components/ui/card";
import { CommunityDetailHeader } from "@/components/communities/community-detail-header";
import { CommunityAdminCollapsible } from "@/components/communities/community-admin-collapsible";
import {
  CommunityBottomActions,
  CommunityMembersEntry,
} from "@/components/communities/community-bottom-actions";
import { PRIORITY_LABELS } from "@/lib/constants";
import { Droplets } from "lucide-react";
import { format } from "date-fns";

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
        "request_id, blood_requests(id, status, patient_name, primary_blood_group, priority, units_filled, units_needed, deadline)"
      )
      .eq("community_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

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
            patient_name: string;
            primary_blood_group: string;
            priority: string;
            units_filled: number;
            units_needed: number;
            deadline: string;
          } | null
      )
      .filter((r) => r && ["open", "partially_filled"].includes(r.status)) ?? [];

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
            {activeRequests.map((r) => (
              <GroupedRow key={r!.id} href={`/requests/${r!.id}`} showChevron>
                <GroupedRowIcon color="red">
                  <Droplets className="h-4 w-4" />
                </GroupedRowIcon>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-medium text-[var(--label)]">{r!.patient_name}</span>
                    <Badge variant={r!.priority === "emergency" ? "emergency" : "default"}>
                      {PRIORITY_LABELS[r!.priority]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-[var(--label-secondary)]">
                    {r!.primary_blood_group} · {r!.units_filled}/{r!.units_needed} units
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--label-tertiary)]">
                    Deadline {format(new Date(r!.deadline), "MMM d, h:mm a")}
                  </p>
                </div>
              </GroupedRow>
            ))}
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
