"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { List, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useFavorites } from "@/hooks/use-favorites";
import {
  type DateRange,
  type PriceRange,
  type ReferenceData,
  type RoomType,
  ROOM_TYPE_LABEL,
  SCHOOL_SLUG,
  formatDateRange,
  toBrowseListing,
} from "@/lib/browse";
import { DateRangeFilter } from "./date-range-filter";
import { FilterSelect } from "./filter-select";
import { PriceFilter } from "./price-filter";
import { ListingCard, ListingCardSkeleton } from "./listing-card";
import { MapView } from "./map-view";
import { MapPeek } from "./map-peek";
import { useMediaQuery } from "@/hooks/use-media-query";
import { type Bounds, type Sort, useBrowseFilters } from "@/hooks/use-browse-filters";

export function BrowseView({ reference }: { reference: ReferenceData }) {
  const { campuses, semesters, amenities: amenityList } = reference;
  const router = useRouter();
  const campusSlugs = useMemo(() => campuses.map((c) => c.slug), [campuses]);
  const { filters: f, update, clear } = useBrowseFilters(campusSlugs);
  const { campus, dates, price, roomType, amenities, bounds, sort } = f;
  const setCampus = (campus: string) => update({ campus });
  const setDates = (dates: DateRange | null) => update({ dates });
  const setPrice = (price: PriceRange) => update({ price });
  const setRoomType = (roomType: RoomType | "any") => update({ roomType });
  const setAmenities = (next: string[] | ((prev: string[]) => string[])) =>
    update({ amenities: typeof next === "function" ? next(amenities) : next });
  const setBounds = (bounds: Bounds | null) => update({ bounds });
  const setSort = (sort: Sort) => update({ sort });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [peekId, setPeekId] = useState<string | null>(null);
  const wide = useMediaQuery("(min-width: 1024px)");
  const moreRef = useRef<HTMLDialogElement>(null);

  const { userId, ready } = useSession();
  const { savedIds, toggle } = useFavorites(userId);
  const amenityLabels = useMemo(() => new Map(amenityList.map((a) => [a.slug, a.label])), [amenityList]);

  const filters = { campus, dates, price, roomType, amenities, bounds, sort };
  const search = useQuery({
    queryKey: ["listings", "browse", filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await createClient().rpc("search_listings", {
        p_school: SCHOOL_SLUG,
        p_campus: campus === "any" ? undefined : campus,
        p_start: dates?.start,
        p_end: dates?.end,
        p_min_price: price.min ?? undefined,
        p_max_price: price.max ?? undefined,
        p_room_type: roomType === "any" ? undefined : roomType,
        p_amenities: amenities.length ? amenities : undefined,
        p_west: bounds?.west,
        p_south: bounds?.south,
        p_east: bounds?.east,
        p_north: bounds?.north,
        p_sort: sort,
        p_limit: 100,
      });
      if (error) throw error;
      return data;
    },
  });

  const results = useMemo(
    () => (search.data ?? []).map((row) => toBrowseListing(row, amenityLabels)),
    [search.data, amenityLabels],
  );
  const activeCount = results.filter((l) => l.status === "active").length;
  const filtersSet =
    campus !== "any" ||
    !!dates ||
    price.min != null ||
    price.max != null ||
    roomType !== "any" ||
    amenities.length > 0 ||
    !!bounds;
  const campusName = campuses.find((c) => c.slug === campus)?.name;
  const loadingFirst = search.isPending;

  function clearFilters() {
    clear();
  }

  function toggleSave(id: string) {
    if (!ready) return;
    if (!userId) {
      router.push("/sign-in");
      return;
    }
    toggle.mutate({ listingId: id, save: !savedIds.has(id) });
  }

  // Desktop: scroll to the card. Phone map: show a preview on the map instead of leaving it.
  function focusListing(id: string) {
    setHoveredId(id);
    if (!wide && mobileView === "map") {
      setPeekId(id);
      return;
    }
    requestAnimationFrame(() =>
      document.getElementById(`listing-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }

  return (
    <>
      <a
        href="#map"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-20 focus:z-50 focus:rounded-lg focus:bg-sheet focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to map
      </a>

      {/* Filter bar */}
      <div className="sticky top-16 z-20 border-b border-rule bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] md:px-7">
          <FilterSelect
            label="Campus"
            value={campus}
            onChange={setCampus}
            options={[{ value: "any", label: "Any" }, ...campuses.map((c) => ({ value: c.slug, label: c.name }))]}
          />
          <DateRangeFilter value={dates} semesters={semesters} onChange={setDates} />
          <PriceFilter value={price} onChange={setPrice} />
          <FilterSelect
            label="Room"
            value={roomType}
            onChange={(v) => setRoomType(v as RoomType | "any")}
            options={[
              { value: "any", label: "Any" },
              ...(Object.keys(ROOM_TYPE_LABEL) as RoomType[]).map((r) => ({ value: r, label: ROOM_TYPE_LABEL[r] })),
            ]}
          />
          <button
            type="button"
            onClick={() => moreRef.current?.showModal()}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
              amenities.length
                ? "border-brand bg-brand-soft text-accent-foreground"
                : "border-input bg-sheet hover:border-foreground/40",
            )}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            More filters
            {amenities.length > 0 && <span className="font-normal">({amenities.length})</span>}
          </button>
          {filtersSet && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 shrink-0 rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(400px,42%)]">
        {/* Results */}
        <section
          aria-label="Listings"
          className={cn("min-w-0 px-4 pb-24 pt-5 md:px-7 lg:pb-10", mobileView === "map" && "hidden lg:block")}
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div aria-live="polite">
              <h1 className="text-2xl font-semibold tracking-tight">
                {loadingFirst ? (
                  "Finding places"
                ) : (
                  <>
                    <span className="font-mono">{activeCount}</span> {activeCount === 1 ? "place" : "places"}
                    {campusName ? ` near ${campusName}` : " near campus"}
                  </>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">
                {dates ? formatDateRange(dates.start, dates.end) : "Any dates"}
                {bounds && ", in the map area"}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-9 rounded-lg border border-input bg-sheet px-2 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <option value="closest">{campusName ? `Closest to ${campusName}` : "Closest to a campus"}</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price, low to high</option>
                <option value="price_desc">Price, high to low</option>
              </select>
            </label>
          </div>

          {search.isError ? (
            <div role="alert" className="rounded-lg border border-dashed border-input bg-sheet px-6 py-14">
              <p className="text-xl font-semibold">Listings didn&apos;t load.</p>
              <p className="mt-2 text-muted-foreground">Check your connection, then try again.</p>
              <button
                type="button"
                onClick={() => search.refetch()}
                className="mt-5 h-11 rounded-lg bg-foreground px-5 text-sm font-semibold text-background active:scale-[0.98]"
              >
                Try again
              </button>
            </div>
          ) : loadingFirst ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState onClear={clearFilters} filtersSet={filtersSet} />
          ) : (
            <div className={cn("grid gap-4 transition-opacity sm:grid-cols-2", search.isFetching && "opacity-70")}>
              {results.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  semesters={semesters}
                  range={dates}
                  saved={savedIds.has(l.id)}
                  active={hoveredId === l.id}
                  onToggleSave={() => toggleSave(l.id)}
                  onHover={(h) => setHoveredId(h ? l.id : null)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Map */}
        <div
          id="map"
          tabIndex={-1}
          className={cn(
            "relative lg:sticky lg:top-[7.75rem] lg:block lg:h-[calc(100dvh-7.75rem)] lg:border-l lg:border-rule",
            mobileView === "map" ? "h-[calc(100dvh-7.75rem)]" : "hidden",
          )}
        >
          <MapView
            className="h-full"
            listings={results}
            campuses={campuses}
            activeId={hoveredId}
            savedIds={savedIds}
            areaActive={!!bounds}
            onPinHover={setHoveredId}
            onPinClick={focusListing}
            onSearchArea={setBounds}
            onClearArea={() => setBounds(null)}
          />
          {!wide && mobileView === "map" && peekId && results.find((l) => l.id === peekId) && (
            <MapPeek
              listing={results.find((l) => l.id === peekId)!}
              range={dates}
              onClose={() => setPeekId(null)}
            />
          )}
        </div>
      </main>

      {/* Mobile list/map switch */}
      <button
        type="button"
        onClick={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
        className="fixed bottom-5 left-1/2 z-30 inline-flex h-12 -translate-x-1/2 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background shadow-[0_8px_24px_-8px_oklch(0.2_0.02_250/0.5)] active:scale-[0.98] lg:hidden"
      >
        {mobileView === "list" ? <MapIcon className="size-4" aria-hidden /> : <List className="size-4" aria-hidden />}
        {mobileView === "list" ? "Map" : "List"}
      </button>

      {/* More filters: bottom sheet on phones, side panel on desktop */}
      <dialog
        ref={moreRef}
        aria-label="More filters"
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-xl border-t border-rule bg-sheet p-0 text-foreground backdrop:bg-foreground/30 backdrop:backdrop-blur-[2px] md:ml-auto md:mt-0 md:h-dvh md:max-h-none md:w-[420px] md:rounded-none md:border-l md:border-t-0"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <h2 className="text-lg font-semibold">More filters</h2>
          <button
            type="button"
            onClick={() => moreRef.current?.close()}
            aria-label="Close filters"
            className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <fieldset className="px-5 py-5">
          <legend className="mb-3 text-sm font-medium text-muted-foreground">Amenities</legend>
          <div className="grid grid-cols-2 gap-2">
            {amenityList.map((a) => {
              const on = amenities.includes(a.slug);
              return (
                <label
                  key={a.slug}
                  className={cn(
                    "flex h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                    on ? "border-brand bg-brand-soft text-accent-foreground" : "border-input hover:border-foreground/40",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setAmenities((p) => (on ? p.filter((x) => x !== a.slug) : [...p, a.slug]))}
                    className="size-4 accent-[var(--brand)]"
                  />
                  {a.label}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="flex gap-3 border-t border-rule px-5 py-4">
          <button
            type="button"
            onClick={() => setAmenities([])}
            className="h-11 rounded-lg px-4 text-sm font-medium hover:bg-muted"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => moreRef.current?.close()}
            className="ml-auto h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground active:scale-[0.98]"
          >
            Show {activeCount} {activeCount === 1 ? "place" : "places"}
          </button>
        </div>
      </dialog>
    </>
  );
}

function EmptyState({ onClear, filtersSet }: { onClear: () => void; filtersSet: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-input bg-sheet px-6 py-14">
      <p className="text-xl font-semibold">{filtersSet ? "Nothing matches yet." : "No places posted yet."}</p>
      <p className="mt-2 max-w-[48ch] text-muted-foreground">
        {filtersSet
          ? "New places show up most in the weeks before each break. Try a wider price or any dates."
          : "Subletting your place? Post it and people near campus can find it."}
      </p>
      {filtersSet ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 h-11 rounded-lg bg-foreground px-5 text-sm font-semibold text-background active:scale-[0.98]"
        >
          Clear filters
        </button>
      ) : (
        <Link
          href="/listings/new"
          className="mt-5 inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground"
        >
          Post a sublet
        </Link>
      )}
    </div>
  );
}
