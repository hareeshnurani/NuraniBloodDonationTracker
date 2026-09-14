"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { joinCommunityByCode } from "@/lib/actions/communities";
import { PageHeader } from "@/components/ui/page-header";

export default function JoinByCodePage() {
  const params = useParams();
  const code = params.code as string;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function join() {
      const result = await joinCommunityByCode(code);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      window.location.href = `/communities/${result.communityId}`;
    }
    join();
  }, [code]);

  if (loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        <p className="mt-4 text-[15px] text-[var(--label-secondary)]">Joining community...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md text-center py-20">
      <PageHeader title="Could not join" subtitle={error} />
      <a href="/communities" className="text-[var(--accent)] hover:underline">
        Go to communities
      </a>
    </div>
  );
}
