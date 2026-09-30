import type { ShareableRequest } from "@/lib/request-share";
import { shareRequestText, shareRequestUrl } from "@/lib/request-share";

export type SharePosterPayload = {
  url: string;
  message: string;
  title: string;
  /** Appeal text plus public share URL — use as share caption / WhatsApp text */
  captionWithLink: string;
};

export function buildSharePosterPayload(
  request: ShareableRequest,
  origin: string
): SharePosterPayload {
  const url = shareRequestUrl(origin, request.id);
  const message = shareRequestText(request);
  return {
    url,
    message,
    title: `Blood needed — ${request.primary_blood_group}`,
    captionWithLink: `${message}\n\n${url}`,
  };
}

export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** Share poster file with caption that includes the tappable link. Never falls back to link-only. */
export async function sharePosterWithLink(opts: {
  file: File;
  title: string;
  captionWithLink: string;
  url: string;
}): Promise<boolean> {
  if (!canUseWebShare()) return false;

  const attempts: ShareData[] = [
    { files: [opts.file], text: opts.captionWithLink, title: opts.title },
    { files: [opts.file], text: opts.captionWithLink },
    { files: [opts.file], text: opts.captionWithLink, url: opts.url, title: opts.title },
  ];

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

export function openWhatsAppWithText(text: string) {
  const encoded = encodeURIComponent(text);
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const href = mobile ? `whatsapp://send?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  window.open(href, "_blank", "noopener,noreferrer");
}

export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadShareFile(file: File) {
  const href = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = href;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(href);
}

/** WhatsApp: pre-fill message with link, copy caption, save poster for attach. */
export async function prepareWhatsAppPosterShare(opts: {
  file: File;
  captionWithLink: string;
}): Promise<{ copied: boolean }> {
  const copied = await copyShareText(opts.captionWithLink);
  downloadShareFile(opts.file);
  openWhatsAppWithText(opts.captionWithLink);
  return { copied };
}
