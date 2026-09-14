"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Shield, Plus, LogOut, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MobileMoreSheetProps {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function MobileMoreSheet({ open, onClose, isAdmin }: MobileMoreSheetProps) {
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!open) return null;

  const items = [
    { href: "/profile", label: "Profile", icon: User, description: "Account & donor settings" },
    { href: "/requests/new", label: "New Request", icon: Plus, description: "Request blood for a patient" },
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: Shield, description: "Manage users & requests" }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 animate-fade-in rounded-t-[20px] bg-[var(--surface)] pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between border-b border-[var(--separator)] px-5 py-4">
          <h2 className="text-[17px] font-semibold text-[var(--label)]">More</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--label-secondary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3">
          {items.map(({ href, label, icon: Icon, description }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-[14px] px-4 py-3.5 transition-colors active:bg-[var(--surface-secondary)]",
                  active && "bg-[var(--accent-soft)]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-[12px]",
                    active ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-secondary)] text-[var(--label-secondary)]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className={cn("text-[16px] font-medium", active ? "text-[var(--accent)]" : "text-[var(--label)]")}>
                    {label}
                  </p>
                  <p className="text-[13px] text-[var(--label-secondary)]">{description}</p>
                </div>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5 text-left transition-colors active:bg-[var(--surface-secondary)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--accent-soft)] text-[var(--accent)]">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[16px] font-medium text-[var(--accent)]">Log out</p>
              <p className="text-[13px] text-[var(--label-secondary)]">Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
