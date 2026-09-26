import Link from "next/link";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export function GroupsCreateFab() {
  return (
    <Link
      href="/communities/new"
      aria-label="Create group"
      className={cn(
        "fixed z-40 flex h-14 w-14 items-center justify-center rounded-full",
        "bg-[#25D366] text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)]",
        "transition-transform active:scale-95 hover:brightness-105",
        "right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))]",
        "lg:right-[max(1rem,calc((100vw-640px)/2+1rem))] lg:bottom-8"
      )}
    >
      <Plus className="h-7 w-7 stroke-[2.5]" />
    </Link>
  );
}
