import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequesterDonorThreads } from "@/lib/chat-inbox";
import { ChatDonorListRow } from "@/components/chat/chat-list-row";
import { EmptyState } from "@/components/ui/page-header";
import { MessageCircle } from "lucide-react";

export default async function ChatRequestHubPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("blood_requests")
    .select("id, patient_name, requester_id, status")
    .eq("id", requestId)
    .single();

  if (!request) notFound();

  const isRequester = request.requester_id === profile.id;

  const { data: donorThread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("request_id", requestId)
    .eq("donor_id", profile.id)
    .maybeSingle();

  if (!isRequester && donorThread) {
    redirect(`/chat/${donorThread.id}`);
  }

  if (!isRequester && !donorThread) {
    notFound();
  }

  if (!["open", "partially_filled"].includes(request.status)) {
    redirect("/chat");
  }

  const donorThreads = await getRequesterDonorThreads(supabase, requestId, profile.id);

  return (
    <div className="-mx-4 space-y-4 lg:mx-0">
      <header className="flex items-center gap-2 border-b border-[var(--separator)] bg-[var(--surface)] px-2 py-2 lg:rounded-t-[var(--radius-lg)]">
        <Link
          href="/chat"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--accent)] hover:bg-[var(--surface-secondary)]"
          aria-label="Back to chats"
        >
          <span className="text-[28px] leading-none font-light">‹</span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-[var(--label)]">{request.patient_name}</p>
          <p className="text-[13px] text-[var(--label-secondary)]">Select a donor to message</p>
        </div>
      </header>

      {donorThreads.length > 0 ? (
        <div className="bg-[var(--surface)] lg:overflow-hidden lg:rounded-b-[var(--radius-lg)] lg:border lg:border-t-0 lg:border-[var(--separator)]">
          {donorThreads.map((d) => (
            <ChatDonorListRow key={d.threadId} donorName={d.donorName} href={`/chat/${d.threadId}`} />
          ))}
        </div>
      ) : (
        <div className="px-4">
          <EmptyState
            icon={<MessageCircle className="h-6 w-6" />}
            title="No donor chats yet"
            description="When a donor accepts this request, you can message them here."
          />
        </div>
      )}
    </div>
  );
}
