"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Pill = { id: string; label: string };

export function AdminFilterPills({
  basePath,
  paramName,
  pills,
}: {
  basePath: string;
  paramName: string;
  pills: Pill[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? pills[0]?.id ?? "all";

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((pill) => {
        const active = current === pill.id;
        const href =
          pill.id === pills[0]?.id
            ? basePath
            : `${basePath}?${paramName}=${encodeURIComponent(pill.id)}`;

        return (
          <Link
            key={pill.id}
            href={href}
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface-secondary)] text-[var(--label-secondary)] hover:text-[var(--label)]"
            )}
          >
            {pill.label}
          </Link>
        );
      })}
    </div>
  );
}
