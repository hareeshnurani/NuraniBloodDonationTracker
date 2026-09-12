"use client";

import { useState } from "react";
import { acceptInvitation, rejectInvitation } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";

export function InviteActions({ invitationId }: { invitationId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleAccept() {
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
    <div className="flex gap-3">
      <Button onClick={handleAccept} disabled={loading}>
        {loading ? "..." : "Accept"}
      </Button>
      <Button variant="secondary" onClick={handleReject} disabled={loading}>
        Reject
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
