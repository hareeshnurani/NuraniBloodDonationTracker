"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  acceptInvitation,
  rejectInvitation,
  ensureDonorChatThread,
  ensureDonorInvitation,
} from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { MATCH_RADIUS_KM } from "@/lib/constants";
import { MessageCircle, X, Check } from "lucide-react";

export function InviteCardActions({
  invitationId: initialInvitationId,
  requestId,
  distanceKm: initialDistanceKm,
  compact = false,
}: {
  invitationId: string | null;
  requestId: string;
  distanceKm: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [invitationId, setInvitationId] = useState(initialInvitationId);
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm);
  const [loading, setLoading] = useState<"accept" | "reject" | "chat" | null>(null);
  const [error, setError] = useState("");
  const [showDistanceConfirm, setShowDistanceConfirm] = useState(false);

  const isFarAway = distanceKm > MATCH_RADIUS_KM;

  async function resolveInvitationId() {
    if (invitationId) return invitationId;
    const ensured = await ensureDonorInvitation(requestId);
    if (ensured.error || !ensured.invitationId) {
      setError(ensured.error ?? "Could not respond to this request");
      return null;
    }
    setInvitationId(ensured.invitationId);
    setDistanceKm(ensured.distance_km ?? distanceKm);
    return ensured.invitationId;
  }

  async function handleAccept(skipConfirm = false) {
    if (isFarAway && !skipConfirm) {
      setShowDistanceConfirm(true);
      return;
    }
    setLoading("accept");
    setError("");
    const id = await resolveInvitationId();
    if (!id) {
      setLoading(null);
      return;
    }
    const result = await acceptInvitation(id);
    if (result.error) {
      setError(result.error);
      setLoading(null);
      return;
    }
    router.refresh();
    router.push(`/donor/invites/${id}`);
  }

  async function handleReject() {
    setLoading("reject");
    setError("");
    const id = await resolveInvitationId();
    if (!id) {
      setLoading(null);
      return;
    }
    await rejectInvitation(id);
    router.refresh();
    setLoading(null);
  }

  async function handleChat() {
    setLoading("chat");
    setError("");
    const result = await ensureDonorChatThread(requestId);
    if (result.error || !result.threadId) {
      setError(result.error ?? "Could not open chat");
      setLoading(null);
      return;
    }
    router.push(`/chat/${result.threadId}`);
  }

  const btnClass = compact ? "flex-1 min-w-0" : "";

  return (
    <div className="space-y-2">
      {showDistanceConfirm && (
        <div className="rounded-[var(--radius-md)] border border-[var(--warning)] bg-[var(--warning-soft,#fff8e6)] px-3 py-2.5">
          <p className="text-[13px] font-medium text-[var(--label)]">
            Hospital is {distanceKm.toFixed(1)} km away (over {MATCH_RADIUS_KM} km)
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => handleAccept(true)} disabled={!!loading}>
              Yes, I can help
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowDistanceConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={btnClass}
          disabled={!!loading}
          onClick={handleReject}
        >
          <X className="mr-1 h-3.5 w-3.5 shrink-0" />
          Decline
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={btnClass}
          disabled={!!loading}
          onClick={handleChat}
        >
          <MessageCircle className="mr-1 h-3.5 w-3.5 shrink-0" />
          {loading === "chat" ? "…" : "Chat"}
        </Button>
        <Button
          type="button"
          size="sm"
          className={btnClass}
          disabled={!!loading}
          onClick={() => handleAccept()}
        >
          <Check className="mr-1 h-3.5 w-3.5 shrink-0" />
          {loading === "accept" ? "…" : "Accept"}
        </Button>
      </div>
      {error && <p className="text-[12px] text-[var(--accent)]">{error}</p>}
    </div>
  );
}
