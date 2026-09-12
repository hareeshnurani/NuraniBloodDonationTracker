"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

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

export async function approveUser(userId: string) {
  const { profile } = await requireAdmin();
  const supabase = createServiceClient();

  await supabase.from("profiles").update({ status: "active" }).eq("id", userId);

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "user_approved",
    title: "Account approved",
    body: "Your account has been approved. You can now use BloodLink.",
    payload: {},
  });

  await logAudit(profile.id, "user_approved", "profile", userId);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function rejectUser(userId: string, reason: string) {
  const { profile } = await requireAdmin();
  const supabase = createServiceClient();

  await supabase
    .from("profiles")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", userId);

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "user_rejected",
    title: "Account not approved",
    body: reason || "Your registration was not approved.",
    payload: {},
  });

  await logAudit(profile.id, "user_rejected", "profile", userId, { reason });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminUpdateDonationDate(userId: string, date: string | null) {
  const { profile } = await requireAdmin();
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("donor_profiles")
    .select("last_donation_date")
    .eq("user_id", userId)
    .single();

  await supabase
    .from("donor_profiles")
    .update({ last_donation_date: date, is_available: false })
    .eq("user_id", userId);

  await logAudit(profile.id, "donation_date_edited", "donor_profile", userId, {
    old_date: existing?.last_donation_date,
    new_date: date,
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function adminSendMessage(userId: string, body: string) {
  const { profile } = await requireAdmin();
  const supabase = createServiceClient();

  await supabase.from("notifications").insert({
    user_id: userId,
    type: "admin_message",
    title: "Message from admin",
    body,
    payload: { from_admin: profile.id },
  });

  await logAudit(profile.id, "admin_message", "profile", userId, { body });
  return { success: true };
}
