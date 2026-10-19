import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

// Shared social card: brand mark, a kicker line, the title and a footer line.
export function renderOgImage({
  kicker,
  title,
  footer,
}: {
  kicker: string;
  title: string;
  footer: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0b0f14 0%, #121823 60%, #0d2a20 100%)",
          color: "#e6edf4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "linear-gradient(135deg, #10b981, #34d399)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#04120c",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            rc
          </div>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 700 }}>
            root<span style={{ color: "#697585" }}>&nbsp;cause</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 30, color: "#34d399" }}>{kicker}</div>
          <div style={{ display: "flex", fontSize: title.length > 48 ? 58 : 72, fontWeight: 700, lineHeight: 1.1 }}>
            {title}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#9aa7b5" }}>{footer}</div>
      </div>
    ),
    OG_SIZE,
  );
}
