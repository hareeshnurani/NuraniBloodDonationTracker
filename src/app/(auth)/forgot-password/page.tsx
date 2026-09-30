"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordReset } from "@/lib/actions/account-security";
import { authCallbackUrl } from "@/lib/app-url";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Droplets } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[var(--label-secondary)]">
          Loading…
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const result = await requestPasswordReset(email);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if ("useClientReset" in result && result.useClientReset) {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: authCallbackUrl("/reset-password") }
      );
      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }
    }

    setMessage(
      "If an account exists for that email, we sent password reset instructions. Check your inbox and spam folder."
    );
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <div className="w-full max-w-[400px] animate-scale-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--accent)] text-white">
            <Droplets className="h-7 w-7" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">Forgot password?</h1>
          <p className="mt-1.5 text-[15px] text-[var(--label-secondary)]">
            Enter your email and we&apos;ll send a link to reset your password.
          </p>
        </div>

        <div className="rounded-[var(--radius-xl)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            {error && (
              <div className="rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[var(--accent)]">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-[var(--radius-md)] bg-[var(--success-soft)] px-4 py-3 text-[14px] text-[var(--success)]">
                {message}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading || !!message}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[15px] text-[var(--label-secondary)]">
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
