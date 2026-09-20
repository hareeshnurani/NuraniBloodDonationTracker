"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ensureDonorChatThread } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function DonorInviteChatButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openChat() {
    setLoading(true);
    setError("");
    const result = await ensureDonorChatThread(requestId);
    if (result.error || !result.threadId) {
      setError(result.error ?? "Could not open chat");
      setLoading(false);
      return;
    }
    router.push(`/chat/${result.threadId}`);
  }

  return (
    <div>
      <Button type="button" variant="secondary" onClick={openChat} disabled={loading}>
        <MessageCircle className="mr-1.5 h-4 w-4" />
        {loading ? "Opening…" : "Message requester before accepting"}
      </Button>
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
