import Link from "next/link";
import { requireActiveProfile, getDonorProfile } from "@/lib/auth";
import {
  getEffectiveLocationState,
  locationUnavailableMessage,
  isGpsTimestampFresh,
} from "@/lib/profile-location";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { DonorAvailabilityToggle } from "@/components/donor/availability-toggle";
import { UseMyLocationToggle } from "@/components/donor/use-my-location-toggle";
import { UseMyLocationAutoRefresh } from "@/components/donor/use-my-location-auto-refresh";
import { PendingConfirmations } from "@/components/donor/pending-confirmations";
import { PinReorderList } from "@/components/communities/pin-reorder-list";
import { REQUEST_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { formatDistance, getEligibleDate, isDonorEligible } from "@/lib/utils";
import { Droplets, Plus, AlertCircle, Heart, ChevronRight, Users, MapPin } from "lucide-react";
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

  const { data: acceptedInvites } = await supabase
    .from("donor_invitations")
    .select("id, blood_requests(patient_name), donation_confirmations(status)")
    .eq("donor_id", profile.id)
    .eq("is_confirmed", true);

  const confirmationItems =
    acceptedInvites
      ?.filter((inv) => {
        const conf = inv.donation_confirmations as { status: string } | { status: string }[] | null;
        if (!conf) return true;
        if (Array.isArray(conf)) {
          return conf.length === 0 || conf.some((c) => c.status === "pending");
        }
        return conf.status === "pending";
      })
      .map((inv) => {
        const req = inv.blood_requests as unknown as { patient_name: string };
        return {
          invitation_id: inv.id,
          patient_name: req?.patient_name ?? "Patient",
        };
      }) ?? [];

  const { count: livesSaved } = await supabase
    .from("donation_confirmations")
    .select("invitation_id, donor_invitations!inner(donor_id)", { count: "exact", head: true })
    .eq("status", "donated")
    .eq("donor_invitations.donor_id", profile.id);

  const { data: memberships } = await supabase
    .from("community_members")
    .select("community_id, communities(id, name)")
    .eq("user_id", profile.id);

  const { data: pins } = await supabase
    .from("user_community_pins")
    .select("community_id, sort_order")
    .eq("user_id", profile.id)
    .order("sort_order", { ascending: true });

  const communityIds = memberships?.map((m) => m.community_id) ?? [];
  let communityFeed: { id: string; name: string; activeCount: number; sort_order: number; pinned: boolean }[] = [];

  if (communityIds.length > 0) {
    const { data: requestLinks } = await supabase
      .from("request_communities")
      .select("community_id, blood_requests(status)")
      .in("community_id", communityIds);

    const activeCountMap = new Map<string, number>();
    for (const rl of requestLinks ?? []) {
      const req = rl.blood_requests as unknown as { status: string } | null;
      if (req && ["open", "partially_filled"].includes(req.status)) {
        activeCountMap.set(rl.community_id, (activeCountMap.get(rl.community_id) ?? 0) + 1);
      }
    }

    const pinMap = new Map(pins?.map((p) => [p.community_id, p.sort_order]) ?? []);

    communityFeed = (memberships ?? []).map((m) => {
      const c = m.communities as unknown as { id: string; name: string };
      return {
        id: c.id,
        name: c.name,
        activeCount: activeCountMap.get(m.community_id) ?? 0,
        sort_order: pinMap.get(m.community_id) ?? 999,
        pinned: pinMap.has(m.community_id),
      };
    });

    communityFeed.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.pinned && b.pinned) return a.sort_order - b.sort_order;
      if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
      return a.name.localeCompare(b.name);
    });
  }

  const pinnedCommunities = communityFeed.filter((c) => c.pinned);
  const unpinnedCommunities = communityFeed.filter((c) => !c.pinned);

  const eligible = donorProfile
    ? isDonorEligible(donorProfile.last_donation_date)
    : false;

  const locationState = getEffectiveLocationState(profile);
  const hasLocation = locationState.available;
  const gpsNeedsRefresh =
    (profile.use_my_location ?? false) && !isGpsTimestampFresh(profile.gps_updated_at);

  const firstName = profile.name.split(" ")[0];
  const donatedUnits = livesSaved ?? 0;

  const welcomeSubtitle =
    donorProfile && donatedUnits > 0
      ? `You have saved ${donatedUnits} ${donatedUnits === 1 ? "life" : "lives"} through your donations. Thank you!`
      : donorProfile
        ? "Every donation can save a life. Turn on your availability and be someone's hero today."
        : "Your blood donation dashboard";

  return (
    <div className="space-y-8">
      <UseMyLocationAutoRefresh
        useMyLocation={profile.use_my_location ?? false}
        gpsUpdatedAt={profile.gps_updated_at}
      />
      <PageHeader
        title={`Welcome, ${firstName}`}
        subtitle={welcomeSubtitle}
        action={
          <Link href="/requests/new" className="hidden sm:block">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              New request
            </Button>
          </Link>
        }
      />

      <PendingConfirmations items={confirmationItems} />

      {donorProfile && (
        <GroupedSection title="Donor Status">
          <GroupedRow>
            <GroupedRowIcon color="red">
              <Droplets className="h-4 w-4" />
            </GroupedRowIcon>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[var(--label)]">
                Blood group {donorProfile.blood_group}
              </p>
              {!eligible && donorProfile.last_donation_date && (
                <p className="text-[13px] text-[var(--warning)] mt-0.5">
                  Eligible again on {format(getEligibleDate(donorProfile.last_donation_date), "MMM d, yyyy")}
                </p>
              )}
              {eligible && (
                <p className="text-[13px] text-[var(--success)] mt-0.5">Eligible to donate</p>
              )}
              {!hasLocation && (
                <div className="mt-2 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-soft,#fff8e6)] px-3 py-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
                  <p className="text-[13px] leading-snug text-[var(--label-secondary)]">
                    <span className="font-medium text-[var(--label)]">Location unavailable.</span>{" "}
                    {locationUnavailableMessage(locationState.reason)}{" "}
                    <Link href="/profile" className="font-medium text-[var(--accent)] hover:underline">
                      Profile
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-3">
              <UseMyLocationToggle
                enabled={profile.use_my_location ?? false}
                needsRefresh={gpsNeedsRefresh}
              />
              <DonorAvailabilityToggle
              isAvailable={donorProfile.is_available}
              eligible={eligible}
              hasDonationDate={!!donorProfile.last_donation_date}
            />
            </div>
          </GroupedRow>
        </GroupedSection>
      )}

      {communityFeed.length > 0 && (
        <section>
          <SectionHeader
            title="My Communities"
            action={
              <Link href="/communities" className="text-[15px] font-medium text-[var(--accent)] flex items-center gap-0.5">
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          {pinnedCommunities.length > 0 && (
            <GroupedSection>
              <PinReorderList communities={pinnedCommunities} />
            </GroupedSection>
          )}
          {unpinnedCommunities.length > 0 && (
            <GroupedSection className={pinnedCommunities.length > 0 ? "mt-2" : ""}>
              {unpinnedCommunities.slice(0, 5).map((c) => (
                <GroupedRow key={c.id} href={`/communities/${c.id}`} showChevron>
                  <GroupedRowIcon color="blue">
                    <Users className="h-4 w-4" />
                  </GroupedRowIcon>
                  <div className="flex-1 min-w-0">
                    <span className="text-[15px] font-medium text-[var(--label)]">{c.name}</span>
                    {c.activeCount > 0 && (
                      <p className="text-[13px] text-[var(--accent)] mt-0.5">
                        {c.activeCount} active request{c.activeCount !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </GroupedRow>
              ))}
            </GroupedSection>
          )}
        </section>
      )}

      <section>
        <SectionHeader title="My Active Requests" />
        {myRequests && myRequests.length > 0 ? (
          <GroupedSection>
            {myRequests.map((req) => (
              <GroupedRow key={req.id} href={`/requests/${req.id}`} showChevron>
                <GroupedRowIcon color="red">
                  <Droplets className="h-4 w-4" />
                </GroupedRowIcon>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-medium text-[var(--label)]">{req.patient_name}</span>
                    <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                      {PRIORITY_LABELS[req.priority]}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">
                    {req.primary_blood_group} · {req.units_filled}/{req.units_needed} units ·{" "}
                    {REQUEST_STATUS_LABELS[req.status]}
                  </p>
                  <p className="text-[12px] text-[var(--label-tertiary)] mt-0.5">
                    Deadline: {format(new Date(req.deadline), "MMM d, h:mm a")}
                  </p>
                </div>
              </GroupedRow>
            ))}
          </GroupedSection>
        ) : (
          <EmptyState
            icon={<AlertCircle className="h-6 w-6" />}
            title="No active requests"
            description="Create a request when you need blood for a patient."
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
      </section>

      {donorProfile && (
        <section>
          <SectionHeader
            title="Pending Invites"
            action={
              pendingInvites && pendingInvites.length > 0 ? (
                <Link href="/donor/invites" className="text-[15px] font-medium text-[var(--accent)] flex items-center gap-0.5">
                  See all <ChevronRight className="h-4 w-4" />
                </Link>
              ) : undefined
            }
          />
          {pendingInvites && pendingInvites.length > 0 ? (
            <GroupedSection>
              {pendingInvites.map((inv) => {
                const req = inv.blood_requests as {
                  patient_name: string;
                  primary_blood_group: string;
                  priority: string;
                };
                return (
                  <GroupedRow key={inv.id} href={`/donor/invites/${inv.id}`} showChevron>
                    <GroupedRowIcon color="green">
                      <Heart className="h-4 w-4" />
                    </GroupedRowIcon>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-medium text-[var(--label)]">{req.patient_name}</span>
                        {inv.is_replacement_match && (
                          <Badge variant="replacement">Replacement</Badge>
                        )}
                        <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                          {PRIORITY_LABELS[req.priority]}
                        </Badge>
                      </div>
                      <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">
                        {req.primary_blood_group} · {formatDistance(inv.distance_km)} away
                      </p>
                    </div>
                  </GroupedRow>
                );
              })}
            </GroupedSection>
          ) : (
            <EmptyState
              icon={<Heart className="h-6 w-6" />}
              title="No pending invites"
              description="Turn on your availability to receive donation requests from nearby patients."
            />
          )}
        </section>
      )}
    </div>
  );
}
