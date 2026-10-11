import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/browse/site-header";
import { ScopedListings } from "@/components/browse/scoped-listings";
import { getReferenceData } from "@/lib/reference-data";

export const metadata: Metadata = { title: "My listings | RU Subletting" };

export default async function MyListingsPage() {
  const reference = await getReferenceData();
  return (
    <>
      <SiteHeader current="/my-listings" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">My listings</h1>
          <Link
            href="/listings/new"
            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:brightness-110"
          >
            Post a sublet
          </Link>
        </div>
        <ScopedListings scope="mine" reference={reference} />
      </main>
    </>
  );
}
