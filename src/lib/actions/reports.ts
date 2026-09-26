"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

const REASONS = ["harassment", "spam", "incorrect_info", "other"] as const;
export type ReportReason = (typeof REASONS)[number];

export async function submitContentReport(
  entityType: "chat_thread" | "community" | "blood_request" | "profile",
  entityId: string,
  reason: ReportReason,
  details?: string
) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };
  if (!REASONS.includes(reason)) return { error: "Invalid reason" };

  const supabase = await createClient();
  const { error } = await supabase.from("content_reports").insert({
    reporter_id: profile.id,
    entity_type: entityType,
    entity_id: entityId,
    reason,
    details: details?.trim() || null,
  });

  if (error) {
    if (error.message.includes("content_reports")) {
      return { error: "Reporting is not available until migration 012 is applied in Supabase." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/reports");
  return { success: true };
}
