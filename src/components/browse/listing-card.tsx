import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type BrowseListing,
  type DateRange,
  type Semester,
  ROOM_TYPE_LABEL,
  daysSince,
  formatDateRange,
  formatPrice,
} from "@/lib/browse";
import { CommuteLine } from "./commute-line";
import { SemesterFitBar } from "./semester-fit-bar";

const STATUS_BADGE: Partial<Record<BrowseListing["status"], string>> = {
  taken: "Taken",
  paused: "Paused",
  draft: "Draft",
};

export function ListingCard({
  listing,
  semesters,
  range,
  saved,
  active,
  onToggleSave,
  onHover,
  href,
}: {
  href?: string;
  listing: BrowseListing;
  semesters: Semester[];
  range: DateRange | null;
  saved: boolean;
  active?: boolean;
  onToggleSave?: () => void;
  onHover?: (hovering: boolean) => void;
}) {
  const inactive = listing.status !== "active";
  const title = `${ROOM_TYPE_LABEL[listing.roomType]}${listing.unitLabel ? ` ${listing.unitLabel}` : ""}`;
  const place = [listing.street, listing.neighborhood !== listing.street ? listing.neighborhood : null]
    .filter(Boolean)
    .join(", ");
  const age = daysSince(listing.createdAt);
  const badge = STATUS_BADGE[listing.status];

  return (
    <article
      id={`listing-${listing.id}`}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-sheet transition-[border-color,box-shadow] duration-150 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        active && !inactive
          ? "border-foreground shadow-[0_12px_28px_-16px_oklch(0.15_0.04_265/0.6)]"
          : "border-rule",
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted sm:aspect-[3/2]">
        {listing.photoUrl && (
          <Image
            src={listing.photoUrl}
            alt={`Photo of ${title.toLowerCase()}${listing.street ? ` on ${listing.street}` : ""}`}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw"
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none",
              inactive && "opacity-50 grayscale",
            )}
          />
        )}

        {badge ? (
          <span aria-hidden className="absolute left-3 top-3 rounded-md bg-sheet px-2 py-1 text-xs font-bold text-muted-foreground">
            {badge}
          </span>
        ) : age <= 1 ? (
          <span className="absolute left-3 top-3 rounded-md bg-signal px-2 py-1 text-xs font-bold text-cta-foreground">New</span>
        ) : null}

        {!inactive && onToggleSave && (
          <button
            type="button"
            onClick={onToggleSave}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save listing"}
            className={cn(
              "absolute right-2.5 top-2.5 z-10 inline-flex size-11 items-center justify-center rounded-full shadow-[0_2px_8px_-2px_oklch(0.15_0.04_265/0.5)] transition-[background-color,color,transform] active:scale-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
              saved ? "bg-cta text-cta-foreground" : "bg-sheet text-foreground hover:text-cta",
            )}
          >
            <Heart className={cn("size-5", saved && "fill-current")} aria-hidden />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {badge && <span className="sr-only">{badge}: </span>}
            <h2 className={cn("text-base font-bold leading-snug", inactive && "text-muted-foreground")}>
              <Link
                href={
                  href ?? (range ? `/listings/${listing.id}?from=${range.start}&to=${range.end}` : `/listings/${listing.id}`)
                }
                className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
              >
                {title}
              </Link>
            </h2>
            {place && <p className="truncate text-sm text-muted-foreground">{place}</p>}
          </div>

          {/* The price plate: the same object as the map pin. */}
          <p
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1.5 text-right leading-none",
              inactive ? "bg-muted text-muted-foreground" : "bg-plate text-plate-foreground",
            )}
          >
            <span
              className={cn(
                "block font-mono text-xl font-extrabold tracking-tight",
                listing.status === "taken" && "line-through decoration-1",
              )}
            >
              {formatPrice(listing.price)}
            </span>
            <span className="mt-1 block text-[11px] font-semibold opacity-80">per month</span>
          </p>
        </div>

        <p className="truncate text-sm font-semibold">
          <span className="font-mono">{formatDateRange(listing.start, listing.end)}</span>
          {listing.amenities.length > 0 && (
            <span className="ml-3 font-normal text-muted-foreground">{listing.amenities.slice(0, 2).join(", ")}</span>
          )}
        </p>

        {!inactive && (
          <div className="mt-auto flex flex-col gap-3 border-t border-rule pt-3">
            <SemesterFitBar start={listing.start} end={listing.end} semesters={semesters} range={range} />
            {listing.commute && listing.campusName && (
              <CommuteLine campusName={listing.campusName} commute={listing.commute} />
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-rule bg-sheet">
      <div className="aspect-[16/9] w-full animate-pulse bg-muted sm:aspect-[3/2]" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex justify-between gap-3">
          <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
          <div className="h-11 w-20 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-3.5 w-2/5 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
