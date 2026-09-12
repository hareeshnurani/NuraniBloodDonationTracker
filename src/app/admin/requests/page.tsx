import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { Card, Badge } from "@/components/ui/card";
import { REQUEST_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { format } from "date-fns";

export default async function AdminRequestsPage() {
  const supabase = createServiceClient();

  const { data: requests } = await supabase
    .from("blood_requests")
    .select("*, profiles:requester_id(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">All requests</h1>
      <div className="space-y-2">
        {requests?.map((req) => (
          <Link key={req.id} href={`/requests/${req.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{req.patient_name}</p>
                  <p className="text-sm text-gray-500">
                    By {(req.profiles as { name: string })?.name} · {req.primary_blood_group} ·{" "}
                    {req.units_filled}/{req.units_needed} units ·{" "}
                    {format(new Date(req.deadline), "MMM d, h:mm a")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
                    {PRIORITY_LABELS[req.priority]}
                  </Badge>
                  <Badge>{REQUEST_STATUS_LABELS[req.status]}</Badge>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
