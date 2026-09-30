import type { ShareableRequest } from "@/lib/request-share";
import { shareRequestText, shareRequestUrl } from "@/lib/request-share";

export type SharePosterPayload = {
  url: string;
  message: string;
  title: string;
  /** Full WhatsApp / share message: appeal lines + public link */
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

export function buildLinkShareAttempts(
  payload: Pick<SharePosterPayload, "url" | "message" | "title" | "captionWithLink">
): ShareData[] {
  const { url, message, title, captionWithLink } = payload;
  return [
    { url, text: captionWithLink, title },
    { text: captionWithLink, url, title },
    { text: captionWithLink, title },
    { url, text: message, title },
  ];
}

export type ShareLinkResult = {
  shared: boolean;
  mode?: "native" | "whatsapp";
};

export function shareSuccessHint(result: ShareLinkResult | null): string {
  if (!result) return "Could not share — try again";
  if (!result.shared) return "Copy the link below or try WhatsApp";
  if (result.mode === "whatsapp") {
    return "WhatsApp opened — send the message; tap the link to see the poster";
  }
  return "Shared — recipients tap the link to view the poster on BloodLink";
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

/** Share appeal text + public link (poster shown when the link is opened). */
export async function shareRequestLink(
  payload: SharePosterPayload
): Promise<ShareLinkResult> {
  for (const data of buildLinkShareAttempts(payload)) {
    if (await tryNativeShare(data)) {
      return { shared: true, mode: "native" };
    }
  }
  return { shared: false };
}

export function shareRequestLinkOnWhatsApp(payload: SharePosterPayload): ShareLinkResult {
  openWhatsAppWithMessage(payload.captionWithLink);
  return { shared: true, mode: "whatsapp" };
}

export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
