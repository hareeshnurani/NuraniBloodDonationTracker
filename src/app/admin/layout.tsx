import { requireAdmin } from "@/lib/auth";
import { AppNav } from "@/components/layout/app-nav";
import Link from "next/link";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/audit", label: "Audit logs" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppNav isAdmin />
      <div className="glass border-b border-[var(--separator)]">
        <div className="mx-auto flex max-w-5xl gap-1 px-5 py-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[var(--label-secondary)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--label)]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <main className="mx-auto max-w-5xl px-5 py-6 pb-24 md:pb-8 animate-fade-in">{children}</main>
    </div>
  );
}
