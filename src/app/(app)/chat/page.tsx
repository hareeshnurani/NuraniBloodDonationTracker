import Link from "next/link";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

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
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      {threads && threads.length > 0 ? (
        <div className="space-y-2">
          {threads.map((t) => {
            const patientName = (t.blood_requests as { patient_name: string })?.patient_name;
            const otherName =
              t.requester_id === profile.id
                ? (t.donor as { name: string })?.name
                : (t.requester as { name: string })?.name;
            return (
              <Link key={t.id} href={`/chat/${t.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <p className="font-medium">{patientName}</p>
                  <p className="text-sm text-gray-500">Chat with {otherName}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="text-center text-gray-500">
          <p>No conversations yet. Chats open when a donor accepts your request.</p>
        </Card>
      )}
    </div>
  );
}
