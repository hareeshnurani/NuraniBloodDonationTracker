import type { ShareableRequest } from "@/lib/request-share";
import { getShareCardCopy, sanitizeShareCardText } from "@/lib/share-card-copy";

const FONT = "Inter";
const RED = "#ff3b30";
const DARK = "#121214";

type OgProps = {
  req: ShareableRequest;
  shareUrl: string;
  qrDataUrl: string;
};

/** Satori-safe landscape poster — blood type hero + QR/link baked into PNG. */
export function buildShareCardOgElement({ req, shareUrl, qrDataUrl }: OgProps) {
  const copy = getShareCardCopy(req);
  const urlOnPoster = sanitizeShareCardText(shareUrl, 88);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${DARK} 0%, #2a1210 45%, #8b1a12 100%)`,
        color: "white",
        fontFamily: FONT,
        padding: "36px 44px",
      }}
    >
      {copy.isEmergency ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: RED,
            marginBottom: 20,
            padding: "8px 0",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 4,
          }}
        >
          EMERGENCY
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: 460,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 300,
            height: 300,
            borderRadius: 150,
            background: "rgba(255,59,48,0.25)",
            border: "6px solid rgba(255,255,255,0.9)",
            boxShadow: "0 0 72px rgba(255,59,48,0.45)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 108,
              fontWeight: 700,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            {copy.bloodGroup}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 720,
            paddingLeft: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              color: RED,
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            {copy.heroHeadline}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: 10,
            }}
          >
            {copy.unitsHero}
          </div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
            {copy.patientName}
          </div>
          <div style={{ display: "flex", fontSize: 20, opacity: 0.85, marginBottom: 8 }}>
            {copy.unitsSub} · {copy.priority}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              background: "rgba(255,255,255,0.12)",
              padding: "12px 18px",
              borderRadius: 12,
            }}
          >
            By {copy.deadline}
          </div>
          {copy.location ? (
            <div
              style={{
                display: "flex",
                fontSize: 18,
                opacity: 0.8,
                marginTop: 12,
                lineHeight: 1.35,
              }}
            >
              {copy.location}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "2px solid rgba(255,255,255,0.25)",
          paddingTop: 18,
          marginTop: 4,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 420 }}>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700 }}>BloodLink</div>
          <div style={{ display: "flex", fontSize: 16, opacity: 0.8, marginTop: 4 }}>
            Scan QR or type this link to respond
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 480, marginRight: 16 }}>
            <div style={{ display: "flex", fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>
              {urlOnPoster}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              background: "white",
              padding: 6,
              borderRadius: 8,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- OG/Satori */}
            <img src={qrDataUrl} width={92} height={92} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}
