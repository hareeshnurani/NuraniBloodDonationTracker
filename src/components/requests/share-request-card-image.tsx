"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "loading" | "ready" | "error";

export function ShareRequestCardImage({
  requestId,
  alt,
}: {
  requestId: string;
  alt: string;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [src, setSrc] = useState<string>("");
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    setStatus("loading");
    setSrc(`/api/requests/${requestId}/share-card?attempt=${attempt}`);
  }, [requestId, attempt]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--separator)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
      {status === "loading" && (
        <div
          className="flex aspect-[20/30] w-full flex-col items-center justify-center gap-3 bg-[var(--surface-secondary)]"
          aria-busy="true"
          aria-label="Loading appeal image"
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--separator-opaque)]" />
          <p className="text-[14px] text-[var(--label-secondary)]">Loading appeal card…</p>
        </div>
      )}
      {status === "error" && (
        <div className="flex aspect-[20/30] w-full flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-[15px] font-medium text-[var(--label)]">Image could not load</p>
          <p className="text-[13px] text-[var(--label-secondary)]">
            The summary below is still correct. Tap retry or use the link to open BloodLink.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={() => setAttempt((a) => a + 1)}>
            Retry image
          </Button>
        </div>
      )}
      {src && status !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={status === "ready" ? "block w-full" : "hidden"}
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
        />
      )}
    </div>
  );
}
