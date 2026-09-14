import { notFound } from "next/navigation";
import Link from "next/link";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, SectionHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Badge } from "@/components/ui/card";
import { Users, Droplets, Globe, Lock } from "lucide-react";
import { CommunityAdminPanel } from "@/components/communities/community-admin-panel";
import { PinButton } from "@/components/communities/pin-button";
import { LeaveCommunityButton } from "@/components/communities/leave-community-button";
import { PRIORITY_LABELS } from "@/lib/constants";
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

  const { data: members } = await supabase
    .from("community_members")
    .select("user_id, is_admin, joined_at, profiles(name, email)")
    .eq("community_id", id)
    .order("joined_at", { ascending: true });

  const { data: requestLinks } = await supabase
    .from("request_communities")
    .select("request_id, blood_requests(*)")
    .eq("community_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const activeRequests =
    requestLinks
      ?.map((rl) => rl.blood_requests as unknown as { id: string; status: string; patient_name: string; primary_blood_group: string; priority: string; units_filled: number; units_needed: number; deadline: string } | null)
      .filter(
        (r) => r && ["open", "partially_filled"].includes(r.status)
      ) ?? [];

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
            {activeRequests.map((r) => (
                <GroupedRow key={r!.id} href={`/requests/${r!.id}`} showChevron>
                  <GroupedRowIcon color="red">
                    <Droplets className="h-4 w-4" />
                  </GroupedRowIcon>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-[var(--label)]">{r!.patient_name}</span>
                      <Badge variant={r!.priority === "emergency" ? "emergency" : "default"}>
                        {PRIORITY_LABELS[r!.priority]}
                      </Badge>
                    </div>
                    <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">
                      {r!.primary_blood_group} · {r!.units_filled}/{r!.units_needed} units
                    </p>
                    <p className="text-[12px] text-[var(--label-tertiary)] mt-0.5">
                      Deadline: {format(new Date(r!.deadline), "MMM d, h:mm a")}
                    </p>
                  </div>
                </GroupedRow>
            ))}
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
