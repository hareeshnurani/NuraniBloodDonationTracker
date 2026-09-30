import type { ShareableRequest } from "@/lib/request-share";
import { shareRequestText, shareRequestUrl } from "@/lib/request-share";

export type SharePosterPayload = {
  url: string;
  message: string;
  title: string;
  captionWithLink: string;
  /** Short caption — URL only (works better with image on some WhatsApp builds) */
  urlCaption: string;
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
    urlCaption: url,
  };
}

export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export type SharePosterResult = {
  shared: boolean;
  copied: boolean;
};

/** Copy link, then share poster. Caption tries URL-first for WhatsApp. */
export async function sharePosterWithLink(opts: {
  file: File;
  title: string;
  message: string;
  captionWithLink: string;
  urlCaption: string;
  url: string;
}): Promise<SharePosterResult> {
  const copied = await copyShareText(opts.captionWithLink);

  if (!canUseWebShare()) {
    return { shared: false, copied };
  }

  const urlBlock = `${opts.url}\n\n${opts.message}`;
  const attempts: ShareData[] = [
    { files: [opts.file], text: opts.urlCaption },
    { files: [opts.file], text: urlBlock },
    { files: [opts.file], text: opts.captionWithLink, title: opts.title },
    { files: [opts.file], text: opts.captionWithLink },
    { files: [opts.file], text: opts.captionWithLink, url: opts.url, title: opts.title },
  ];

  for (const data of attempts) {
    try {
      if (navigator.canShare && !navigator.canShare(data)) continue;
      await navigator.share(data);
      return { shared: true, copied };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
    }
  }

  return { shared: false, copied };
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

/** WhatsApp: try image+URL share; else save poster (has QR/link) + open chat with URL. */
export async function prepareWhatsAppPosterShare(opts: {
  file: File;
  captionWithLink: string;
  urlCaption: string;
  message: string;
}): Promise<SharePosterResult> {
  const copied = await copyShareText(opts.captionWithLink);

  if (canUseWebShare()) {
    const attempts: ShareData[] = [
      { files: [opts.file], text: opts.urlCaption },
      { files: [opts.file], text: `${opts.urlCaption}\n\n${opts.message}` },
    ];
    for (const data of attempts) {
      try {
        if (navigator.canShare && !navigator.canShare(data)) continue;
        await navigator.share(data);
        return { shared: true, copied };
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") throw err;
      }
    }
  }

  downloadShareFile(opts.file);
  openWhatsAppWithText(opts.urlCaption);
  return { shared: false, copied };
}

export function shareSuccessHint(result: SharePosterResult): string {
  if (result.shared && result.copied) {
    return "Shared. Link also copied — poster includes QR + URL if caption is missing.";
  }
  if (result.shared) {
    return "Shared. The poster includes the link and QR code on the image.";
  }
  if (result.copied) {
    return "Link copied. Paste as caption; poster has QR + URL too.";
  }
  return "Poster includes link and QR. Paste the link from the sheet if needed.";
}
