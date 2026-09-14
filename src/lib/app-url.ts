/**
 * Production app URL for auth redirects (email confirmation, etc.).
 * Set NEXT_PUBLIC_APP_URL in Vercel to your live domain.
 */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function authCallbackUrl(next = "/onboarding"): string {
  return `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}
