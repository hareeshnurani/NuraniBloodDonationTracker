"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Droplets, Mail } from "lucide-react";
import { authCallbackUrl } from "@/lib/app-url";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: authCallbackUrl("/onboarding"),
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
        <div className="w-full max-w-[400px] text-center animate-scale-in">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-soft)]">
            <Mail className="h-7 w-7 text-[var(--success)]" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">Check your email</h1>
          <p className="mt-3 text-[15px] text-[var(--label-secondary)] leading-relaxed">
            We sent a verification link to{" "}
            <span className="font-medium text-[var(--label)]">{email}</span>.
            Click it to continue registration.
          </p>
          <Link href="/login" className="mt-6 inline-block text-[15px] font-medium text-[var(--accent)] hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <div className="w-full max-w-[400px] animate-scale-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--accent)] text-white">
            <Droplets className="h-7 w-7" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">Create account</h1>
          <p className="mt-1.5 text-[15px] text-[var(--label-secondary)]">
            Join BloodLink to request or donate blood
          </p>
        </div>

        <div className="rounded-[var(--radius-xl)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>
            {error && (
              <div className="rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[var(--accent)]">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[15px] text-[var(--label-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
