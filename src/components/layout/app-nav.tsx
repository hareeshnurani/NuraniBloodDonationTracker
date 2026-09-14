"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Droplets,
  Bell,
  MessageCircle,
  User,
  Shield,
  LogOut,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/donor/invites", label: "Donor", icon: Droplets },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-[var(--separator)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/home" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--accent)] text-white">
              <Droplets className="h-4.5 w-4.5" />
            </div>
            <span className="text-[17px] font-semibold text-[var(--label)]">BloodLink</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition-all duration-200",
                  pathname.startsWith(href)
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--label-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--label)]"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition-all duration-200",
                  pathname.startsWith("/admin")
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--label-secondary)] hover:bg-[var(--surface-secondary)]"
                )}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            <div className="mx-1 h-5 w-px bg-[var(--separator)]" />
            <Link href="/requests/new">
              <button className="flex items-center gap-1.5 rounded-[10px] bg-[var(--accent)] px-3.5 py-2 text-[13px] font-medium text-white transition-all hover:bg-[var(--accent-hover)] active:scale-[0.98]">
                <Plus className="h-4 w-4" />
                Request
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] text-[var(--label-secondary)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--label)]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--separator)] pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex items-stretch">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors",
                  active ? "text-[var(--accent)]" : "text-[var(--label-tertiary)]"
                )}
              >
                <Icon className={cn("h-[22px] w-[22px]", active && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
