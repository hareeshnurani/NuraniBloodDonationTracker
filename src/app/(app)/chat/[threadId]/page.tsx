import { notFound } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChatBox } from "@/components/chat/chat-box";
import { ReportThreadButton } from "@/components/chat/report-thread-button";
import { InsetScreenHeader } from "@/components/ui/entity-avatar";

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
    .select(
      "*, blood_requests(patient_name, status), requester:requester_id(name), donor:donor_id(name)"
    )
    .eq("id", threadId)
    .or(`requester_id.eq.${profile.id},donor_id.eq.${profile.id}`)
    .single();

  if (!thread) notFound();

  const req = thread.blood_requests as unknown as { patient_name: string; status: string };
  if (!["open", "partially_filled"].includes(req.status)) {
    notFound();
  }

  const isRequester = thread.requester_id === profile.id;

  if (!isRequester) {
    const { data: inv } = await supabase
      .from("donor_invitations")
      .select("donation_confirmations(status)")
      .eq("request_id", thread.request_id)
      .eq("donor_id", profile.id)
      .eq("is_confirmed", true)
      .maybeSingle();
    const dc = inv?.donation_confirmations as { status: string } | { status: string }[] | null;
    const row = Array.isArray(dc) ? dc[0] : dc;
    if (row?.status === "donated") notFound();
  }

  const otherName = isRequester
    ? (thread.donor as { name: string })?.name
    : (thread.requester as { name: string })?.name;

  const backHref = isRequester ? `/chat/request/${thread.request_id}` : "/chat";

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return (
    <div className="-mx-4 flex min-h-[calc(100dvh-8rem)] flex-col lg:mx-0 lg:min-h-[600px]">
      <InsetScreenHeader
        backHref={backHref}
        backLabel="Back"
        title={req.patient_name}
        subtitle={otherName ?? "Chat"}
        trailing={<ReportThreadButton threadId={threadId} variant="header" />}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:rounded-b-[var(--radius-lg)] lg:border lg:border-t-0 lg:border-[var(--separator)]">
        <ChatBox
          threadId={threadId}
          messages={messages ?? []}
          currentUserId={profile.id}
          readOnly={false}
          variant="embedded"
        />
      </div>
    </div>
  );
}
