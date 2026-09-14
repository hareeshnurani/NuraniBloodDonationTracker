"use client";

import { useState } from "react";
import { sendMessage } from "@/lib/actions/chat";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Send } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

export function ChatBox({
  threadId,
  messages,
  currentUserId,
}: {
  threadId: string;
  messages: ChatMessage[];
  currentUserId: string;
}) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    await sendMessage(threadId, body);
    setBody("");
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="flex h-[calc(100dvh-11rem-env(safe-area-inset-bottom))] min-h-[400px] flex-col rounded-[var(--radius-xl)] bg-[var(--surface)] shadow-[var(--shadow-md)] overflow-hidden lg:h-[calc(100vh-200px)] lg:min-h-[500px]">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[15px] text-[var(--label-tertiary)]">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 ${
                    isOwn
                      ? "bg-[var(--accent)] text-white rounded-[20px] rounded-br-[6px]"
                      : "bg-[var(--surface-secondary)] text-[var(--label)] rounded-[20px] rounded-bl-[6px]"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{msg.body}</p>
                  <time className={`mt-1 block text-[11px] ${isOwn ? "text-white/60" : "text-[var(--label-tertiary)]"}`}>
                    {format(new Date(msg.created_at), "h:mm a")}
                  </time>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-[var(--separator)] bg-[var(--surface-secondary)] p-3"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          disabled={loading}
          className="flex-1 rounded-full bg-[var(--surface)] px-4 py-2.5 text-[15px] text-[var(--label)] placeholder:text-[var(--label-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-all hover:bg-[var(--accent-hover)] active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
