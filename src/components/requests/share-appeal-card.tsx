import Link from "next/link";
import type { ShareableRequest } from "@/lib/request-share";
import { getShareCardCopy } from "@/lib/share-card-copy";

/** HTML appeal poster — matches share PNG; link + QR visible without sharing. */
export function ShareAppealCard({
  request,
  shareUrl,
}: {
  request: ShareableRequest;
  shareUrl: string;
}) {
  const copy = getShareCardCopy(request);

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)]"
      style={{
        background: "linear-gradient(135deg, #121214 0%, #2a1210 45%, #8b1a12 100%)",
      }}
    >
      {copy.isEmergency && (
        <div className="bg-[#ff3b30] py-2.5 text-center text-[13px] font-bold tracking-[0.2em] text-white sm:text-[14px]">
          EMERGENCY
        </div>
      )}

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="flex shrink-0 justify-center sm:w-[38%]">
          <div
            className="flex h-[140px] w-[140px] items-center justify-center rounded-full border-[5px] border-white/90 sm:h-[160px] sm:w-[160px]"
            style={{
              background: "rgba(255,59,48,0.25)",
              boxShadow: "0 0 48px rgba(255,59,48,0.4)",
            }}
          >
            <span className="text-[56px] font-bold leading-none tracking-tight text-white sm:text-[64px]">
              {copy.bloodGroup}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-left text-white">
          <p className="text-[13px] font-bold tracking-wide text-[#ff3b30] sm:text-[14px]">
            {copy.heroHeadline}
          </p>
          <p className="mt-1 text-[40px] font-bold leading-none sm:text-[48px]">{copy.unitsHero}</p>
          <p className="mt-2 text-[20px] font-bold leading-snug sm:text-[22px]">{copy.patientName}</p>
          <p className="mt-1 text-[14px] text-white/85">
            {copy.unitsSub} · {copy.priority}
          </p>
          <p className="mt-3 inline-block rounded-[10px] bg-white/12 px-3 py-2 text-[15px] font-semibold sm:text-[16px]">
            By {copy.deadline}
          </p>
          {copy.location && (
            <p className="mt-2 text-[13px] leading-snug text-white/80 sm:text-[14px]">{copy.location}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="text-left text-white">
          <p className="text-[17px] font-bold">BloodLink</p>
          <p className="text-[12px] text-white/75 sm:text-[13px]">
            Shared posters include this link and QR on the image.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/requests/${request.id}/share-qr`}
              alt="QR code to open this blood request"
              width={80}
              height={80}
              className="h-20 w-20"
            />
          </div>
          <Link
            href={shareUrl}
            className="max-w-[200px] break-all text-left text-[11px] font-semibold text-white underline sm:max-w-[240px] sm:text-[12px]"
          >
            {shareUrl}
          </Link>
        </div>
      </div>
    </div>
  );
}
