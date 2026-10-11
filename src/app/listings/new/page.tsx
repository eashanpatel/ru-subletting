import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/browse/site-header";

export const metadata: Metadata = { title: "Post a sublet | RU Subletting" };

// Placeholder until the listing form is built.
export default function NewListingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 md:px-7">
        <h1 className="text-2xl font-semibold tracking-tight">Post a sublet</h1>
        <p className="mt-2 text-muted-foreground">The listing form is coming next. Check back soon.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-lg border border-input bg-sheet px-5 text-sm font-medium">
          Back to browsing
        </Link>
      </main>
    </>
  );
}
