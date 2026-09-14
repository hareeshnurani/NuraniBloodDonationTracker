"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Badge } from "@/components/ui/card";
import { Droplets, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import type { DonationHistoryEntry } from "@/lib/types";

export function DonationHistory() {
  const [history, setHistory] = useState<DonationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        .eq("donor_invitations.donor_id", user.id)
        .not("answered_at", "is", null)
        .order("answered_at", { ascending: false });

      const entries: DonationHistoryEntry[] = (data ?? []).map((row) => {
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
          status: row.status,
          donated_date: row.donated_date,
          not_donated_reason: row.not_donated_reason,
          answered_at: row.answered_at,
          patient_name: req.patient_name,
          blood_group: req.primary_blood_group,
          hospital_notes: req.hospital_notes,
          accepted_at: inv.responded_at,
        };
      });

      setHistory(entries);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <GroupedSection title="Donation History">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </GroupedSection>
    );
  }

  if (history.length === 0) {
    return (
      <GroupedSection title="Donation History">
        <div className="p-6 text-center">
          <Droplets className="h-8 w-8 mx-auto text-[var(--label-tertiary)] mb-2" />
          <p className="text-[15px] font-medium text-[var(--label)]">No donations recorded yet</p>
          <p className="text-[13px] text-[var(--label-secondary)] mt-1">
            When you accept and complete a request, your donation history will appear here.
          </p>
        </div>
      </GroupedSection>
    );
  }

  const donatedCount = history.filter((h) => h.status === "donated").length;

  return (
    <GroupedSection
      title="Donation History"
      footer={`${donatedCount} unit${donatedCount !== 1 ? "s" : ""} donated through BloodLink`}
    >
      {history.map((entry) => (
        <GroupedRow key={entry.invitation_id}>
          <GroupedRowIcon color={entry.status === "donated" ? "green" : "gray"}>
            <Droplets className="h-4 w-4" />
          </GroupedRowIcon>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-medium text-[var(--label)]">{entry.patient_name}</span>
              <Badge variant={entry.status === "donated" ? "success" : "warning"}>
                {entry.status === "donated" ? "Donated" : "Not donated"}
              </Badge>
            </div>
            <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">
              Blood group needed: {entry.blood_group}
            </p>
            {entry.status === "donated" && entry.donated_date && (
              <p className="text-[13px] text-[var(--success)] mt-0.5 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Donated on {format(new Date(entry.donated_date), "MMM d, yyyy")}
              </p>
            )}
            {entry.status === "not_donated" && entry.not_donated_reason && (
              <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">
                Reason: {entry.not_donated_reason}
              </p>
            )}
            {entry.hospital_notes && (
              <p className="text-[12px] text-[var(--label-tertiary)] mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {entry.hospital_notes}
              </p>
            )}
          </div>
        </GroupedRow>
      ))}
    </GroupedSection>
  );
}
