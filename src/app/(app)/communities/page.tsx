import Link from "next/link";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, SectionHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Users, Plus, Globe } from "lucide-react";
import { JoinCommunityButton } from "@/components/communities/join-community-button";

export default async function CommunitiesPage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const [{ data: memberships }, { data: publicCommunities }] = await Promise.all([
    supabase
      .from("community_members")
      .select("community_id, is_admin, communities(id, name, description, visibility)")
      .eq("user_id", profile.id),
    supabase
      .from("communities")
      .select("id, name, description, visibility")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const myCommunities =
    memberships?.map((m) => {
      const c = m.communities as unknown as { id: string; name: string; description: string | null; visibility: string };
      return { ...c, is_admin: m.is_admin };
    }) ?? [];

  const myIds = new Set(myCommunities.map((c) => c.id));

  const discover =
    publicCommunities?.filter((c) => !myIds.has(c.id)) ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Communities"
        subtitle="Join groups to share and respond to blood requests"
        action={
          <Link href="/communities/new">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Create
            </Button>
          </Link>
        }
      />

      <section>
        <SectionHeader title="My Communities" />
        {myCommunities.length > 0 ? (
          <GroupedSection>
            {myCommunities.map((c) => (
              <GroupedRow key={c.id} href={`/communities/${c.id}`} showChevron>
                <GroupedRowIcon color="blue">
                  <Users className="h-4 w-4" />
                </GroupedRowIcon>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-medium text-[var(--label)]">{c.name}</span>
                    {c.is_admin && <Badge>Admin</Badge>}
                  </div>
                  {c.description && (
                    <p className="text-[13px] text-[var(--label-secondary)] mt-0.5 line-clamp-1">
                      {c.description}
                    </p>
                  )}
                </div>
              </GroupedRow>
            ))}
          </GroupedSection>
        ) : (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No communities yet"
            description="Create a community or join a public one below."
            action={
              <Link href="/communities/new">
                <Button>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create community
                </Button>
              </Link>
            }
          />
        )}
      </section>

      {discover.length > 0 && (
        <section>
          <SectionHeader title="Discover Public Communities" />
          <GroupedSection>
            {discover.map((c) => (
              <GroupedRow key={c.id}>
                <GroupedRowIcon color="green">
                  <Globe className="h-4 w-4" />
                </GroupedRowIcon>
                <div className="flex-1 min-w-0">
                  <span className="text-[15px] font-medium text-[var(--label)]">{c.name}</span>
                  {c.description && (
                    <p className="text-[13px] text-[var(--label-secondary)] mt-0.5 line-clamp-1">
                      {c.description}
                    </p>
                  )}
                </div>
                <JoinCommunityButton communityId={c.id} />
              </GroupedRow>
            ))}
          </GroupedSection>
        </section>
      )}
    </div>
  );
}
