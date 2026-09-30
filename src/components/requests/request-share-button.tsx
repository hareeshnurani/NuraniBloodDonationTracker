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

async function loadShareCardBlob(requestId: string, attempt = 0): Promise<Blob> {
  const cardRes = await fetch(`/api/requests/${requestId}/share-card?attempt=${attempt}`, {
    cache: "no-store",
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

async function loadShareCardBlobWithRetry(requestId: string): Promise<Blob> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await loadShareCardBlob(requestId, attempt);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Could not load share image");
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error("Could not load share image");
}

async function invokeNativeShare(opts: {
  title: string;
  message: string;
  url: string;
  file: File | null;
}) {
  const { title, message, url, file } = opts;
  const captionWithLink = `${message}\n\n${url}`;

  if (!canUseWebShare()) return false;

  const attempts: ShareData[] = [];

  if (file) {
    // WhatsApp / mobile: image + caption; URL in text stays tappable
    attempts.push({ files: [file], text: captionWithLink, title });
    attempts.push({ files: [file], text: message, url, title });
    attempts.push({ files: [file], title, text: `${message}\n${url}` });
  }
  attempts.push({ url, title, text: captionWithLink });
  attempts.push({ title, text: captionWithLink });

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
  cardLoading,
  onNativeShare,
  sharing,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  message: string;
  file: File | null;
  cardLoading: boolean;
  onNativeShare: () => void;
  sharing: boolean;
}) {
  const [hint, setHint] = useState("");

  if (!open) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${message}\n\n${url}`);
      setHint("Copied poster text and link");
    } catch {
      setHint("Could not copy — select and copy the link manually");
    }
  }

  function downloadImage() {
    if (!file) {
      if (cardLoading) {
        setHint("Image still loading — try again in a moment");
        return;
      }
      setHint("Image unavailable — use Copy link or open the public share page");
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
          Share sends the <strong>poster image</strong> and a <strong>tappable link</strong> in the
          caption so people can open BloodLink and respond.
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
  const [cardLoading, setCardLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inlineHint, setInlineHint] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");

  const title = `Blood needed — ${request.primary_blood_group}`;
  const message = shareRequestText(request as ShareableRequest);

  const prefetchCard = useCallback(async () => {
    setCardLoading(true);
    try {
      const blob = await loadShareCardBlobWithRetry(request.id);
      setCardFile(
        new File([blob], `bloodlink-${request.id.slice(0, 8)}.png`, { type: "image/png" })
      );
    } catch {
      setCardFile(null);
    } finally {
      setCardLoading(false);
    }
  }, [request.id]);

  useEffect(() => {
    void prefetchCard();
  }, [prefetchCard]);

  async function runShare() {
    const origin = window.location.origin;
    const url = shareRequestUrl(origin, request.id);
    const captionWithLink = `${message}\n\n${url}`;

    setSharing(true);
    setInlineHint("");

    try {
      let file = cardFile;
      if (!file) {
        const blob = await loadShareCardBlobWithRetry(request.id);
        file = new File([blob], `bloodlink-${request.id.slice(0, 8)}.png`, { type: "image/png" });
        setCardFile(file);
      }

      if (canUseWebShare()) {
        const shared = await invokeNativeShare({
          title,
          message,
          url,
          file,
        });
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
    setSharing(true);
    try {
      const shared = await invokeNativeShare({
        title,
        message,
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
        message={sheetUrl ? `${message}\n\n${sheetUrl}` : message}
        file={cardFile}
        cardLoading={cardLoading}
        onNativeShare={handleSheetNativeShare}
        sharing={sharing}
      />
    </>
  );
}
