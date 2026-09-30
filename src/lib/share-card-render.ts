import { readFile } from "node:fs/promises";
import type { ShareableRequest } from "@/lib/request-share";
import { buildShareCardOgElement } from "@/lib/share-card-og";
import { getShareCardFontPaths } from "@/lib/share-card-fonts";
import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from "@/lib/share-card-copy";

export { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT };

export async function loadShareCardFontBuffers() {
  const [regularPath, boldPath] = getShareCardFontPaths();
  const [regular, bold] = await Promise.all([readFile(regularPath), readFile(boldPath)]);
  return [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}

/** PNG for WhatsApp / Open Graph — @vercel/og with explicit Inter font bytes. */
export async function renderShareCardPng(req: ShareableRequest): Promise<Buffer> {
  const fonts = await loadShareCardFontBuffers();
  const og = await import("next/dist/compiled/@vercel/og/index.node.js");
  const element = buildShareCardOgElement(req);
  const response = new og.ImageResponse(element, {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    fonts,
  });
  const png = Buffer.from(await response.arrayBuffer());
  if (png.length < 1000 || png[0] !== 0x89) {
    throw new Error("Share card PNG generation failed");
  }
  return png;
}
