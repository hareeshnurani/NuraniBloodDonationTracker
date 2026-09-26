"use client";

import { useState } from "react";
import { submitContentReport } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";

export function ReportThreadButton({ threadId }: { threadId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function report() {
    const details = prompt("Optional details for moderators:");
    if (details === null) return;
    setLoading(true);
    const result = await submitContentReport("chat_thread", threadId, "harassment", details);
    setLoading(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return <p className="text-sm text-gray-600">Report submitted. An admin will review it.</p>;
  }

  return (
    <Button type="button" size="sm" variant="secondary" onClick={report} disabled={loading}>
      {loading ? "Sending..." : "Report conversation"}
    </Button>
  );
}
