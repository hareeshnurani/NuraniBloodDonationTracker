"use client";

import Link from "next/link";
import { useState } from "react";
import { pinCommunity, unpinCommunity } from "@/lib/actions/communities";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";

export function PinIconButton({
  communityId,
  isPinned,
}: {
  communityId: string;
  isPinned: boolean;
}) {
  const [pinned, setPinned] = useState(isPinned);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    if (pinned) {
      await unpinCommunity(communityId);
      setPinned(false);
    } else {
      await pinCommunity(communityId);
      setPinned(true);
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={pinned ? "Unpin from Home" : "Pin to Home"}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
        pinned
          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
          : "bg-[var(--surface-secondary)] text-[var(--label-secondary)] hover:text-[var(--label)]"
      )}
    >
      <Pin className={cn("h-5 w-5", pinned && "fill-current")} />
    </button>
  );
}

export function CommunityDetailHeader({
  communityId,
  name,
  description,
  visibilityLabel,
  memberCount,
  isMember,
  isPinned,
}: {
  communityId: string;
  name: string;
  description: string | null;
  visibilityLabel: string;
  memberCount: number;
  isMember: boolean;
  isPinned: boolean;
}) {
  return (
    <header className="-mx-4 border-b border-[var(--separator)] bg-[var(--surface)] px-4 pb-4 pt-1 lg:mx-0 lg:rounded-[var(--radius-lg)] lg:border lg:shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-2">
        <Link
          href="/communities"
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--accent)] hover:bg-[var(--surface-secondary)]"
          aria-label="Back to groups"
        >
          <span className="text-[28px] leading-none font-light">‹</span>
        </Link>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[22px] font-semibold tracking-tight text-[var(--label)]">
              {name}
            </h1>
            {isMember && (
              <PinIconButton communityId={communityId} isPinned={isPinned} />
            )}
          </div>
          {description && (
            <p className="mt-1 text-[14px] leading-snug text-[var(--label-secondary)] line-clamp-2">
              {description}
            </p>
          )}
          <p className="mt-2 text-[13px] text-[var(--label-tertiary)]">
            {visibilityLabel} · {memberCount} member{memberCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </header>
  );
}
