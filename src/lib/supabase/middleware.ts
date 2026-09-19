import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/listings/create",
  "/listings/mine",
  "/planning",
  "/choose-username",
  "/inquiries",
  "/security",
  // /alerts itself is private; /alerts/unsubscribe (linked from emails) must stay public,
  // so it is matched exactly below instead of by prefix.
  // Trailing slash so bare /sell (the public chooser) stays unprotected --
  // only the actual create forms underneath it require auth.
  "/sell/",
  // The page itself already redirects a non-admin (Phase 7 security review,
  // Decision 40) -- this just makes that the fast, consistent middleware
  // path instead of the one route in the app that skips it.
  "/admin",
];
const EDIT_LISTING_PATTERN = /^\/listings\/[^/]+\/edit$/;

/**
 * Duplicate-content guard: only the canonical production host may be indexed.
 * Vercel preview deployments and alias hosts (like the *.vercel.app URL)
 * get a noindex header, so they never compete with the real site.
 */
function isCanonicalHost(request: NextRequest): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return true;
  try {
    const canonicalHost = new URL(appUrl).host;
    const host = request.nextUrl.host;
    if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) return true;
    return host === canonicalHost;
  } catch {
    return true;
  }
}

function withIndexingHeaders(request: NextRequest, response: NextResponse): NextResponse {
  if (!isCanonicalHost(request)) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

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
    request.nextUrl.pathname === "/alerts" ||
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
    return withIndexingHeaders(request, NextResponse.redirect(url));
  }

  return withIndexingHeaders(request, supabaseResponse);
}
