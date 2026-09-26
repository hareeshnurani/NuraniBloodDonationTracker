import Link from "next/link";
import { requireActiveProfile, getDonorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { DonateRequestList } from "@/components/donor/donate-request-list";
import { getDonorActiveRequestsForSection } from "@/lib/donor-donate-feed";
import { MATCH_RADIUS_KM } from "@/lib/constants";
import { Droplets, ChevronLeft } from "lucide-react";

type Section = "nearby" | "other";

function parseSection(raw: string | undefined): Section {
  return raw === "other" ? "other" : "nearby";
}

export default async function DonateAllPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionParam } = await searchParams;
  const section = parseSection(sectionParam);
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();
  const donorProfile = await getDonorProfile(profile.id);

  if (!donorProfile) {
    return (
      <PageHeader title="Active requests" subtitle="Set up your donor profile first." />
    );
  }

  const rows = await getDonorActiveRequestsForSection(supabase, profile, donorProfile, section);

  const title =
    section === "nearby" ? "Nearby active requests" : "Other active requests";
  const subtitle =
    section === "nearby"
      ? `Open requests within ${MATCH_RADIUS_KM} km matching your blood group. Closed, expired, and fulfilled requests are hidden.`
      : `Open requests beyond ${MATCH_RADIUS_KM} km. Closed, expired, and fulfilled requests are hidden.`;

  return (
    <div className="space-y-6">
      <Link
        href="/donate"
        className="inline-flex items-center gap-1 text-[15px] font-medium text-[var(--accent)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Donate
      </Link>

      <PageHeader title={title} subtitle={subtitle} />

      {rows.length > 0 ? (
        <DonateRequestList rows={rows} donorAvailable={donorProfile.is_available} />
      ) : (
        <EmptyState
          icon={<Droplets className="h-6 w-6" />}
          title="No active requests in this list"
          description="Try the other section or turn on availability when new requests match your group."
          action={
            <Link
              href={section === "nearby" ? "/donate/all?section=other" : "/donate/all?section=nearby"}
              className="text-[15px] font-medium text-[var(--accent)]"
            >
              View {section === "nearby" ? "other" : "nearby"} requests →
            </Link>
          }
        />
      )}
    </div>
  );
}
