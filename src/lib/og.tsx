import { ImageResponse } from "next/og";
import { OG_WORDMARK } from "@/lib/og-wordmark";

export const OG_SIZE = { width: 1200, height: 630 } as const;

/**
 * Text-only social card: the wordmark and a title. Generated, never a
 * stock photo, so nothing on it can identify a seller.
 */
export function renderOgCard({ title, kicker }: { title: string; kicker: string }) {
  const fontSize = title.length > 80 ? 52 : title.length > 55 ? 60 : 68;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fbeef1", padding: "64px 72px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={OG_WORDMARK.src} width={560} height={Math.round((560 * OG_WORDMARK.height) / OG_WORDMARK.width)} alt="bulkwinegrapes.com" />
        </div>
        <div style={{ display: "flex", fontSize, fontWeight: 700, color: "#1c1917", lineHeight: 1.15, letterSpacing: -1 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 28, color: "#521a32" }}>
          <span>{kicker}</span>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
