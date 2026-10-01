"use client";

import { useState } from "react";
import { updateAccountPassword } from "@/lib/actions/account-security";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { GroupedSection } from "@/components/ui/grouped-list";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    const result = await updateAccountPassword(password);
    setLoading(false);
    if (result.error) setMessage(result.error);
    else {
      setMessage(result.message ?? "Password updated.");
      setPassword("");
      setPasswordConfirm("");
    }
  }

  return (
    <GroupedSection
      footer="Use Forgot password on the sign-in page if you are locked out."
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <Label htmlFor="new_password">New password</Label>
          <Input
            id="new_password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <Label htmlFor="new_password_confirm">Confirm new password</Label>
          <Input
            id="new_password_confirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
        </div>
        {message && (
          <p
            className={`text-[13px] ${
              message.includes("updated") ? "text-[var(--success)]" : "text-[var(--accent)]"
            }`}
          >
            {message}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </GroupedSection>
  );
}
