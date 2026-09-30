import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Calendar, Droplets, MapPin } from "lucide-react";
import { format } from "date-fns";
import type { DonationHistoryEntry } from "@/lib/types";

export function DonationHistoryList({ entries }: { entries: DonationHistoryEntry[] }) {
  return (
    <GroupedSection
      footer={
        entries.length > 0
          ? `${entries.length} donation${entries.length !== 1 ? "s" : ""} recorded through BloodLink`
          : undefined
      }
    >
      {entries.map((entry) => (
        <GroupedRow key={entry.invitation_id}>
          <GroupedRowIcon color="green">
            <Droplets className="h-4 w-4" />
          </GroupedRowIcon>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-[var(--label)]">{entry.patient_name}</p>
            <p className="mt-0.5 text-[13px] text-[var(--label-secondary)]">
              Blood group needed: {entry.blood_group}
            </p>
            {entry.donated_date && (
              <p className="mt-0.5 flex items-center gap-1 text-[13px] text-[var(--success)]">
                <Calendar className="h-3.5 w-3.5" />
                Donated on {format(new Date(entry.donated_date), "MMM d, yyyy")}
              </p>
            )}
            {entry.hospital_notes && (
              <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[var(--label-tertiary)]">
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
