"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { type BrowseListing, type DateRange, ROOM_TYPE_LABEL, formatDateRange, formatPrice } from "@/lib/browse";

/** Phone map: the tapped pin's listing, docked above the List button. */
export function MapPeek({
  listing,
  range,
  onClose,
}: {
  listing: BrowseListing;
  range: DateRange | null;
  onClose: () => void;
}) {
  const title = `${ROOM_TYPE_LABEL[listing.roomType]}${listing.unitLabel ? ` ${listing.unitLabel}` : ""}`;
  const href = range ? `/listings/${listing.id}?from=${range.start}&to=${range.end}` : `/listings/${listing.id}`;

  return (
    <div
      role="dialog"
      aria-label={title}
      className="absolute inset-x-3 bottom-20 z-20 flex overflow-hidden rounded-lg border border-rule bg-sheet shadow-[0_10px_30px_-12px_oklch(0.2_0.02_60/0.45)]"
    >
      <Link href={href} className="relative w-28 shrink-0 bg-muted">
        {listing.photoUrl && <Image src={listing.photoUrl} alt="" fill sizes="112px" className="object-cover" />}
      </Link>
      <div className="min-w-0 flex-1 p-3 pr-10">
        <Link href={href} className="block truncate font-semibold leading-snug">
          {title}
        </Link>
        {listing.street && <p className="truncate text-sm text-muted-foreground">{listing.street}</p>}
        <p className="mt-1 font-mono text-xs text-muted-foreground">{formatDateRange(listing.start, listing.end)}</p>
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <p className="font-mono text-lg font-semibold">
            {formatPrice(listing.price)}
            <span className="font-sans text-xs font-normal text-muted-foreground"> /mo</span>
          </p>
          {listing.commute && listing.campusName && (
            <p className="truncate font-mono text-xs text-muted-foreground">
              {listing.commute.minutes} min {listing.commute.mode === "walk" ? "walk" : "bus"}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-1.5 top-1.5 inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
