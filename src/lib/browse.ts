import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_URL } from "@/lib/supabase/env";

export type RoomType = Database["public"]["Enums"]["room_type"];
export type ListingStatus = Database["public"]["Enums"]["listing_status"];
type SearchRow = Database["public"]["Functions"]["search_listings"]["Returns"][number];

export const SCHOOL_SLUG = "rutgers-nb";

export type Campus = { slug: string; name: string; lat: number; lng: number };
export type Semester = { slug: string; label: string; startsOn: string; endsOn: string };
export type Amenity = { slug: string; label: string };
export type ReferenceData = { campuses: Campus[]; semesters: Semester[]; amenities: Amenity[] };

export type Commute = { minutes: number; mode: "walk" | "bus" };

/** Visitor-chosen dates, as YYYY-MM-DD. */
export type DateRange = { start: string; end: string };
/** Monthly price bounds; null means unbounded on that side. */
export type PriceRange = { min: number | null; max: number | null };

/** Top of the price slider. At this value the max is treated as "no max". */
export const PRICE_SLIDER_MAX = 3000;
export const PRICE_STEP = 25;

export type BrowseListing = {
  id: string;
  title: string;
  roomType: RoomType;
  unitLabel: string | null;
  street: string | null;
  neighborhood: string | null;
  price: number;
  start: string;
  end: string;
  status: ListingStatus;
  createdAt: string;
  lat: number | null;
  lng: number | null;
  campusName: string | null;
  commute: Commute | null;
  photoUrl: string | null;
  photoCount: number;
  amenities: string[];
};

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  private_room: "Private room",
  shared_room: "Shared room",
  entire_place: "Entire place",
  studio: "Studio",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDateRange(start: string, end: string) {
  const [, sm, sd] = start.split("-").map(Number);
  const [, em, ed] = end.split("-").map(Number);
  return `${MONTHS[sm - 1]} ${sd} to ${MONTHS[em - 1]} ${ed}`;
}

export function formatShortDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

export function monthLabel(iso: string) {
  return MONTHS[Number(iso.split("-")[1]) - 1];
}

export function formatPrice(price: number) {
  return `$${price.toLocaleString("en-US")}`;
}

/**
 * Rough commute from straight-line distance: streets add ~30%, walking is
 * ~80 m/min. Past a 20-minute walk, assume the campus bus (ride plus wait).
 */
export function estimateCommute(distanceM: number | null): Commute | null {
  if (distanceM == null) return null;
  const route = distanceM * 1.3;
  const walk = Math.max(1, Math.round(route / 80));
  if (walk <= 20) return { minutes: walk, mode: "walk" };
  return { minutes: Math.round(route / 350 + 7), mode: "bus" };
}

/** Straight-line distance in meters between two points. */
export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function photoUrl(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/listing-photos/${path}`;
}

export function toBrowseListing(row: SearchRow, amenityLabels: Map<string, string>): BrowseListing {
  return {
    id: row.id,
    title: row.title,
    roomType: row.room_type,
    unitLabel: row.unit_label,
    street: row.street_name,
    neighborhood: row.neighborhood,
    price: row.price_monthly,
    start: row.starts_on,
    end: row.ends_on,
    status: row.status,
    createdAt: row.created_at,
    lat: row.lat,
    lng: row.lng,
    campusName: row.campus_name,
    commute: estimateCommute(row.distance_m),
    photoUrl: photoUrl(row.cover_path),
    photoCount: row.photo_count,
    amenities: (row.amenities ?? []).map((slug) => amenityLabels.get(slug) ?? slug),
  };
}

export function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}
