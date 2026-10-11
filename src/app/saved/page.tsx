import type { Metadata } from "next";
import { SiteHeader } from "@/components/browse/site-header";
import { ScopedListings } from "@/components/browse/scoped-listings";
import { getReferenceData } from "@/lib/reference-data";

export const metadata: Metadata = { title: "Saved | RU Subletting" };

export default async function SavedPage() {
  const reference = await getReferenceData();
  return (
    <>
      <SiteHeader current="/saved" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-7">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Saved places</h1>
        <ScopedListings scope="saved" reference={reference} />
      </main>
    </>
  );
}
