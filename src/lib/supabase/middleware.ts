import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/listings/create", "/listings/mine", "/planning", "/choose-username", "/inquiries"];
const EDIT_LISTING_PATTERN = /^\/listings\/[^/]+\/edit$/;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix)) ||
    EDIT_LISTING_PATTERN.test(request.nextUrl.pathname);

  // In demo mode (no real Supabase project configured yet) this call fails
  // fast against the placeholder URL — treat that the same as "no session"
  // instead of taking the whole app down.
  let user = null;
  if (isProtected) {
    try {
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();
      user = sessionUser;
    } catch {
      user = null;
    }
  }

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect_to", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
