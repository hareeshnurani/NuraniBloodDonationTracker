"use client";

import { useState } from "react";
import { sendMessage } from "@/lib/actions/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
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
    <div className="flex h-[500px] flex-col rounded-xl border border-gray-200 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  msg.sender_id === currentUserId
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p>{msg.body}</p>
                <time className="mt-1 block text-xs opacity-70">
                  {format(new Date(msg.created_at), "h:mm a")}
                </time>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 p-4">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !body.trim()}>Send</Button>
      </form>
    </div>
  );
}
