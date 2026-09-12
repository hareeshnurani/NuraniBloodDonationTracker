import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn("rounded-xl border border-gray-200 bg-white p-6 shadow-sm", className)}
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
    default: "bg-gray-100 text-gray-700",
    emergency: "bg-red-100 text-red-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
    replacement: "bg-purple-100 text-purple-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
