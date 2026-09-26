import { describe, it, expect } from "vitest";
import {
  getEffectiveLocationState,
  isGpsTimestampFresh,
  isPinTimestampFresh,
} from "@/lib/profile-location";

describe("getEffectiveLocationState", () => {
  it("requires fresh GPS when use_my_location is on", () => {
    const stale = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const state = getEffectiveLocationState({
      use_my_location: true,
      latitude: 10.7,
      longitude: 76.7,
      home_pincode: null,
      location_label: "GPS",
      gps_updated_at: stale,
      pin_updated_at: null,
    });
    expect(state.available).toBe(false);
    expect(state.reason).toBe("gps_stale");
  });

  it("uses PIN when GPS is off and pin is fresh", () => {
    const fresh = new Date().toISOString();
    expect(isPinTimestampFresh(fresh)).toBe(true);
    const state = getEffectiveLocationState({
      use_my_location: false,
      latitude: 10.7,
      longitude: 76.7,
      home_pincode: "678001",
      location_label: "Palakkad",
      gps_updated_at: null,
      pin_updated_at: fresh,
    });
    expect(state.available).toBe(true);
  });

  it("marks fresh GPS within 3 hours", () => {
    const fresh = new Date().toISOString();
    expect(isGpsTimestampFresh(fresh)).toBe(true);
  });
});
