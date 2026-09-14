"use client";

import { useState } from "react";
import { confirmDonation } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GroupedSection } from "@/components/ui/grouped-list";
import { AlertTriangle } from "lucide-react";

export interface PendingConfirmationItem {
  invitation_id: string;
  patient_name: string;
}

export function PendingConfirmations({ items: initialItems }: { items: PendingConfirmationItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [showCalendar, setShowCalendar] = useState<string | null>(null);
  const [donationDate, setDonationDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleNo(invitationId: string) {
    setLoading(true);
    await confirmDonation(invitationId, false);
    setItems((prev) => prev.filter((i) => i.invitation_id !== invitationId));
    setLoading(false);
  }

  async function handleYes(invitationId: string) {
    if (!donationDate) return;
    setLoading(true);
    await confirmDonation(invitationId, true, donationDate);
    setItems((prev) => prev.filter((i) => i.invitation_id !== invitationId));
    setShowCalendar(null);
    setDonationDate("");
    setLoading(false);
  }

  if (items.length === 0) return null;

  return (
    <GroupedSection title="Donation Confirmations">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-[var(--warning)]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-[13px] font-medium">Please confirm your recent donations</p>
        </div>
        {items.map((item) => (
          <div key={item.invitation_id} className="rounded-[var(--radius-md)] bg-[var(--surface-secondary)] p-4">
            <p className="text-[15px] text-[var(--label)]">
              Did you donate blood for <strong>{item.patient_name}</strong>?
            </p>
            {showCalendar === item.invitation_id ? (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <Input
                  type="date"
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
                <Button size="sm" onClick={() => handleYes(item.invitation_id)} disabled={loading}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCalendar(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => setShowCalendar(item.invitation_id)} disabled={loading}>
                  Yes, I donated
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleNo(item.invitation_id)} disabled={loading}>
                  No
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </GroupedSection>
  );
}
