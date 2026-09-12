import { notFound } from "next/navigation";
import Link from "next/link";
import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/card";
import { InviteActions } from "@/components/donor/invite-actions";
import { PRIORITY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/constants";
import { formatDistance } from "@/lib/utils";
import { format } from "date-fns";

export default async function InviteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const { data: inv } = await supabase
    .from("donor_invitations")
    .select("*, blood_requests(*)")
    .eq("id", id)
    .eq("donor_id", profile.id)
    .single();

  if (!inv) notFound();

  const req = inv.blood_requests as {
    patient_name: string;
    primary_blood_group: string;
    priority: string;
    status: string;
    units_needed: number;
    units_filled: number;
    deadline: string;
    hospital_notes: string | null;
    accepts_replacement: boolean;
  };

  const canRespond =
    inv.response === "pending" &&
    ["open", "partially_filled"].includes(req.status) &&
    req.units_filled < req.units_needed;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/donor/invites" className="text-sm text-red-600 hover:underline">← Back</Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{req.patient_name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {inv.is_replacement_match && (
            <Badge variant="replacement">
              Replacement donor — primary need: {req.primary_blood_group}
            </Badge>
          )}
          <Badge variant={req.priority === "emergency" ? "emergency" : "default"}>
            {PRIORITY_LABELS[req.priority]}
          </Badge>
          <Badge>{REQUEST_STATUS_LABELS[req.status]}</Badge>
        </div>
      </div>
      <Card>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-gray-500">Blood group needed</dt>
            <dd className="font-medium">{req.primary_blood_group}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Units</dt>
            <dd className="font-medium">{req.units_filled} / {req.units_needed} filled</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Distance</dt>
            <dd className="font-medium">{formatDistance(inv.distance_km)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Deadline</dt>
            <dd className="font-medium">{format(new Date(req.deadline), "MMM d, yyyy h:mm a")}</dd>
          </div>
          {req.hospital_notes && (
            <div>
              <dt className="text-sm text-gray-500">Hospital / notes</dt>
              <dd className="font-medium">{req.hospital_notes}</dd>
            </div>
          )}
        </dl>
        <p className="mt-4 text-xs text-gray-500">
          Your contact details are never shared. Coordinate through in-app chat after accepting.
        </p>
        {canRespond && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <InviteActions invitationId={id} />
          </div>
        )}
        {inv.is_confirmed && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-green-700">You are confirmed for this request.</p>
            <Link href="/chat" className="mt-2 inline-block text-sm text-red-600 hover:underline">
              Go to chat →
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
