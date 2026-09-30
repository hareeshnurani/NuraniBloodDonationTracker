"use client";

import { useState } from "react";
import { sendMessage } from "@/lib/actions/chat";
import { format } from "date-fns";
import { Send } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ChatBox({
  threadId,
  messages,
  currentUserId,
  readOnly = false,
  variant = "default",
}: {
  threadId: string;
  messages: ChatMessage[];
  currentUserId: string;
  readOnly?: boolean;
  variant?: "default" | "embedded";
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

  const embedded = variant === "embedded";

  return (
    <div
      className={
        embedded
          ? "flex min-h-0 flex-1 flex-col"
          : "flex h-[calc(100dvh-11rem-env(safe-area-inset-bottom))] min-h-[400px] flex-col overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface)] shadow-[var(--shadow-md)] lg:h-[calc(100vh-200px)] lg:min-h-[500px]"
      }
    >
      <div
        className={cn(
          "flex-1 space-y-2 overflow-y-auto p-3",
          embedded ? "bg-[var(--background)] pb-2" : "p-4"
        )}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[15px] text-[var(--label-tertiary)]">
              No messages yet. Start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={cn(
                    "max-w-[80%] px-3.5 py-2 shadow-[var(--shadow-sm)]",
                    isOwn
                      ? "rounded-[18px] rounded-br-[6px] bg-[var(--accent)] text-white"
                      : "rounded-[18px] rounded-bl-[6px] border border-[var(--separator)] bg-[var(--surface)] text-[var(--label)]"
                  )}
                >
                  <p className="text-[15px] leading-relaxed">{msg.body}</p>
                  <time
                    className={cn(
                      "mt-0.5 block text-right text-[11px]",
                      isOwn ? "text-white/70" : "text-[var(--label-tertiary)]"
                    )}
                  >
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
        className="flex items-center gap-2 border-t border-[var(--separator)] bg-[var(--surface-secondary)] p-2.5 lg:p-3"
      >
        {readOnly ? (
          <p className="flex-1 text-center text-[14px] text-[var(--label-secondary)]">
            Messaging is disabled for closed requests.
          </p>
        ) : (
          <>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Message"
              disabled={loading}
              className="flex-1 rounded-full border border-[var(--separator)] bg-[var(--surface)] px-4 py-2.5 text-[15px] text-[var(--label)] placeholder:text-[var(--label-tertiary)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25"
            />
            <button
              type="submit"
              disabled={loading || !body.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-all hover:bg-[var(--accent-hover)] active:scale-95 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </>
        )}
      </form>
    </div>
  );
}
