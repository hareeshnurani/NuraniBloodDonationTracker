/** Build query string after publish so request detail can show donor reach banner. */
export function requestSubmittedQuery(stats: {
  notifiedCount: number;
  withinRadiusNotified: number;
  communityNotified: number;
}) {
  const params = new URLSearchParams({
    notified: String(stats.notifiedCount),
    near: String(stats.withinRadiusNotified),
    community: String(stats.communityNotified),
  });
  return params.toString();
}
