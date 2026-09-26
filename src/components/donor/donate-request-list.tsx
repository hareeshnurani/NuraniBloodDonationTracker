import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/card";
import { PRIORITY_LABELS } from "@/lib/constants";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { ActiveRequestActions } from "@/components/donor/active-request-actions";
import { formatDistance } from "@/lib/utils";
import type { DonorActiveRequestRow } from "@/lib/donor-donate-feed";
import { Droplets } from "lucide-react";

function formatDistanceLabel(km: number | null) {
  if (km === null) return "Distance unknown";
  return formatDistance(km);
}

export function DonateRequestList({
  rows,
  donorAvailable,
}: {
  rows: DonorActiveRequestRow[];
  donorAvailable: boolean;
}) {
  return (
    <GroupedSection>
      {rows.map((req) => (
        <GroupedRow key={req.requestId}>
          <GroupedRowIcon color="red">
            <Droplets className="h-4 w-4" />
          </GroupedRowIcon>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/requests/${req.requestId}`}
                className="text-[15px] font-medium text-[var(--label)] hover:text-[var(--accent)]"
              >
                {req.patientName}
              </Link>
              <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                {PRIORITY_LABELS[req.priority]}
              </Badge>
              {req.isReplacementMatch && <Badge variant="replacement">Replacement</Badge>}
            </div>
            <p className="mt-0.5 text-[13px] text-[var(--label-secondary)]">
              {req.primaryBloodGroup} · {req.unitsFilled}/{req.unitsNeeded} units ·{" "}
              {formatDistanceLabel(req.distanceKm)}
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--label-tertiary)]">
              Deadline: {format(new Date(req.deadline), "MMM d, h:mm a")}
            </p>
            {req.inviteResponse === "pending" && req.invitationId ? (
              <Link
                href={`/donor/invites/${req.invitationId}`}
                className="mt-2 inline-block text-[13px] font-medium text-[var(--accent)]"
              >
                Open invitation →
              </Link>
            ) : (!req.inviteResponse || req.inviteResponse === "rejected") && donorAvailable ? (
              <div className="mt-2">
                <ActiveRequestActions requestId={req.requestId} />
              </div>
            ) : null}
          </div>
        </GroupedRow>
      ))}
    </GroupedSection>
  );
}
