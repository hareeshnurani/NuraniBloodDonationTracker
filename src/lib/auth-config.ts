/** When true, new accounts must confirm email (link sent via Resend) before using the app. */
export function isEmailVerificationRequired(): boolean {
  if (process.env.BLOODLINK_REQUIRE_EMAIL_VERIFICATION === "false") return false;
  if (
    process.env.BLOODLINK_REQUIRE_EMAIL_VERIFICATION === "true" ||
    process.env.BLOODLINK_USE_EMAIL_CONFIRMATION === "true"
  ) {
    return true;
  }
  // On by default when Resend is configured (set BLOODLINK_REQUIRE_EMAIL_VERIFICATION=false to skip)
  return !!process.env.RESEND_API_KEY?.trim();
}
