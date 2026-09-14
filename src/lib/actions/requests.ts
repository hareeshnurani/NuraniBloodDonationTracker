"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { haversineKm, isDonorEligible, shouldPromptDeadlineExtension } from "@/lib/utils";
import { MATCH_RADIUS_KM } from "@/lib/constants";
import type { BloodGroup } from "@/lib/constants";
import { getFacilityById } from "@/lib/facilities";

async function logAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = createServiceClient();
  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}

async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  payload: Record<string, unknown> = {}
) {
  const supabase = createServiceClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    payload,
  });
}

export async function broadcastRequest(requestId: string) {
  const supabase = createServiceClient();

  const { data: request } = await supabase
    .from("blood_requests")
    .select("*, request_replacement_groups(blood_group)")
    .eq("id", requestId)
    .single();

  if (!request || request.status !== "open") return;

  const replacementGroups: BloodGroup[] =
    request.request_replacement_groups?.map((g: { blood_group: BloodGroup }) => g.blood_group) ?? [];

  const { data: donors } = await supabase
    .from("donor_profiles")
    .select("*, profiles!inner(id, latitude, longitude, status)")
    .eq("willing_to_donate", true)
    .eq("is_available", true)
    .eq("profiles.status", "active");

  if (!donors) return;

  const matches = donors
    .filter((d) => {
      const profile = d.profiles as { latitude: number; longitude: number };
      if (!profile.latitude || !profile.longitude) return false;
      if (!isDonorEligible(d.last_donation_date)) return false;

      const distance = haversineKm(
        request.latitude,
        request.longitude,
        profile.latitude,
        profile.longitude
      );
      if (distance > MATCH_RADIUS_KM) return false;

      const isPrimary = d.blood_group === request.primary_blood_group;
      const isReplacement =
        request.accepts_replacement && replacementGroups.includes(d.blood_group);
      return isPrimary || isReplacement;
    })
    .map((d) => {
      const profile = d.profiles as { id: string; latitude: number; longitude: number };
      const distance = haversineKm(
        request.latitude,
        request.longitude,
        profile.latitude,
        profile.longitude
      );
      return {
        request_id: requestId,
        donor_id: profile.id,
        is_replacement_match:
          d.blood_group !== request.primary_blood_group &&
          replacementGroups.includes(d.blood_group),
        distance_km: Math.round(distance * 10) / 10,
      };
    })
    .sort((a, b) => a.distance_km - b.distance_km);

  if (matches.length === 0) return;

  await supabase.from("donor_invitations").upsert(matches, {
    onConflict: "request_id,donor_id",
    ignoreDuplicates: true,
  });

  const priorityLabel = request.priority === "emergency" ? "🚨 Emergency" : "Routine";
  for (const match of matches) {
    const replacementNote = match.is_replacement_match
      ? ` (Replacement donor — primary need: ${request.primary_blood_group})`
      : "";
    await createNotification(
      match.donor_id,
      "new_request",
      `${priorityLabel} blood request`,
      `Blood needed for ${request.patient_name} — ${request.primary_blood_group}, ${match.distance_km} km away${replacementNote}`,
      { request_id: requestId, patient_name: request.patient_name }
    );
  }
}

