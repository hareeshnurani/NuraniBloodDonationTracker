import { createServiceClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

export default async function AdminReportsPage() {
  const supabase = createServiceClient();

  const { data: reports, error } = await supabase
    .from("content_reports")
    .select("*, profiles:reporter_id(name)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Moderation queue</h1>
        <p className="mt-1 text-sm text-gray-600">User-submitted reports (chat, communities, requests).</p>
      </div>

      {error && (
        <p className="text-sm text-amber-700">
          Could not load reports. Apply Supabase migration 012 if this table is missing.
        </p>
      )}

      {!reports?.length ? (
        <p className="text-sm text-gray-500">No open reports.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <p className="font-medium capitalize">
                {r.entity_type.replace("_", " ")} · {r.reason}
              </p>
              <p className="text-sm text-gray-600">
                Reported by {(r.profiles as { name: string } | null)?.name ?? "Unknown"} ·{" "}
                {format(new Date(r.created_at), "MMM d, h:mm a")}
              </p>
              {r.details && <p className="mt-2 text-sm text-gray-700">{r.details}</p>}
              <p className="mt-2 text-xs text-gray-400">Entity ID: {r.entity_id}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
