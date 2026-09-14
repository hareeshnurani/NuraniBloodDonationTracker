"use client";

import { useState } from "react";
import { acceptInvitation, rejectInvitation } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { MATCH_RADIUS_KM } from "@/lib/constants";

export function InviteActions({
  invitationId,
  distanceKm,
}: {
  invitationId: string;
  distanceKm?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showDistanceConfirm, setShowDistanceConfirm] = useState(false);

  const isFarAway = distanceKm !== undefined && distanceKm > MATCH_RADIUS_KM;

  async function handleAccept(skipConfirm = false) {
    if (isFarAway && !skipConfirm) {
      setShowDistanceConfirm(true);
      return;
    }

    setLoading(true);
    setError("");
    const result = await acceptInvitation(invitationId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
    setTimeout(() => window.location.href = "/home", 1500);
  }

  async function handleReject() {
    setLoading(true);
    await rejectInvitation(invitationId);
    window.location.href = "/donor/invites";
  }

  if (success) {
    return <p className="text-green-600 font-medium">Accepted! You can now chat with the requester.</p>;
  }

  return (
    <div className="space-y-3">
      {showDistanceConfirm && (
        <div className="rounded-[var(--radius-md)] bg-[var(--warning-soft,#fff8e6)] border border-[var(--warning,#f59e0b)] px-4 py-3">
          <p className="text-[14px] font-medium text-[var(--label)]">
            This request is more than {MATCH_RADIUS_KM} km away
          </p>
          <p className="text-[13px] text-[var(--label-secondary)] mt-1">
            The hospital is approximately {distanceKm?.toFixed(1)} km from your location. Are you sure you want to accept?
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => handleAccept(true)} disabled={loading}>
              Yes, I can help
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowDistanceConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={() => handleAccept()} disabled={loading}>
          {loading ? "..." : "Accept"}
        </Button>
        <Button variant="secondary" onClick={handleReject} disabled={loading}>
          Reject
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
