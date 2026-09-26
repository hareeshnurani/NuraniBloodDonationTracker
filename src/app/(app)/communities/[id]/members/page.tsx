import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

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

  function MemberRow({ name, isAdmin }: { name: string; isAdmin: boolean }) {
    return (
      <div className="flex items-center gap-3 border-b border-[var(--separator)] px-4 py-3 last:border-b-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[15px] font-semibold text-[var(--label-secondary)]">
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-medium text-[var(--label)]">{name}</p>
          {isAdmin && (
            <p className="text-[12px] font-medium text-[#5856d6]">Group admin</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 lg:mx-0">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-[var(--separator)] bg-[var(--background)]/95 px-2 py-2 backdrop-blur-md">
        <Link
          href={`/communities/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--accent)] hover:bg-[var(--surface-secondary)]"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-[var(--label)]">Members</p>
          <p className="truncate text-[13px] text-[var(--label-secondary)]">{community.name}</p>
        </div>
        <Badge className="mr-2 shrink-0">{members?.length ?? 0}</Badge>
      </header>

      <div className="bg-[var(--surface)] lg:mt-4 lg:overflow-hidden lg:rounded-[var(--radius-lg)] lg:border lg:border-[var(--separator)]">
        {admins.length > 0 && (
          <>
            <p className="px-4 pb-1 pt-4 text-[12px] font-semibold uppercase tracking-wide text-[var(--label-tertiary)]">
              Admins
            </p>
            {admins.map((m) => {
              const p = m.profiles as unknown as { name: string };
              return <MemberRow key={m.user_id} name={p.name} isAdmin />;
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
              return <MemberRow key={m.user_id} name={p.name} isAdmin={false} />;
            })}
          </>
        )}
      </div>
    </div>
  );
}
