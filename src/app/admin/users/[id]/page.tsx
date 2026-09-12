import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { Card, Badge } from "@/components/ui/card";
import {
  UserApprovalActions,
  AdminDonorDateEditor,
  AdminMessageForm,
} from "@/components/admin/user-actions";
import { USER_STATUS_LABELS } from "@/lib/constants";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from("profiles")
    .select("*, donor_profiles(*)")
    .eq("id", id)
    .single();

  if (!user) notFound();

  const donor = user.donor_profiles as {
    blood_group: string;
    last_donation_date: string | null;
    is_available: boolean;
  } | null;

  const { data: requests } = await supabase
    .from("blood_requests")
    .select("id, patient_name, status, units_needed, units_filled, created_at")
    .eq("requester_id", id)
    .order("created_at", { ascending: false });

  const { data: invites } = await supabase
    .from("donor_invitations")
    .select("response, is_confirmed")
    .eq("donor_id", id);

  const accepted = invites?.filter((i) => i.is_confirmed).length ?? 0;
  const rejected = invites?.filter((i) => i.response === "rejected").length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/users" className="text-sm text-red-600 hover:underline">← Back</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
        <Badge>{USER_STATUS_LABELS[user.status]}</Badge>
      </div>

      <Card>
        <dl className="space-y-2 text-sm">
          <div><dt className="text-gray-500">Email</dt><dd>{user.email}</dd></div>
          <div><dt className="text-gray-500">Location</dt><dd>{user.latitude}, {user.longitude}</dd></div>
          {donor && (
            <>
              <div><dt className="text-gray-500">Blood group</dt><dd>{donor.blood_group}</dd></div>
              <div><dt className="text-gray-500">Available</dt><dd>{donor.is_available ? "Yes" : "No"}</dd></div>
            </>
          )}
        </dl>
        {user.status === "pending_approval" && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <UserApprovalActions userId={id} />
          </div>
        )}
      </Card>

      {donor && (
        <Card>
          <h2 className="font-semibold">Edit last donation date</h2>
          <div className="mt-3">
            <AdminDonorDateEditor userId={id} currentDate={donor.last_donation_date} />
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold">Send message</h2>
        <div className="mt-3">
          <AdminMessageForm userId={id} />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Donor stats</h2>
        <p className="mt-2 text-sm text-gray-600">Accepted: {accepted} · Rejected: {rejected}</p>
      </Card>

      <Card>
        <h2 className="font-semibold">Requests raised ({requests?.length ?? 0})</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {requests?.map((r) => (
            <li key={r.id} className="text-gray-600">
              {r.patient_name} — {r.status} ({r.units_filled}/{r.units_needed})
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
