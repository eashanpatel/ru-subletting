import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth (Google) and password-reset emails land here with a one-time code to
// exchange for a session. Afterwards: browse, or an allowed follow-up page.
const ALLOWED_NEXT = new Set(["/update-password"]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = nextParam && ALLOWED_NEXT.has(nextParam) ? nextParam : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(
    next === "/update-password" ? `${origin}/forgot-password?error=expired` : `${origin}/sign-in?error=oauth`,
  );
}
