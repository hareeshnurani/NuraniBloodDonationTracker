"use client";

import { useState } from "react";
import { submitContentReport } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportThreadButton({
  threadId,
  variant = "default",
}: {
  threadId: string;
  variant?: "default" | "onDark";
}) {
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
    return (
      <span className={cn("text-[12px]", variant === "onDark" ? "text-white/80" : "text-[var(--label-secondary)]")}>
        Reported
      </span>
    );
  }

  if (variant === "onDark") {
    return (
      <button
        type="button"
        onClick={report}
        disabled={loading}
        aria-label="Report conversation"
        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-50"
      >
        <Flag className="h-5 w-5" />
      </button>
    );
  }

  return (
    <Button type="button" size="sm" variant="secondary" onClick={report} disabled={loading}>
      {loading ? "Sending..." : "Report conversation"}
    </Button>
  );
}
