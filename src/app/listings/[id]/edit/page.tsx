import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/browse/site-header";
import { EditListing } from "@/components/post/post-listing";
import { getReferenceData } from "@/lib/reference-data";

export const metadata: Metadata = { title: "Edit listing | RU Subletting" };

type Params = Promise<{ id: string }>;

export default async function EditListingPage({ params }: { params: Params }) {
  const reference = await getReferenceData();
  return (
    <>
      <SiteHeader current="/my-listings" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 md:px-7 lg:pb-16">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight">Edit listing</h1>
        <Suspense>
          <EditForParams params={params} reference={reference} />
        </Suspense>
      </main>
    </>
  );
}

async function EditForParams({ params, reference }: { params: Params; reference: Awaited<ReturnType<typeof getReferenceData>> }) {
  const { id } = await params;
  return <EditListing id={id} reference={reference} />;
}
