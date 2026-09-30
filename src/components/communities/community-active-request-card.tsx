import Link from "next/link";
import { GroupedRowIcon } from "@/components/ui/grouped-list";
import { Badge } from "@/components/ui/card";
import { DonorRequestActions } from "@/components/donor/donor-request-actions";
import { PRIORITY_LABELS } from "@/lib/constants";
import { Droplets } from "lucide-react";
import { format } from "date-fns";

export type CommunityActiveRequestData = {
  id: string;
  patient_name: string;
  primary_blood_group: string;
  priority: string;
  units_filled: number;
  units_needed: number;
  deadline: string;
};

export function CommunityActiveRequestCard({
  request,
  showDonorActions,
  invitationId,
  distanceKm,
  inviteResponse,
  isConfirmed,
}: {
  request: CommunityActiveRequestData;
  showDonorActions: boolean;
  invitationId: string | null;
  distanceKm: number;
  inviteResponse?: string | null;
  isConfirmed?: boolean;
}) {
  return (
    <div className="border-b border-[var(--separator)] last:border-b-0">
      <Link
        href={`/requests/${request.id}`}
        className="flex min-h-[52px] items-center gap-3 px-4 py-4 transition-colors hover:bg-[var(--surface-secondary)] active:bg-[#ebebf0]"
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
      {showDonorActions && (
        <div className="border-t border-[var(--separator)] bg-[var(--surface-secondary)]/40 px-4 py-3">
          <DonorRequestActions
            requestId={request.id}
            invitationId={invitationId}
            distanceKm={distanceKm}
            inviteResponse={inviteResponse}
            isConfirmed={isConfirmed}
            compact
            showDetailsLink
          />
        </div>
      )}
    </div>
  );
}
