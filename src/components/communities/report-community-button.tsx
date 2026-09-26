"use client";

import { useState } from "react";
import { submitContentReport } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";

export function ReportCommunityButton({ communityId }: { communityId: string }) {
  const [loading, setLoading] = useState(false);

  async function report() {
    const details = prompt("Why are you reporting this community?");
    if (details === null) return;
    setLoading(true);
    const result = await submitContentReport("community", communityId, "spam", details);
    setLoading(false);
    if (result.error) alert(result.error);
    else alert("Report submitted. An admin will review it.");
  }

  return (
    <Button type="button" size="sm" variant="secondary" onClick={report} disabled={loading}>
      Report community
    </Button>
  );
}
