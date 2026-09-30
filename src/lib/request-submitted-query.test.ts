import { describe, expect, it } from "vitest";
import { requestSubmittedQuery } from "@/lib/request-submitted-query";

describe("requestSubmittedQuery", () => {
  it("encodes broadcast stats for the detail page banner", () => {
    expect(
      requestSubmittedQuery({
        notifiedCount: 12,
        withinRadiusNotified: 8,
        communityNotified: 5,
      })
    ).toBe("notified=12&near=8&community=5");
  });
});
