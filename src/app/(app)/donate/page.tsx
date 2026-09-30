import Link from "next/link";
import { requireActiveProfile, getDonorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveLocationState } from "@/lib/profile-location";
import { PageHeader, SectionHeader, EmptyState } from "@/components/ui/page-header";
import { DonorWallCarousel } from "@/components/donor/donor-wall-carousel";
import { getDonorDonateWall } from "@/lib/donor-donate-feed";
import { MATCH_RADIUS_KM } from "@/lib/constants";
import { isDonorEligible } from "@/lib/utils";
import { Heart, MapPin, ChevronRight, Droplets } from "lucide-react";

const PREVIEW_LIMIT = 8;

export default async function DonatePage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();
  const donorProfile = await getDonorProfile(profile.id);
  const locationState = getEffectiveLocationState(profile);

  if (!donorProfile) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Donate"
          subtitle="Set up your donor profile in Profile to see the public request wall."
        />
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="Donor profile needed"
          description="Complete onboarding or add donor details in Profile to browse active donation requests."
          action={
            <Link href="/profile" className="text-[15px] font-medium text-[var(--accent)]">
              Go to Profile →
            </Link>
          }
        />
      </div>
    );
  }

  const eligible = isDonorEligible(donorProfile.last_donation_date);
  if (!donorProfile.willing_to_donate || !eligible) {
    return (
      <div className="space-y-6">
        <PageHeader title="Donate" subtitle="Public wall of active blood requests matching your group." />
        <EmptyState
          icon={<Droplets className="h-6 w-6" />}
          title="Not eligible to browse as donor"
          description={
            !donorProfile.willing_to_donate
              ? "Mark yourself as willing to donate in Profile to see requests here."
              : "You are still in the post-donation cooldown period."
          }
          action={
            <Link href="/profile" className="text-[15px] font-medium text-[var(--accent)]">
              Go to Profile →
            </Link>
          }
        />
      </div>
    );
  }

  const { nearby, other } = await getDonorDonateWall(supabase, profile, donorProfile);
  const nearbyPreview = nearby.slice(0, PREVIEW_LIMIT);
  const otherPreview = other.slice(0, PREVIEW_LIMIT);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Donate"
        subtitle="Public wall — every active request that matches your blood group, not limited to your communities."
      />

      {!locationState.available && (
        <p className="rounded-[var(--radius-lg)] border border-[var(--warning)]/25 bg-[var(--warning-soft,#fff8e6)] px-4 py-3 text-[14px] text-[var(--label-secondary)]">
          <span className="font-semibold text-[var(--label)]">Location not set.</span> Requests with
          unknown distance appear under &quot;Other&quot; until you set GPS or PIN in{" "}
          <Link href="/profile" className="font-medium text-[var(--accent)] hover:underline">
            Profile
          </Link>
          .
        </p>
      )}

      <section>
        <SectionHeader
          title="Donation requests nearby"
          action={
            nearby.length > 0 ? (
              <Link
                href="/donate/all?section=nearby"
                className="flex items-center gap-0.5 text-[15px] font-medium text-[var(--accent)]"
              >
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            ) : undefined
          }
        />
        <p className="mb-4 px-1 text-[13px] text-[var(--label-secondary)]">
          Within {MATCH_RADIUS_KM} km of you — all open matching requests on the wall.
        </p>
        {nearbyPreview.length > 0 ? (
          <DonorWallCarousel rows={nearbyPreview} donorAvailable={donorProfile.is_available} />
        ) : (
          <EmptyState
            icon={<MapPin className="h-6 w-6" />}
            title="No nearby active requests"
            description="When an open request matches your group within 50 km, it appears here."
          />
        )}
      </section>

      <section>
        <SectionHeader
          title="Other donation requests"
          action={
            other.length > 0 ? (
              <Link
                href="/donate/all?section=other"
                className="flex items-center gap-0.5 text-[15px] font-medium text-[var(--accent)]"
              >
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            ) : undefined
          }
        />
        <p className="mb-4 px-1 text-[13px] text-[var(--label-secondary)]">
          More than {MATCH_RADIUS_KM} km away, or distance unknown — still on the public wall.
        </p>
        {otherPreview.length > 0 ? (
          <DonorWallCarousel rows={otherPreview} donorAvailable={donorProfile.is_available} />
        ) : (
          <EmptyState
            icon={<Heart className="h-6 w-6" />}
            title="No other active requests"
            description="Wider-area matching requests show here when they are open and match your group."
          />
        )}
      </section>
    </div>
  );
}
