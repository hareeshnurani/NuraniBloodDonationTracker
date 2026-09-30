import { join } from "node:path";

let cachedFontPaths: string[] | null = null;

/** Bundled Inter TTF paths (static for Next/Vercel file tracing). */
export function getShareCardFontPaths(): string[] {
  if (cachedFontPaths) return cachedFontPaths;
  const root = process.cwd();
  cachedFontPaths = [
    join(root, "src/assets/fonts", "Inter-Regular.ttf"),
    join(root, "src/assets/fonts", "Inter-Bold.ttf"),
  ];
  return cachedFontPaths;
}
