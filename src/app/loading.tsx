import { ListingCardSkeleton } from "@/components/browse/listing-card";
import { SiteHeader } from "@/components/browse/site-header";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto grid w-full max-w-[1600px] flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(400px,42%)]">
        <div className="px-4 pt-[4.5rem] md:px-7">
          <div className="mb-4 h-12 w-56 animate-pulse rounded-lg bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="hidden animate-pulse bg-map-ground lg:block" />
      </div>
    </>
  );
}
