"use client";

import Link from "next/link";
import { useState } from "react";
import { leaveCommunity } from "@/lib/actions/communities";
import { submitContentReport } from "@/lib/actions/reports";
import { ChevronRight, Flag, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommunityMembersEntry({
  communityId,
  memberCount,
}: {
  communityId: string;
  memberCount: number;
}) {
  return (
    <Link
      href={`/communities/${communityId}/members`}
      className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--separator)] bg-[var(--surface)] px-4 py-3.5 transition-colors hover:bg-[var(--surface-secondary)] active:bg-[var(--surface-secondary)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        <Users className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-medium text-[var(--label)]">Members</p>
        <p className="text-[13px] text-[var(--label-secondary)]">
          {memberCount} participant{memberCount !== 1 ? "s" : ""} · tap to view
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-[var(--label-tertiary)]" />
    </Link>
  );
}

export function CommunityBottomActions({ communityId }: { communityId: string }) {
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  async function handleLeave() {
    if (!confirm("Leave this group? You can rejoin with an invite if it is private.")) return;
    setLeaveLoading(true);
    const result = await leaveCommunity(communityId);
    if (result.success) window.location.href = "/communities";
    else {
      alert(result.error);
      setLeaveLoading(false);
    }
  }

  async function handleReport() {
    const details = prompt("Why are you reporting this group?");
    if (details === null) return;
    setReportLoading(true);
    const result = await submitContentReport("community", communityId, "spam", details);
    setReportLoading(false);
    if (result.error) alert(result.error);
    else alert("Report submitted.");
  }

  return (
    <div className="space-y-2 pt-2">
      <button
        type="button"
        onClick={handleReport}
        disabled={reportLoading}
        className="flex w-full items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3.5 text-left text-[16px] font-medium text-[var(--label-secondary)] transition-colors hover:bg-[var(--surface-secondary)]"
      >
        <Flag className="h-5 w-5 shrink-0" />
        Report group
      </button>
      <button
        type="button"
        onClick={handleLeave}
        disabled={leaveLoading}
        className={cn(
          "flex w-full items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3.5 text-left text-[16px] font-medium",
          "text-[var(--warning)] transition-colors hover:bg-[var(--warning-soft)] active:bg-[var(--warning-soft)]"
        )}
      >
        <LogOut className="h-5 w-5 shrink-0" />
        {leaveLoading ? "Leaving…" : "Exit group"}
      </button>
    </div>
  );
}
