import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getChatRequestInbox } from "@/lib/chat-inbox";
import { ChatRequestListRow } from "@/components/chat/chat-list-row";
import { EmptyState } from "@/components/ui/page-header";
import { MessageCircle } from "lucide-react";

export default async function ChatListPage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const inbox = await getChatRequestInbox(supabase, profile.id);

  return (
    <div className="-mx-4 min-h-[50vh] lg:mx-0">
      {inbox.length > 0 ? (
        <div className="bg-[var(--surface)] lg:overflow-hidden lg:rounded-[var(--radius-lg)] lg:border lg:border-[var(--separator)]">
          {inbox.map((item) => (
            <ChatRequestListRow
              key={item.requestId}
              requestId={item.requestId}
              patientName={item.patientName}
              subtitle={
                item.role === "requester" && item.threadCount > 1
                  ? `${item.threadCount} donors`
                  : undefined
              }
              href={`/chat/request/${item.requestId}`}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-10">
          <EmptyState
            icon={<MessageCircle className="h-6 w-6" />}
            title="No chats yet"
            description="Chats appear when a donor accepts your request, or when you accept a donation invite."
          />
        </div>
      )}
    </div>
  );
}
