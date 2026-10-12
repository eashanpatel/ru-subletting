import { Suspense } from "react";
import { BrowseView } from "@/components/browse/browse-view";
import { SiteHeader } from "@/components/browse/site-header";
import { getReferenceData } from "@/lib/reference-data";

export default async function BrowsePage() {
  const reference = await getReferenceData();
  return (
    <>
      <SiteHeader />
      {/* Filters come from the URL, which is request data. */}
      <Suspense fallback={<BrowseFallback />}>
        <BrowseView reference={reference} />
      </Suspense>
    </>
  );
}

function BrowseFallback() {
  return (
    <div className="mx-auto grid w-full max-w-[1600px] flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(400px,42%)]">
      <div className="px-4 pt-[4.5rem] md:px-7">
        <div className="mb-4 h-12 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
      <div className="hidden animate-pulse bg-map-ground lg:block" />
    </div>
  );
}
