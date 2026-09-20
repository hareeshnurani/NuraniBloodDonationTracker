import Link from "next/link";
import { requireActiveProfile, getDonorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { DonorAvailabilityToggle } from "@/components/donor/availability-toggle";
import { PendingConfirmations } from "@/components/donor/pending-confirmations";
import { PinReorderList } from "@/components/communities/pin-reorder-list";
import { RequesterActiveRequestCards } from "@/components/requests/requester-active-cards";
import { DonorInviteCarousel } from "@/components/donor/donor-invite-carousel";
import { getDonorHomeFeed } from "@/lib/donor-feed";
import { getEligibleDate, isDonorEligible } from "@/lib/utils";
import { Droplets, Plus, AlertCircle, Heart, ChevronRight, Users } from "lucide-react";
import { format } from "date-fns";

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
      .select(
        "id, patient_name, priority, primary_blood_group, units_filled, units_needed, status, deadline"
      )
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
      .select("community_id, communities(id, name)")
      .eq("user_id", profile.id),
    supabase
      .from("user_community_pins")
      .select("community_id, sort_order")
      .eq("user_id", profile.id)
      .order("sort_order", { ascending: true }),
  ]);

  const donorFeed = donorProfile
    ? await getDonorHomeFeed(supabase, profile, donorProfile)
    : { cards: [], matchingActiveCount: 0, pendingCount: 0 };

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
            </div>
            <DonorAvailabilityToggle
              isAvailable={donorProfile.is_available}
              eligible={eligible}
              hasDonationDate={!!donorProfile.last_donation_date}
            />
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
          <RequesterActiveRequestCards requests={myRequests} />
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
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-[var(--label)]">
                  {donorProfile.blood_group} needed
                </h2>
                {donorFeed.matchingActiveCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[12px] font-bold text-white shadow-sm">
                    {donorFeed.matchingActiveCount} active
                  </span>
                )}
              </div>
              <p className="mt-1 text-[14px] text-[var(--label-secondary)]">
                {donorFeed.pendingCount > 0
                  ? `${donorFeed.pendingCount} invitation${donorFeed.pendingCount !== 1 ? "s" : ""} waiting for you — swipe through each card`
                  : donorFeed.matchingActiveCount > 0
                    ? "Open requests match your blood group. Browse invites to respond."
                    : "Turn on availability to receive requests when patients nearby need your group."}
              </p>
            </div>
            <Link
              href="/donor/invites"
              className="text-[15px] font-medium text-[var(--accent)] flex items-center gap-0.5 shrink-0"
            >
              All invites <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {donorFeed.cards.length > 0 ? (
            <DonorInviteCarousel cards={donorFeed.cards} />
          ) : (
            <EmptyState
              icon={<Heart className="h-6 w-6" />}
              title="No pending invitations"
              description={
                donorFeed.matchingActiveCount > 0
                  ? "You can still browse open requests that match your blood group."
                  : "When a request matches your profile, it will appear here as a card you can accept or decline."
              }
              action={
                donorFeed.matchingActiveCount > 0 ? (
                  <Link href="/donor/invites">
                    <Button variant="secondary">Browse matching requests</Button>
                  </Link>
                ) : undefined
              }
            />
          )}
        </section>
      )}
    </div>
  );
}
