import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function GroupedSection({
  title,
  footer,
  children,
  className,
}: {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <h3 className="px-4 text-[13px] font-medium text-[var(--label-secondary)] uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className="overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
        {children}
      </div>
      {footer && (
        <p className="px-4 text-[13px] text-[var(--label-secondary)] leading-relaxed">{footer}</p>
      )}
    </div>
  );
}

export function GroupedRow({
  children,
  className,
  onClick,
  href,
  showChevron,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  showChevron?: boolean;
}) {
  const content = (
    <>
      <div className="flex-1 min-w-0">{children}</div>
      {showChevron && (
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--label-tertiary)]" />
      )}
    </>
  );

  const rowClass = cn(
    "flex items-center gap-3 px-4 py-4 min-h-[52px] transition-colors duration-150",
    "border-b border-[var(--separator)] last:border-b-0",
    (onClick || href) && "cursor-pointer hover:bg-[var(--surface-secondary)] active:bg-[#ebebf0]",
    className
  );

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {content}
      </Link>
    );
  }

  return (
    <div className={rowClass} onClick={onClick} role={onClick ? "button" : undefined}>
      {content}
    </div>
  );
}

export function GroupedRowIcon({
  children,
  className,
  color = "red",
}: {
  children: React.ReactNode;
  className?: string;
  color?: "red" | "green" | "blue" | "orange" | "purple" | "gray";
}) {
  const colors = {
    red: "bg-[var(--accent-soft)] text-[var(--accent)]",
    green: "bg-[var(--success-soft)] text-[var(--success)]",
    blue: "bg-[#007aff1a] text-[#007aff]",
    orange: "bg-[var(--warning-soft)] text-[var(--warning)]",
    purple: "bg-[var(--purple-soft)] text-[var(--purple)]",
    gray: "bg-[#ebebf0] text-[var(--label-secondary)]",
  };

  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]",
        colors[color],
        className
      )}
    >
      {children}
    </div>
  );
}
