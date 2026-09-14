import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h1 className="text-[34px] font-bold tracking-tight text-[var(--label)] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[15px] text-[var(--label-secondary)]">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <h2 className="text-[22px] font-bold tracking-tight text-[var(--label)]">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface)] px-6 py-12 text-center shadow-[var(--shadow-sm)]">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--label-tertiary)]">
          {icon}
        </div>
      )}
      <p className="text-[17px] font-semibold text-[var(--label)]">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-xs text-[15px] text-[var(--label-secondary)] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
