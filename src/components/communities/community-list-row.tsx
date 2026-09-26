import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const avatarColors = [
  "bg-[#007aff]",
  "bg-[#5856d6]",
  "bg-[#ff9500]",
  "bg-[#34c759]",
  "bg-[#ff2d55]",
  "bg-[#af52de]",
];

function colorForId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % avatarColors.length;
  return avatarColors[h];
}

export function CommunityListRow({
  id,
  name,
  subtitle,
  meta,
  href,
  trailing,
}: {
  id: string;
  name: string;
  subtitle: string;
  meta?: string;
  href: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 border-b border-[var(--separator)] px-4 py-3.5",
        "transition-colors active:bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80"
      )}
    >
      <div
        className={cn(
          "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-[18px] font-semibold text-white",
          colorForId(id)
        )}
      >
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[17px] font-medium text-[var(--label)]">{name}</p>
          {meta && (
            <span className="shrink-0 text-[12px] text-[var(--label-tertiary)]">{meta}</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[14px] text-[var(--label-secondary)]">{subtitle}</p>
      </div>
      {trailing ?? <ChevronRight className="h-5 w-5 shrink-0 text-[var(--label-tertiary)]" />}
    </Link>
  );
}

export function CommunityListRowStatic({
  id,
  name,
  subtitle,
  trailing,
}: {
  id: string;
  name: string;
  subtitle: string;
  trailing: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--separator)] px-4 py-3.5">
      <div
        className={cn(
          "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-[18px] font-semibold text-white",
          colorForId(id)
        )}
      >
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-medium text-[var(--label)]">{name}</p>
        <p className="mt-0.5 truncate text-[14px] text-[var(--label-secondary)]">{subtitle}</p>
      </div>
      <div className="shrink-0">{trailing}</div>
    </div>
  );
}
