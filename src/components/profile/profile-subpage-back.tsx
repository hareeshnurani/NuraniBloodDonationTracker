import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function ProfileSubpageBack() {
  return (
    <Link
      href="/profile"
      className="inline-flex items-center gap-1 text-[15px] font-medium text-[var(--accent)]"
    >
      <ChevronLeft className="h-4 w-4" />
      Back to Profile
    </Link>
  );
}
