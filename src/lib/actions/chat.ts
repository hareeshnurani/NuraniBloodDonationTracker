"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export async function sendMessage(threadId: string, body: string) {
  const profile = await getProfile();
  if (!profile || !body.trim()) return { error: "Invalid message" };

  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("chat_threads")
    .select("status")
    .eq("id", threadId)
    .single();

  if (!thread) return { error: "Conversation not found" };
  if (thread.status === "closed") {
    return { error: "This conversation is closed because the request ended." };
  }

  const { error } = await supabase.from("chat_messages").insert({
    thread_id: threadId,
    sender_id: profile.id,
    body: body.trim(),
  });

  if (error) return { error: error.message };
  revalidatePath("/chat");
  revalidatePath(`/chat/${threadId}`);
  return { success: true };
}

export async function markNotificationRead(notificationId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", profile.id);

  revalidatePath("/notifications");
  return { success: true };
}
