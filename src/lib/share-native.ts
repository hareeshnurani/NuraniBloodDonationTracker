import type { ShareableRequest } from "@/lib/request-share";
import { shareRequestText, shareRequestUrl } from "@/lib/request-share";

export type SharePosterPayload = {
  url: string;
  message: string;
  title: string;
  captionWithLink: string;
  imageDescription: string;
};

export type SharePlatform = "android-chrome" | "ios-chrome" | "chrome-desktop" | "other";

export function detectSharePlatform(): SharePlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isChrome = /Chrome/i.test(ua) && !/Edg|OPR|SamsungBrowser/i.test(ua);
  if (!isChrome) return "other";
  if (/Android/i.test(ua)) return "android-chrome";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios-chrome";
  return "chrome-desktop";
}

export function isMobileChrome(): boolean {
  const p = detectSharePlatform();
  return p === "android-chrome" || p === "ios-chrome";
}

export function getChromeShareTip(): string | null {
  const platform = detectSharePlatform();
  if (platform === "android-chrome") {
    return "Chrome: tap Share poster + link, choose WhatsApp — poster image plus link caption.";
  }
  if (platform === "ios-chrome") {
    return "Chrome on iPhone: choose WhatsApp on the share sheet. If the link is missing, use WhatsApp (poster + link) below.";
  }
  if (platform === "chrome-desktop") {
    return "Chrome on computer: pick WhatsApp or Save image, then paste the link from the share menu if needed.";
  }
  return null;
}

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

function dedupeShareAttempts(attempts: ShareData[]): ShareData[] {
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

/** Poster file + text as image caption (pick WhatsApp from the sheet). */
export function buildImageFileShareAttempts(
  file: File,
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink" | "imageDescription">,
  platform: SharePlatform = detectSharePlatform()
): ShareData[] {
  const { url, message, title, captionWithLink, imageDescription } = payload;
  const appealOnly = messageWithoutTrailingUrl(captionWithLink, url);

  const defaultOrder: ShareData[] = [
    { files: [file], text: captionWithLink, title },
    { files: [file], text: imageDescription, title },
    { files: [file], text: `${url}\n\n${appealOnly}`, title },
    { files: [file], text: url, title: captionWithLink },
    { files: [file], title: captionWithLink, text: url },
    { files: [file], text: captionWithLink },
  ];

  /** Android Chrome → WhatsApp often keeps caption when URL leads the text field. */
  const androidChromeOrder: ShareData[] = [
    { files: [file], text: imageDescription, title },
    { files: [file], text: url, title: captionWithLink },
    { files: [file], text: captionWithLink, title },
    { files: [file], text: `${url}\n\n${appealOnly}`, title },
    { files: [file], title: captionWithLink, text: url },
  ];

  const iosChromeOrder: ShareData[] = [
    { files: [file], text: url, title: captionWithLink },
    { files: [file], text: imageDescription, title },
    { files: [file], text: captionWithLink, title },
  ];

  if (platform === "android-chrome") return dedupeShareAttempts(androidChromeOrder);
  if (platform === "ios-chrome") return dedupeShareAttempts(iosChromeOrder);
  return dedupeShareAttempts(defaultOrder);
}

export function pickImageFileSharePayload(
  file: File,
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink" | "imageDescription">
): ShareData | null {
  const attempts = buildImageFileShareAttempts(file, payload);
  if (!canUseWebShare()) return null;
  for (const data of attempts) {
    if (!navigator.canShare || navigator.canShare(data)) return data;
  }
  return attempts[0] ?? null;
}

/** Link-only share (poster as OG preview). Desktop fallback only. */
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
    return "Poster saved — in WhatsApp tap attach and pick the file (message already has the link)";
  }
  if (result.mode === "native-url") {
    return "Shared as link with preview — use Share poster + link and pick WhatsApp for the image file";
  }
  return "Poster sent — link should be in the caption under the image";
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

/** One share sheet per tap — best payload for this browser. */
async function tryShareImageFileWithDescription(
  file: File,
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink" | "imageDescription">
): Promise<boolean> {
  const data = pickImageFileSharePayload(file, payload);
  if (!data) return false;
  return tryNativeShare(data);
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

  if (!isMobileChrome()) {
    if (await tryShareLinkInMessageBody(payload)) {
      return { shared: true, mode: "native-url" };
    }
  }

  return { shared: false };
}

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
