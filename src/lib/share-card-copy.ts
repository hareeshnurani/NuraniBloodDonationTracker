import { format } from "date-fns";
import type { ShareableRequest } from "@/lib/request-share";
import { formatShareLocation, shareStatusLabel } from "@/lib/request-share";
import { PRIORITY_LABELS } from "@/lib/constants";

/** Landscape poster — fits WhatsApp preview & shares without excessive height */
export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 800;

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
  const bloodGroup = sanitizeShareCardText(req.primary_blood_group, 8);
  return {
    unitsLeft,
    isEmergency: req.priority === "emergency",
    location: locationRaw ? sanitizeShareCardText(locationRaw, 72) : null,
    deadline: sanitizeShareCardText(format(new Date(req.deadline), "MMM d | h:mm a"), 28),
    deadlineLong: sanitizeShareCardText(
      format(new Date(req.deadline), "MMM d, yyyy | h:mm a"),
      40
    ),
    patientName: sanitizeShareCardText(req.patient_name, 42),
    bloodGroup,
    priority: sanitizeShareCardText(PRIORITY_LABELS[req.priority] ?? req.priority, 24),
    status: sanitizeShareCardText(shareStatusLabel(req.status), 24),
    heroHeadline: `${bloodGroup} BLOOD NEEDED`,
    unitsHero: `${unitsLeft} UNIT${unitsLeft !== 1 ? "S" : ""}`,
    unitsSub: `${req.units_filled}/${req.units_needed} filled`,
    ctaLine: "Tap the link in this message to respond on BloodLink",
  };
}

export function shareCardLinkLabel(origin: string, requestId: string) {
  const host = origin.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `${host}/share/request/${requestId.slice(0, 8)}...`;
}
