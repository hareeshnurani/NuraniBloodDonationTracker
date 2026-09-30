import { format } from "date-fns";
import type { ShareableRequest } from "@/lib/request-share";
import { formatShareLocation, shareStatusLabel } from "@/lib/request-share";
import { PRIORITY_LABELS } from "@/lib/constants";

/** JSX for next/og ImageResponse — keep layout Satori-safe (no flex:1, no emoji). */
export function buildShareCardElement(req: ShareableRequest) {
  const unitsLeft = Math.max(0, req.units_needed - req.units_filled);
  const isEmergency = req.priority === "emergency";
  const locationRaw = formatShareLocation(req);
  const location =
    locationRaw && locationRaw.length > 120 ? `${locationRaw.slice(0, 119)}…` : locationRaw;
  const deadline = format(new Date(req.deadline), "MMM d, yyyy · h:mm a");
  const patientName =
    req.patient_name.length > 48 ? `${req.patient_name.slice(0, 47)}…` : req.patient_name;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(165deg, #1a1a1e 0%, #2c2c2e 42%, #c41e14 130%)",
        color: "white",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
        padding: "48px 44px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#ff3b30",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            BL
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 30, fontWeight: 700 }}>BloodLink</span>
            <span style={{ fontSize: 17, opacity: 0.75 }}>Urgent blood donation appeal</span>
          </div>
        </div>
        {isEmergency ? (
          <div
            style={{
              background: "#ff3b30",
              padding: "8px 18px",
              borderRadius: 999,
              fontSize: 16,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Emergency
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          height: 720,
        }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            background: "rgba(255,255,255,0.12)",
            border: "4px solid rgba(255,255,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 64, fontWeight: 800 }}>{req.primary_blood_group}</span>
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 12, maxWidth: 920 }}>
          {patientName}
        </div>
        <div style={{ fontSize: 24, opacity: 0.9, marginBottom: 8 }}>
          Needs {unitsLeft} unit{unitsLeft !== 1 ? "s" : ""} of {req.primary_blood_group} blood
        </div>
        <div style={{ fontSize: 20, opacity: 0.75 }}>
          {req.units_filled}/{req.units_needed} filled · {shareStatusLabel(req.status)}
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 20,
            marginBottom: 12,
          }}
        >
          <span style={{ opacity: 0.7 }}>Priority</span>
          <span style={{ fontWeight: 600 }}>{PRIORITY_LABELS[req.priority] ?? req.priority}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, marginBottom: 12 }}>
          <span style={{ opacity: 0.7 }}>Deadline</span>
          <span style={{ fontWeight: 600 }}>{deadline}</span>
        </div>
        {location ? (
          <div style={{ display: "flex", flexDirection: "column", fontSize: 18 }}>
            <span style={{ opacity: 0.7, marginBottom: 6 }}>Location</span>
            <span style={{ fontWeight: 500 }}>{location}</span>
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          borderTop: "1px solid rgba(255,255,255,0.2)",
          paddingTop: 20,
          fontSize: 18,
          opacity: 0.7,
        }}
      >
        Open the link to respond on BloodLink
      </div>
    </div>
  );
}

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1620;
