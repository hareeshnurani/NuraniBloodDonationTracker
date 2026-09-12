"use client";

import { useState } from "react";
import { confirmDonation } from "@/lib/actions/profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <Card className="border-amber-200 bg-amber-50">
      <h2 className="font-semibold text-amber-900">Pending donation confirmations</h2>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <div key={item.invitation_id} className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-700">
              Did you donate blood for the request &quot;{item.patient_name}&quot; which was
              accepted by you?
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
                <Button
                  size="sm"
                  onClick={() => setShowCalendar(item.invitation_id)}
                  disabled={loading}
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleNo(item.invitation_id)}
                  disabled={loading}
                >
                  No
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
