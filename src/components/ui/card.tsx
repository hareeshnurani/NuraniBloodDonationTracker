import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  onClick,
  variant = "default",
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "elevated" | "inset" | "tinted";
}) {
  const variants = {
    default: "bg-[var(--surface)] shadow-[var(--shadow-sm)]",
    elevated: "bg-[var(--surface)] shadow-[var(--shadow-md)]",
    inset: "bg-[var(--surface-secondary)]",
    tinted: "bg-[var(--accent-soft)]",
  };

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] p-5 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-[var(--shadow-md)] active:scale-[0.99]",
        variants[variant],
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      {children}
    </div>
  );
}

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: "default" | "emergency" | "success" | "warning" | "replacement";
  children: React.ReactNode;
}) {
  const variants = {
    default: "bg-[#ebebf0] text-[var(--label-secondary)]",
    emergency: "bg-[var(--accent-soft)] text-[var(--accent)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
    replacement: "bg-[var(--purple-soft)] text-[var(--purple)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
