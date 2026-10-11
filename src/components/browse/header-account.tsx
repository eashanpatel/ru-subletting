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

  const meta = (claims.user_metadata ?? {}) as { full_name?: string; name?: string };
  const label = meta.full_name || meta.name || (claims.email as string | undefined) || "Account";

  return (
    <form action="/auth/sign-out" method="post" className="hidden items-center gap-2 md:flex">
      <span className="max-w-40 truncate text-sm text-muted-foreground" title={label}>
        {label}
      </span>
      <button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
        Sign out
      </button>
    </form>
  );
}

export function SignInLink() {
  return (
    <Link href="/sign-in" className="hidden rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted md:inline-flex">
      Sign in
    </Link>
  );
}
