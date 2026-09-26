import { notFound } from "next/navigation";
import Link from "next/link";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChatBox } from "@/components/chat/chat-box";
import { ReportThreadButton } from "@/components/chat/report-thread-button";

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
  const threadClosed = thread.status === "closed";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/chat" className="text-sm text-red-600 hover:underline">← Back to messages</Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-900">Chat — {patientName}</h1>
        <ReportThreadButton threadId={threadId} />
      </div>
      {threadClosed && (
        <p className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
          This chat is closed because the blood request ended.
        </p>
      )}
      <ChatBox
        threadId={threadId}
        messages={messages ?? []}
        currentUserId={profile.id}
        readOnly={threadClosed}
      />
    </div>
  );
}
