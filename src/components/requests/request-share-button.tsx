"use client";

import { useCallback, useState } from "react";
import type { ShareableRequest } from "@/lib/request-share";
import { getAppUrl } from "@/lib/app-url";
import {
  buildSharePosterPayload,
  canUseWebShare,
  copyShareText,
  shareRequestLink,
  shareRequestLinkOnWhatsApp,
  shareSuccessHint,
} from "@/lib/share-native";
import { Share2, X, Link2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

function ShareFallbackSheet({
  open,
  onClose,
  payload,
  onShareLink,
  onWhatsApp,
  sharing,
}: {
  open: boolean;
  onClose: () => void;
  payload: { captionWithLink: string; url: string } | null;
  onShareLink: () => void;
  onWhatsApp: () => void;
  sharing: boolean;
}) {
  const [hint, setHint] = useState("");

  if (!open || !payload) return null;

  const { captionWithLink, url } = payload;

  async function copyAll() {
    const ok = await copyShareText(captionWithLink);
    setHint(ok ? "Copied appeal and link" : "Could not copy — use the link below");
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-[20px] bg-[var(--surface)] p-5 shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-xl)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[var(--label)]">Share blood appeal</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-secondary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-[14px] leading-relaxed text-[var(--label-secondary)]">
          Share the <strong>message and link</strong>. When someone taps the link, they see the{" "}
          <strong>poster</strong> and can respond on BloodLink.
        </p>
        <div className="flex flex-col gap-2">
          {canUseWebShare() && (
            <Button type="button" className="w-full gap-2" disabled={sharing} onClick={onShareLink}>
              <Share2 className="h-4 w-4" />
              {sharing ? "Opening…" : "Share link"}
            </Button>
          )}
          <Button type="button" variant="tinted" className="w-full gap-2" disabled={sharing} onClick={onWhatsApp}>
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button type="button" variant="secondary" className="w-full gap-2" onClick={copyAll}>
            <Link2 className="h-4 w-4" />
            Copy message & link
          </Button>
        </div>
        {hint && <p className="mt-3 text-[13px] text-[var(--success)]">{hint}</p>}
        <p className="mt-3 break-all text-[11px] text-[var(--label-tertiary)]">{url}</p>
      </div>
    </div>
  );
}

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inlineHint, setInlineHint] = useState("");
  const [sheetPayload, setSheetPayload] = useState<ReturnType<
    typeof buildSharePosterPayload
  > | null>(null);

  const getPayload = useCallback(
    () => buildSharePosterPayload(request as ShareableRequest, getAppUrl()),
    [request]
  );

  async function runShareLink() {
    const payload = getPayload();
    const result = await shareRequestLink(payload);
    setInlineHint(shareSuccessHint(result));
    return result;
  }

  async function runShare() {
    const payload = getPayload();
    setSharing(true);
    setInlineHint("");
    setSheetPayload(payload);

    try {
      const result = await runShareLink();
      if (result?.shared) {
        setSheetOpen(false);
        return;
      }
      setSheetOpen(true);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setSheetOpen(true);
    } finally {
      setSharing(false);
    }
  }

  function handleWhatsAppShare() {
    const payload = getPayload();
    setSharing(true);
    try {
      const result = shareRequestLinkOnWhatsApp(payload);
      setInlineHint(shareSuccessHint(result));
      setSheetOpen(false);
    } finally {
      setSharing(false);
    }
  }

  async function handleShareClick(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    await runShare();
  }

  async function handleSheetShareLink() {
    setSharing(true);
    try {
      const result = await runShareLink();
      if (result?.shared) setSheetOpen(false);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setInlineHint("Could not share — try WhatsApp or copy");
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      {variant === "compact" ? (
        <div className={cn("flex flex-col items-center", className)}>
          <button
            type="button"
            aria-label="Share request"
            disabled={sharing}
            onClick={handleShareClick}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              "bg-[#5856d6] text-white shadow-[var(--shadow-sm)]",
              "transition-transform hover:bg-[#4b49c9] active:scale-95 disabled:opacity-50"
            )}
          >
            <Share2 className="h-4 w-4" />
          </button>
          {inlineHint && (
            <span className="mt-1 max-w-[7rem] text-center text-[10px] text-[var(--label-secondary)]">
              {inlineHint}
            </span>
          )}
        </div>
      ) : (
        <div className={cn("flex flex-col gap-1", className)}>
          <button
            type="button"
            disabled={sharing}
            onClick={handleShareClick}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5",
              "bg-[#5856d6] text-[15px] font-medium text-white shadow-[var(--shadow-sm)]",
              "transition-all hover:bg-[#4b49c9] active:scale-[0.98] disabled:opacity-50"
            )}
          >
            <Share2 className="h-4 w-4" />
            {sharing ? "Sharing…" : "Share appeal link"}
          </button>
          {inlineHint && <p className="text-[12px] text-[var(--label-secondary)]">{inlineHint}</p>}
          <p className="text-[11px] leading-snug text-[var(--label-tertiary)]">
            Message includes the link; opening it shows the poster.
          </p>
        </div>
      )}

      <ShareFallbackSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        payload={sheetPayload}
        onShareLink={handleSheetShareLink}
        onWhatsApp={handleWhatsAppShare}
        sharing={sharing}
      />
    </>
  );
}
