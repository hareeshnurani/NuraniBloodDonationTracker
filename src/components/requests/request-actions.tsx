"use client";

import { useState } from "react";
import {
  closeBloodRequest,
  extendDeadline,
  publishBloodRequest,
} from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

interface Props {
  requestId: string;
  status: string;
  canExtend: boolean;
}

export function RequestActions({ requestId, status, canExtend }: Props) {
  const [showClose, setShowClose] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [reason, setReason] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePublish() {
    setLoading(true);
    await publishBloodRequest(requestId);
    window.location.reload();
  }

  async function handleClose() {
    setLoading(true);
    setError("");
    const result = await closeBloodRequest(requestId, reason);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    window.location.reload();
  }

  async function handleExtend() {
    setLoading(true);
    setError("");
    const result = await extendDeadline(requestId, new Date(newDeadline).toISOString());
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      {status === "draft" && (
        <Button onClick={handlePublish} disabled={loading}>Publish request</Button>
      )}
      {["open", "partially_filled"].includes(status) && (
        <>
          <Button variant="danger" onClick={() => setShowClose(true)} disabled={loading}>
            Close request
          </Button>
          {canExtend && (
            <Button variant="secondary" onClick={() => setShowExtend(true)} disabled={loading}>
              Extend deadline
            </Button>
          )}
        </>
      )}
      {showClose && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Reason for closing *</p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Found remaining donors offline"
            className="mt-2"
            rows={3}
          />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleClose} disabled={loading || !reason.trim()}>
              Confirm close
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowClose(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {showExtend && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">New deadline</p>
          <Input
            type="datetime-local"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            className="mt-2"
          />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleExtend} disabled={loading || !newDeadline}>
              Extend
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowExtend(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
