import { format } from "date-fns";
import type { ShareableRequest } from "@/lib/request-share";
import { formatShareLocation, shareStatusLabel } from "@/lib/request-share";
import { PRIORITY_LABELS } from "@/lib/constants";

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1620;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeText(value: string, maxLen: number) {
  const ascii = value.replace(/[^\x20-\x7E]/g, (ch) => {
    if (ch === "\u2014" || ch === "\u2013") return "-";
    if (ch === "\u00b7" || ch === "\u2022") return "|";
    if (ch === "\u2026") return "...";
    return "";
  });
  return ascii.length <= maxLen ? ascii : `${ascii.slice(0, maxLen - 3)}...`;
}

/** SVG appeal card (no Satori) — rasterized to PNG in the API route. */
export function buildShareCardSvg(req: ShareableRequest) {
  const w = SHARE_CARD_WIDTH;
  const h = SHARE_CARD_HEIGHT;
  const unitsLeft = Math.max(0, req.units_needed - req.units_filled);
  const isEmergency = req.priority === "emergency";
  const locationRaw = formatShareLocation(req);
  const location = locationRaw ? sanitizeText(locationRaw, 120) : "";
  const deadline = sanitizeText(format(new Date(req.deadline), "MMM d, yyyy | h:mm a"), 40);
  const patientName = sanitizeText(req.patient_name, 48);
  const bloodGroup = sanitizeText(req.primary_blood_group, 8);
  const priority = sanitizeText(PRIORITY_LABELS[req.priority] ?? req.priority, 24);
  const status = sanitizeText(shareStatusLabel(req.status), 24);

  const locationBlock = location
    ? `<text x="96" y="1330" fill="rgba(255,255,255,0.65)" font-size="22" font-family="system-ui,sans-serif">Location</text>
  <text x="96" y="1368" fill="#ffffff" font-size="24" font-weight="500" font-family="system-ui,sans-serif">${escapeXml(location)}</text>`
    : "";

  const emergencyBadge = isEmergency
    ? `<rect x="820" y="72" rx="24" ry="24" width="164" height="48" fill="#ff3b30"/>
  <text x="902" y="104" text-anchor="middle" fill="#fff" font-size="18" font-weight="700" font-family="system-ui,sans-serif">EMERGENCY</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a1e"/>
      <stop offset="42%" stop-color="#2c2c2e"/>
      <stop offset="100%" stop-color="#c41e14"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="48" y="56" width="52" height="52" rx="14" fill="#ff3b30"/>
  <text x="74" y="92" text-anchor="middle" fill="#fff" font-size="22" font-weight="800" font-family="system-ui,sans-serif">BL</text>
  <text x="116" y="86" fill="#fff" font-size="30" font-weight="700" font-family="system-ui,sans-serif">BloodLink</text>
  <text x="116" y="114" fill="rgba(255,255,255,0.75)" font-size="17" font-family="system-ui,sans-serif">Urgent blood donation appeal</text>
  ${emergencyBadge}
  <circle cx="540" cy="520" r="102" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.35)" stroke-width="4"/>
  <text x="540" y="548" text-anchor="middle" fill="#fff" font-size="64" font-weight="800" font-family="system-ui,sans-serif">${escapeXml(bloodGroup)}</text>
  <text x="540" y="680" text-anchor="middle" fill="#fff" font-size="40" font-weight="700" font-family="system-ui,sans-serif">${escapeXml(patientName)}</text>
  <text x="540" y="740" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="24" font-family="system-ui,sans-serif">Needs ${unitsLeft} unit${unitsLeft !== 1 ? "s" : ""} of ${escapeXml(bloodGroup)} blood</text>
  <text x="540" y="782" text-anchor="middle" fill="rgba(255,255,255,0.75)" font-size="20" font-family="system-ui,sans-serif">${req.units_filled}/${req.units_needed} filled | ${escapeXml(status)}</text>
  <rect x="48" y="1180" width="984" height="220" rx="20" fill="rgba(255,255,255,0.1)"/>
  <text x="96" y="1238" fill="rgba(255,255,255,0.65)" font-size="22" font-family="system-ui,sans-serif">Priority</text>
  <text x="984" y="1238" text-anchor="end" fill="#fff" font-size="22" font-weight="600" font-family="system-ui,sans-serif">${escapeXml(priority)}</text>
  <text x="96" y="1288" fill="rgba(255,255,255,0.65)" font-size="22" font-family="system-ui,sans-serif">Deadline</text>
  <text x="984" y="1288" text-anchor="end" fill="#fff" font-size="22" font-weight="600" font-family="system-ui,sans-serif">${escapeXml(deadline)}</text>
  ${locationBlock}
  <line x1="48" y1="1460" x2="1032" y2="1460" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="540" y="1510" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="18" font-family="system-ui,sans-serif">Open the link to respond on BloodLink</text>
</svg>`;
}
