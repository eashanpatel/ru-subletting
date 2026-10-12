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
        className="max-w-44 truncate rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        title={label}
      >
        {label}
      </Link>
      <form action="/auth/sign-out" method="post">
        <button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
          Sign out
        </button>
      </form>
    </div>
  );
}

export function SignInLink() {
  return (
    <Link href="/sign-in" className="hidden rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted md:inline-flex">
      Sign in
    </Link>
  );
}
