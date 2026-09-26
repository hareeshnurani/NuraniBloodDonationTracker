import type { SupabaseClient } from "@supabase/supabase-js";
import type { BloodRequest, DonationHistoryEntry } from "@/lib/types";

export async function getDonatedHistoryForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<DonationHistoryEntry[]> {
  const { data } = await supabase
    .from("donation_confirmations")
    .select(`
      invitation_id,
      status,
      donated_date,
      not_donated_reason,
      answered_at,
      donor_invitations!inner(
        donor_id,
        responded_at,
        blood_requests(patient_name, primary_blood_group, hospital_notes)
      )
    `)
    .eq("donor_invitations.donor_id", userId)
    .eq("status", "donated")
    .not("answered_at", "is", null)
    .order("donated_date", { ascending: false, nullsFirst: false })
    .order("answered_at", { ascending: false });

  return (data ?? []).map((row) => {
    const inv = row.donor_invitations as unknown as {
      responded_at: string | null;
      blood_requests: {
        patient_name: string;
        primary_blood_group: string;
        hospital_notes: string | null;
      };
    };
    const req = inv.blood_requests;
    return {
      invitation_id: row.invitation_id,
      status: row.status as DonationHistoryEntry["status"],
      donated_date: row.donated_date,
      not_donated_reason: row.not_donated_reason,
      answered_at: row.answered_at,
      patient_name: req.patient_name,
      blood_group: req.primary_blood_group,
      hospital_notes: req.hospital_notes,
      accepted_at: inv.responded_at,
    };
  });
}

export async function getRequestHistoryForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<BloodRequest[]> {
  const { data } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("requester_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []) as BloodRequest[];
}
