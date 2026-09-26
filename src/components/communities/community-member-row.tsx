"use client";

import { useState } from "react";
import { setCommunityAdmin } from "@/lib/actions/communities";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Button } from "@/components/ui/button";
import { ShieldPlus } from "lucide-react";

export function CommunityMemberRow({
  communityId,
  userId,
  name,
  isAdmin,
  canManageRoles,
  isSelf,
}: {
  communityId: string;
  userId: string;
  name: string;
  isAdmin: boolean;
  canManageRoles: boolean;
  isSelf: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function makeAdmin() {
    if (
      !confirm(
        `Make ${name} a group admin? They will be able to manage members, invites, and group settings.`
      )
    ) {
      return;
    }
    setLoading(true);
    setMessage("");
    const result = await setCommunityAdmin(communityId, userId, true);
    if (result.error) {
      setMessage(result.error);
      setLoading(false);
      return;
    }
    window.location.reload();
  }

  const showMakeAdmin = canManageRoles && !isAdmin && !isSelf;

  return (
    <div className="flex items-center gap-3 border-b border-[var(--separator)] px-4 py-3 last:border-b-0">
      <EntityAvatar id={userId} name={name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium text-[var(--label)]">
          {name}
          {isSelf && (
            <span className="ml-1.5 text-[13px] font-normal text-[var(--label-secondary)]">(You)</span>
          )}
        </p>
        {isAdmin && <p className="text-[12px] font-medium text-[var(--accent)]">Group admin</p>}
        {message && <p className="mt-0.5 text-[12px] text-[var(--accent)]">{message}</p>}
      </div>
      {showMakeAdmin && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={makeAdmin}
          className="shrink-0 gap-1"
        >
          <ShieldPlus className="h-3.5 w-3.5" />
          {loading ? "…" : "Make admin"}
        </Button>
      )}
    </div>
  );
}
