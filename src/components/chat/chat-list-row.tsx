import Link from "next/link";
import { cn } from "@/lib/utils";
import { EntityAvatar } from "@/components/ui/entity-avatar";

const rowClass = cn(
  "flex items-center gap-3 border-b border-[var(--separator)] px-4 py-3.5",
  "transition-colors active:bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80"
);

export function ChatRequestListRow({
  requestId,
  patientName,
  subtitle,
  href,
}: {
  requestId: string;
  patientName: string;
  subtitle?: string;
  href: string;
}) {
  return (
    <Link href={href} className={rowClass}>
      <EntityAvatar id={requestId} name={patientName} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-medium text-[var(--label)]">{patientName}</p>
        {subtitle && (
          <p className="mt-0.5 truncate text-[14px] text-[var(--label-secondary)]">{subtitle}</p>
        )}
      </div>
    </Link>
  );
}

export function ChatDonorListRow({
  donorId,
  donorName,
  href,
}: {
  donorId: string;
  donorName: string;
  href: string;
}) {
  return (
    <Link href={href} className={rowClass}>
      <EntityAvatar id={donorId} name={donorName} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium text-[var(--label)]">{donorName}</p>
        <p className="text-[13px] text-[var(--label-secondary)]">Donor · tap to open chat</p>
      </div>
    </Link>
  );
}
