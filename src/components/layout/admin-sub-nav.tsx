"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/reports", label: "Moderation" },
];

export function AdminSubNav({ moderationOpenCount = 0 }: { moderationOpenCount?: number }) {
  const pathname = usePathname();

  return (
    <div className="glass border-b border-[var(--separator)]">
      <div className="mx-auto max-w-5xl">
        <nav className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {adminLinks.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            const showBadge = link.href === "/admin/reports" && moderationOpenCount > 0;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-secondary)] text-[var(--label-secondary)]"
                )}
              >
                {link.label}
                {showBadge && (
                  <span
                    className={cn(
                      "ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                      active ? "bg-white/25 text-white" : "bg-[var(--accent)] text-white"
                    )}
                  >
                    {moderationOpenCount > 99 ? "99+" : moderationOpenCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
