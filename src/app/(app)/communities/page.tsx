import Link from "next/link";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/page-header";
import { CommunityListRow, CommunityListRowStatic } from "@/components/communities/community-list-row";
import { GroupsCreateFab } from "@/components/communities/groups-create-fab";
import { JoinCommunityButton } from "@/components/communities/join-community-button";
import { InsetListShell } from "@/components/ui/entity-avatar";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

export default async function CommunitiesPage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const [{ data: memberships }, { data: publicCommunities }] = await Promise.all([
    supabase
      .from("community_members")
      .select("community_id, is_admin, joined_at, communities(*)")
      .eq("user_id", profile.id)
      .order("joined_at", { ascending: false }),
    supabase
      .from("communities")
      .select("*")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const myCommunities =
    memberships?.map((m) => {
      const c = m.communities as unknown as {
        id: string;
        name: string;
        description: string | null;
        visibility: string;
      };
      return { ...c, is_admin: m.is_admin };
    }) ?? [];

  const myIds = myCommunities.map((c) => c.id);

  let activeCountByCommunity = new Map<string, number>();
  if (myIds.length > 0) {
    const { data: requestLinks } = await supabase
      .from("request_communities")
      .select("community_id, blood_requests(status)")
      .in("community_id", myIds);

    for (const rl of requestLinks ?? []) {
      const req = rl.blood_requests as unknown as { status: string } | null;
      if (req && ["open", "partially_filled"].includes(req.status)) {
        activeCountByCommunity.set(
          rl.community_id,
          (activeCountByCommunity.get(rl.community_id) ?? 0) + 1
        );
      }
    }
  }

  const discover = publicCommunities?.filter((c) => !myIds.includes(c.id)) ?? [];

  return (
    <div className="-mx-4 min-h-[50vh] pb-20 lg:mx-0 lg:pb-0">
      {myCommunities.length > 0 ? (
        <InsetListShell>
          {myCommunities.map((c) => {
            const active = activeCountByCommunity.get(c.id) ?? 0;
            const subtitle =
              active > 0
                ? `${active} active request${active !== 1 ? "s" : ""} · ${c.visibility === "public" ? "Public" : "Private"}`
                : c.description?.trim() ||
                  `${c.visibility === "public" ? "Public group" : "Private group"}${c.is_admin ? " · You’re admin" : ""}`;

            return (
              <CommunityListRow
                key={c.id}
                id={c.id}
                name={c.name}
                subtitle={subtitle}
                href={`/communities/${c.id}`}
              />
            );
          })}
        </InsetListShell>
      ) : (
        <div className="px-4 py-8">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No groups yet"
            description="Create a group or join a public one below."
            action={
              <Link href="/communities/new" className="text-[15px] font-medium text-[var(--accent)]">
                Create your first group →
              </Link>
            }
          />
        </div>
      )}

      {discover.length > 0 && (
        <div className="mt-6">
          <p className="px-4 pb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--label-tertiary)]">
            Discover
          </p>
          <InsetListShell>
            {discover.map((c) => (
              <CommunityListRowStatic
                key={c.id}
                id={c.id}
                name={c.name}
                subtitle={c.description?.trim() || "Public group · tap Join"}
                trailing={<JoinCommunityButton communityId={c.id} />}
              />
            ))}
          </InsetListShell>
        </div>
      )}

      <div className="hidden lg:block lg:mt-6 lg:px-0">
        <Link href="/communities/new">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            New group
          </Button>
        </Link>
      </div>

      <GroupsCreateFab />
    </div>
  );
}
