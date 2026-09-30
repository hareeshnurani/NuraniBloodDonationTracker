import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDonatedHistoryForUser } from "@/lib/profile-history";
import { DonationHistoryList } from "@/components/profile/donation-history-list";
import { ProfileSubpageBack } from "@/components/profile/profile-subpage-back";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Droplets } from "lucide-react";

export default async function ProfileDonationHistoryPage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();
  const entries = await getDonatedHistoryForUser(supabase, profile.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ProfileSubpageBack />
      <PageHeader
        title="Donation history"
        subtitle="Completed donations you confirmed through BloodLink"
      />
      {entries.length > 0 ? (
        <DonationHistoryList entries={entries} />
      ) : (
        <EmptyState
          icon={<Droplets className="h-6 w-6" />}
          title="No donations yet"
          description="When you accept a request and confirm that you donated, it will appear here."
        />
      )}
    </div>
  );
}
