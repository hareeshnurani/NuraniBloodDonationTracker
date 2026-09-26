import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/user-notifications";

export const dynamic = "force-dynamic";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

/** Marks open requests past deadline as expired and notifies requesters. */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: expired, error } = await supabase
    .from("blood_requests")
    .select("id, patient_name, requester_id")
    .in("status", ["open", "partially_filled"])
    .lt("deadline", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!expired?.length) {
    return NextResponse.json({ expired: 0 });
  }

  const ids = expired.map((r) => r.id);

  await supabase
    .from("blood_requests")
    .update({
      status: "expired",
      closure_type: "expired",
      closure_reason: "Deadline passed",
    })
    .in("id", ids);

  await supabase.from("chat_threads").update({ status: "closed" }).in("request_id", ids);

  for (const req of expired) {
    await notifyUser(
      req.requester_id,
      "deadline_warning",
      "Request expired",
      `Your blood request for ${req.patient_name} has expired because the deadline passed. You can create a new request if still needed.`,
      { request_id: req.id },
      { path: `/requests/${req.id}`, email: true }
    );
  }

  return NextResponse.json({ expired: expired.length, ids });
}
