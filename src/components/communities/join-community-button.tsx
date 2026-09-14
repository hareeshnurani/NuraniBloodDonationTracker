"use client";

import { useState } from "react";
import { joinCommunity } from "@/lib/actions/communities";
import { Button } from "@/components/ui/button";

export function JoinCommunityButton({ communityId }: { communityId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    const result = await joinCommunity(communityId);
    if (result.success) {
      window.location.href = `/communities/${communityId}`;
    } else {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleJoin} disabled={loading}>
      {loading ? "..." : "Join"}
    </Button>
  );
}
