import type { ShareableRequest } from "@/lib/request-share";
import { shareRequestText, shareRequestUrl } from "@/lib/request-share";

export type SharePosterPayload = {
  url: string;
  message: string;
  title: string;
  captionWithLink: string;
  imageDescription: string;
};

export function buildSharePosterPayload(
  request: ShareableRequest,
  origin: string
): SharePosterPayload {
  const base = origin.replace(/\/$/, "");
  const url = shareRequestUrl(base, request.id);
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function messageWithoutTrailingUrl(captionWithLink: string, url: string) {
  return captionWithLink.replace(new RegExp(`\\n*${escapeRegExp(url)}\\s*$`), "").trim();
}

/** Poster file + text as image caption (pick WhatsApp from the sheet). */
export function buildImageFileShareAttempts(
  file: File,
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink" | "imageDescription">
): ShareData[] {
  const { url, message, title, captionWithLink, imageDescription } = payload;
  const appealOnly = messageWithoutTrailingUrl(captionWithLink, url);

  const attempts: ShareData[] = [
    { files: [file], text: captionWithLink, title },
    { files: [file], text: imageDescription, title },
    { files: [file], text: `${url}\n\n${appealOnly}`, title },
    { files: [file], text: url, title: captionWithLink },
    { files: [file], title: captionWithLink, text: url },
    { files: [file], text: captionWithLink, url, title },
    { files: [file], text: url },
    { files: [file], title },
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

/** Link-only share (poster as OG preview, not as attachment). Last resort. */
export function buildLinkMessageShareAttempts(
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink">
): ShareData[] {
  const { url, message, title, captionWithLink } = payload;
  return [
    { url, text: captionWithLink, title },
    { text: captionWithLink, url, title },
    { url, text: message, title },
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
    return "Poster saved — attach it in WhatsApp (message text already includes the link)";
  }
  if (result.mode === "native-url") {
    return "Shared link with poster preview — for the poster file, pick WhatsApp from the share sheet";
  }
  return "Poster shared — link should appear as the image caption; if not, use WhatsApp (poster + link) in the menu";
}

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

async function tryShareImageFileWithDescription(
  file: File,
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink" | "imageDescription">
): Promise<boolean> {
  for (const data of buildImageFileShareAttempts(file, payload)) {
    if (await tryNativeShare(data)) return true;
  }
  return false;
}

async function tryShareLinkInMessageBody(
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink">
): Promise<boolean> {
  for (const data of buildLinkMessageShareAttempts(payload)) {
    if (await tryNativeShare(data)) return true;
  }
  return false;
}

export function shareViaWhatsAppCompose(
  file: File,
  captionWithLink: string
): SharePosterResult {
  downloadShareFile(file);
  openWhatsAppWithMessage(captionWithLink);
  return { shared: true, imageSaved: true, mode: "whatsapp-compose" };
}

/**
 * Share poster PNG first (Web Share files + caption text), then link-only fallback.
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

  if (await tryShareImageFileWithDescription(opts.file, payload)) {
    return { shared: true, mode: "native-file" };
  }

  if (await tryShareLinkInMessageBody(payload)) {
    return { shared: true, mode: "native-url" };
  }

  return { shared: false };
}

/**
 * WhatsApp: share poster file + caption via system sheet when possible;
 * otherwise save poster and open WhatsApp with message text (link included).
 */
export async function sharePosterWithLinkOnWhatsApp(opts: {
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

  if (await tryShareImageFileWithDescription(opts.file, payload)) {
    return { shared: true, mode: "native-file" };
  }

  return shareViaWhatsAppCompose(opts.file, opts.captionWithLink);
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

export async function sharePosterFileOnly(file: File, title: string): Promise<boolean> {
  return tryNativeShare({ files: [file], title });
}
