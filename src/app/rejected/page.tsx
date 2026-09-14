import { getProfile } from "@/lib/auth";
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
          {profile?.rejection_reason || "Your registration was not approved by an administrator."}
        </p>
      </div>
    </div>
  );
}
