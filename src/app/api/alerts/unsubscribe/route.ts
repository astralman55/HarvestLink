import { NextResponse, type NextRequest } from "next/server";
import { unsubscribeByToken } from "@/lib/alerts/unsubscribe";

/**
 * One-click unsubscribe target for the List-Unsubscribe header (RFC 8058):
 * mail apps POST here when the reader taps "Unsubscribe". It stops every alert
 * for that member, since that is what "unsubscribe from these emails" means.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  try {
    const ok = token ? await unsubscribeByToken(token, "all") : false;
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
