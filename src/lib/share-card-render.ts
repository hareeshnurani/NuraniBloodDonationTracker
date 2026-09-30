import sharp from "sharp";
import type { ShareableRequest } from "@/lib/request-share";
import { getShareCardFontStyle } from "@/lib/share-card-fonts";
import { buildShareCardSvg, SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from "@/lib/share-card-svg";

export async function renderShareCardPng(req: ShareableRequest): Promise<Buffer> {
  const svg = buildShareCardSvg(req, getShareCardFontStyle());
  return sharp(Buffer.from(svg), { density: 144 })
    .resize(SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)
    .png()
    .toBuffer();
}

export { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT };
