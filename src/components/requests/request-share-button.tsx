"use client";

import { useCallback, useEffect, useState } from "react";
import { shareRequestText, shareRequestUrl, type ShareableRequest } from "@/lib/request-share";
import { Share2, X, Link2, Download } from "lucide-react";
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

function canUseWebShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

async function loadShareCardBlob(requestId: string): Promise<Blob> {
  const cardRes = await fetch(`/api/requests/${requestId}/share-card`, {
    cache: "force-cache",
  });
  if (!cardRes.ok) {
    const detail = await cardRes.text().catch(() => "");
    throw new Error(detail || "Could not load share image");
  }
  const blob = await cardRes.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("Share image unavailable");
  }
  return blob;
}

async function invokeNativeShare(opts: {
  title: string;
  message: string;
  url: string;
  file: File | null;
}) {
  const { title, message, url, file } = opts;

  if (!canUseWebShare()) return false;

  const attempts: ShareData[] = [];

  if (file) {
    attempts.push({ files: [file], title, text: message });
  }
  attempts.push({ url, title, text: message });
  attempts.push({ title, text: `${message}\n${url}` });

  for (const data of attempts) {
    try {
      if (navigator.canShare && !navigator.canShare(data)) continue;
      await navigator.share(data);
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
    }
  }

  return false;
}

function ShareFallbackSheet({
  open,
  onClose,
  url,
  message,
  file,
  onNativeShare,
  sharing,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  message: string;
  file: File | null;
  onNativeShare: () => void;
  sharing: boolean;
}) {
  const [hint, setHint] = useState("");

  if (!open) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${message}\n${url}`);
      setHint("Copied to clipboard");
    } catch {
      setHint("Could not copy — select and copy the link manually");
    }
  }

  function downloadImage() {
    if (!file) {
      setHint("Image still loading — try again in a moment");
      return;
    }
    const href = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = href;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(href);
    setHint("Image downloaded — attach it in WhatsApp Status or chat");
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
          <h2 className="text-[17px] font-semibold text-[var(--label)]">Share request</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-secondary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-[14px] leading-relaxed text-[var(--label-secondary)]">
          Share the BloodLink appeal card and link. On your phone, use <strong>Share</strong> to pick
          WhatsApp, Messages, or another app.
        </p>
        <div className="flex flex-col gap-2">
          {canUseWebShare() && (
            <Button type="button" className="w-full gap-2" disabled={sharing} onClick={onNativeShare}>
              <Share2 className="h-4 w-4" />
              {sharing ? "Opening…" : "Share…"}
            </Button>
          )}
          <Button type="button" variant="secondary" className="w-full gap-2" onClick={copyLink}>
            <Link2 className="h-4 w-4" />
            Copy link & text
          </Button>
          <Button type="button" variant="secondary" className="w-full gap-2" onClick={downloadImage}>
            <Download className="h-4 w-4" />
            Download appeal image
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
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inlineHint, setInlineHint] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");

  const title = `Blood needed — ${request.primary_blood_group}`;
  const message = shareRequestText(request as ShareableRequest);

  const prefetchCard = useCallback(async () => {
    try {
      const blob = await loadShareCardBlob(request.id);
      setCardFile(
        new File([blob], `bloodlink-${request.id.slice(0, 8)}.png`, { type: "image/png" })
      );
      setCardReady(true);
    } catch {
      setCardReady(false);
      setCardFile(null);
    }
  }, [request.id]);

  useEffect(() => {
    void prefetchCard();
  }, [prefetchCard]);

  async function runShare() {
    const origin = window.location.origin;
    const url = shareRequestUrl(origin, request.id);
    const fullMessage = `${message}\n${url}`;

    setSharing(true);
    setInlineHint("");

    try {
      let file = cardFile;
      if (!file) {
        const blob = await loadShareCardBlob(request.id);
        file = new File([blob], `bloodlink-${request.id.slice(0, 8)}.png`, { type: "image/png" });
        setCardFile(file);
        setCardReady(true);
      }

      if (canUseWebShare() && file) {
        const shared = await invokeNativeShare({ title, message: fullMessage, url, file });
        if (shared) {
          setSheetOpen(false);
          return;
        }
      }

      setSheetUrl(url);
      setSheetOpen(true);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setSheetUrl(shareRequestUrl(window.location.origin, request.id));
      setSheetOpen(true);
    } finally {
      setSharing(false);
    }
  }

  async function handleShareClick(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    void prefetchCard();
    await runShare();
  }

  async function handleSheetNativeShare() {
    const origin = window.location.origin;
    const url = shareRequestUrl(origin, request.id);
    const fullMessage = `${message}\n${url}`;
    setSharing(true);
    try {
      const shared = await invokeNativeShare({
        title,
        message: fullMessage,
        url,
        file: cardFile,
      });
      if (shared) setSheetOpen(false);
      else setInlineHint("Could not open share menu — use copy or download below");
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setInlineHint("Share cancelled or blocked");
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
            onTouchStart={() => void prefetchCard()}
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
            onTouchStart={() => void prefetchCard()}
            onClick={handleShareClick}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5",
              "bg-[#5856d6] text-[15px] font-medium text-white shadow-[var(--shadow-sm)]",
              "transition-all hover:bg-[#4b49c9] active:scale-[0.98] disabled:opacity-50"
            )}
          >
            <Share2 className="h-4 w-4" />
            {sharing ? "Preparing…" : "Share request"}
          </button>
          {inlineHint && <p className="text-[12px] text-[var(--label-secondary)]">{inlineHint}</p>}
        </div>
      )}

      <ShareFallbackSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        url={sheetUrl}
        message={sheetUrl ? `${message}\n${sheetUrl}` : message}
        file={cardFile}
        onNativeShare={handleSheetNativeShare}
        sharing={sharing}
      />
    </>
  );
}
