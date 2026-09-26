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
  readOnly = false,
  variant = "default",
}: {
  threadId: string;
  messages: ChatMessage[];
  currentUserId: string;
  readOnly?: boolean;
  variant?: "default" | "whatsapp";
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

  const wa = variant === "whatsapp";

  return (
    <div
      className={
        wa
          ? "flex min-h-0 flex-1 flex-col"
          : "flex h-[calc(100dvh-11rem-env(safe-area-inset-bottom))] min-h-[400px] flex-col overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface)] shadow-[var(--shadow-md)] lg:h-[calc(100vh-200px)] lg:min-h-[500px]"
      }
    >
      <div className={`flex-1 space-y-2 overflow-y-auto p-3 ${wa ? "pb-2" : "p-4"}`}>
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
                  className={`max-w-[80%] px-3 py-2 shadow-sm ${
                    isOwn
                      ? wa
                        ? "rounded-[8px] rounded-tr-[2px] bg-[#dcf8c6] text-[#111]"
                        : "rounded-[20px] rounded-br-[6px] bg-[var(--accent)] text-white"
                      : wa
                        ? "rounded-[8px] rounded-tl-[2px] bg-white text-[#111]"
                        : "rounded-[20px] rounded-bl-[6px] bg-[var(--surface-secondary)] text-[var(--label)]"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{msg.body}</p>
                  <time
                    className={`mt-0.5 block text-right text-[11px] ${
                      isOwn
                        ? wa
                          ? "text-[#667781]"
                          : "text-white/60"
                        : "text-[var(--label-tertiary)]"
                    }`}
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
        className={`flex items-center gap-2 border-t p-2 ${
          wa ? "border-[#d1d7db] bg-[#f0f2f5]" : "border-[var(--separator)] bg-[var(--surface-secondary)] p-3"
        }`}
      >
        {readOnly ? (
          <p className="flex-1 text-center text-[14px] text-[var(--label-secondary)]">Messaging is disabled for closed requests.</p>
        ) : (
          <>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          disabled={loading}
          className={`flex-1 rounded-full px-4 py-2.5 text-[15px] text-[var(--label)] placeholder:text-[var(--label-tertiary)] focus:outline-none ${
            wa ? "border border-[#e9edef] bg-white" : "bg-[var(--surface)] focus:ring-2 focus:ring-[var(--accent)]/20"
          } transition-all`}
        />
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all active:scale-95 disabled:opacity-40 ${
            wa ? "bg-[#128C7E]" : "bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
          </>
        )}
      </form>
    </div>
  );
}
