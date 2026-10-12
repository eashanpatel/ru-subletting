import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Pages that need an account. Signed-out visitors go to /sign-in. */
const PROTECTED = ["/saved", "/my-listings", "/listings/new", "/account"];

/** Refreshes the Supabase session cookie and guards account-only pages. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Do not put code between client creation and this call: it is what
  // refreshes an expired session.
  const { data } = await supabase.auth.getClaims();

  const { pathname } = request.nextUrl;
  const signedIn = !!data?.claims;
  const needsAccount =
    PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) || /^\/listings\/[^/]+\/edit$/.test(pathname);

  // Signed out on an account page -> sign in. Signed in on /sign-in -> browse.
  const target = !signedIn && needsAccount ? "/sign-in" : signedIn && pathname === "/sign-in" ? "/" : null;
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // Carry over any refreshed session cookies.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
