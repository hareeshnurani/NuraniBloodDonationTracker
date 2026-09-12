import Link from "next/link";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/card";
import { PRIORITY_LABELS } from "@/lib/constants";
import { formatDistance } from "@/lib/utils";

export default async function DonorInvitesPage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const { data: invites } = await supabase
    .from("donor_invitations")
    .select("*, blood_requests(*)")
    .eq("donor_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Donor invitations</h1>
      {invites && invites.length > 0 ? (
        <div className="space-y-3">
          {invites.map((inv) => {
            const req = inv.blood_requests as {
              patient_name: string;
              primary_blood_group: string;
              priority: string;
              status: string;
            };
            return (
              <Link key={inv.id} href={`/donor/invites/${inv.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{req.patient_name}</span>
                        {inv.is_replacement_match && (
                          <Badge variant="replacement">Replacement donor</Badge>
                        )}
                        <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                          {PRIORITY_LABELS[req.priority]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {req.primary_blood_group} · {formatDistance(inv.distance_km)} · {inv.response}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="text-center text-gray-500">
          <p>No invitations yet.</p>
        </Card>
      )}
    </div>
  );
}
