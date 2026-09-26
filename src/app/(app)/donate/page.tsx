import Link from "next/link";
import { requireActiveProfile, getDonorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getEffectiveLocationState,
} from "@/lib/profile-location";
import { PageHeader, SectionHeader, EmptyState } from "@/components/ui/page-header";
import { DonorInviteCarousel } from "@/components/donor/donor-invite-carousel";
import { getDonorDonatePreview } from "@/lib/donor-donate-feed";
import { MATCH_RADIUS_KM } from "@/lib/constants";
import { Heart, MapPin, ChevronRight } from "lucide-react";

const PREVIEW_LIMIT = 5;

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
          subtitle="Set up your donor profile in Profile to see matching requests."
        />
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="Donor profile needed"
          description="Complete onboarding or add donor details in Profile to browse donation requests."
          action={
            <Link href="/profile" className="text-[15px] font-medium text-[var(--accent)]">
              Go to Profile →
            </Link>
          }
        />
      </div>
    );
  }

  const { nearby, other } = await getDonorDonatePreview(supabase, profile, donorProfile);
  const nearbyPreview = nearby.slice(0, PREVIEW_LIMIT);
  const otherPreview = other.slice(0, PREVIEW_LIMIT);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Donate"
        subtitle="Respond to blood requests that match your group — nearby first, then wider matches."
      />

      {!locationState.available && (
        <p className="rounded-[var(--radius-lg)] border border-[var(--warning)]/25 bg-[var(--warning-soft,#fff8e6)] px-4 py-3 text-[14px] text-[var(--label-secondary)]">
          <span className="font-semibold text-[var(--label)]">Location not set.</span> Distances may be
          inaccurate until you set GPS or PIN in{" "}
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
          Within {MATCH_RADIUS_KM} km — same matching radius as automatic invites.
        </p>
        {nearbyPreview.length > 0 ? (
          <DonorInviteCarousel cards={nearbyPreview} />
        ) : (
          <EmptyState
            icon={<MapPin className="h-6 w-6" />}
            title="No nearby pending invites"
            description="When a request matches you within 50 km, cards will appear here."
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
          Beyond {MATCH_RADIUS_KM} km — often community-linked or wider search; confirm distance before accepting.
        </p>
        {otherPreview.length > 0 ? (
          <DonorInviteCarousel cards={otherPreview} />
        ) : (
          <EmptyState
            icon={<Heart className="h-6 w-6" />}
            title="No distant pending invites"
            description="Invites beyond 50 km show here when you are in a linked community or matched at wider range."
          />
        )}
      </section>
    </div>
  );
}
