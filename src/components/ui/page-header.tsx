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
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-[var(--label)] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[14px] sm:text-[15px] text-[var(--label-secondary)]">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 sm:pt-1">{action}</div>}
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
    <div className={cn("flex items-center justify-between gap-3 mb-3", className)}>
      <h2 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[var(--label)]">{title}</h2>
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
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface)] px-5 py-10 sm:px-6 sm:py-12 text-center shadow-[var(--shadow-sm)]">
      {icon && (
        <div className="mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--label-tertiary)]">
          {icon}
        </div>
      )}
      <p className="text-[16px] sm:text-[17px] font-semibold text-[var(--label)]">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-xs text-[14px] sm:text-[15px] text-[var(--label-secondary)] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5 w-full sm:w-auto">{action}</div>}
    </div>
  );
}
