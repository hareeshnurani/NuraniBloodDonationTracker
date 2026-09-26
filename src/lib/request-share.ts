import { createServiceClient } from "@/lib/supabase/admin";
import { PRIORITY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/constants";
import { format } from "date-fns";

export type ShareableRequest = {
  id: string;
  patient_name: string;
  primary_blood_group: string;
  priority: string;
  units_needed: number;
  units_filled: number;
  deadline: string;
  hospital_notes: string | null;
  location_district: string | null;
  location_state: string | null;
  pincode: string | null;
  status: string;
};

export async function getShareableRequest(id: string): Promise<ShareableRequest | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("blood_requests")
    .select(
      "id, patient_name, primary_blood_group, priority, units_needed, units_filled, deadline, hospital_notes, location_district, location_state, pincode, status"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  if (!["open", "partially_filled"].includes(data.status)) return null;
  return data as ShareableRequest;
}

export function shareRequestUrl(origin: string, requestId: string) {
  return `${origin.replace(/\/$/, "")}/share/request/${requestId}`;
}

export function shareRequestText(req: ShareableRequest) {
  const priority =
    req.priority === "emergency" ? PRIORITY_LABELS.emergency : PRIORITY_LABELS.routine;
  const location = formatShareLocation(req);
  const deadline = format(new Date(req.deadline), "MMM d, h:mm a");
  const unitsLeft = Math.max(0, req.units_needed - req.units_filled);
  return [
    `🩸 Blood needed — ${req.primary_blood_group}`,
    `${req.patient_name} · ${priority}`,
    `${unitsLeft} unit${unitsLeft !== 1 ? "s" : ""} still needed · by ${deadline}`,
    location ? location : null,
    "Help on BloodLink:",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatShareLocation(req: ShareableRequest) {
  const parts: string[] = [];
  if (req.hospital_notes?.trim()) parts.push(req.hospital_notes.trim());
  if (req.pincode) {
    let pin = `PIN ${req.pincode}`;
    if (req.location_district) pin += ` · ${req.location_district}`;
    if (req.location_state) pin += `, ${req.location_state}`;
    parts.push(pin);
  } else if (req.location_district || req.location_state) {
    parts.push([req.location_district, req.location_state].filter(Boolean).join(", "));
  }
  return parts.join(" · ") || null;
}

export function shareStatusLabel(status: string) {
  return REQUEST_STATUS_LABELS[status] ?? status;
}
