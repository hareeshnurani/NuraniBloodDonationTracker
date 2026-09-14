"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Droplets } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    window.location.href = "/home";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <div className="w-full max-w-[400px] animate-scale-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--accent)] text-white">
            <Droplets className="h-7 w-7" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">Welcome back</h1>
          <p className="mt-1.5 text-[15px] text-[var(--label-secondary)]">Sign in to BloodLink</p>
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
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <div className="rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[var(--accent)]">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[15px] text-[var(--label-secondary)]">
          No account?{" "}
          <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
