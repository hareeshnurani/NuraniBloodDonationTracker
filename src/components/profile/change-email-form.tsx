"use client";

import { useState } from "react";
import { updateAccountEmail } from "@/lib/actions/account-security";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { GroupedSection } from "@/components/ui/grouped-list";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const result = await updateAccountEmail(newEmail);
    setLoading(false);
    if (result.error) setMessage(result.error);
    else {
      setMessage(result.message ?? "Check your email to confirm the change.");
      setNewEmail("");
    }
  }

  return (
    <GroupedSection>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <p className="text-[13px] text-[var(--label-secondary)]">
          Current email: <span className="font-medium text-[var(--label)]">{currentEmail}</span>
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
        {message && (
          <p
            className={`text-[13px] ${
              message.includes("confirm") || message.includes("sent")
                ? "text-[var(--success)]"
                : "text-[var(--accent)]"
            }`}
          >
            {message}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Send confirmation link"}
        </Button>
      </form>
    </GroupedSection>
  );
}
