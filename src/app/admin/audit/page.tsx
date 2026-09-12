import { createServiceClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

export default async function AdminAuditPage() {
  const supabase = createServiceClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, profiles:actor_id(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Audit logs</h1>
      <div className="space-y-2">
        {logs?.map((log) => (
          <Card key={log.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">{log.action}</p>
                <p className="text-sm text-gray-500">
                  {log.entity_type} · {(log.profiles as { name: string } | null)?.name ?? "System"}
                </p>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <pre className="mt-1 text-xs text-gray-400">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
              <time className="shrink-0 text-xs text-gray-400">
                {format(new Date(log.created_at), "MMM d, h:mm a")}
              </time>
            </div>
          </Card>
        ))}
        {(!logs || logs.length === 0) && (
          <Card className="text-center text-gray-500">
            <p>No audit logs yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
