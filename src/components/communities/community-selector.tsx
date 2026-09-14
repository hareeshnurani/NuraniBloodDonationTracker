"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Community } from "@/lib/types";
import { Users } from "lucide-react";

export function CommunitySelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id, communities(*)")
        .eq("user_id", user.id);

      const list =
        memberships?.map((m) => m.communities as unknown as Community).filter(Boolean) ?? [];
      setCommunities(list);
      setLoading(false);
    }
    load();
  }, []);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  if (loading) return null;
  if (communities.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] bg-[var(--surface-secondary)] p-4">
        <p className="text-[14px] text-[var(--label-secondary)]">
          Join or create a community to also share requests with your group. Requests always appear on the public wall too.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[13px] text-[var(--label-secondary)]">
        Optionally share with communities you belong to. All community members can respond regardless of distance.
      </p>
      <div className="space-y-1.5">
        {communities.map((c) => (
          <label
            key={c.id}
            className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] px-3 py-2.5 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(c.id)}
              onChange={() => toggle(c.id)}
              className="h-4 w-4 rounded border-gray-300 text-[var(--accent)]"
            />
            <Users className="h-4 w-4 text-[var(--label-tertiary)] shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[15px] font-medium text-[var(--label)]">{c.name}</span>
              <span className="ml-2 text-[12px] text-[var(--label-tertiary)] capitalize">
                {c.visibility}
              </span>
            </div>
          </label>
        ))}
      </div>
      {selected.map((id) => (
        <input key={id} type="hidden" name="community_ids" value={id} />
      ))}
    </div>
  );
}
