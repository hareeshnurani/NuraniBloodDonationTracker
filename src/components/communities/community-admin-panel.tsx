"use client";

import { useState } from "react";
import { createCommunityInvite, addCommunityMember } from "@/lib/actions/communities";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { GroupedSection } from "@/components/ui/grouped-list";
import { Link2, UserPlus } from "lucide-react";

export function CommunityAdminPanel({
  communityId,
  visibility,
}: {
  communityId: string;
  visibility: string;
}) {
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreateInvite() {
    setInviteLoading(true);
    setMessage("");
    const result = await createCommunityInvite(communityId, 30);
    if (result.error) {
      setMessage(result.error);
    } else if (result.code) {
      setInviteCode(result.code);
      setMessage("Invite link created (valid 30 days)");
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
      setMessage("Member added successfully");
      setEmail("");
      setTimeout(() => window.location.reload(), 1000);
    }
    setAddLoading(false);
  }

  const inviteUrl =
    inviteCode
      ? `${window.location.origin}/communities/join/${inviteCode}`
      : "";

  return (
    <GroupedSection title="Admin Tools">
      <div className="p-4 space-y-4">
        {visibility === "private" && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-[15px] font-medium text-[var(--label)]">Invite link</p>
            </div>
            <Button size="sm" onClick={handleCreateInvite} disabled={inviteLoading}>
              {inviteLoading ? "..." : "Generate invite link"}
            </Button>
            {inviteUrl && (
              <div className="mt-2 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] p-3">
                <p className="text-[13px] text-[var(--label-secondary)] break-all">{inviteUrl}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => navigator.clipboard.writeText(inviteUrl)}
                >
                  Copy link
                </Button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleAddMember}>
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-4 w-4 text-[var(--accent)]" />
            <Label className="!mb-0 normal-case tracking-normal text-[15px] text-[var(--label)]">
              Add member by email
            </Label>
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@email.com"
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={addLoading}>
              {addLoading ? "..." : "Add"}
            </Button>
          </div>
        </form>

        {message && (
          <p className="text-[13px] text-[var(--label-secondary)]">{message}</p>
        )}
      </div>
    </GroupedSection>
  );
}
