"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function Switch({ checked, onChange, disabled, label, description }: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && <p className="text-[15px] font-medium text-[var(--label)]">{label}</p>}
          {description && (
            <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">{description}</p>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 disabled:opacity-40 disabled:cursor-not-allowed",
          checked ? "bg-[var(--success)]" : "bg-[#e9e9eb]"
        )}
      >
        <span
          className={cn(
            "inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-[2px]"
          )}
        />
      </button>
    </div>
  );
}
