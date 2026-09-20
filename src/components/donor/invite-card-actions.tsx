"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  acceptInvitation,
  rejectInvitation,
  ensureDonorChatThread,
} from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { MATCH_RADIUS_KM } from "@/lib/constants";
import { MessageCircle, X, Check } from "lucide-react";

export function InviteCardActions({
  invitationId,
  requestId,
  distanceKm,
  compact = false,
}: {
  invitationId: string;
  requestId: string;
  distanceKm: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | "chat" | null>(null);
  const [error, setError] = useState("");
  const [showDistanceConfirm, setShowDistanceConfirm] = useState(false);

  const isFarAway = distanceKm > MATCH_RADIUS_KM;

  async function handleAccept(skipConfirm = false) {
    if (isFarAway && !skipConfirm) {
      setShowDistanceConfirm(true);
      return;
    }
    setLoading("accept");
    setError("");
    const result = await acceptInvitation(invitationId);
    if (result.error) {
      setError(result.error);
      setLoading(null);
      return;
    }
    router.refresh();
    router.push(`/donor/invites/${invitationId}`);
  }

  async function handleReject() {
    setLoading("reject");
    await rejectInvitation(invitationId);
    router.refresh();
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
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
