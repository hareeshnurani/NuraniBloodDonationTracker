import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { Card, Badge } from "@/components/ui/card";
import { USER_STATUS_LABELS } from "@/lib/constants";

export default async function AdminUsersPage() {
  const supabase = createServiceClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("*, donor_profiles(blood_group, is_available)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      <div className="space-y-2">
        {users?.map((user) => (
          <Link key={user.id} href={`/admin/users/${user.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  {user.role === "admin" && <Badge variant="emergency">Admin</Badge>}
                  <Badge variant={user.status === "pending_approval" ? "warning" : "default"}>
                    {USER_STATUS_LABELS[user.status]}
                  </Badge>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
