import { describe, expect, it } from "vitest";
import type { ShareableRequest } from "@/lib/request-share";
import { renderShareCardPng } from "@/lib/share-card-render";
import { getShareCardFontPaths } from "@/lib/share-card-fonts";
import sharp from "sharp";

const mockReq: ShareableRequest = {
  id: "2a6f8bbc-4ae2-4a30-b537-086f30671f33",
  patient_name: "Test User 123",
  primary_blood_group: "O+",
  priority: "emergency",
  units_needed: 5,
  units_filled: 0,
  deadline: "2026-10-01T12:00:00.000Z",
  hospital_notes: "Kauvery Hospital — Contact Details - 9999999999",
  location_district: null,
  location_state: null,
  pincode: null,
  status: "open",
};

describe("share card PNG", () => {
  it("renders PNG via resvg from SVG", async () => {
    const buf = await renderShareCardPng(mockReq);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it("embeds Inter fonts in SVG", async () => {
    const { buildShareCardSvg } = await import("@/lib/share-card-svg");
    const svg = buildShareCardSvg(mockReq);
    expect(svg).toContain("BloodLink");
    expect(svg).toContain("O+");
    expect(getShareCardFontPaths().length).toBe(2);
  });

  it("PNG includes light text pixels (fonts rendered)", async () => {
    const buf = await renderShareCardPng(mockReq);
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let lightPixels = 0;
    for (let y = 70; y < 120; y += 4) {
      for (let x = 100; x < 420; x += 4) {
        if (x >= info.width || y >= info.height) continue;
        const i = (y * info.width + x) * info.channels;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 200 && g > 200 && b > 200) lightPixels++;
      }
    }
    expect(lightPixels).toBeGreaterThan(20);
  });
});
