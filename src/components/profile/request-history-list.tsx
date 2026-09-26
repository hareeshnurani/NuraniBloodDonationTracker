import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Badge } from "@/components/ui/card";
import { PRIORITY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/constants";
import type { BloodRequest } from "@/lib/types";
import { Droplets } from "lucide-react";
import { format } from "date-fns";

function statusBadgeVariant(status: BloodRequest["status"]) {
  if (status === "open" || status === "partially_filled") return "default" as const;
  if (status === "fulfilled") return "success" as const;
  if (status === "expired") return "warning" as const;
  return "default" as const;
}

export function RequestHistoryList({ requests }: { requests: BloodRequest[] }) {
  return (
    <GroupedSection
      footer={
        requests.length > 0
          ? `${requests.length} request${requests.length !== 1 ? "s" : ""} since you joined BloodLink`
          : undefined
      }
    >
      {requests.map((req) => (
        <GroupedRow key={req.id} href={`/requests/${req.id}`} showChevron>
          <GroupedRowIcon color="red">
            <Droplets className="h-4 w-4" />
          </GroupedRowIcon>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-medium text-[var(--label)]">{req.patient_name}</span>
              <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                {PRIORITY_LABELS[req.priority]}
              </Badge>
              <Badge variant={statusBadgeVariant(req.status)}>
                {REQUEST_STATUS_LABELS[req.status]}
              </Badge>
            </div>
            <p className="mt-0.5 text-[13px] text-[var(--label-secondary)]">
              {req.primary_blood_group} · {req.units_filled}/{req.units_needed} units
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--label-tertiary)]">
              Created {format(new Date(req.created_at), "MMM d, yyyy")} · Deadline{" "}
              {format(new Date(req.deadline), "MMM d, h:mm a")}
            </p>
            {req.status === "closed" && req.closure_reason && (
              <p className="mt-0.5 text-[12px] text-[var(--label-secondary)]">
                Closed: {req.closure_reason}
              </p>
            )}
          </div>
        </GroupedRow>
      ))}
    </GroupedSection>
  );
}
