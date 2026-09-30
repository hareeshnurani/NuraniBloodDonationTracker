import { createServiceClient } from "@/lib/supabase/admin";
import { format } from "date-fns";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Shield } from "lucide-react";

export default async function AdminReportsPage() {
  const supabase = createServiceClient();

  const { data: reports, error } = await supabase
    .from("content_reports")
    .select("*, profiles:reporter_id(name)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderation"
        subtitle="User-submitted reports on chat, communities, and requests."
      />

      {error && (
        <p className="text-sm text-[var(--warning)]">
          Could not load reports. Apply Supabase migration 012 if this table is missing.
        </p>
      )}

      {!reports?.length ? (
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title="No open reports"
          description="When someone reports content, it will appear here for review."
        />
      ) : (
        <GroupedSection>
          {reports.map((r) => (
            <GroupedRow key={r.id}>
              <GroupedRowIcon color="orange">
                <Shield className="h-4 w-4" />
              </GroupedRowIcon>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium capitalize text-[var(--label)]">
                  {r.entity_type.replace("_", " ")} · {r.reason}
                </p>
                <p className="mt-0.5 text-[13px] text-[var(--label-secondary)]">
                  Reported by {(r.profiles as { name: string } | null)?.name ?? "Unknown"} ·{" "}
                  {format(new Date(r.created_at), "MMM d, h:mm a")}
                </p>
                {r.details && (
                  <p className="mt-2 text-[13px] text-[var(--label-secondary)]">{r.details}</p>
                )}
                <p className="mt-2 text-[12px] text-[var(--label-tertiary)]">Entity ID: {r.entity_id}</p>
              </div>
            </GroupedRow>
          ))}
        </GroupedSection>
      )}
    </div>
  );
}
