import type { ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

function waitText(nextAt: string) {
  const hours = Math.max(1, Math.ceil((new Date(nextAt).getTime() - Date.now()) / 3_600_000));
  if (hours >= 48) return `about ${Math.round(hours / 24)} days`;
  return hours === 1 ? "about an hour" : `about ${hours} hours`;
}

/**
 * Checks the posting limit before someone spends five minutes on the form.
 * At the limit, the form is replaced by when they can post again. The
 * database enforces the same limit on save, so this is only a courtesy.
 */
export async function PostingAllowance({ children }: { children: ReactNode }) {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_posting_allowance");
  const a = data?.[0];

  if (!a || (a.day_left > 0 && a.month_left > 0)) {
    return (
      <>
        {a && a.day_left === 1 && (
          <p className="mb-6 rounded-lg border border-rule bg-sheet px-4 py-3 text-sm text-muted-foreground">
            You can post one more listing today.
          </p>
        )}
        {children}
      </>
    );
  }

  const monthly = a.month_left === 0;
  return (
    <div role="status" className="max-w-[60ch] rounded-lg border border-rule bg-sheet px-6 py-8">
      <p className="text-xl font-semibold">You&apos;ve reached the posting limit for now.</p>
      <p className="mt-2 text-muted-foreground">
        {monthly
          ? "Each account can post 15 new listings in 30 days."
          : "Each account can post 5 new listings in 24 hours."}{" "}
        You can post again in {a.next_post_at ? waitText(a.next_post_at) : "a little while"}. Editing, pausing, and
        relisting your current listings still works.
      </p>
      <Link
        href="/my-listings"
        className="mt-5 inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground"
      >
        Go to my listings
      </Link>
    </div>
  );
}
