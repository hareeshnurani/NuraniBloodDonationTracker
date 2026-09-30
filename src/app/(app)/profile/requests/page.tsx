import Link from "next/link";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestHistoryForUser } from "@/lib/profile-history";
import { RequestHistoryList } from "@/components/profile/request-history-list";
import { ProfileSubpageBack } from "@/components/profile/profile-subpage-back";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus } from "lucide-react";

export default async function ProfileRequestHistoryPage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();
  const requests = await getRequestHistoryForUser(supabase, profile.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ProfileSubpageBack />
      <PageHeader
        title="Request history"
        subtitle="Every blood request you have raised on BloodLink"
      />
      {requests.length > 0 ? (
        <RequestHistoryList requests={requests} />
      ) : (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="No requests yet"
          description="When you create a blood request for a patient, it will show up here."
          action={
            <Link href="/requests/new">
              <Button>
                <Plus className="mr-1.5 h-4 w-4" />
                Create request
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