export async function createBloodRequest(formData: FormData) {
  const profile = await getProfile();
  if (!profile || profile.status !== "active") {
    return { error: "Not authorized" };
  }

  const supabase = await createClient();
  const replacementGroups = formData.getAll("replacement_groups") as BloodGroup[];
  const publish = formData.get("publish") === "true";

  const facilityId = formData.get("facility_id") as string;
  const facility = getFacilityById(facilityId);
  if (!facility) {
    return { error: "Please select a valid hospital or blood bank." };
  }

  const additionalNotes = (formData.get("hospital_notes") as string)?.trim();
  const hospitalNotes = additionalNotes
    ? `${facility.name} — ${additionalNotes}`
    : facility.name;

  const { data: request, error } = await supabase
    .from("blood_requests")
    .insert({
      requester_id: profile.id,
      patient_name: formData.get("patient_name") as string,
      primary_blood_group: formData.get("primary_blood_group") as BloodGroup,
      units_needed: parseInt(formData.get("units_needed") as string, 10),
      priority: formData.get("priority") as string,
      deadline: formData.get("deadline") as string,
      accepts_replacement: formData.get("accepts_replacement") === "true",
      latitude: facility.latitude,
      longitude: facility.longitude,
      hospital_notes: hospitalNotes,
      status: publish ? "open" : "draft",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  if (replacementGroups.length > 0) {
    await supabase.from("request_replacement_groups").insert(
      replacementGroups.map((bg) => ({ request_id: request.id, blood_group: bg }))
    );
  }

  await logAudit(profile.id, "request_created", "blood_request", request.id);

  if (publish) {
    await broadcastRequest(request.id);
  }

  revalidatePath("/home");
  revalidatePath("/requests");
  return { success: true, id: request.id };
}

export async function publishBloodRequest(requestId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("blood_requests")
    .update({ status: "open" })
    .eq("id", requestId)
    .eq("requester_id", profile.id)
    .eq("status", "draft");

  if (error) return { error: error.message };

  await broadcastRequest(requestId);
  revalidatePath(`/requests/${requestId}`);
  return { success: true };
}

export async function closeBloodRequest(requestId: string, reason: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = createServiceClient();
  const { data: request } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("id", requestId)
    .eq("requester_id", profile.id)
    .single();

  if (!request) return { error: "Request not found" };
  if (!["open", "partially_filled"].includes(request.status)) {
    return { error: "Cannot close this request" };
  }
  if (!reason.trim()) return { error: "Reason is required" };

  await supabase
    .from("blood_requests")
    .update({
      status: "closed",
      closure_type: "manual",
      closure_reason: reason.trim(),
    })
    .eq("id", requestId);

  await supabase
    .from("chat_threads")
    .update({ status: "closed" })
    .eq("request_id", requestId);

  const { data: confirmed } = await supabase
    .from("donor_invitations")
    .select("id, donor_id")
    .eq("request_id", requestId)
    .eq("is_confirmed", true);

  if (confirmed) {
    for (const inv of confirmed) {
      await supabase.from("donation_confirmations").upsert(
        { invitation_id: inv.id, status: "pending" },
        { onConflict: "invitation_id" }
      );
      await createNotification(
        inv.donor_id,
        "donation_confirm",
        "Donation confirmation",
        `Did you donate blood for ${request.patient_name}'s request which was accepted by you?`,
        { request_id: requestId, invitation_id: inv.id, patient_name: request.patient_name }
      );
    }
  }

  await logAudit(profile.id, "request_closed", "blood_request", requestId, { reason });
  revalidatePath(`/requests/${requestId}`);
  return { success: true };
}

export async function extendDeadline(requestId: string, newDeadline: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("blood_requests")
    .update({ deadline: newDeadline, extension_prompted_at: null })
    .eq("id", requestId)
    .eq("requester_id", profile.id);

  if (error) return { error: error.message };
  await logAudit(profile.id, "deadline_extended", "blood_request", requestId, {
    new_deadline: newDeadline,
  });
  revalidatePath(`/requests/${requestId}`);
  return { success: true };
}

export async function checkDeadlineWarnings(requestId: string) {
  const supabase = createServiceClient();
  const { data: request } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request) return;
  if (!["open", "partially_filled"].includes(request.status)) return;
  if (request.extension_prompted_at) return;
  if (request.units_filled >= request.units_needed) return;
  if (!shouldPromptDeadlineExtension(request.deadline)) return;

  await supabase
    .from("blood_requests")
    .update({ extension_prompted_at: new Date().toISOString() })
    .eq("id", requestId);

  await createNotification(
    request.requester_id,
    "deadline_warning",
    "Deadline approaching",
    `Your request for ${request.patient_name} needs ${request.units_needed - request.units_filled} more unit(s). Extend the deadline?`,
    { request_id: requestId }
  );

  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
  for (const admin of admins ?? []) {
    await createNotification(
      admin.id,
      "deadline_warning",
      "Request deadline approaching",
      `Request for ${request.patient_name} is short on units with deadline near.`,
      { request_id: requestId }
    );
  }
}

export async function acceptInvitation(invitationId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("accept_invitation", {
    p_invitation_id: invitationId,
    p_donor_id: profile.id,
  });

  if (error) return { error: error.message };

  const result = data as {
    success: boolean;
    error?: string;
    status?: string;
    units_filled?: number;
    units_needed?: number;
  };

  if (!result.success) return { error: result.error ?? "Could not accept" };

  const { data: invitation } = await supabase
    .from("donor_invitations")
    .select("request_id, blood_requests(patient_name, requester_id)")
    .eq("id", invitationId)
    .single();

  if (invitation) {
    const req = invitation.blood_requests as unknown as {
      patient_name: string;
      requester_id: string;
    };
    await createNotification(
      req.requester_id,
      "invite_accepted",
      "Donor confirmed",
      `A donor confirmed for ${req.patient_name}'s request`,
      { request_id: invitation.request_id, invitation_id: invitationId }
    );

    if (result.status === "fulfilled") {
      const { data: allConfirmed } = await supabase
        .from("donor_invitations")
        .select("id, donor_id")
        .eq("request_id", invitation.request_id)
        .eq("is_confirmed", true);

      for (const inv of allConfirmed ?? []) {
        await supabase.from("donation_confirmations").upsert(
          { invitation_id: inv.id, status: "pending" },
          { onConflict: "invitation_id" }
        );
        await createNotification(
          inv.donor_id,
          "donation_confirm",
          "Donation confirmation",
          `Did you donate blood for ${req.patient_name}'s request which was accepted by you?`,
          {
            request_id: invitation.request_id,
            invitation_id: inv.id,
            patient_name: req.patient_name,
          }
        );
      }
    }
  }

  revalidatePath("/donor/invites");
  revalidatePath("/home");
  return result;
}

export async function rejectInvitation(invitationId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("donor_invitations")
    .update({ response: "rejected", responded_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("donor_id", profile.id);

  if (error) return { error: error.message };
  revalidatePath("/donor/invites");
  return { success: true };
}
