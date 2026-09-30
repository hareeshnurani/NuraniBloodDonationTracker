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
        "bg-[var(--accent)] text-white shadow-[var(--shadow-md)]",
        "transition-transform active:scale-95 hover:bg-[var(--accent-hover)]",
        "right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))]",
        "lg:right-[max(1rem,calc((100vw-640px)/2+1rem))] lg:bottom-8"
      )}
    >
      <Plus className="h-7 w-7 stroke-[2.5]" />
    </Link>
  );
}
