"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 md:px-7">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong on our end.</h1>
      <p className="mt-2 text-muted-foreground">
        Try again. If it keeps happening, wait a minute and reload the page.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:brightness-110"
        >
          Try again
        </button>
        <Link href="/" className="inline-flex h-11 items-center rounded-lg border border-input px-5 text-sm font-medium hover:border-foreground/40">
          Back to browse
        </Link>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-muted-foreground">Error reference: {error.digest}</p>}
    </main>
  );
}
