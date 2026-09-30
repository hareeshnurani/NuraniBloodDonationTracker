import type { ShareableRequest } from "@/lib/request-share";
import { shareRequestText, shareRequestUrl } from "@/lib/request-share";

export type SharePosterPayload = {
  url: string;
  message: string;
  title: string;
  /** Full message for WhatsApp compose / link share (appeal then link) */
  captionWithLink: string;
  /** URL-first caption for rare targets that accept file + text */
  imageDescription: string;
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
    imageDescription: `${url}\n\n${message}`,
  };
}

export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function isMobileShareDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function messageWithoutTrailingUrl(captionWithLink: string, url: string) {
  return captionWithLink.replace(new RegExp(`\\n*${escapeRegExp(url)}\\s*$`), "").trim();
}

/** Ordered for targets that use `text` as the image caption / description. */
export function buildImageFileShareAttempts(
  file: File,
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink" | "imageDescription">
): ShareData[] {
  const { url, message, title, captionWithLink, imageDescription } = payload;
  const appealOnly = messageWithoutTrailingUrl(captionWithLink, url);

  const attempts: ShareData[] = [
    { files: [file], text: captionWithLink, title },
    { files: [file], text: imageDescription },
    { files: [file], text: `${url}\n\n${appealOnly}`, title },
    { files: [file], text: url },
    { files: [file], title: captionWithLink, text: url },
    { files: [file], text: captionWithLink },
  ];

  const seen = new Set<string>();
  return attempts.filter((data) => {
    const key = JSON.stringify({
      text: data.text ?? "",
      title: data.title ?? "",
      url: data.url ?? "",
      files: data.files?.length ?? 0,
    });
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Share payloads where the link is part of the message body (not clipboard). */
export function buildLinkMessageShareAttempts(
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink">
): ShareData[] {
  const { url, message, title, captionWithLink } = payload;
  return [
    { url, text: captionWithLink, title },
    { text: captionWithLink, url, title },
    { url, text: message, title },
    { text: captionWithLink, title },
  ];
}

export type SharePosterResult = {
  shared: boolean;
  imageSaved?: boolean;
  mode?: "native-file" | "native-url" | "whatsapp-compose";
};

export function shareSuccessHint(result: SharePosterResult | null): string {
  if (!result) return "Poster not ready — try again";
  if (!result.shared) return "Choose an option below";
  if (result.mode === "whatsapp-compose") {
    return "WhatsApp opened with your message and link — tap attach and choose the saved poster";
  }
  if (result.mode === "native-url") {
    return "Shared with link in the message (poster shows in the link preview)";
  }
  return "Poster shared with link in the message";
}

/** Opens WhatsApp with `text` pre-filled in the compose field (not clipboard). */
export function openWhatsAppWithMessage(text: string) {
  const href = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  const opened = window.open(href, "_blank", "noopener,noreferrer");
  if (!opened) window.location.assign(href);
}

async function tryNativeShare(data: ShareData): Promise<boolean> {
  if (!canUseWebShare()) return false;
  if (navigator.canShare && !navigator.canShare(data)) return false;
  try {
    await navigator.share(data);
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    return false;
  }
}

async function tryShareLinkInMessageBody(
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink">
): Promise<boolean> {
  for (const data of buildLinkMessageShareAttempts(payload)) {
    if (await tryNativeShare(data)) return true;
  }
  return false;
}

async function tryShareImageFileWithDescription(
  file: File,
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink" | "imageDescription">
): Promise<boolean> {
  for (const data of buildImageFileShareAttempts(file, payload)) {
    if (await tryNativeShare(data)) return true;
  }
  return false;
}

/** WhatsApp compose: message text (with link) in chat + poster saved to attach. No clipboard. */
export function shareViaWhatsAppCompose(
  file: File,
  captionWithLink: string
): SharePosterResult {
  downloadShareFile(file);
  openWhatsAppWithMessage(captionWithLink);
  return { shared: true, imageSaved: true, mode: "whatsapp-compose" };
}

/**
 * Share with link in the message payload (Web Share text/url), not via clipboard.
 * On mobile, avoids file-only WhatsApp shares that drop the caption.
 */
export async function sharePosterWithLink(opts: {
  file: File;
  title: string;
  captionWithLink: string;
  imageDescription: string;
  message: string;
  url: string;
}): Promise<SharePosterResult> {
  const payload = {
    url: opts.url,
    message: opts.message,
    title: opts.title,
    captionWithLink: opts.captionWithLink,
    imageDescription: opts.imageDescription,
  };

  if (await tryShareLinkInMessageBody(payload)) {
    return { shared: true, mode: "native-url" };
  }

  if (!isMobileShareDevice()) {
    if (await tryShareImageFileWithDescription(opts.file, payload)) {
      return { shared: true, mode: "native-file" };
    }
  }

  return { shared: false };
}

/**
 * WhatsApp: always pre-fill the chat message (appeal + link) via WhatsApp API,
 * save poster for attach — do not use Web Share file-only (drops text) or clipboard.
 */
export async function sharePosterWithLinkOnWhatsApp(opts: {
  file: File;
  title: string;
  captionWithLink: string;
  imageDescription: string;
  message: string;
  url: string;
}): Promise<SharePosterResult> {
  void opts.title;
  void opts.imageDescription;
  void opts.message;
  void opts.url;
  return shareViaWhatsAppCompose(opts.file, opts.captionWithLink);
}

/** Manual fallback only — not used for automatic share. */
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

/** Share poster PNG only (no link) — for apps where link share is separate. */
export async function sharePosterFileOnly(file: File, title: string): Promise<boolean> {
  return tryNativeShare({ files: [file], title });
}
