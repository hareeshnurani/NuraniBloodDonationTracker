import { Clock } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <div className="w-full max-w-md text-center animate-scale-in">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--warning-soft)]">
          <Clock className="h-7 w-7 text-[var(--warning)]" />
        </div>
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">Awaiting approval</h1>
        <p className="mt-3 text-[15px] text-[var(--label-secondary)] leading-relaxed">
          Your profile has been submitted. An administrator will review your details and approve
          your account. You will be notified once approved.
        </p>
      </div>
    </div>
  );
}
