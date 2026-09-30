import type { ShareableRequest } from "@/lib/request-share";
import { shareRequestText, shareRequestUrl } from "@/lib/request-share";

export type SharePosterPayload = {
  url: string;
  message: string;
  title: string;
  /** WhatsApp caption: appeal text + blank line + tappable URL */
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

function shareDataWithImageAndCaption(file: File, captionWithLink: string, title: string, url: string) {
  const urlFirst = `${url}\n\n${captionWithLink.split("\n\n").slice(0, -1).join("\n\n") || ""}`.trim();
  const lines: ShareData[] = [
    { files: [file], text: captionWithLink, title },
    { files: [file], text: captionWithLink },
    { files: [file], text: `${url}\n\n${messageFromCaption(captionWithLink, url)}`, title },
    { files: [file], text: captionWithLink, url, title },
  ];
  if (urlFirst !== captionWithLink) {
    lines.splice(2, 0, { files: [file], text: urlFirst, title });
  }
  return lines;
}

function messageFromCaption(captionWithLink: string, url: string) {
  return captionWithLink.replace(new RegExp(`\\n*${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`), "").trim();
}

export type SharePosterResult = {
  shared: boolean;
  /** Link copied so user can paste if the app drops the caption */
  linkCopied?: boolean;
};

export function shareSuccessHint(result: SharePosterResult | null): string {
  if (!result) return "Poster not ready — try again";
  if (result.shared) {
    return result.linkCopied
      ? "Poster shared — link copied (paste in chat if text is missing)"
      : "Poster and link shared";
  }
  return "Choose an option below";
}

/** Share poster PNG with link in the message caption (not on the image). */
export async function sharePosterWithLink(opts: {
  file: File;
  title: string;
  captionWithLink: string;
  url: string;
}): Promise<SharePosterResult> {
  if (!canUseWebShare()) return { shared: false };

  const attempts = shareDataWithImageAndCaption(
    opts.file,
    opts.captionWithLink,
    opts.title,
    opts.url
  );

  for (const data of attempts) {
    try {
      if (navigator.canShare && !navigator.canShare(data)) continue;
      await navigator.share(data);
      return { shared: true };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
    }
  }

  return { shared: false };
}

/** Opens the system share sheet — user picks WhatsApp; image + caption when supported. */
export async function sharePosterWithLinkOnWhatsApp(opts: {
  file: File;
  title: string;
  captionWithLink: string;
  url: string;
}): Promise<SharePosterResult> {
  const result = await sharePosterWithLink(opts);
  if (result.shared) return result;

  const copied = await copyShareText(opts.captionWithLink);
  const retried = copied ? await sharePosterWithLink({ ...opts }) : result;
  if (retried.shared) return { shared: true, linkCopied: copied };
  return { shared: false, linkCopied: copied };
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
