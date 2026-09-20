import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/card";
import { PRIORITY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/constants";
import { Droplets } from "lucide-react";

type RequestRow = {
  id: string;
  patient_name: string;
  priority: string;
  primary_blood_group: string;
  units_filled: number;
  units_needed: number;
  status: string;
  deadline: string;
};

export function RequesterActiveRequestCards({ requests }: { requests: RequestRow[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {requests.map((req) => {
        const pct =
          req.units_needed > 0
            ? Math.min(100, Math.round((req.units_filled / req.units_needed) * 100))
            : 0;
        return (
          <Link
            key={req.id}
            href={`/requests/${req.id}`}
            className="group block rounded-[var(--radius-lg)] border border-[var(--separator)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] transition-all hover:border-[var(--accent)]/30 hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Droplets className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[var(--label)] group-hover:text-[var(--accent)]">
                    {req.patient_name}
                  </p>
                  <p className="text-[12px] text-[var(--label-secondary)]">
                    {req.primary_blood_group} · {REQUEST_STATUS_LABELS[req.status]}
                  </p>
                </div>
              </div>
              <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                {PRIORITY_LABELS[req.priority]}
              </Badge>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[12px] text-[var(--label-secondary)]">
                <span>Units</span>
                <span className="font-medium tabular-nums text-[var(--label)]">
                  {req.units_filled}/{req.units_needed}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-[var(--label-tertiary)]">
              Deadline {format(new Date(req.deadline), "MMM d, h:mm a")}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
