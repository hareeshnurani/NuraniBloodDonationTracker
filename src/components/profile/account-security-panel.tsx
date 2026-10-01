"use client";

import { useState } from "react";
import { updateAccountEmail, updateAccountPassword } from "@/lib/actions/account-security";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { GroupedSection } from "@/components/ui/grouped-list";
import { KeyRound, Mail } from "lucide-react";

export function AccountSecurityPanel({ currentEmail }: { currentEmail: string }) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setPasswordMsg("Passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg("");
    const result = await updateAccountPassword(password);
    setPasswordLoading(false);
    if (result.error) setPasswordMsg(result.error);
    else {
      setPasswordMsg(result.message ?? "Password updated.");
      setPassword("");
      setPasswordConfirm("");
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMsg("");
    const result = await updateAccountEmail(newEmail);
    setEmailLoading(false);
    if (result.error) setEmailMsg(result.error);
    else {
      setEmailMsg(result.message ?? "Check your email to confirm the change.");
      setNewEmail("");
    }
  }

  return (
    <GroupedSection
      title="Sign-in & security"
      footer="Use Forgot password on the sign-in page if you are locked out."
    >
      <div className="space-y-6 p-4">
        <form onSubmit={handlePassword} className="space-y-3 border-b border-[var(--separator)] pb-6">
          <div className="flex items-center gap-2 text-[15px] font-medium text-[var(--label)]">
            <KeyRound className="h-4 w-4 text-[var(--accent)]" />
            Change password
          </div>
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
          {passwordMsg && (
            <p
              className={`text-[13px] ${
                passwordMsg.includes("updated") ? "text-[var(--success)]" : "text-[var(--accent)]"
              }`}
            >
              {passwordMsg}
            </p>
          )}
          <Button type="submit" variant="secondary" disabled={passwordLoading} className="w-full sm:w-auto">
            {passwordLoading ? "Updating…" : "Update password"}
          </Button>
        </form>

        <form onSubmit={handleEmail} className="space-y-3">
          <div className="flex items-center gap-2 text-[15px] font-medium text-[var(--label)]">
            <Mail className="h-4 w-4 text-[var(--accent)]" />
            Change email
          </div>
          <p className="text-[13px] text-[var(--label-secondary)]">
            Current: {currentEmail}
          </p>
          <div>
            <Label htmlFor="new_email">New email address</Label>
            <Input
              id="new_email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              autoComplete="email"
              required
            />
          </div>
          {emailMsg && (
            <p
              className={`text-[13px] ${
                emailMsg.includes("confirm") ? "text-[var(--success)]" : "text-[var(--accent)]"
              }`}
            >
              {emailMsg}
            </p>
          )}
          <Button type="submit" variant="secondary" disabled={emailLoading} className="w-full sm:w-auto">
            {emailLoading ? "Sending…" : "Update email"}
          </Button>
        </form>
      </div>
    </GroupedSection>
  );
}
