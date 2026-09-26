"use client";

import { useState } from "react";
import { shareRequestText, shareRequestUrl, type ShareableRequest } from "@/lib/request-share";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SharePayload = Pick<
  ShareableRequest,
  | "id"
  | "patient_name"
  | "primary_blood_group"
  | "priority"
  | "units_needed"
  | "units_filled"
  | "deadline"
  | "hospital_notes"
  | "location_district"
  | "location_state"
  | "pincode"
  | "status"
>;

export function RequestShareButton({
  request,
  variant = "default",
  className,
}: {
  request: SharePayload;
  variant?: "default" | "compact";
  className?: string;
}) {
  const [sharing, setSharing] = useState(false);
  const [hint, setHint] = useState("");

  async function handleShare(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setSharing(true);
    setHint("");

    const origin = window.location.origin;
    const url = shareRequestUrl(origin, request.id);
    const text = `${shareRequestText(request as ShareableRequest)}\n${url}`;

    try {
      const cardRes = await fetch(`/api/requests/${request.id}/share-card`);
      if (!cardRes.ok) throw new Error("Could not load share image");

      const blob = await cardRes.blob();
      const file = new File([blob], `bloodlink-${request.id.slice(0, 8)}.png`, {
        type: "image/png",
      });

      const shareData: ShareData = {
        title: `Blood needed — ${request.primary_blood_group}`,
        text: shareRequestText(request as ShareableRequest),
        url,
      };

      if (typeof navigator !== "undefined" && navigator.share) {
        if (navigator.canShare?.({ ...shareData, files: [file] })) {
          await navigator.share({ ...shareData, files: [file] });
        } else {
          await navigator.share(shareData);
        }
      } else {
        await navigator.clipboard.writeText(text);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
        setHint("Link copied · image downloaded");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        setHint("Link copied to clipboard");
      } catch {
        setHint("Share failed — try again");
      }
    } finally {
      setSharing(false);
    }
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <button
          type="button"
          aria-label="Share request"
          disabled={sharing}
          onClick={handleShare}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            "bg-[#5856d6] text-white shadow-[var(--shadow-sm)]",
            "transition-transform hover:bg-[#4b49c9] active:scale-95 disabled:opacity-50"
          )}
        >
          <Share2 className="h-4 w-4" />
        </button>
        {hint && (
          <span className="mt-1 max-w-[7rem] text-center text-[10px] text-[var(--label-secondary)]">
            {hint}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        type="button"
        disabled={sharing}
        onClick={handleShare}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5",
          "bg-[#5856d6] text-[15px] font-medium text-white shadow-[var(--shadow-sm)]",
          "transition-all hover:bg-[#4b49c9] active:scale-[0.98] disabled:opacity-50"
        )}
      >
        <Share2 className="h-4 w-4" />
        {sharing ? "Preparing…" : "Share request"}
      </button>
      {hint && <p className="text-[12px] text-[var(--label-secondary)]">{hint}</p>}
    </div>
  );
}
