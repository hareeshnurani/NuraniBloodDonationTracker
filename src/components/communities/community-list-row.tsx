import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { EntityAvatar } from "@/components/ui/entity-avatar";

const rowClass = cn(
  "flex items-center gap-3 border-b border-[var(--separator)] px-4 py-3.5",
  "transition-colors active:bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80"
);

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
    <Link href={href} className={rowClass}>
      <EntityAvatar id={id} name={name} />
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
    <div className={rowClass}>
      <EntityAvatar id={id} name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-medium text-[var(--label)]">{name}</p>
        <p className="mt-0.5 truncate text-[14px] text-[var(--label-secondary)]">{subtitle}</p>
      </div>
      <div className="shrink-0">{trailing}</div>
    </div>
  );
}
