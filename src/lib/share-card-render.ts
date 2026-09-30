import { Resvg } from "@resvg/resvg-js";
import type { ShareableRequest } from "@/lib/request-share";
import {
  assertShareCardFontsReady,
  getShareCardFontPaths,
  shareCardFontFamily,
} from "@/lib/share-card-fonts";
import { buildShareCardSvg, SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from "@/lib/share-card-svg";

export async function renderShareCardPng(req: ShareableRequest): Promise<Buffer> {
  assertShareCardFontsReady();
  const svg = buildShareCardSvg(req);
  const fontFiles = getShareCardFontPaths();

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: SHARE_CARD_WIDTH },
    font: {
      loadSystemFonts: false,
      defaultFontFamily: shareCardFontFamily(),
      fontFiles,
    },
    logLevel: process.env.NODE_ENV === "development" ? "warn" : "error",
  });

  const png = resvg.render().asPng();
  if (png.length < 1000) {
    throw new Error("Share card PNG unexpectedly small");
  }
  if (resvg.height !== SHARE_CARD_HEIGHT && resvg.width !== SHARE_CARD_WIDTH) {
    // width fit preserves aspect ratio from viewBox
  }
  return Buffer.from(png);
}

export { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT };
