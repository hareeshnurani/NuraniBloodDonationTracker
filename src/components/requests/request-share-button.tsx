"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShareableRequest } from "@/lib/request-share";
import { getAppUrl } from "@/lib/app-url";
import {
  buildSharePosterPayload,
  canUseWebShare,
  copyShareText,
  downloadShareFile,
  prepareWhatsAppPosterShare,
  sharePosterWithLink,
} from "@/lib/share-native";
import { Share2, X, Link2, Download, MessageCircle } from "lucide-react";
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

function ShareFallbackSheet({
  open,
  onClose,
  payload,
  file,
  cardLoading,
  onShareImageAndLink,
  onWhatsApp,
  sharing,
}: {
  open: boolean;
  onClose: () => void;
  payload: { captionWithLink: string; url: string } | null;
  file: File | null;
  cardLoading: boolean;
  onShareImageAndLink: () => void;
  onWhatsApp: () => void;
  sharing: boolean;
}) {
  const [hint, setHint] = useState("");

  if (!open || !payload) return null;

  async function copyAll() {
    const ok = await copyShareText(payload.captionWithLink);
    setHint(ok ? "Copied poster text and link" : "Could not copy — use the link below");
  }

  function saveImage() {
    if (!file) {
      setHint(
        cardLoading
          ? "Poster still loading…"
          : "Poster unavailable — copy the link and share manually"
      );
      return;
    }
    downloadShareFile(file);
    setHint("Poster saved — attach it in your chat after pasting the link");
  }

  async function copyAndSave() {
    if (!file) {
      await copyAll();
      return;
    }
    const ok = await copyShareText(payload.captionWithLink);
    downloadShareFile(file);
    setHint(
      ok
        ? "Link copied and poster saved — paste text and attach image in WhatsApp"
        : "Poster saved — paste the link from below into your chat"
    );
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
          <h2 className="text-[17px] font-semibold text-[var(--label)]">Share poster + link</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-secondary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-[14px] leading-relaxed text-[var(--label-secondary)]">
          Recipients should get the <strong>blood poster</strong> and a{" "}
          <strong>tappable link</strong> to open the request on BloodLink.
        </p>
        <div className="flex flex-col gap-2">
          {canUseWebShare() && (
            <Button
              type="button"
              className="w-full gap-2"
              disabled={sharing || cardLoading || !file}
              onClick={onShareImageAndLink}
            >
              <Share2 className="h-4 w-4" />
              {sharing ? "Opening…" : "Share image + link"}
            </Button>
          )}
          <Button
            type="button"
            variant="tinted"
            className="w-full gap-2"
            disabled={cardLoading || !file}
            onClick={onWhatsApp}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp (poster + link)
          </Button>
          <Button type="button" variant="secondary" className="w-full gap-2" onClick={copyAndSave}>
            <Download className="h-4 w-4" />
            Copy link & save poster
          </Button>
          <Button type="button" variant="secondary" className="w-full gap-2" onClick={copyAll}>
            <Link2 className="h-4 w-4" />
            Copy text & link only
          </Button>
        </div>
        {hint && <p className="mt-3 text-[13px] text-[var(--success)]">{hint}</p>}
        <p className="mt-3 break-all text-[11px] text-[var(--label-tertiary)]">{payload.url}</p>
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
  const [sheetPayload, setSheetPayload] = useState<ReturnType<
    typeof buildSharePosterPayload
  > | null>(null);

  const getPayload = useCallback(
    () => buildSharePosterPayload(request as ShareableRequest, getAppUrl()),
    [request]
  );

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

  async function ensurePosterFile(): Promise<File | null> {
    if (cardFile) return cardFile;
    try {
      const blob = await loadShareCardBlobWithRetry(request.id);
      const file = new File([blob], `bloodlink-${request.id.slice(0, 8)}.png`, {
        type: "image/png",
      });
      setCardFile(file);
      return file;
    } catch {
      return null;
    }
  }

  async function runShareImageAndLink(): Promise<boolean> {
    const payload = getPayload();
    const file = await ensurePosterFile();
    if (!file) {
      setInlineHint("Poster not ready — try again");
      return false;
    }
    return sharePosterWithLink({
      file,
      title: payload.title,
      captionWithLink: payload.captionWithLink,
      url: payload.url,
    });
  }

  async function runShare() {
    const payload = getPayload();
    setSharing(true);
    setInlineHint("");
    setSheetPayload(payload);

    try {
      const shared = await runShareImageAndLink();
      if (shared) {
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

  async function handleWhatsAppShare() {
    const payload = getPayload();
    setSharing(true);
    try {
      const file = await ensurePosterFile();
      if (!file) {
        setInlineHint("Poster not ready");
        return;
      }
      const { copied } = await prepareWhatsAppPosterShare({
        file,
        captionWithLink: payload.captionWithLink,
      });
      setInlineHint(
        copied
          ? "WhatsApp opened — attach the saved poster if it is not already there"
          : "WhatsApp opened — paste the link and attach the saved poster"
      );
      setSheetOpen(false);
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

  async function handleSheetShareImageAndLink() {
    setSharing(true);
    try {
      const shared = await runShareImageAndLink();
      if (shared) setSheetOpen(false);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setInlineHint("Could not share — try WhatsApp or copy & save");
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
            disabled={sharing || cardLoading}
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
            disabled={sharing || cardLoading}
            onTouchStart={() => void prefetchCard()}
            onClick={handleShareClick}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5",
              "bg-[#5856d6] text-[15px] font-medium text-white shadow-[var(--shadow-sm)]",
              "transition-all hover:bg-[#4b49c9] active:scale-[0.98] disabled:opacity-50"
            )}
          >
            <Share2 className="h-4 w-4" />
            {cardLoading ? "Loading poster…" : sharing ? "Sharing…" : "Share poster + link"}
          </button>
          {inlineHint && <p className="text-[12px] text-[var(--label-secondary)]">{inlineHint}</p>}
        </div>
      )}

      <ShareFallbackSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        payload={sheetPayload}
        file={cardFile}
        cardLoading={cardLoading}
        onShareImageAndLink={handleSheetShareImageAndLink}
        onWhatsApp={handleWhatsAppShare}
        sharing={sharing}
      />
    </>
  );
}
