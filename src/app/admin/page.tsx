import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Users, Droplets, Clock } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  const [{ count: pendingUsers }, { count: openRequests }, { count: activeDonors }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "pending_approval"),
      supabase.from("blood_requests").select("*", { count: "exact", head: true }).in("status", ["open", "partially_filled"]),
      supabase.from("donor_profiles").select("*", { count: "exact", head: true }).eq("is_available", true),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/users">
          <Card className="transition-shadow hover:shadow-md">
            <Clock className="h-8 w-8 text-amber-500" />
            <p className="mt-2 text-2xl font-bold">{pendingUsers ?? 0}</p>
            <p className="text-sm text-gray-500">Pending approvals</p>
          </Card>
        </Link>
        <Link href="/admin/requests">
          <Card className="transition-shadow hover:shadow-md">
            <Droplets className="h-8 w-8 text-red-500" />
            <p className="mt-2 text-2xl font-bold">{openRequests ?? 0}</p>
            <p className="text-sm text-gray-500">Open requests</p>
          </Card>
        </Link>
        <Card>
          <Users className="h-8 w-8 text-green-500" />
          <p className="mt-2 text-2xl font-bold">{activeDonors ?? 0}</p>
          <p className="text-sm text-gray-500">Available donors</p>
        </Card>
      </div>
    </div>
  );
}
