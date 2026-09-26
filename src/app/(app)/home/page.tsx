import Link from "next/link";
import { requireActiveProfile, getDonorProfile } from "@/lib/auth";
import {
  getEffectiveLocationState,
  isGpsTimestampFresh,
} from "@/lib/profile-location";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { DonorHomeStatusControls } from "@/components/donor/donor-home-status-controls";
import { UseMyLocationAutoRefresh } from "@/components/donor/use-my-location-auto-refresh";
import { PendingConfirmations } from "@/components/donor/pending-confirmations";
import { PinReorderList } from "@/components/communities/pin-reorder-list";
import { DonorWallCarousel } from "@/components/donor/donor-wall-carousel";
import { getDonorDonateWall } from "@/lib/donor-donate-feed";
import { REQUEST_STATUS_LABELS, PRIORITY_LABELS, MATCH_RADIUS_KM } from "@/lib/constants";
import { getEligibleDate, isDonorEligible } from "@/lib/utils";
import { Droplets, Plus, AlertCircle, ChevronRight, Users, MapPin, Heart } from "lucide-react";
import { format } from "date-fns";

const HOME_NEARBY_PREVIEW = 8;

export default async function HomePage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const [
    donorProfile,
    { data: myRequests },
    { data: acceptedInvites },
    { count: livesSaved },
    { data: memberships },
    { data: pins },
  ] = await Promise.all([
    getDonorProfile(profile.id),
    supabase
      .from("blood_requests")
      .select("*")
      .eq("requester_id", profile.id)
      .in("status", ["open", "partially_filled", "draft"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("donor_invitations")
      .select("id, blood_requests(patient_name), donation_confirmations(status)")
      .eq("donor_id", profile.id)
      .eq("is_confirmed", true),
    supabase
      .from("donation_confirmations")
      .select("invitation_id, donor_invitations!inner(donor_id)", { count: "exact", head: true })
      .eq("status", "donated")
      .eq("donor_invitations.donor_id", profile.id),
    supabase
      .from("community_members")
      .select("community_id, joined_at, communities(id, name)")
      .eq("user_id", profile.id)
      .order("joined_at", { ascending: false }),
    supabase
      .from("user_community_pins")
      .select("community_id, sort_order")
      .eq("user_id", profile.id)
      .order("sort_order", { ascending: true }),
  ]);

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

  const communityIds = memberships?.map((m) => m.community_id) ?? [];
  let communityFeed: { id: string; name: string; activeCount: number; sort_order: number; pinned: boolean }[] =
    [];

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
      return a.name.localeCompare(b.name);
    });
  }

  const pinnedCommunities = communityFeed.filter((c) => c.pinned);

  const homeCommunityFallback =
    pinnedCommunities.length === 0 && memberships?.[0]
      ? (() => {
          const m = memberships[0];
          const c = m.communities as unknown as { id: string; name: string };
          return (
            communityFeed.find((x) => x.id === c.id) ?? {
              id: c.id,
              name: c.name,
              activeCount: 0,
              sort_order: 999,
              pinned: false,
            }
          );
        })()
      : null;

  const eligible = donorProfile ? isDonorEligible(donorProfile.last_donation_date) : false;

  const locationState = getEffectiveLocationState(profile);
  const hasLocation = locationState.available;
  const gpsNeedsRefresh =
    (profile.use_my_location ?? false) && !isGpsTimestampFresh(profile.gps_updated_at);

  let nearbyWallPreview: Awaited<ReturnType<typeof getDonorDonateWall>>["nearby"] = [];
  if (
    donorProfile?.willing_to_donate &&
    eligible
  ) {
    const wall = await getDonorDonateWall(supabase, profile, donorProfile);
    nearbyWallPreview = wall.nearby.slice(0, HOME_NEARBY_PREVIEW);
  }

  const firstName = profile.name.split(" ")[0];
  const donatedUnits = livesSaved ?? 0;

  const welcomeSubtitle =
    donorProfile && donatedUnits > 0
      ? `You have saved ${donatedUnits} ${donatedUnits === 1 ? "life" : "lives"} through your donations. Thank you!`
      : donorProfile
        ? "Every donation can save a life. Turn on your availability and be someone's hero today."
        : "Your blood donation dashboard";

  const showCommunitiesSection =
    pinnedCommunities.length > 0 || homeCommunityFallback != null;

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
          <div className="space-y-4 p-4">
            <div className="flex items-start gap-3">
              <GroupedRowIcon color="red">
                <Droplets className="h-4 w-4" />
              </GroupedRowIcon>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[17px] font-semibold tracking-tight text-[var(--label)]">
                  {donorProfile.blood_group}
                </p>
                <p className="text-[13px] text-[var(--label-secondary)]">Blood group</p>
                {!eligible && donorProfile.last_donation_date && (
                  <p className="text-[13px] text-[var(--warning)] pt-0.5">
                    Eligible again on{" "}
                    {format(getEligibleDate(donorProfile.last_donation_date), "MMM d, yyyy")}
                  </p>
                )}
                {eligible && (
                  <p className="inline-flex items-center rounded-full bg-[var(--success-soft)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--success)]">
                    Eligible to donate
                  </p>
                )}
              </div>
            </div>

            <DonorHomeStatusControls
              isAvailable={donorProfile.is_available}
              eligible={eligible}
              hasDonationDate={!!donorProfile.last_donation_date}
              hasEffectiveLocation={hasLocation}
              useMyLocation={profile.use_my_location ?? false}
              gpsNeedsRefresh={gpsNeedsRefresh}
            />

            {!hasLocation && (
              <div className="flex gap-3 rounded-[var(--radius-lg)] border border-[var(--warning)]/25 bg-[var(--warning-soft,#fff8e6)] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--warning)]/15">
                  <MapPin className="h-4 w-4 text-[var(--warning)]" />
                </div>
                <p className="text-[14px] leading-relaxed text-[var(--label-secondary)]">
                  <span className="font-semibold text-[var(--label)]">Location not set.</span>{" "}
                  We can&apos;t route nearby requests or show accurate distances until you add GPS or
                  your PIN code in{" "}
                  <Link href="/profile" className="font-medium text-[var(--accent)] hover:underline">
                    Profile
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </GroupedSection>
      )}

      {showCommunitiesSection && (
        <section>
          <SectionHeader
            title="My Communities"
            action={
              <Link
                href="/communities"
                className="flex items-center gap-0.5 text-[15px] font-medium text-[var(--accent)]"
              >
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          {pinnedCommunities.length > 0 ? (
            <GroupedSection>
              <PinReorderList communities={pinnedCommunities} />
            </GroupedSection>
          ) : homeCommunityFallback ? (
            <GroupedSection>
              <GroupedRow href={`/communities/${homeCommunityFallback.id}`} showChevron>
                <GroupedRowIcon color="blue">
                  <Users className="h-4 w-4" />
                </GroupedRowIcon>
                <div className="min-w-0 flex-1">
                  <span className="text-[15px] font-medium text-[var(--label)]">
                    {homeCommunityFallback.name}
                  </span>
                  <p className="mt-0.5 text-[13px] text-[var(--label-secondary)]">
                    Recently joined · Pin communities in Groups to show more here
                  </p>
                  {homeCommunityFallback.activeCount > 0 && (
                    <p className="mt-0.5 text-[13px] text-[var(--accent)]">
                      {homeCommunityFallback.activeCount} active request
                      {homeCommunityFallback.activeCount !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </GroupedRow>
            </GroupedSection>
          ) : null}
        </section>
      )}

      {donorProfile?.willing_to_donate && eligible && (
        <section>
          <SectionHeader
            title="Donation requests nearby"
            action={
              nearbyWallPreview.length > 0 ? (
                <Link
                  href="/donate/all?section=nearby"
                  className="flex items-center gap-0.5 text-[15px] font-medium text-[var(--accent)]"
                >
                  See all <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/donate"
                  className="flex items-center gap-0.5 text-[15px] font-medium text-[var(--accent)]"
                >
                  Donate tab <ChevronRight className="h-4 w-4" />
                </Link>
              )
            }
          />
          <p className="mb-4 px-1 text-[13px] text-[var(--label-secondary)]">
            Active requests matching your group within {MATCH_RADIUS_KM} km — swipe to browse.
          </p>
          {nearbyWallPreview.length > 0 ? (
            <DonorWallCarousel
              rows={nearbyWallPreview}
              donorAvailable={donorProfile.is_available}
            />
          ) : (
            <EmptyState
              icon={<Heart className="h-6 w-6" />}
              title="No nearby active requests"
              description="When an open request matches your blood group nearby, it will appear here."
            />
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
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-medium text-[var(--label)]">
                      {req.patient_name}
                    </span>
                    <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                      {PRIORITY_LABELS[req.priority]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-[var(--label-secondary)]">
                    {req.primary_blood_group} · {req.units_filled}/{req.units_needed} units ·{" "}
                    {REQUEST_STATUS_LABELS[req.status]}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--label-tertiary)]">
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
    </div>
  );
}
