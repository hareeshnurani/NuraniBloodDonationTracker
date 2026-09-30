import { ImageResponse } from "next/og";
import { format } from "date-fns";
import {
  formatShareLocation,
  getShareableRequest,
  shareStatusLabel,
} from "@/lib/request-share";
import { PRIORITY_LABELS } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const req = await getShareableRequest(id);

  if (!req) {
    return new Response("Not found", { status: 404 });
  }

  const unitsLeft = Math.max(0, req.units_needed - req.units_filled);
  const isEmergency = req.priority === "emergency";
  const location = formatShareLocation(req);
  const deadline = format(new Date(req.deadline), "MMM d, yyyy · h:mm a");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(165deg, #1a1a1e 0%, #2c2c2e 38%, #ff3b30 140%)",
          color: "white",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
          padding: "56px 48px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              🩸
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>BloodLink</span>
              <span style={{ fontSize: 18, opacity: 0.75 }}>Urgent blood donation appeal</span>
            </div>
          </div>
          {isEmergency && (
            <div
              style={{
                background: "#ff3b30",
                padding: "10px 20px",
                borderRadius: 999,
                fontSize: 18,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Emergency
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 110,
              background: "rgba(255,255,255,0.12)",
              border: "4px solid rgba(255,255,255,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 36,
            }}
          >
            <span style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>
              {req.primary_blood_group}
            </span>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, marginBottom: 12, maxWidth: 900 }}>
            {req.patient_name}
          </div>
          <div style={{ fontSize: 26, opacity: 0.9, marginBottom: 8 }}>
            Needs {unitsLeft} unit{unitsLeft !== 1 ? "s" : ""} of {req.primary_blood_group} blood
          </div>
          <div style={{ fontSize: 22, opacity: 0.75 }}>
            {req.units_filled}/{req.units_needed} units filled · {shareStatusLabel(req.status)}
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: 24,
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 }}>
            <span style={{ opacity: 0.7 }}>Priority</span>
            <span style={{ fontWeight: 600 }}>{PRIORITY_LABELS[req.priority] ?? req.priority}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 }}>
            <span style={{ opacity: 0.7 }}>Deadline</span>
            <span style={{ fontWeight: 600 }}>{deadline}</span>
          </div>
          {location && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 20 }}>
              <span style={{ opacity: 0.7 }}>Location</span>
              <span style={{ fontWeight: 500, lineHeight: 1.35 }}>{location}</span>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.2)",
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 20, opacity: 0.65 }}>Scan or open link to respond on BloodLink</span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              opacity: 0.85,
              letterSpacing: 0.5,
            }}
          >
            BloodLink
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}
