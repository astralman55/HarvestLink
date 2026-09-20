import { NextResponse, type NextRequest } from "next/server";
import { optOutOfWantedAlerts } from "@/lib/wanted/unsubscribe";

/** One-click unsubscribe target for the List-Unsubscribe header (RFC 8058) on the seller emails about new requests. */
export async function POST(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("u");
  const token = request.nextUrl.searchParams.get("t");
  try {
    const ok = userId && token ? await optOutOfWantedAlerts(userId, token) : false;
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
