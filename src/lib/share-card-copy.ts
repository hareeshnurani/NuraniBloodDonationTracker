import { format } from "date-fns";
import type { ShareableRequest } from "@/lib/request-share";
import { formatShareLocation, shareStatusLabel } from "@/lib/request-share";
import { PRIORITY_LABELS } from "@/lib/constants";

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1620;

export function sanitizeShareCardText(value: string, maxLen: number) {
  const normalized = value.replace(/[^\x20-\x7E]/g, (ch) => {
    if (ch === "\u2014" || ch === "\u2013") return "-";
    if (ch === "\u00b7" || ch === "\u2022") return "|";
    if (ch === "\u2026") return "...";
    return "";
  });
  return normalized.length <= maxLen ? normalized : `${normalized.slice(0, maxLen - 3)}...`;
}

export function getShareCardCopy(req: ShareableRequest) {
  const unitsLeft = Math.max(0, req.units_needed - req.units_filled);
  const locationRaw = formatShareLocation(req);
  return {
    unitsLeft,
    isEmergency: req.priority === "emergency",
    location: locationRaw ? sanitizeShareCardText(locationRaw, 120) : null,
    deadline: sanitizeShareCardText(format(new Date(req.deadline), "MMM d, yyyy | h:mm a"), 40),
    patientName: sanitizeShareCardText(req.patient_name, 48),
    bloodGroup: sanitizeShareCardText(req.primary_blood_group, 8),
    priority: sanitizeShareCardText(PRIORITY_LABELS[req.priority] ?? req.priority, 24),
    status: sanitizeShareCardText(shareStatusLabel(req.status), 24),
    unitsLine: `${req.units_filled}/${req.units_needed} filled | ${sanitizeShareCardText(shareStatusLabel(req.status), 24)}`,
    needLine: `Needs ${unitsLeft} unit${unitsLeft !== 1 ? "s" : ""} of ${sanitizeShareCardText(req.primary_blood_group, 8)} blood`,
  };
}
