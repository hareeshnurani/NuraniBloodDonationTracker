import { notFound, redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequesterDonorThreads } from "@/lib/chat-inbox";
import { ChatDonorListRow } from "@/components/chat/chat-list-row";
import { EmptyState } from "@/components/ui/page-header";
import { InsetListShell, InsetScreenHeader } from "@/components/ui/entity-avatar";
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
    <div className="-mx-4 space-y-0 lg:mx-0">
      <InsetScreenHeader
        backHref="/chat"
        backLabel="Back to chats"
        title={request.patient_name}
        subtitle="Select a donor to message"
      />

      {donorThreads.length > 0 ? (
        <InsetListShell className="lg:rounded-t-none lg:border-t-0">
          {donorThreads.map((d) => (
            <ChatDonorListRow
              key={d.threadId}
              donorId={d.donorId}
              donorName={d.donorName}
              href={`/chat/${d.threadId}`}
            />
          ))}
        </InsetListShell>
      ) : (
        <div className="px-4 py-8">
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
