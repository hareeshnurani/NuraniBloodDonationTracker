"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  resendVerificationEmail,
  resendVerificationEmailForAddress,
} from "@/lib/actions/verify-email";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[var(--label-secondary)]">
          Loading…
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";
  const [email, setEmail] = useState(emailFromQuery);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setSignedIn(!!user));
  }, []);

  async function resend() {
    setLoading(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const result = user?.email
      ? await resendVerificationEmail()
      : await resendVerificationEmailForAddress(email || emailFromQuery);

    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    setMessage(result.message ?? "Verification email sent — check your inbox.");
  }

  const showEmailField = !signedIn && !emailFromQuery;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <div className="w-full max-w-md text-center animate-scale-in">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)]">
          <Mail className="h-7 w-7 text-[var(--accent)]" />
        </div>
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">Verify your email</h1>
        <p className="mt-3 text-[15px] text-[var(--label-secondary)] leading-relaxed">
          {emailFromQuery ? (
            <>
              We sent a confirmation link to{" "}
              <span className="font-medium text-[var(--label)]">{emailFromQuery}</span>. Open it to
              continue, then sign in.
            </>
          ) : (
            <>Please check your inbox and click the verification link before using BloodLink.</>
          )}
        </p>

        {showEmailField && (
          <div className="mt-6 text-left">
            <Label htmlFor="resend_email">Email address</Label>
            <Input
              id="resend_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5"
            />
          </div>
        )}

        {message && <p className="mt-4 text-[14px] text-[var(--success)]">{message}</p>}
        {error && <p className="mt-4 text-[14px] text-[var(--accent)]">{error}</p>}

        <div className="mt-6 flex flex-col gap-3">
          <Button type="button" variant="secondary" disabled={loading} onClick={() => void resend()}>
            {loading ? "Sending…" : "Resend verification email"}
          </Button>
          <Link href="/login" className="text-[15px] font-medium text-[var(--accent)] hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
