import { describe, expect, it } from "vitest";
import sharp from "sharp";
import type { ShareableRequest } from "@/lib/request-share";
import { renderShareCardPng, SHARE_CARD_WIDTH } from "@/lib/share-card-render";
import { getShareCardFontPaths } from "@/lib/share-card-fonts";

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

async function countLightPixels(buf: Buffer, x0: number, y0: number, x1: number, y1: number) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let lightPixels = 0;
  for (let y = y0; y < y1; y += 3) {
    for (let x = x0; x < x1; x += 3) {
      if (x >= info.width || y >= info.height) continue;
      const i = (y * info.width + x) * info.channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 200 && g > 200 && b > 200) lightPixels++;
    }
  }
  return lightPixels;
}

describe("share card PNG", () => {
  it("loads bundled Inter font files", () => {
    expect(getShareCardFontPaths().length).toBe(2);
  });

  it("renders landscape poster PNG with readable text (no QR on image)", async () => {
    const buf = await renderShareCardPng(mockReq);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf[0]).toBe(0x89);
    const meta = await sharp(buf).metadata();
    expect(meta.width).toBe(SHARE_CARD_WIDTH);
    expect(meta.height).toBe(800);
    const bloodTypePixels = await countLightPixels(buf, 80, 140, 280, 340);
    const headlinePixels = await countLightPixels(buf, 400, 120, 900, 280);
    expect(bloodTypePixels).toBeGreaterThan(10);
    expect(headlinePixels).toBeGreaterThan(10);
  });
});
