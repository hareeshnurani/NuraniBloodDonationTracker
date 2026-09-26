import Link from "next/link";
import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/card";
import { REQUEST_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { AdminForceCloseButton } from "@/components/admin/admin-force-close-button";
import { AdminFilterPills } from "@/components/admin/admin-filter-pills";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRowIcon } from "@/components/ui/grouped-list";
import { format } from "date-fns";
import { Droplets } from "lucide-react";

const REQUEST_FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "emergency", label: "Emergency" },
  { id: "fulfilled", label: "Fulfilled" },
  { id: "expired", label: "Expired" },
] as const;

type FilterId = (typeof REQUEST_FILTERS)[number]["id"];

function parseFilter(raw: string | undefined): FilterId {
  if (raw && REQUEST_FILTERS.some((f) => f.id === raw)) return raw as FilterId;
  return "all";
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const filter = parseFilter(filterParam);
  const supabase = createServiceClient();

  let query = supabase
    .from("blood_requests")
    .select("*, profiles:requester_id(name)")
    .limit(100);

  if (filter === "open") {
    query = query
      .in("status", ["open", "partially_filled"])
      .order("deadline", { ascending: true });
  } else if (filter === "emergency") {
    query = query
      .in("status", ["open", "partially_filled"])
      .eq("priority", "emergency")
      .order("deadline", { ascending: true });
  } else if (filter === "fulfilled") {
    query = query.eq("status", "fulfilled").order("created_at", { ascending: false });
  } else if (filter === "expired") {
    query = query.eq("status", "expired").order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: requests } = await query;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requests"
        subtitle="Monitor open needs, emergencies, and closed or expired posts."
      />

      <Suspense fallback={<div className="h-10" aria-hidden />}>
        <AdminFilterPills basePath="/admin/requests" paramName="filter" pills={[...REQUEST_FILTERS]} />
      </Suspense>

      {!requests?.length ? (
        <EmptyState
          icon={<Droplets className="h-6 w-6" />}
          title="No requests in this view"
          description="Try another filter or check back when new requests are posted."
        />
      ) : (
        <GroupedSection>
          {requests.map((req) => {
            const closable = ["open", "partially_filled", "draft"].includes(req.status);
            return (
              <div
                key={req.id}
                className="flex items-center border-b border-[var(--separator)] last:border-b-0"
              >
                <Link
                  href={`/requests/${req.id}`}
                  className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 px-4 py-4 transition-colors hover:bg-[var(--surface-secondary)] active:bg-[#ebebf0]"
                >
                  <GroupedRowIcon color={req.priority === "emergency" ? "red" : "gray"}>
                    <Droplets className="h-4 w-4" />
                  </GroupedRowIcon>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-medium text-[var(--label)]">
                        {req.patient_name}
                      </span>
                      <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                        {PRIORITY_LABELS[req.priority]}
                      </Badge>
                      <Badge>{REQUEST_STATUS_LABELS[req.status]}</Badge>
                    </div>
                    <p className="mt-0.5 text-[13px] text-[var(--label-secondary)]">
                      By {(req.profiles as { name: string } | null)?.name ?? "Unknown"} ·{" "}
                      {req.primary_blood_group} · {req.units_filled}/{req.units_needed} units ·
                      Deadline {format(new Date(req.deadline), "MMM d, h:mm a")}
                    </p>
                  </div>
                </Link>
                {closable && (
                  <div className="shrink-0 pr-3">
                    <AdminForceCloseButton requestId={req.id} />
                  </div>
                )}
              </div>
            );
          })}
        </GroupedSection>
      )}
    </div>
  );
}
