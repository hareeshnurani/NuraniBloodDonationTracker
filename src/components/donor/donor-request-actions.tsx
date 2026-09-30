"use client";

import Link from "next/link";
import { InviteCardActions } from "@/components/donor/invite-card-actions";

export function DonorRequestActions({
  requestId,
  invitationId,
  distanceKm,
  inviteResponse,
  isConfirmed,
  compact = true,
  showDetailsLink = false,
}: {
  requestId: string;
  invitationId: string | null;
  distanceKm: number;
  inviteResponse?: string | null;
  isConfirmed?: boolean;
  compact?: boolean;
  showDetailsLink?: boolean;
}) {
  if (inviteResponse === "rejected") {
    return (
      <p className="text-[13px] text-[var(--label-secondary)]">
        You declined this request.
      </p>
    );
  }

  if (isConfirmed || inviteResponse === "accepted") {
    return (
      <div className="space-y-2">
        <p className="text-[13px] font-medium text-[var(--success)]">You accepted this request.</p>
        {invitationId && (
          <Link
            href={`/donor/invites/${invitationId}`}
            className="inline-block text-[13px] font-medium text-[var(--accent)] hover:underline"
          >
            Open invite &amp; chat →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <InviteCardActions
        invitationId={invitationId}
        requestId={requestId}
        distanceKm={distanceKm}
        compact={compact}
      />
      {showDetailsLink && (
        <Link
          href={`/requests/${requestId}`}
          className="block text-center text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          View hospital &amp; request details
        </Link>
      )}
    </div>
  );
}
