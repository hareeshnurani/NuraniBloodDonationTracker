import type { ShareableRequest } from "@/lib/request-share";
import { getShareCardCopy } from "@/lib/share-card-copy";

const FONT = "Inter";

/** Satori-safe layout for @vercel/og (every multi-child div uses display:flex). */
export function buildShareCardOgElement(req: ShareableRequest) {
  const copy = getShareCardCopy(req);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "linear-gradient(165deg, #1a1a1e 0%, #2c2c2e 42%, #c41e14 130%)",
        color: "white",
        fontFamily: FONT,
        padding: "48px 44px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#ff3b30",
              marginRight: 16,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            BL
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>BloodLink</div>
            <div style={{ display: "flex", fontSize: 17, opacity: 0.75 }}>
              Urgent blood donation appeal
            </div>
          </div>
        </div>
        <div style={{ display: "flex" }}>
          {copy.isEmergency ? (
            <div
              style={{
                display: "flex",
                background: "#ff3b30",
                padding: "8px 18px",
                borderRadius: 999,
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              EMERGENCY
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 720,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 200,
            height: 200,
            borderRadius: 100,
            background: "rgba(255,255,255,0.12)",
            border: "4px solid rgba(255,255,255,0.35)",
            marginBottom: 32,
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          {copy.bloodGroup}
        </div>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, marginBottom: 12 }}>
          {copy.patientName}
        </div>
        <div style={{ display: "flex", fontSize: 24, opacity: 0.9, marginBottom: 8 }}>
          {copy.needLine}
        </div>
        <div style={{ display: "flex", fontSize: 20, opacity: 0.75 }}>{copy.unitsLine}</div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: "24px 28px",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            fontSize: 20,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", opacity: 0.7 }}>Priority</div>
          <div style={{ display: "flex", fontWeight: 600 }}>{copy.priority}</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            fontSize: 20,
            marginBottom: copy.location ? 12 : 0,
          }}
        >
          <div style={{ display: "flex", opacity: 0.7 }}>Deadline</div>
          <div style={{ display: "flex", fontWeight: 600 }}>{copy.deadline}</div>
        </div>
        {copy.location ? (
          <div style={{ display: "flex", flexDirection: "column", fontSize: 18 }}>
            <div style={{ display: "flex", opacity: 0.7, marginBottom: 6 }}>Location</div>
            <div style={{ display: "flex", fontWeight: 500 }}>{copy.location}</div>
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
