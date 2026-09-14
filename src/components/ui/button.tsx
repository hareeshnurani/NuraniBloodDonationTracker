import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "tinted";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.98] shadow-sm disabled:bg-[#ff3b3080]",
    secondary:
      "bg-[var(--surface-secondary)] text-[var(--label)] hover:bg-[#ebebf0] active:scale-[0.98]",
    danger:
      "bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[#ff3b3020] active:scale-[0.98]",
    ghost:
      "bg-transparent text-[var(--accent)] hover:bg-[var(--accent-soft)] active:scale-[0.98]",
    tinted:
      "bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[#ff3b3020] active:scale-[0.98]",
  };
  const sizes = {
    sm: "px-3.5 py-1.5 text-[13px] rounded-[10px]",
    md: "px-5 py-2.5 text-[15px] rounded-[12px]",
    lg: "px-7 py-3.5 text-[17px] rounded-[14px] font-semibold",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
