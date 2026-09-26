"use client";

import { useState } from "react";
import { adminForceCloseRequest } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function AdminForceCloseButton({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);

  async function closeRequest() {
    const reason = prompt("Reason for closing this request (sent to requester):");
    if (!reason?.trim()) return;
    setLoading(true);
    const result = await adminForceCloseRequest(requestId, reason);
    setLoading(false);
    if (result.error) alert(result.error);
    else window.location.reload();
  }

  return (
    <Button type="button" size="sm" variant="danger" onClick={closeRequest} disabled={loading}>
      {loading ? "Closing..." : "Force close"}
    </Button>
  );
}
