import type { ShareableRequest } from "@/lib/request-share";
import { getShareCardCopy } from "@/lib/share-card-copy";
import { Badge } from "@/components/ui/card";

/** HTML appeal card — uses the site font stack (always readable in the browser). */
export function ShareAppealCard({ request }: { request: ShareableRequest }) {
  const copy = getShareCardCopy(request);

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-md)]"
      style={{
        background: "linear-gradient(165deg, #1a1a1e 0%, #2c2c2e 42%, #c41e14 130%)",
      }}
    >
      <div className="flex flex-col p-5 text-white sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#ff3b30] text-[15px] font-bold">
              BL
            </div>
            <div>
              <p className="text-[20px] font-bold leading-tight sm:text-[22px]">BloodLink</p>
              <p className="text-[13px] text-white/75">Urgent blood donation appeal</p>
            </div>
          </div>
          {copy.isEmergency && (
            <Badge variant="emergency" className="shrink-0 uppercase tracking-wide">
              Emergency
            </Badge>
          )}
        </div>

        <div className="flex flex-col items-center py-4 text-center sm:py-6">
          <div className="mb-4 flex h-[120px] w-[120px] items-center justify-center rounded-full border-4 border-white/35 bg-white/10 sm:h-[140px] sm:w-[140px]">
            <span className="text-[40px] font-extrabold tracking-tight sm:text-[48px]">
              {copy.bloodGroup}
            </span>
          </div>
          <p className="text-[22px] font-bold leading-snug sm:text-[26px]">{copy.patientName}</p>
          <p className="mt-2 text-[15px] text-white/90 sm:text-[16px]">{copy.needLine}</p>
          <p className="mt-1 text-[14px] text-white/75">{copy.unitsLine}</p>
        </div>

        <div className="rounded-[var(--radius-md)] bg-white/10 p-4 text-[14px] sm:text-[15px]">
          <div className="flex justify-between gap-4 py-1">
            <span className="text-white/65">Priority</span>
            <span className="font-semibold">{copy.priority}</span>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <span className="text-white/65">Deadline</span>
            <span className="text-right font-semibold">{copy.deadline}</span>
          </div>
          {copy.location && (
            <div className="border-t border-white/10 pt-3 mt-2">
              <p className="text-white/65">Location</p>
              <p className="mt-1 font-medium leading-snug">{copy.location}</p>
            </div>
          )}
        </div>

        <p className="mt-4 border-t border-white/20 pt-4 text-center text-[13px] text-white/70">
          Open the link to respond on BloodLink
        </p>
      </div>
    </div>
  );
}
