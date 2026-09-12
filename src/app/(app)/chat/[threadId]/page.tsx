import { notFound } from "next/navigation";
import Link from "next/link";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChatBox } from "@/components/chat/chat-box";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("chat_threads")
    .select("*, blood_requests(patient_name)")
    .eq("id", threadId)
    .or(`requester_id.eq.${profile.id},donor_id.eq.${profile.id}`)
    .single();

  if (!thread) notFound();

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const patientName = (thread.blood_requests as { patient_name: string })?.patient_name;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/chat" className="text-sm text-red-600 hover:underline">← Back to messages</Link>
      <h1 className="text-xl font-bold text-gray-900">Chat — {patientName}</h1>
      <ChatBox
        threadId={threadId}
        messages={messages ?? []}
        currentUserId={profile.id}
      />
    </div>
  );
}
