import { existsSync } from "node:fs";
import { join } from "node:path";

export const SHARE_CARD_FONT_FAMILY = "Inter";

let cachedFontPaths: string[] | null = null;

function resolveFontPath(fileName: string): string {
  const root = process.cwd();
  const candidates = [
    join(root, "src/assets/fonts", fileName),
    join(root, "public/fonts", fileName),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Share card font missing: ${fileName} (cwd=${root})`);
}

/** Absolute paths to bundled Inter TTF for @vercel/og. */
export function getShareCardFontPaths(): string[] {
  if (cachedFontPaths) return cachedFontPaths;
  cachedFontPaths = [
    resolveFontPath("Inter-Regular.ttf"),
    resolveFontPath("Inter-Bold.ttf"),
  ];
  return cachedFontPaths;
}

/** Verify fonts readable at startup of render (clear error if Vercel trace omitted files). */
export function assertShareCardFontsReady(): void {
  for (const path of getShareCardFontPaths()) {
    readFileSync(path);
  }
}

export function shareCardFontFamily() {
  return SHARE_CARD_FONT_FAMILY;
}
