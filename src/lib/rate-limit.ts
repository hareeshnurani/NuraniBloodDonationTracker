import { createServiceClient } from "@/lib/supabase/admin";

/** Count rows in a table for a user since `sinceIso`. */
export async function countRecentForUser(
  table: "blood_requests",
  userColumn: "requester_id",
  userId: string,
  sinceIso: string
): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(userColumn, userId)
    .gte("created_at", sinceIso);

  if (error) {
    console.error("[rate-limit]", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function assertRequestCreationAllowed(userId: string): Promise<string | null> {
  const maxPerDay = parseInt(process.env.BLOODLINK_MAX_REQUESTS_PER_DAY ?? "5", 10);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const count = await countRecentForUser("blood_requests", "requester_id", userId, since);
  if (count >= maxPerDay) {
    return `You can post at most ${maxPerDay} requests per 24 hours. Try again later or contact support.`;
  }
  return null;
}
