import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { requireActiveProfile, getDonorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkDeadlineWarnings } from "@/lib/actions/requests";
import { Card, Badge } from "@/components/ui/card";
import { RequestActions } from "@/components/requests/request-actions";
import { ActiveRequestActions } from "@/components/donor/active-request-actions";
import { REQUEST_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { shouldPromptDeadlineExtension } from "@/lib/utils";
import { RequestShareButton } from "@/components/requests/request-share-button";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  await checkDeadlineWarnings(id);

  const { data: request } = await supabase
    .from("blood_requests")
    .select("*, request_replacement_groups(blood_group)")
    .eq("id", id)
    .single();

  if (!request) notFound();

  const isOwner = request.requester_id === profile.id;
  const isAdmin = profile.role === "admin";
  const isOpen = ["open", "partially_filled"].includes(request.status);

  const { data: myInvite } = await supabase
    .from("donor_invitations")
    .select("id, response, is_confirmed")
    .eq("request_id", id)
    .eq("donor_id", profile.id)
    .maybeSingle();

  const donorProfile =
    !isOwner && !isAdmin ? await getDonorProfile(profile.id) : null;
  const showDonorRespond =
    !isOwner &&
    !isAdmin &&
    isOpen &&
    request.units_filled < request.units_needed &&
    !!donorProfile?.willing_to_donate;

  const { data: invitations } =
    isOwner || isAdmin
      ? await supabase
          .from("donor_invitations")
          .select("*, profiles:donor_id(name)")
          .eq("request_id", id)
          .order("created_at", { ascending: false })
      : { data: null };

  const { data: threads } = isOwner
    ? await supabase
        .from("chat_threads")
        .select("id, donor_id")
        .eq("request_id", id)
        .eq("requester_id", profile.id)
    : { data: null };

  const canExtend =
    isOwner &&
    !request.extension_prompted_at &&
    shouldPromptDeadlineExtension(request.deadline) &&
    request.units_filled < request.units_needed;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/home" className="text-sm text-red-600 hover:underline">← Back</Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{request.patient_name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={request.priority === "emergency" ? "emergency" : "default"}>
              {PRIORITY_LABELS[request.priority]}
            </Badge>
            <Badge>{REQUEST_STATUS_LABELS[request.status]}</Badge>
            <Badge>{request.primary_blood_group}</Badge>
          </div>
        </div>
        {isOpen && (
          <RequestShareButton
            request={{
              id: request.id,
              patient_name: request.patient_name,
              primary_blood_group: request.primary_blood_group,
              priority: request.priority,
              units_needed: request.units_needed,
              units_filled: request.units_filled,
              deadline: request.deadline,
              status: request.status,
              hospital_notes: request.hospital_notes,
              location_district: request.location_district,
              location_state: request.location_state,
              pincode: request.pincode,
            }}
          />
        )}
      </div>

      <Card>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-500">Units</dt>
            <dd className="font-medium">{request.units_filled} / {request.units_needed} filled</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Deadline</dt>
            <dd className="font-medium">{format(new Date(request.deadline), "MMM d, yyyy h:mm a")}</dd>
          </div>
          {request.hospital_notes && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-gray-500">Hospital / Blood bank</dt>
              <dd className="font-medium">{request.hospital_notes}</dd>
              {request.pincode && (
                <dd className="text-sm text-gray-500 mt-0.5">
                  PIN {request.pincode}
                  {request.location_district && ` · ${request.location_district}`}
                  {request.location_state && `, ${request.location_state}`}
                </dd>
              )}
            </div>
          )}
          {request.accepts_replacement && request.request_replacement_groups?.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-gray-500">Replacement groups accepted</dt>
              <dd className="font-medium">
                {request.request_replacement_groups.map((g: { blood_group: string }) => g.blood_group).join(", ")}
              </dd>
            </div>
          )}
          {request.closure_reason && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-gray-500">Closure reason</dt>
              <dd className="font-medium">{request.closure_reason}</dd>
            </div>
          )}
        </dl>
        {isOwner && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <RequestActions
              requestId={id}
              status={request.status}
              canExtend={canExtend || !!request.extension_prompted_at}
            />
          </div>
        )}
      </Card>

      {!isOwner && !isAdmin && myInvite && (
        <Card>
          <h2 className="font-semibold text-gray-900">Your invitation</h2>
          <p className="mt-2 text-sm text-gray-600">
            You have been matched to this request.
          </p>
          <Link
            href={`/donor/invites/${myInvite.id}`}
            className="mt-3 inline-block text-sm font-medium text-red-600 hover:underline"
          >
            Open invite →
          </Link>
        </Card>
      )}

      {showDonorRespond && !myInvite && (
        <Card>
          <h2 className="font-semibold text-gray-900">Respond as donor</h2>
          <p className="mt-1 text-sm text-gray-600">
            Turn on availability on Home if accept fails. You will confirm distance before accepting
            requests far from you.
          </p>
          <div className="mt-4">
            <ActiveRequestActions requestId={id} />
          </div>
        </Card>
      )}

      {isOwner && threads && threads.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900">Chats with confirmed donors</h2>
          <ul className="mt-3 space-y-2">
            {threads.map((t) => (
              <li key={t.id}>
                <Link href={`/chat/${t.id}`} className="text-sm text-red-600 hover:underline">
                  Open chat →
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isOwner && (
        <Card>
          <h2 className="font-semibold text-gray-900">Donor responses</h2>
          {invitations && invitations.length > 0 ? (
            <ul className="mt-3 divide-y divide-gray-100">
              {invitations.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium">
                      {(inv.profiles as { name: string })?.name ?? "Donor"}
                    </span>
                    {inv.is_replacement_match && (
                      <Badge variant="replacement" className="ml-2">Replacement</Badge>
                    )}
                    <p className="text-sm text-gray-500">{inv.distance_km} km away</p>
                  </div>
                  <Badge
                    variant={
                      inv.is_confirmed ? "success" : inv.response === "rejected" ? "default" : "warning"
                    }
                  >
                    {inv.is_confirmed ? "Confirmed" : inv.response}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500">No donors notified yet.</p>
          )}
        </Card>
      )}
    </div>
  );
}
