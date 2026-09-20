import Link from "next/link";
import { requireActiveProfile, getDonorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/card";
import { PageHeader, SectionHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { ActiveRequestActions } from "@/components/donor/active-request-actions";
import { PRIORITY_LABELS, MATCH_RADIUS_KM } from "@/lib/constants";
import { formatDistance, haversineKm, isDonorEligible } from "@/lib/utils";
import { Heart, Droplets } from "lucide-react";
import { format } from "date-fns";

export default async function DonorInvitesPage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const [{ data: invites }, donorProfile] = await Promise.all([
    supabase
      .from("donor_invitations")
      .select(
        "id, request_id, response, distance_km, is_replacement_match, blood_requests(patient_name, primary_blood_group, priority, status)"
      )
      .eq("donor_id", profile.id)
      .order("created_at", { ascending: false }),
    getDonorProfile(profile.id),
  ]);

  const pendingCount = invites?.filter((i) => i.response === "pending").length ?? 0;

  const invitedRequestIds = new Set(invites?.map((i) => i.request_id) ?? []);

  let activeRequests: {
    id: string;
    patient_name: string;
    primary_blood_group: string;
    priority: string;
    units_filled: number;
    units_needed: number;
    deadline: string;
    hospital_notes: string | null;
    latitude: number;
    longitude: number;
    accepts_replacement: boolean;
    distance_km: number;
    hasInvite: boolean;
    inviteId?: string;
    inviteResponse?: string;
  }[] = [];

  if (donorProfile?.willing_to_donate && isDonorEligible(donorProfile.last_donation_date)) {
    const { data: openRequests } = await supabase
      .from("blood_requests")
      .select(
        "id, patient_name, primary_blood_group, priority, units_filled, units_needed, deadline, hospital_notes, latitude, longitude, accepts_replacement, request_replacement_groups(blood_group)"
      )
      .in("status", ["open", "partially_filled"])
      .order("created_at", { ascending: false })
      .limit(50);

    for (const req of openRequests ?? []) {
      if (req.units_filled >= req.units_needed) continue;

      const replacements =
        (req.request_replacement_groups as { blood_group: string }[] | undefined)?.map(
          (g) => g.blood_group
        ) ?? [];
      const isPrimary = donorProfile.blood_group === req.primary_blood_group;
      const isReplacement = req.accepts_replacement && replacements.includes(donorProfile.blood_group);
      if (!isPrimary && !isReplacement) continue;

      let distance = 0;
      if (profile.latitude && profile.longitude) {
        distance = haversineKm(req.latitude, req.longitude, profile.latitude, profile.longitude);
      }

      const existingInvite = invites?.find((i) => i.request_id === req.id);

      activeRequests.push({
        id: req.id,
        patient_name: req.patient_name,
        primary_blood_group: req.primary_blood_group,
        priority: req.priority,
        units_filled: req.units_filled,
        units_needed: req.units_needed,
        deadline: req.deadline,
        hospital_notes: req.hospital_notes,
        latitude: req.latitude,
        longitude: req.longitude,
        accepts_replacement: req.accepts_replacement,
        distance_km: existingInvite?.distance_km ?? Math.round(distance * 10) / 10,
        hasInvite: invitedRequestIds.has(req.id),
        inviteId: existingInvite?.id,
        inviteResponse: existingInvite?.response,
      });
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Donor"
        subtitle={pendingCount > 0 ? `${pendingCount} pending invite${pendingCount > 1 ? "s" : ""}` : "Browse and respond to blood requests"}
      />

      <section>
        <SectionHeader title="Your Invitations" />
        {invites && invites.length > 0 ? (
          <GroupedSection>
            {invites.map((inv) => {
              const req = inv.blood_requests as unknown as {
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
            description="You'll receive invites when requests match your blood group nearby or in your communities."
          />
        )}
      </section>

      {donorProfile && (
        <section>
          <SectionHeader title="All Active Requests" />
          <p className="text-[13px] text-[var(--label-secondary)] mb-3 px-1">
            Browse all open requests matching your blood group. Requests beyond {MATCH_RADIUS_KM} km require confirmation to accept.
          </p>
          {activeRequests.length > 0 ? (
            <GroupedSection>
              {activeRequests.map((req) => (
                <GroupedRow key={req.id}>
                  <GroupedRowIcon color="red">
                    <Droplets className="h-4 w-4" />
                  </GroupedRowIcon>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/requests/${req.id}`} className="text-[15px] font-medium text-[var(--label)] hover:text-[var(--accent)]">
                        {req.patient_name}
                      </Link>
                      <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                        {PRIORITY_LABELS[req.priority]}
                      </Badge>
                      {req.distance_km > MATCH_RADIUS_KM && (
                        <Badge variant="warning">{formatDistance(req.distance_km)}</Badge>
                      )}
                    </div>
                    <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">
                      {req.primary_blood_group} · {req.units_filled}/{req.units_needed} units ·{" "}
                      {formatDistance(req.distance_km)} away
                    </p>
                    <p className="text-[12px] text-[var(--label-tertiary)] mt-0.5">
                      Deadline: {format(new Date(req.deadline), "MMM d, h:mm a")}
                    </p>
                    {req.inviteResponse === "pending" && req.inviteId ? (
                      <Link href={`/donor/invites/${req.inviteId}`} className="text-[13px] text-[var(--accent)] mt-1 inline-block">
                        View invitation →
                      </Link>
                    ) : !req.inviteResponse || req.inviteResponse === "rejected" ? (
                      donorProfile.is_available && (
                        <div className="mt-2">
                          <ActiveRequestActions requestId={req.id} />
                        </div>
                      )
                    ) : null}
                  </div>
                </GroupedRow>
              ))}
            </GroupedSection>
          ) : (
            <EmptyState
              icon={<Droplets className="h-6 w-6" />}
              title="No matching requests"
              description="Enable donor availability to respond when requests match your blood group."
            />
          )}
        </section>
      )}
    </div>
  );
}
