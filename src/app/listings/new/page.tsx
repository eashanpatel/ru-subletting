import type { Metadata } from "next";
import { SiteHeader } from "@/components/browse/site-header";
import { NewListing } from "@/components/post/post-listing";
import { getReferenceData } from "@/lib/reference-data";

export const metadata: Metadata = { title: "Post a sublet | RU Subletting" };

export default async function NewListingPage() {
  const reference = await getReferenceData();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 md:px-7 lg:pb-16">
        <h1 className="text-3xl font-semibold tracking-tight">Post a sublet</h1>
        <p className="mb-8 mt-1 max-w-[60ch] text-muted-foreground">
          Takes about five minutes. You can save a draft and finish later.
        </p>
        <NewListing reference={reference} />
      </main>
    </>
  );
}
