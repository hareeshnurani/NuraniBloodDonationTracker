import Link from "next/link";
import { requireActiveProfile, getDonorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DonorAvailabilityToggle } from "@/components/donor/availability-toggle";
import { PendingConfirmations } from "@/components/donor/pending-confirmations";
import { REQUEST_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { formatDistance, getEligibleDate, isDonorEligible } from "@/lib/utils";
import { Droplets, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default async function HomePage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();
  const donorProfile = await getDonorProfile(profile.id);

  const { data: myRequests } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("requester_id", profile.id)
    .in("status", ["open", "partially_filled", "draft"])
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: pendingInvites } = await supabase
    .from("donor_invitations")
    .select("*, blood_requests(*)")
    .eq("donor_id", profile.id)
    .eq("response", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: pendingConfirmations } = await supabase
    .from("donation_confirmations")
    .select("invitation_id, donor_invitations!inner(donor_id, blood_requests(patient_name))")
    .eq("status", "pending")
    .eq("donor_invitations.donor_id", profile.id);

  const confirmationItems =
    pendingConfirmations?.map((c) => {
      const inv = c.donor_invitations as unknown as {
        blood_requests: { patient_name: string };
      };
      return {
        invitation_id: c.invitation_id,
        patient_name: inv?.blood_requests?.patient_name ?? "Patient",
      };
    }) ?? [];

  const eligible = donorProfile
    ? isDonorEligible(donorProfile.last_donation_date)
    : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {profile.name}</h1>
          <p className="text-sm text-gray-500">Blood donation request management</p>
        </div>
        <Link href="/requests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New request
          </Button>
        </Link>
      </div>

      {donorProfile && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">Donor status</h2>
              <p className="text-sm text-gray-500">
                Blood group: <strong>{donorProfile.blood_group}</strong>
                {!eligible && donorProfile.last_donation_date && (
                  <span className="ml-2 text-amber-600">
                    Eligible again on{" "}
                    {format(getEligibleDate(donorProfile.last_donation_date), "MMM d, yyyy")}
                  </span>
                )}
              </p>
            </div>
            <DonorAvailabilityToggle
              isAvailable={donorProfile.is_available}
              eligible={eligible}
              hasDonationDate={!!donorProfile.last_donation_date}
            />
          </div>
        </Card>
      )}

      <PendingConfirmations items={confirmationItems} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Your active requests</h2>
        {myRequests && myRequests.length > 0 ? (
          <div className="space-y-3">
            {myRequests.map((req) => (
              <Link key={req.id} href={`/requests/${req.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{req.patient_name}</span>
                        <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                          {PRIORITY_LABELS[req.priority]}
                        </Badge>
                        <Badge>{REQUEST_STATUS_LABELS[req.status]}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {req.primary_blood_group} · {req.units_filled}/{req.units_needed} units ·
                        Deadline: {format(new Date(req.deadline), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <Droplets className="h-5 w-5 text-red-400" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center text-gray-500">
            <AlertCircle className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2">No active requests. Create one when you need blood.</p>
          </Card>
        )}
      </section>

      {donorProfile && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Pending donor invites</h2>
          {pendingInvites && pendingInvites.length > 0 ? (
            <div className="space-y-3">
              {pendingInvites.map((inv) => {
                const req = inv.blood_requests as {
                  patient_name: string;
                  primary_blood_group: string;
                  priority: string;
                };
                return (
                  <Link key={inv.id} href={`/donor/invites/${inv.id}`}>
                    <Card className="transition-shadow hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{req.patient_name}</span>
                            {inv.is_replacement_match && (
                              <Badge variant="replacement">Replacement donor</Badge>
                            )}
                            <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                              {PRIORITY_LABELS[req.priority]}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {req.primary_blood_group} · {formatDistance(inv.distance_km)} away
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
              <p>No pending invites. Make sure your availability is turned on.</p>
            </Card>
          )}
          <Link href="/donor/invites" className="mt-2 inline-block text-sm text-red-600 hover:underline">
            View all invites
          </Link>
        </section>
      )}
    </div>
  );
}
