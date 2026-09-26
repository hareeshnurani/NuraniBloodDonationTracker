import Link from "next/link";
import { Droplets } from "lucide-react";

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--accent-soft)] text-[var(--accent)]">
          <Droplets className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--label)]">Account suspended</h1>
        <p className="mt-3 text-[15px] text-[var(--label-secondary)]">
          Your BloodLink account has been suspended after a safety review. If you believe this is a mistake, contact
          the project administrator.
        </p>
        <Link href="/login" className="mt-6 inline-block text-[15px] font-medium text-[var(--accent)] hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
