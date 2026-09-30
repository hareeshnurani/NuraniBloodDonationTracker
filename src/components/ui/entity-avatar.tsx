import Link from "next/link";
import { cn } from "@/lib/utils";

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Deterministic avatar colors aligned with app semantic tokens. */
const AVATAR_STYLES = [
  "bg-[var(--accent-soft)] text-[var(--accent)]",
  "bg-[#007aff1a] text-[#007aff]",
  "bg-[var(--success-soft)] text-[var(--success)]",
  "bg-[var(--warning-soft)] text-[var(--warning)]",
  "bg-[#5856d61a] text-[#5856d6]",
  "bg-[#af52de1a] text-[#af52de]",
] as const;

export function avatarStyleForId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % AVATAR_STYLES.length;
  return AVATAR_STYLES[h];
}

const SIZES = {
  md: "h-11 w-11 text-[15px]",
  lg: "h-[52px] w-[52px] text-[18px]",
} as const;

export function EntityAvatar({
  id,
  name,
  size = "lg",
  className,
}: {
  id: string;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        SIZES[size],
        avatarStyleForId(id),
        className
      )}
    >
      {initialsFromName(name)}
    </div>
  );
}

export function InsetListShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden bg-[var(--surface)]",
        "lg:rounded-[var(--radius-lg)] lg:border lg:border-[var(--separator)] lg:shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function InsetScreenHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  trailing,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-[var(--separator)] bg-[var(--background)]/95 px-2 py-2 backdrop-blur-md lg:static lg:rounded-t-[var(--radius-lg)] lg:bg-[var(--surface)]">
      <Link
        href={backHref}
        aria-label={backLabel}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--accent)] transition-colors hover:bg-[var(--surface-secondary)]"
      >
        <span className="text-[28px] font-light leading-none">‹</span>
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-semibold text-[var(--label)]">{title}</p>
        {subtitle && (
          <p className="truncate text-[13px] text-[var(--label-secondary)]">{subtitle}</p>
        )}
      </div>
      {trailing}
    </header>
  );
}
