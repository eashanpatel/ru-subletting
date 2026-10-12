"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { type DateRange, type PriceRange, ROOM_TYPE_LABEL, type RoomType } from "@/lib/browse";

export type Sort = "closest" | "newest" | "price_asc" | "price_desc";
export type Bounds = { west: number; south: number; east: number; north: number };

export type BrowseFilters = {
  campus: string;
  dates: DateRange | null;
  price: PriceRange;
  roomType: RoomType | "any";
  amenities: string[];
  bounds: Bounds | null;
  sort: Sort;
};

const SORTS: Sort[] = ["closest", "newest", "price_asc", "price_desc"];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const num = (v: string | null) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

function parse(params: URLSearchParams, campusSlugs: string[]): BrowseFilters {
  const from = params.get("from");
  const to = params.get("to");
  const room = params.get("room");
  const sort = params.get("sort") as Sort | null;
  const area = (params.get("area") ?? "").split(",").map(Number);
  const campus = params.get("campus");

  return {
    campus: campus && campusSlugs.includes(campus) ? campus : "any",
    dates: from && to && ISO.test(from) && ISO.test(to) && to > from ? { start: from, end: to } : null,
    price: { min: num(params.get("min")), max: num(params.get("max")) },
    roomType: room && room in ROOM_TYPE_LABEL ? (room as RoomType) : "any",
    amenities: (params.get("amen") ?? "").split(",").filter(Boolean),
    bounds:
      area.length === 4 && area.every(Number.isFinite)
        ? { west: area[0], south: area[1], east: area[2], north: area[3] }
        : null,
    sort: sort && SORTS.includes(sort) ? sort : "closest",
  };
}

function serialize(f: BrowseFilters) {
  const q = new URLSearchParams();
  if (f.campus !== "any") q.set("campus", f.campus);
  if (f.dates) {
    q.set("from", f.dates.start);
    q.set("to", f.dates.end);
  }
  if (f.price.min != null) q.set("min", String(f.price.min));
  if (f.price.max != null) q.set("max", String(f.price.max));
  if (f.roomType !== "any") q.set("room", f.roomType);
  if (f.amenities.length) q.set("amen", f.amenities.join(","));
  if (f.bounds) {
    const b = f.bounds;
    q.set("area", [b.west, b.south, b.east, b.north].map((n) => n.toFixed(4)).join(","));
  }
  if (f.sort !== "closest") q.set("sort", f.sort);
  return q.toString();
}

/**
 * Browse filters live in the URL, so a search can be shared in a group chat
 * and survives refresh and the back button.
 */
export function useBrowseFilters(campusSlugs: string[]) {
  const params = useSearchParams();
  const pathname = usePathname();
  const key = params.toString();
  // campusSlugs must be stable (memoized by the caller).
  const filters = useMemo(() => parse(new URLSearchParams(key), campusSlugs), [key, campusSlugs]);

  const update = useCallback(
    (patch: Partial<BrowseFilters>) => {
      const next = serialize({ ...filters, ...patch });
      // Next keeps useSearchParams in sync with history.replaceState, without a server round trip.
      window.history.replaceState(null, "", next ? `${pathname}?${next}` : pathname);
    },
    [filters, pathname],
  );

  const clear = useCallback(() => {
    window.history.replaceState(null, "", filters.sort !== "closest" ? `${pathname}?sort=${filters.sort}` : pathname);
  }, [filters.sort, pathname]);

  return { filters, update, clear };
}
