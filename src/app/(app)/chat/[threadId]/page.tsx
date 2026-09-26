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
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--separator)] bg-[#128C7E] px-2 py-2 text-white lg:rounded-t-[var(--radius-lg)]">
        <Link
          href={backHref}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Back"
        >
          <span className="text-[28px] leading-none font-light">‹</span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold">{req.patient_name}</p>
          <p className="truncate text-[13px] text-white/85">{otherName ?? "Chat"}</p>
        </div>
        <ReportThreadButton threadId={threadId} variant="onDark" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-[#e5ddd5] dark:bg-[var(--background)]">
        <ChatBox
          threadId={threadId}
          messages={messages ?? []}
          currentUserId={profile.id}
          readOnly={false}
          variant="whatsapp"
        />
      </div>
    </div>
  );
}
