import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "lucide-react";
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
}: {
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
        "group relative flex flex-col overflow-hidden rounded-lg border bg-sheet transition-[border-color,box-shadow] duration-150 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        saved && !inactive ? "border-brand" : "border-rule",
        active && !inactive && !saved && "border-foreground/30",
        active && !inactive && "shadow-[0_8px_24px_-14px_oklch(0.3_0.02_60/0.45)]",
      )}
    >
      <div className={cn("relative aspect-[16/9] w-full overflow-hidden bg-muted sm:aspect-[3/2]", inactive && "opacity-50")}>
        {listing.photoUrl && (
          <Image
            src={listing.photoUrl}
            alt={`Photo of ${title.toLowerCase()}${listing.street ? ` on ${listing.street}` : ""}`}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {badge && <span className="sr-only">{badge}: </span>}
            <h2 className={cn("font-semibold leading-snug", inactive && "text-muted-foreground")}>
              <Link
                href={range ? `/listings/${listing.id}?from=${range.start}&to=${range.end}` : `/listings/${listing.id}`}
                className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
              >
                {title}
              </Link>
            </h2>
            {place && <p className="text-sm text-muted-foreground">{place}</p>}
          </div>
          {badge ? (
            <span aria-hidden className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {badge}
            </span>
          ) : age <= 1 ? (
            <span className="shrink-0 rounded-md bg-signal-soft px-2 py-0.5 text-xs font-medium text-signal-foreground">
              New
            </span>
          ) : null}
        </div>

        <p className="truncate font-mono text-sm">
          {formatDateRange(listing.start, listing.end)}
          {listing.amenities.length > 0 && (
            <span className="ml-3 font-sans text-muted-foreground">{listing.amenities.slice(0, 2).join(", ")}</span>
          )}
        </p>

        {!inactive && (
          <div className="flex flex-col gap-3">
            <SemesterFitBar start={listing.start} end={listing.end} semesters={semesters} range={range} />
            {listing.commute && listing.campusName && (
              <CommuteLine campusName={listing.campusName} commute={listing.commute} />
            )}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-rule pt-3">
          <p className="font-mono text-2xl font-semibold tracking-tight">
            <span className={cn(listing.status === "taken" && "text-muted-foreground line-through decoration-1")}>
              {formatPrice(listing.price)}
            </span>
            <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground"> /mo</span>
          </p>

          {!inactive && onToggleSave && (
            <button
              type="button"
              onClick={onToggleSave}
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved" : "Save listing"}
              className={cn(
                "relative z-10 inline-flex size-11 items-center justify-center rounded-lg border transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                saved
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-rule text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              <Bookmark className={cn("size-4", saved && "fill-current")} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-rule bg-sheet">
      <div className="aspect-[16/9] w-full animate-pulse bg-muted sm:aspect-[3/2]" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-2/5 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-7 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
