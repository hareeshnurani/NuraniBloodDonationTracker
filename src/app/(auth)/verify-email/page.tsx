"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl } from "@/lib/app-url";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useState } from "react";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setMessage("Sign in again, then return here to resend verification.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: authCallbackUrl("/onboarding") },
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage("Verification email sent — check your inbox.");
  }

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
        {message && (
          <p className="mt-4 text-[14px] text-[var(--label-secondary)]">{message}</p>
        )}
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
