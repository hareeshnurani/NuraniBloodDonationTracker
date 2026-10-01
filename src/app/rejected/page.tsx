import { getProfile } from "@/lib/auth";
import { SUPPORT_EMAIL } from "@/lib/constants";
import { XCircle } from "lucide-react";

export default async function RejectedPage() {
  const profile = await getProfile();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <div className="w-full max-w-md text-center animate-scale-in">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)]">
          <XCircle className="h-7 w-7 text-[var(--accent)]" />
        </div>
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">Account not approved</h1>
        <p className="mt-3 text-[15px] text-[var(--label-secondary)] leading-relaxed">
          We couldn&apos;t approve your BloodLink account at this time.
        </p>
        {profile?.rejection_reason?.trim() ? (
          <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] px-4 py-3 text-left text-[14px] leading-relaxed text-[var(--label-secondary)]">
            <span className="font-medium text-[var(--label)]">Note from our team: </span>
            {profile.rejection_reason.trim()}
          </p>
        ) : (
          <p className="mt-2 text-[15px] text-[var(--label-secondary)] leading-relaxed">
            If you think this was a mistake, you can reach out to us.
          </p>
        )}
        <p className="mt-4 text-[14px] text-[var(--label-secondary)]">
          Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-[var(--accent)] hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
