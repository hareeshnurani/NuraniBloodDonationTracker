import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/admin";

const ACTIVE_REQUEST_STATUSES = ["open", "partially_filled"] as const;

/** Remove all threads for a closed/expired/fulfilled request (requester inbox). */
export async function deleteChatThreadsForRequest(
  supabase: SupabaseClient,
  requestId: string
) {
  await supabase.from("chat_threads").delete().eq("request_id", requestId);
}

export async function deleteChatThreadsForRequestIds(
  supabase: SupabaseClient,
  requestIds: string[]
) {
  if (!requestIds.length) return;
  await supabase.from("chat_threads").delete().in("request_id", requestIds);
}

/** Remove one donor↔requester thread after they mark donation complete. */
export async function deleteDonorChatThread(
  supabase: SupabaseClient,
  requestId: string,
  donorId: string
) {
  await supabase
    .from("chat_threads")
    .delete()
    .eq("request_id", requestId)
    .eq("donor_id", donorId);
}

/**
 * When every confirmed slot has answered donation confirmation and the request
 * is no longer actively collecting, remove any remaining threads.
 */
export async function cleanupRequestChatsIfFullyResolved(
  supabase: SupabaseClient,
  requestId: string
) {
  const { data: request } = await supabase
    .from("blood_requests")
    .select("status, units_filled, units_needed")
    .eq("id", requestId)
    .single();

  if (!request) return;

  if (ACTIVE_REQUEST_STATUSES.includes(request.status as (typeof ACTIVE_REQUEST_STATUSES)[number])) {
    if (request.units_filled < request.units_needed) return;
  }

  const { data: confirmedInvites } = await supabase
    .from("donor_invitations")
    .select("id, donation_confirmations(status)")
    .eq("request_id", requestId)
    .eq("is_confirmed", true);

  if (!confirmedInvites?.length) return;

  const allAnswered = confirmedInvites.every((inv) => {
    const dc = inv.donation_confirmations as
      | { status: string }
      | { status: string }[]
      | null;
    const row = Array.isArray(dc) ? dc[0] : dc;
    return row && row.status !== "pending";
  });

  if (!allAnswered) return;

  await deleteChatThreadsForRequest(supabase, requestId);
}

export async function onDonorMarkedDonated(invitationId: string) {
  const supabase = createServiceClient();
  const { data: inv } = await supabase
    .from("donor_invitations")
    .select("request_id, donor_id")
    .eq("id", invitationId)
    .single();

  if (!inv) return;

  await deleteDonorChatThread(supabase, inv.request_id, inv.donor_id);
  await cleanupRequestChatsIfFullyResolved(supabase, inv.request_id);
}

export async function onRequestEnded(requestId: string) {
  const supabase = createServiceClient();
  await deleteChatThreadsForRequest(supabase, requestId);
}

export async function onRequestsEnded(requestIds: string[]) {
  const supabase = createServiceClient();
  await deleteChatThreadsForRequestIds(supabase, requestIds);
}
