import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { formatShareLocation, getShareableRequest } from "@/lib/request-share";
import { PRIORITY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ShareRequestCardImage } from "@/components/requests/share-request-card-image";
import { Droplets } from "lucide-react";
import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from "@/lib/share-card-element";

type PageProps = { params: Promise<{ id: string }> };

function appOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://bloodlink.app";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const req = await getShareableRequest(id);
  if (!req) {
    return { title: "Request not found · BloodLink" };
  }
  const origin = appOrigin();
  const imageUrl = `${origin}/api/requests/${id}/share-card`;
  return {
    title: `Blood needed — ${req.primary_blood_group} · BloodLink`,
    description: `${req.patient_name} needs blood. ${PRIORITY_LABELS[req.priority] ?? req.priority} priority.`,
    openGraph: {
      title: `Blood needed — ${req.primary_blood_group}`,
      description: `Help ${req.patient_name} on BloodLink`,
      images: [{ url: imageUrl, width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Blood needed — ${req.primary_blood_group}`,
      description: `Help ${req.patient_name} on BloodLink`,
      images: [imageUrl],
    },
  };
}

export default async function PublicShareRequestPage({ params }: PageProps) {
  const { id } = await params;
  const req = await getShareableRequest(id);
  if (!req) notFound();

  const location = formatShareLocation(req);
  const unitsLeft = Math.max(0, req.units_needed - req.units_filled);
  const loginHref = `/login?next=${encodeURIComponent(`/requests/${id}`)}`;

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-2 text-[14px] font-semibold text-[var(--accent)]">
          <Droplets className="h-4 w-4" />
          BloodLink
        </div>
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">
          Blood donation appeal
        </h1>
        <ShareRequestCardImage requestId={id} alt={`Blood request for ${req.patient_name}`} />
        <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-sm)]">
          <p className="text-[13px] font-medium uppercase tracking-wide text-[var(--label-secondary)]">
            Summary
          </p>
          <p className="mt-2 text-[20px] font-semibold text-[var(--label)]">{req.patient_name}</p>
          <p className="mt-1 text-[15px] text-[var(--label-secondary)]">
            {req.primary_blood_group} · {unitsLeft} unit{unitsLeft !== 1 ? "s" : ""} still needed
          </p>
          <p className="mt-1 text-[14px] text-[var(--label-tertiary)]">
            Deadline {format(new Date(req.deadline), "MMM d, yyyy · h:mm a")}
          </p>
          {location && (
            <p className="mt-2 text-[14px] text-[var(--label-secondary)]">{location}</p>
          )}
        </div>
        <Link href={loginHref}>
          <Button size="lg" className="w-full">
            Open in BloodLink
          </Button>
        </Link>
        <p className="text-[13px] text-[var(--label-tertiary)]">
          Sign in or create an account to respond as a donor.
        </p>
      </div>
    </div>
  );
}
