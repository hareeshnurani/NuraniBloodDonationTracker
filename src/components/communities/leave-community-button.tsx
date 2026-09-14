"use client";

import { useState } from "react";
import { leaveCommunity } from "@/lib/actions/communities";
import { Button } from "@/components/ui/button";

export function LeaveCommunityButton({ communityId }: { communityId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this community?")) return;
    setLoading(true);
    const result = await leaveCommunity(communityId);
    if (result.success) {
      window.location.href = "/communities";
    } else {
      alert(result.error);
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="secondary" onClick={handleLeave} disabled={loading}>
      {loading ? "..." : "Leave"}
    </Button>
  );
}
