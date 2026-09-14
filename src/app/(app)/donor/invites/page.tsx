import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { PRIORITY_LABELS } from "@/lib/constants";
import { formatDistance } from "@/lib/utils";
import { Heart } from "lucide-react";

export default async function DonorInvitesPage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const { data: invites } = await supabase
    .from("donor_invitations")
    .select("*, blood_requests(*)")
    .eq("donor_id", profile.id)
    .order("created_at", { ascending: false });

  const pendingCount = invites?.filter((i) => i.response === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donor Invitations"
        subtitle={pendingCount > 0 ? `${pendingCount} pending response${pendingCount > 1 ? "s" : ""}` : "All caught up"}
      />
      {invites && invites.length > 0 ? (
        <GroupedSection>
          {invites.map((inv) => {
            const req = inv.blood_requests as {
              patient_name: string;
              primary_blood_group: string;
              priority: string;
              status: string;
            };
            return (
              <GroupedRow key={inv.id} href={`/donor/invites/${inv.id}`} showChevron>
                <GroupedRowIcon color={inv.response === "pending" ? "red" : "gray"}>
                  <Heart className="h-4 w-4" />
                </GroupedRowIcon>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-medium text-[var(--label)]">{req.patient_name}</span>
                    {inv.is_replacement_match && (
                      <Badge variant="replacement">Replacement</Badge>
                    )}
                    <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                      {PRIORITY_LABELS[req.priority]}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">
                    {req.primary_blood_group} · {formatDistance(inv.distance_km)} ·{" "}
                    <span className="capitalize">{inv.response}</span>
                  </p>
                </div>
              </GroupedRow>
            );
          })}
        </GroupedSection>
      ) : (
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="No invitations yet"
          description="When a patient needs blood near you, you'll receive an invitation here."
        />
      )}
    </div>
  );
}
