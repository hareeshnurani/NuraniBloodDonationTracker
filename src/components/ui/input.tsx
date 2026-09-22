import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[var(--radius-md)] bg-[var(--surface-secondary)] px-4 py-3 text-[15px] text-[var(--label)] placeholder:text-[var(--label-tertiary)] transition-all duration-200 focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[var(--radius-md)] bg-[var(--surface-secondary)] px-4 py-3 text-[15px] text-[var(--label)] placeholder:text-[var(--label-tertiary)] transition-all duration-200 focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 resize-none",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-[var(--radius-md)] bg-[var(--surface-secondary)] px-4 py-3 text-[15px] text-[var(--label)] transition-all duration-200 focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 appearance-none",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[13px] font-medium text-[var(--label-secondary)] uppercase tracking-wide",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
