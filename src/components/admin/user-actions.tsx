"use client";

import { useState } from "react";
import { approveUser, rejectUser, adminUpdateDonationDate, adminSendMessage } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function UserApprovalActions({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  async function approve() {
    setLoading(true);
    await approveUser(userId);
    window.location.reload();
  }

  async function reject() {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    setLoading(true);
    await rejectUser(userId, reason);
    window.location.reload();
  }

  return (
    <div className="flex gap-2">
      <Button onClick={approve} disabled={loading}>Approve</Button>
      <Button variant="danger" onClick={reject} disabled={loading}>Reject</Button>
    </div>
  );
}

export function AdminDonorDateEditor({
  userId,
  currentDate,
}: {
  userId: string;
  currentDate: string | null;
}) {
  const [date, setDate] = useState(currentDate ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await adminUpdateDonationDate(userId, date || null);
    window.location.reload();
  }

  return (
    <div className="flex items-end gap-2">
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Button size="sm" onClick={save} disabled={loading}>Update</Button>
    </div>
  );
}

export function AdminMessageForm({ userId }: { userId: string }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!body.trim()) return;
    setLoading(true);
    await adminSendMessage(userId, body);
    setBody("");
    setLoading(false);
    alert("Message sent.");
  }

  return (
    <div className="space-y-2">
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message to user..." rows={3} />
      <Button size="sm" onClick={send} disabled={loading}>Send message</Button>
    </div>
  );
}
