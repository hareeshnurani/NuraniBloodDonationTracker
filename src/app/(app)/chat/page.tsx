import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { MessageCircle } from "lucide-react";

export default async function ChatListPage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const { data: threads } = await supabase
    .from("chat_threads")
    .select("*, blood_requests(patient_name), requester:requester_id(name), donor:donor_id(name)")
    .or(`requester_id.eq.${profile.id},donor_id.eq.${profile.id}`)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" subtitle="Coordinate with donors and requesters" />
      {threads && threads.length > 0 ? (
        <GroupedSection>
          {threads.map((t) => {
            const patientName = (t.blood_requests as { patient_name: string })?.patient_name;
            const otherName =
              t.requester_id === profile.id
                ? (t.donor as { name: string })?.name
                : (t.requester as { name: string })?.name;
            return (
              <GroupedRow key={t.id} href={`/chat/${t.id}`} showChevron>
                <GroupedRowIcon color="blue">
                  <MessageCircle className="h-4 w-4" />
                </GroupedRowIcon>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[var(--label)]">{patientName}</p>
                  <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">
                    Chat with {otherName}
                  </p>
                </div>
              </GroupedRow>
            );
          })}
        </GroupedSection>
      ) : (
        <EmptyState
          icon={<MessageCircle className="h-6 w-6" />}
          title="No conversations yet"
          description="Chats open when a donor accepts your request or you accept an invite."
        />
      )}
    </div>
  );
}
