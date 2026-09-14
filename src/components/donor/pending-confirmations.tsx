"use client";

import { useState } from "react";
import { confirmDonation } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { GroupedSection } from "@/components/ui/grouped-list";
import { Heart } from "lucide-react";

export interface PendingConfirmationItem {
  invitation_id: string;
  patient_name: string;
}

export function PendingConfirmations({ items: initialItems }: { items: PendingConfirmationItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [step, setStep] = useState<"question" | "yes-date" | "no-reason">("question");
  const [donationDate, setDonationDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setActiveItem(null);
    setStep("question");
    setDonationDate("");
    setReason("");
    setError("");
  }

  async function handleNo(invitationId: string) {
    if (!reason.trim()) {
      setError("Please enter a reason");
      return;
    }
    setLoading(true);
    setError("");
    const result = await confirmDonation(invitationId, false, undefined, reason);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setItems((prev) => prev.filter((i) => i.invitation_id !== invitationId));
    resetForm();
    setLoading(false);
    window.location.reload();
  }

  async function handleYes(invitationId: string) {
    if (!donationDate) {
      setError("Please select the donation date");
      return;
    }
    setLoading(true);
    setError("");
    const result = await confirmDonation(invitationId, true, donationDate);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setItems((prev) => prev.filter((i) => i.invitation_id !== invitationId));
    resetForm();
    setLoading(false);
    window.location.reload();
  }

  if (items.length === 0) return null;

  return (
    <GroupedSection>
      <div className="p-4 space-y-4">
        {items.map((item) => {
          const isActive = activeItem === item.invitation_id;
          return (
            <div
              key={item.invitation_id}
              className="rounded-[var(--radius-lg)] border-2 border-[var(--accent)] bg-[var(--accent-soft)] p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                  <Heart className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-semibold text-[var(--label)] leading-snug">
                    Have you completed the donation to{" "}
                    <span className="text-[var(--accent)]">{item.patient_name}</span>?
                  </p>
                  <p className="text-[13px] text-[var(--label-secondary)] mt-1">
                    Let us know so we can update your donation record and eligibility.
                  </p>

                  {isActive && step === "yes-date" ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-[13px] font-medium text-[var(--label)]">
                          When did you donate?
                        </label>
                        <Input
                          type="date"
                          value={donationDate}
                          onChange={(e) => setDonationDate(e.target.value)}
                          max={new Date().toISOString().split("T")[0]}
                          className="mt-1.5"
                        />
                      </div>
                      {error && <p className="text-[13px] text-red-600">{error}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleYes(item.invitation_id)} disabled={loading}>
                          {loading ? "Saving..." : "Confirm donation"}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={resetForm} disabled={loading}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : isActive && step === "no-reason" ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-[13px] font-medium text-[var(--label)]">
                          Please tell us why you could not donate
                        </label>
                        <Textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. health issue, schedule conflict, patient no longer needed..."
                          rows={3}
                          className="mt-1.5"
                        />
                      </div>
                      {error && <p className="text-[13px] text-red-600">{error}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleNo(item.invitation_id)} disabled={loading}>
                          {loading ? "Saving..." : "Submit"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={resetForm} disabled={loading}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveItem(item.invitation_id);
                          setStep("yes-date");
                          setError("");
                        }}
                        disabled={loading}
                      >
                        Yes, I donated
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setActiveItem(item.invitation_id);
                          setStep("no-reason");
                          setError("");
                        }}
                        disabled={loading}
                      >
                        No, not yet
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GroupedSection>
  );
}
