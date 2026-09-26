import Link from "next/link";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

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
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 border-b border-[var(--separator)] px-4 py-3.5",
        "transition-colors active:bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80"
      )}
    >
      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-[17px] font-semibold text-white">
        {initials(patientName)}
      </div>
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
  donorName,
  href,
}: {
  donorName: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 border-b border-[var(--separator)] px-4 py-3.5",
        "transition-colors active:bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80"
      )}
    >
      <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[15px] font-semibold text-[var(--label-secondary)]">
        {initials(donorName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium text-[var(--label)]">{donorName}</p>
        <p className="text-[13px] text-[var(--label-secondary)]">Donor · tap to open chat</p>
      </div>
    </Link>
  );
}
