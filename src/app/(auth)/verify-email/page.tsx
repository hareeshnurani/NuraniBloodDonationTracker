import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <div className="w-full max-w-md text-center animate-scale-in">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)]">
          <Mail className="h-7 w-7 text-[var(--accent)]" />
        </div>
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">Verify your email</h1>
        <p className="mt-3 text-[15px] text-[var(--label-secondary)] leading-relaxed">
          Please check your inbox and click the verification link before continuing.
        </p>
        <Link href="/login" className="mt-6 inline-block text-[15px] font-medium text-[var(--accent)] hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
