import type { SupabaseClient } from "@supabase/supabase-js";

export type ChatRequestInboxItem = {
  requestId: string;
  patientName: string;
  role: "requester" | "donor";
  threadCount: number;
  sortAt: string;
};

const ACTIVE = ["open", "partially_filled"];

export async function getChatRequestInbox(
  supabase: SupabaseClient,
  userId: string
): Promise<ChatRequestInboxItem[]> {
  const { data: donorInvites } = await supabase
    .from("donor_invitations")
    .select("request_id, donation_confirmations(status)")
    .eq("donor_id", userId)
    .eq("is_confirmed", true);

  const donatedRequestIds = new Set<string>();
  for (const inv of donorInvites ?? []) {
    const dc = inv.donation_confirmations as { status: string } | { status: string }[] | null;
    const row = Array.isArray(dc) ? dc[0] : dc;
    if (row?.status === "donated") donatedRequestIds.add(inv.request_id);
  }

  const { data: threads } = await supabase
    .from("chat_threads")
    .select(
      "id, request_id, requester_id, donor_id, created_at, blood_requests(patient_name, status)"
    )
    .or(`requester_id.eq.${userId},donor_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  const byRequest = new Map<string, ChatRequestInboxItem>();

  for (const t of threads ?? []) {
    const req = t.blood_requests as unknown as {
      patient_name: string;
      status: string;
    } | null;
    if (!req || !ACTIVE.includes(req.status)) continue;

    const isRequester = t.requester_id === userId;
    const isDonor = t.donor_id === userId;

    if (isDonor) {
      if (donatedRequestIds.has(t.request_id)) continue;
    }

    const role: "requester" | "donor" = isRequester ? "requester" : "donor";
    const existing = byRequest.get(t.request_id);

    if (!existing) {
      byRequest.set(t.request_id, {
        requestId: t.request_id,
        patientName: req.patient_name,
        role: isRequester ? "requester" : "donor",
        threadCount: 1,
        sortAt: t.created_at,
      });
    } else {
      existing.threadCount += 1;
      if (t.created_at > existing.sortAt) existing.sortAt = t.created_at;
      if (isRequester) existing.role = "requester";
    }
  }

  return Array.from(byRequest.values()).sort(
    (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()
  );
}

export type ChatDonorThreadItem = {
  threadId: string;
  donorId: string;
  donorName: string;
  sortAt: string;
};

export async function getRequesterDonorThreads(
  supabase: SupabaseClient,
  requestId: string,
  requesterId: string
): Promise<ChatDonorThreadItem[]> {
  const { data: invites } = await supabase
    .from("donor_invitations")
    .select("donor_id, donation_confirmations(status)")
    .eq("request_id", requestId)
    .eq("is_confirmed", true);

  const donatedDonors = new Set<string>();
  for (const inv of invites ?? []) {
    const dc = inv.donation_confirmations as { status: string } | { status: string }[] | null;
    const row = Array.isArray(dc) ? dc[0] : dc;
    if (row?.status === "donated") donatedDonors.add(inv.donor_id);
  }

  const { data: threads } = await supabase
    .from("chat_threads")
    .select("id, donor_id, created_at, profiles:donor_id(name), blood_requests(status)")
    .eq("request_id", requestId)
    .eq("requester_id", requesterId)
    .order("created_at", { ascending: false });

  const items: ChatDonorThreadItem[] = [];

  for (const t of threads ?? []) {
    const req = t.blood_requests as unknown as { status: string } | null;
    if (!req || !ACTIVE.includes(req.status)) continue;
    if (donatedDonors.has(t.donor_id)) continue;

    const donor = t.profiles as unknown as { name: string } | { name: string }[] | null;
    const name = Array.isArray(donor) ? donor[0]?.name : donor?.name;

    items.push({
      threadId: t.id,
      donorId: t.donor_id,
      donorName: name ?? "Donor",
      sortAt: t.created_at,
    });
  }

  return items;
}
