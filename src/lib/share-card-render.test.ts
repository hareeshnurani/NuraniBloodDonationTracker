import { describe, expect, it } from "vitest";
import type { ShareableRequest } from "@/lib/request-share";
import { renderShareCardPng } from "@/lib/share-card-render";

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
  it("renders PNG via sharp from SVG", async () => {
    const buf = await renderShareCardPng(mockReq);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });
});
