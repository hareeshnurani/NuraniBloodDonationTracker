"use client";

import { useState } from "react";
import { ensureDonorInvitation, acceptInvitation } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { MATCH_RADIUS_KM } from "@/lib/constants";

export function ActiveRequestActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDistanceConfirm, setShowDistanceConfirm] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  async function handleRespond(skipConfirm = false) {
    setLoading(true);
    setError("");

    const ensured = await ensureDonorInvitation(requestId);
    if (ensured.error) {
      setError(ensured.error);
      setLoading(false);
      return;
    }

    const dist = ensured.distance_km ?? 0;
    setDistanceKm(dist);

    if (dist > MATCH_RADIUS_KM && !skipConfirm) {
      setShowDistanceConfirm(true);
      setLoading(false);
      return;
    }

    const result = await acceptInvitation(ensured.invitationId!);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    window.location.href = `/donor/invites/${ensured.invitationId}`;
  }

  return (
    <div className="space-y-2">
      {showDistanceConfirm && distanceKm !== null && (
        <div className="rounded-[var(--radius-md)] bg-[var(--warning-soft,#fff8e6)] border border-[var(--warning,#f59e0b)] px-3 py-2">
          <p className="text-[13px] font-medium text-[var(--label)]">
            This request is {distanceKm.toFixed(1)} km away (more than {MATCH_RADIUS_KM} km)
          </p>
          <p className="text-[12px] text-[var(--label-secondary)] mt-0.5">
            Are you sure you want to accept?
          </p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => handleRespond(true)} disabled={loading}>
              Yes, accept
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowDistanceConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <Button size="sm" onClick={() => handleRespond()} disabled={loading}>
        {loading ? "..." : "Accept request"}
      </Button>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
