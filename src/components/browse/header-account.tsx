import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Signed-in state for the header. Reads cookies, so render it inside <Suspense>. */
export async function HeaderAccount() {
  // Session checks read the clock; keep them out of the prerendered shell.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) {
    return <SignInLink />;
  }

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", claims.sub).maybeSingle();
  const meta = (claims.user_metadata ?? {}) as { full_name?: string; name?: string };
  const label = profile?.full_name || meta.full_name || meta.name || (claims.email as string | undefined) || "Account";

  return (
    <div className="hidden items-center gap-1 md:flex">
      <Link
        href="/account"
        className="max-w-44 truncate rounded-lg px-3 py-2 text-sm font-semibold text-shell-muted hover:bg-shell-foreground/10 hover:text-shell-foreground focus-visible:ring-2 focus-visible:ring-shell-foreground focus-visible:outline-none"
        title={label}
      >
        {label}
      </Link>
      <form action="/auth/sign-out" method="post">
        <button type="submit" className="rounded-lg px-3 py-2 text-sm font-semibold text-shell-muted hover:bg-shell-foreground/10 hover:text-shell-foreground focus-visible:ring-2 focus-visible:ring-shell-foreground focus-visible:outline-none">
          Sign out
        </button>
      </form>
    </div>
  );
}

export function SignInLink() {
  return (
    <Link href="/sign-in" className="hidden rounded-lg px-3 py-2 text-sm font-semibold hover:bg-shell-foreground/10 focus-visible:ring-2 focus-visible:ring-shell-foreground focus-visible:outline-none md:inline-flex">
      Sign in
    </Link>
  );
}
