"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Droplets,
  Bell,
  MessageCircle,
  User,
  Users,
  Shield,
  LogOut,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MobileMoreSheet } from "./mobile-more-sheet";

const desktopLinks = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/communities", label: "Groups", icon: Users },
  { href: "/donor/invites", label: "Donor", icon: Droplets },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

const mobileTabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/donor/invites", label: "Donor", icon: Droplets },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

export function AppNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/requests/new") ||
    pathname.startsWith("/admin");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--separator)] pt-[env(safe-area-inset-top)] lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href="/home" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--accent)] text-white">
              <Droplets className="h-4 w-4" />
            </div>
            <span className="text-[17px] font-semibold text-[var(--label)]">BloodLink</span>
          </Link>

          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "bg-[var(--surface-secondary)] text-[var(--label-secondary)]"
                )}
                aria-label="Admin"
              >
                <Shield className="h-[18px] w-[18px]" />
              </Link>
            )}
            <Link
              href="/requests/new"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-white active:scale-95 transition-transform"
              aria-label="New request"
            >
              <Plus className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--separator)] hidden lg:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/home" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--accent)] text-white">
              <Droplets className="h-4 w-4" />
            </div>
            <span className="text-[17px] font-semibold text-[var(--label)]">BloodLink</span>
          </Link>

          <nav className="flex items-center gap-1">
            {desktopLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                prefetch={true}
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

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--separator)] pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Main navigation"
      >
        <div className="flex items-stretch">
          {mobileTabs.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={cn(
                  "flex min-h-[50px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors",
                  active ? "text-[var(--accent)]" : "text-[var(--label-tertiary)]"
                )}
              >
                <Icon className={cn("h-[22px] w-[22px]", active && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-[50px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors",
              moreActive ? "text-[var(--accent)]" : "text-[var(--label-tertiary)]"
            )}
          >
            <MoreHorizontal className={cn("h-[22px] w-[22px]", moreActive && "stroke-[2.5]")} />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} isAdmin={isAdmin} />
    </>
  );
}
