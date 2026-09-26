"use client";

import { useState } from "react";
import {
  approveUser,
  rejectUser,
  adminUpdateDonationDate,
  adminSendMessage,
  setUserRole,
  suspendUser,
  reinstateUser,
  setVerifiedDonor,
} from "@/lib/actions/admin";
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

export function AdminRoleActions({
  userId,
  currentRole,
  currentUserId,
}: {
  userId: string;
  currentRole: "user" | "admin";
  currentUserId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function changeRole(role: "user" | "admin") {
    const label = role === "admin" ? "grant admin access to" : "remove admin access from";
    if (!confirm(`Are you sure you want to ${label} this user?`)) return;

    setLoading(true);
    setError("");
    const result = await setUserRole(userId, role);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    window.location.reload();
  }

  const isSelf = userId === currentUserId;

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        Current role: <strong className="capitalize">{currentRole}</strong>
        {isSelf && <span className="ml-2 text-gray-400">(you)</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {currentRole !== "admin" && (
          <Button size="sm" onClick={() => changeRole("admin")} disabled={loading}>
            Make admin
          </Button>
        )}
        {currentRole === "admin" && !isSelf && (
          <Button size="sm" variant="danger" onClick={() => changeRole("user")} disabled={loading}>
            Remove admin
          </Button>
        )}
        {currentRole === "admin" && isSelf && (
          <p className="text-xs text-gray-500">Ask another admin to remove your admin access.</p>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
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

export function AdminSuspendActions({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);

  async function suspend() {
    const reason = prompt("Reason for suspension (shown to user):");
    if (!reason) return;
    setLoading(true);
    const result = await suspendUser(userId, reason);
    if (result.error) alert(result.error);
    else window.location.reload();
  }

  async function reinstate() {
    if (!confirm("Reinstate this user to active status?")) return;
    setLoading(true);
    await reinstateUser(userId);
    window.location.reload();
  }

  if (status === "rejected" || status === "profile_incomplete") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "suspended" && (
        <Button size="sm" variant="danger" onClick={suspend} disabled={loading}>
          Suspend account
        </Button>
      )}
      {status === "suspended" && (
        <Button size="sm" onClick={reinstate} disabled={loading}>
          Reinstate user
        </Button>
      )}
    </div>
  );
}

export function AdminVerifiedDonorToggle({
  userId,
  verified,
}: {
  userId: string;
  verified: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const result = await setVerifiedDonor(userId, !verified);
    if (result.error) alert(result.error);
    else window.location.reload();
  }

  return (
    <Button size="sm" variant="secondary" onClick={toggle} disabled={loading}>
      {verified ? "Remove verified donor badge" : "Mark as verified donor"}
    </Button>
  );
}
