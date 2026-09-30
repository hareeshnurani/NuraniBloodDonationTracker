import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = {
  href?: string;
  label: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: "red" | "green" | "blue" | "orange" | "gray";
};

const iconColors = {
  red: "bg-[var(--accent-soft)] text-[var(--accent)]",
  green: "bg-[var(--success-soft)] text-[var(--success)]",
  blue: "bg-[#007aff1a] text-[#007aff]",
  orange: "bg-[var(--warning-soft)] text-[var(--warning)]",
  gray: "bg-[#ebebf0] text-[var(--label-secondary)]",
};

export function AdminStatCard({
  href,
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor = "gray",
}: Props) {
  const inner = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-[10px]",
          iconColors[iconColor]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-[28px] font-bold tabular-nums tracking-tight text-[var(--label)]">
        {value}
      </p>
      <p className="mt-0.5 text-[14px] font-medium text-[var(--label)]">{label}</p>
      {subtitle && (
        <p className="mt-1 text-[12px] text-[var(--label-secondary)]">{subtitle}</p>
      )}
    </>
  );

  const className =
    "block rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] active:scale-[0.99]";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
