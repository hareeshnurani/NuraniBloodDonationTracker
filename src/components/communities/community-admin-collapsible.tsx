"use client";

import { useState } from "react";
import { createCommunityInvite, addCommunityMember } from "@/lib/actions/communities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Link2, Settings2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommunityAdminCollapsible({
  communityId,
  visibility,
}: {
  communityId: string;
  visibility: string;
}) {
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreateInvite() {
    setInviteLoading(true);
    setMessage("");
    const result = await createCommunityInvite(communityId, 30);
    if (result.error) setMessage(result.error);
    else if (result.code) {
      setInviteCode(result.code);
      setMessage("Invite link ready (30 days)");
    }
    setInviteLoading(false);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setMessage("");
    const result = await addCommunityMember(communityId, email);
    if (result.error) setMessage(result.error);
    else {
      setMessage("Member added");
      setEmail("");
      setTimeout(() => window.location.reload(), 800);
    }
    setAddLoading(false);
  }

  const inviteUrl = inviteCode ? `${window.location.origin}/communities/join/${inviteCode}` : "";

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--separator)] bg-[var(--surface)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--surface-secondary)]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Settings2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-medium text-[var(--label)]">Manage group</p>
          <p className="text-[13px] text-[var(--label-secondary)]">Invites & members (admin)</p>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-[var(--label-tertiary)]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[var(--label-tertiary)]" />
        )}
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-[var(--separator)] px-4 py-4">
            {visibility === "private" && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-[14px] font-medium text-[var(--label)]">
                  <Link2 className="h-4 w-4 text-[var(--accent)]" />
                  Invite link
                </div>
                <Button size="sm" onClick={handleCreateInvite} disabled={inviteLoading}>
                  {inviteLoading ? "…" : "Generate link"}
                </Button>
                {inviteUrl && (
                  <div className="mt-2 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] p-3">
                    <p className="break-all text-[12px] text-[var(--label-secondary)]">{inviteUrl}</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-2"
                      onClick={() => navigator.clipboard.writeText(inviteUrl)}
                    >
                      Copy
                    </Button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-2">
              <div className="flex items-center gap-2 text-[14px] font-medium text-[var(--label)]">
                <UserPlus className="h-4 w-4 text-[var(--accent)]" />
                Add by email
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={addLoading}>
                  {addLoading ? "…" : "Add"}
                </Button>
              </div>
            </form>

            {message && <p className="text-[13px] text-[var(--label-secondary)]">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
