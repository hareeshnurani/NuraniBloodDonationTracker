"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MATCH_RADIUS_KM } from "@/lib/constants";
import { X } from "lucide-react";

export function RequestSubmittedBanner({
  notified,
  withinRadius,
  communityNotified,
}: {
  notified: number;
  withinRadius: number;
  communityNotified: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    router.replace(window.location.pathname, { scroll: false });
  }, [router]);

  if (!open) return null;

  const detailParts: string[] = [];
  if (withinRadius > 0) {
    detailParts.push(
      `${withinRadius} available donor${withinRadius !== 1 ? "s" : ""} within ${MATCH_RADIUS_KM} km`
    );
  }
  if (communityNotified > 0) {
    detailParts.push(
      `${communityNotified} community member${communityNotified !== 1 ? "s" : ""} in your groups`
    );
  }

  return (
    <div
      role="status"
      className="relative rounded-[var(--radius-lg)] border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-4 pr-10"
    >
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--label-secondary)] hover:bg-black/5"
        onClick={() => setOpen(false)}
      >
        <X className="h-4 w-4" />
      </button>
      {notified > 0 ? (
        <>
          <p className="text-[15px] font-semibold text-[var(--label)]">
            Your request has been submitted to {notified} user{notified !== 1 ? "s" : ""}.
            Let&apos;s wait for their response.
          </p>
          {detailParts.length > 0 && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--label-secondary)]">
              We notified {detailParts.join(" and ")} (matching blood group, available to donate).
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-[15px] font-semibold text-[var(--label)]">
            Your request is live.
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--label-secondary)]">
            No matching available donors were found within {MATCH_RADIUS_KM} km or in your
            communities yet. Share the appeal link to reach more people.
          </p>
        </>
      )}
    </div>
  );
}

function parseCount(value: string | undefined) {
  if (value === undefined) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function RequestSubmittedBannerFromQuery({
  searchParams,
}: {
  searchParams: { notified?: string; near?: string; community?: string };
}) {
  const notified = parseCount(searchParams.notified);
  if (notified === null) return null;
  const withinRadius = parseCount(searchParams.near) ?? 0;
  const communityNotified = parseCount(searchParams.community) ?? 0;
  return (
    <RequestSubmittedBanner
      notified={notified}
      withinRadius={withinRadius}
      communityNotified={communityNotified}
    />
  );
}
