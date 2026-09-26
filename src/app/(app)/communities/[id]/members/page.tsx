import { notFound } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/card";
import { EntityAvatar, InsetListShell, InsetScreenHeader } from "@/components/ui/entity-avatar";
import { cn } from "@/lib/utils";

export default async function CommunityMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const { data: community } = await supabase
    .from("communities")
    .select("name, visibility")
    .eq("id", id)
    .single();

  if (!community) notFound();

  const { data: membership } = await supabase
    .from("community_members")
    .select("is_admin")
    .eq("community_id", id)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!membership && community.visibility === "private" && profile.role !== "admin") {
    notFound();
  }

  const { data: members } = await supabase
    .from("community_members")
    .select("user_id, is_admin, joined_at, profiles(name)")
    .eq("community_id", id)
    .order("joined_at", { ascending: true });

  const admins = members?.filter((m) => m.is_admin) ?? [];
  const others = members?.filter((m) => !m.is_admin) ?? [];

  function MemberRow({ userId, name, isAdmin }: { userId: string; name: string; isAdmin: boolean }) {
    return (
      <div className="flex items-center gap-3 border-b border-[var(--separator)] px-4 py-3 last:border-b-0">
        <EntityAvatar id={userId} name={name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-medium text-[var(--label)]">{name}</p>
          {isAdmin && (
            <p className="text-[12px] font-medium text-[var(--accent)]">Group admin</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 lg:mx-0">
      <InsetScreenHeader
        backHref={`/communities/${id}`}
        backLabel="Back to group"
        title="Members"
        subtitle={community.name}
        trailing={<Badge className="mr-2 shrink-0">{members?.length ?? 0}</Badge>}
      />

      <InsetListShell className="lg:rounded-t-none lg:border-t-0">
        {admins.length > 0 && (
          <>
            <p className="px-4 pb-1 pt-4 text-[12px] font-semibold uppercase tracking-wide text-[var(--label-tertiary)]">
              Admins
            </p>
            {admins.map((m) => {
              const p = m.profiles as unknown as { name: string };
              return <MemberRow key={m.user_id} userId={m.user_id} name={p.name} isAdmin />;
            })}
          </>
        )}
        {others.length > 0 && (
          <>
            <p
              className={cn(
                "px-4 pb-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--label-tertiary)]",
                admins.length > 0 ? "pt-4" : "pt-4"
              )}
            >
              {admins.length > 0 ? "Members" : "Everyone"}
            </p>
            {others.map((m) => {
              const p = m.profiles as unknown as { name: string };
              return <MemberRow key={m.user_id} userId={m.user_id} name={p.name} isAdmin={false} />;
            })}
          </>
        )}
      </InsetListShell>
    </div>
  );
}
