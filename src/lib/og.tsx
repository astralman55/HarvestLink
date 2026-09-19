import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 } as const;

/**
 * Text-only social card: brand mark, wordmark, and a title. Generated, never a
 * stock photo, so nothing on it can identify a seller.
 */
export function renderOgCard({ title, kicker }: { title: string; kicker: string }) {
  const fontSize = title.length > 80 ? 52 : title.length > 55 ? 60 : 68;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fbeef1", padding: "64px 72px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", width: 72, height: 72, borderRadius: 16, background: "#722545", alignItems: "center", justifyContent: "center" }}>
            <svg width="46" height="46" viewBox="0 0 64 64">
              <path d="M32 19 C32 13 33 9 37 6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              <circle cx="17" cy="26" r="7.2" fill="#fff" />
              <circle cx="32" cy="26" r="7.2" fill="#fff" />
              <circle cx="47" cy="26" r="7.2" fill="#fff" />
              <circle cx="24.5" cy="38" r="7.2" fill="#fff" />
              <circle cx="39.5" cy="38" r="7.2" fill="#fff" />
              <circle cx="32" cy="50" r="7.2" fill="#fff" />
              <path d="M37 6 C46 4 54 8 56 16 C47 18 40 14 37 6 Z" fill="#c9dca8" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#1c1917" }}>
            Harvest<span style={{ color: "#722545" }}>Link</span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize, fontWeight: 700, color: "#1c1917", lineHeight: 1.15, letterSpacing: -1 }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#521a32" }}>
          <span>{kicker}</span>
          <span>bulkwinegrapes.com</span>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
