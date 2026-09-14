"use client";

import { useState } from "react";
import { pinCommunity, unpinCommunity } from "@/lib/actions/communities";
import { Button } from "@/components/ui/button";
import { Pin } from "lucide-react";

export function PinButton({ communityId, isPinned }: { communityId: string; isPinned: boolean }) {
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
    <Button size="sm" variant="secondary" onClick={toggle} disabled={loading}>
      <Pin className={`h-3.5 w-3.5 mr-1 ${pinned ? "text-[var(--accent)]" : ""}`} />
      {pinned ? "Pinned" : "Pin"}
    </Button>
  );
}
