import { readFileSync } from "node:fs";
import { join } from "node:path";

const FONT_FAMILY = "BloodLinkShare";

let cachedFontStyle: string | null = null;

/** Embedded @font-face for SVG text (Vercel/Linux has no system-ui fonts). */
export function getShareCardFontStyle(): string {
  if (cachedFontStyle) return cachedFontStyle;

  const root = process.cwd();
  const regularPath = join(root, "src/assets/fonts/Inter-Regular.ttf");
  const boldPath = join(root, "src/assets/fonts/Inter-Bold.ttf");

  const regularB64 = readFileSync(regularPath).toString("base64");
  const boldB64 = readFileSync(boldPath).toString("base64");

  cachedFontStyle = `<style type="text/css"><![CDATA[
@font-face {
  font-family: '${FONT_FAMILY}';
  src: url('data:font/ttf;base64,${regularB64}') format('truetype');
  font-weight: 100 500;
  font-style: normal;
}
@font-face {
  font-family: '${FONT_FAMILY}';
  src: url('data:font/ttf;base64,${boldB64}') format('truetype');
  font-weight: 600 900;
  font-style: normal;
}
text { font-family: '${FONT_FAMILY}', sans-serif; }
]]></style>`;

  return cachedFontStyle;
}

export function shareCardFontFamily() {
  return FONT_FAMILY;
}
