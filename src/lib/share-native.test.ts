import { describe, expect, it } from "vitest";
import type { ShareableRequest } from "@/lib/request-share";
import {
  buildImageFileShareAttempts,
  buildLinkMessageShareAttempts,
  buildSharePosterPayload,
} from "@/lib/share-native";

const mockReq: ShareableRequest = {
  id: "2a6f8bbc-4ae2-4a30-b537-086f30671f33",
  patient_name: "Test User 123",
  primary_blood_group: "O+",
  priority: "emergency",
  units_needed: 5,
  units_filled: 0,
  deadline: "2026-10-01T12:00:00.000Z",
  hospital_notes: "Kauvery Hospital",
  location_district: null,
  location_state: null,
  pincode: null,
  status: "open",
};

describe("buildSharePosterPayload", () => {
  it("includes public share URL in caption", () => {
    const payload = buildSharePosterPayload(
      mockReq,
      "https://nurani-blood-donation-tracker.vercel.app"
    );
    expect(payload.url).toBe(
      "https://nurani-blood-donation-tracker.vercel.app/share/request/2a6f8bbc-4ae2-4a30-b537-086f30671f33"
    );
    expect(payload.captionWithLink).toContain(payload.url);
    expect(payload.captionWithLink).toContain("O+");
    expect(payload.captionWithLink).toContain("Tap the link");
    expect(payload.imageDescription.startsWith(payload.url)).toBe(true);
  });

  it("prefers URL-first text for image file share attempts", () => {
    const payload = buildSharePosterPayload(mockReq, "https://example.com");
    const file = new File(["x"], "bloodlink.png", { type: "image/png" });
    const attempts = buildImageFileShareAttempts(file, payload);
    expect(attempts[0].text).toBe(payload.captionWithLink);
    expect(attempts.some((a) => a.text === payload.imageDescription)).toBe(true);
  });

  it("puts appeal and URL in link message share payloads", () => {
    const payload = buildSharePosterPayload(mockReq, "https://example.com");
    const attempts = buildLinkMessageShareAttempts(payload);
    expect(attempts[0].text).toBe(payload.captionWithLink);
    expect(attempts[0].url).toBe(payload.url);
  });
});
