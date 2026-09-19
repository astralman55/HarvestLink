import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/verification";

const ALLOWED_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "email_change", "magiclink", "invite"];

/**
 * Link fallback for the confirmation email. The email carries both the code
 * (what most people use) and a button pointing here with a one-time token
 * hash, so someone who'd rather click still ends up signed in -- and,
 * unlike Supabase's default PKCE link, it works when the email is opened on
 * a different device or browser than the one that signed up.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeRedirectPath(searchParams.get("next"));

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return NextResponse.redirect(new URL(next, origin));
    } catch {
      // Fall through to the friendly failure below.
    }
  }

  const failed = new URL("/login", origin);
  failed.searchParams.set("error", "link_expired");
  return NextResponse.redirect(failed);
}
