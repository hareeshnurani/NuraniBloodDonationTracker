import type { ShareableRequest } from "@/lib/request-share";
import { getShareCardCopy, shareCardLinkLabel } from "@/lib/share-card-copy";

const FONT = "Inter";
const RED = "#ff3b30";
const DARK = "#121214";

type OgProps = {
  req: ShareableRequest;
  linkLabel?: string;
};

/** Satori-safe landscape poster — blood type is the hero. */
export function buildShareCardOgElement({ req, linkLabel }: OgProps) {
  const copy = getShareCardCopy(req);
  const footerLink = linkLabel ?? "Open the share link to respond";

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
        padding: "40px 48px",
      }}
    >
      {copy.isEmergency ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: RED,
            marginBottom: 28,
            padding: "10px 0",
            fontSize: 22,
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
          height: 520,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 340,
            height: 340,
            borderRadius: 170,
            background: "rgba(255,59,48,0.25)",
            border: "6px solid rgba(255,255,255,0.9)",
            boxShadow: "0 0 80px rgba(255,59,48,0.45)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 120,
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
            width: 680,
            paddingLeft: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              color: RED,
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            {copy.heroHeadline}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            {copy.unitsHero}
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700, marginBottom: 16 }}>
            {copy.patientName}
          </div>
          <div style={{ display: "flex", fontSize: 22, opacity: 0.85, marginBottom: 8 }}>
            {copy.unitsSub} · {copy.priority}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 600,
              background: "rgba(255,255,255,0.12)",
              padding: "14px 20px",
              borderRadius: 12,
            }}
          >
            By {copy.deadline}
          </div>
          {copy.location ? (
            <div
              style={{
                display: "flex",
                fontSize: 20,
                opacity: 0.8,
                marginTop: 14,
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
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "2px solid rgba(255,255,255,0.2)",
          paddingTop: 22,
          marginTop: 8,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>BloodLink</div>
          <div style={{ display: "flex", fontSize: 18, opacity: 0.75 }}>{copy.ctaLine}</div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 16,
            fontWeight: 600,
            opacity: 0.85,
            maxWidth: 420,
            textAlign: "right",
          }}
        >
          {footerLink}
        </div>
      </div>
    </div>
  );
}

export function buildShareCardOgElementFromRequest(
  req: ShareableRequest,
  appOrigin?: string
) {
  const linkLabel = appOrigin ? shareCardLinkLabel(appOrigin, req.id) : undefined;
  return buildShareCardOgElement({ req, linkLabel });
}
