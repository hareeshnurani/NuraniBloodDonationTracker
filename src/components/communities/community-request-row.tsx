import Link from "next/link";
import { GroupedRowIcon } from "@/components/ui/grouped-list";
import { Badge } from "@/components/ui/card";
import { RequestShareButton } from "@/components/requests/request-share-button";
import { PRIORITY_LABELS } from "@/lib/constants";
import { Droplets } from "lucide-react";
import { format } from "date-fns";

export type CommunityRequestRowData = {
  id: string;
  patient_name: string;
  primary_blood_group: string;
  priority: string;
  units_filled: number;
  units_needed: number;
  deadline: string;
  status: string;
  hospital_notes?: string | null;
  location_district?: string | null;
  location_state?: string | null;
  pincode?: string | null;
};

export function CommunityRequestRow({ request }: { request: CommunityRequestRowData }) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--separator)] last:border-b-0">
      <Link
        href={`/requests/${request.id}`}
        className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 px-4 py-4 transition-colors hover:bg-[var(--surface-secondary)] active:bg-[#ebebf0]"
      >
        <GroupedRowIcon color="red">
          <Droplets className="h-4 w-4" />
        </GroupedRowIcon>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-medium text-[var(--label)]">{request.patient_name}</span>
            <Badge variant={request.priority === "emergency" ? "emergency" : "default"}>
              {PRIORITY_LABELS[request.priority]}
            </Badge>
          </div>
          <p className="mt-0.5 text-[13px] text-[var(--label-secondary)]">
            {request.primary_blood_group} · {request.units_filled}/{request.units_needed} units
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--label-tertiary)]">
            Deadline {format(new Date(request.deadline), "MMM d, h:mm a")}
          </p>
        </div>
      </Link>
      <div className="shrink-0 pr-3">
        <RequestShareButton
          variant="compact"
          request={{
            id: request.id,
            patient_name: request.patient_name,
            primary_blood_group: request.primary_blood_group,
            priority: request.priority,
            units_needed: request.units_needed,
            units_filled: request.units_filled,
            deadline: request.deadline,
            status: request.status,
            hospital_notes: request.hospital_notes ?? null,
            location_district: request.location_district ?? null,
            location_state: request.location_state ?? null,
            pincode: request.pincode ?? null,
          }}
        />
      </div>
    </div>
  );
}
