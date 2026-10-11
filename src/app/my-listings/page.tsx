import type { Metadata } from "next";
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
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">My listings</h1>
        <ScopedListings scope="mine" reference={reference} />
      </main>
    </>
  );
}
