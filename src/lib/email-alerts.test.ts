import { describe, it, expect, vi, afterEach } from "vitest";
import { sendEmailAlert } from "@/lib/email-alerts";

describe("sendEmailAlert", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("skips sending when RESEND_API_KEY is not set", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const result = await sendEmailAlert({
      to: "donor@example.com",
      subject: "Test",
      text: "Body",
    });
    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
  });
});
