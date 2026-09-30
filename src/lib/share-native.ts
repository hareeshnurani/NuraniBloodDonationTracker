import type { ShareableRequest } from "@/lib/request-share";
import { shareRequestText, shareRequestUrl } from "@/lib/request-share";

export type SharePosterPayload = {
  url: string;
  message: string;
  title: string;
  /** Full message for paste / WhatsApp compose (appeal then link) */
  captionWithLink: string;
  /** URL-first caption — works better as image description on some share targets */
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function messageWithoutTrailingUrl(captionWithLink: string, url: string) {
  return captionWithLink.replace(new RegExp(`\\n*${escapeRegExp(url)}\\s*$`), "").trim();
}

/** Ordered for targets (incl. WhatsApp) that use `text` as the image caption / description. */
export function buildImageFileShareAttempts(
  file: File,
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink" | "imageDescription">
): ShareData[] {
  const { url, message, title, captionWithLink, imageDescription } = payload;
  const appealOnly = messageWithoutTrailingUrl(captionWithLink, url);

  const attempts: ShareData[] = [
    { files: [file], text: url },
    { files: [file], text: imageDescription },
    { files: [file], text: `${url}\n\n${appealOnly}`, title },
    { files: [file], title: captionWithLink, text: url },
    { files: [file], text: captionWithLink, title },
    { files: [file], text: captionWithLink },
    { files: [file], text: message, url, title },
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

export type SharePosterResult = {
  shared: boolean;
  linkCopied?: boolean;
  imageSaved?: boolean;
  mode?: "native-file" | "native-url" | "whatsapp-compose";
};

export function shareSuccessHint(result: SharePosterResult | null): string {
  if (!result) return "Poster not ready — try again";
  if (!result.shared) {
    return result.linkCopied
      ? "Link copied — use WhatsApp or copy & save below"
      : "Choose an option below";
  }
  if (result.mode === "whatsapp-compose") {
    return "WhatsApp opened with the link in the message — tap attach and pick the saved poster";
  }
  if (result.mode === "native-url") {
    return "Shared link with poster preview — tap the link to open BloodLink";
  }
  if (result.linkCopied) {
    return "Poster shared — link copied (paste under the photo if WhatsApp drops the caption)";
  }
  return "Poster and link shared";
}

export function openWhatsAppWithMessage(text: string) {
  const href = `https://wa.me/?text=${encodeURIComponent(text)}`;
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

/** Share poster PNG with link in the image description / caption (not printed on the image). */
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

  const linkCopied = await copyShareText(opts.captionWithLink);

  if (await tryShareImageFileWithDescription(opts.file, payload)) {
    return { shared: true, linkCopied, mode: "native-file" };
  }

  if (await tryNativeShare({ url: opts.url, title: opts.title, text: opts.message })) {
    return { shared: true, linkCopied, mode: "native-url" };
  }

  return { shared: false, linkCopied };
}

/**
 * WhatsApp: try image + description via Web Share, then open WhatsApp with full text
 * and save the poster so the user attaches one message (text already includes the link).
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

  const linkCopied = await copyShareText(opts.captionWithLink);

  if (await tryShareImageFileWithDescription(opts.file, payload)) {
    return { shared: true, linkCopied, mode: "native-file" };
  }

  downloadShareFile(opts.file);
  openWhatsAppWithMessage(opts.captionWithLink);
  return {
    shared: true,
    linkCopied,
    imageSaved: true,
    mode: "whatsapp-compose",
  };
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
