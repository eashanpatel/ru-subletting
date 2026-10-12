import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { type ListingStatus, type RoomType, estimateCommute, photoUrl, type Commute } from "@/lib/browse";
import type { AddressVisibility } from "@/lib/listing-form";

export type CampusCommute = { slug: string; name: string; distanceM: number; commute: Commute };

export type ListingDetail = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  roomType: RoomType;
  unitLabel: string | null;
  street: string | null;
  neighborhood: string | null;
  price: number;
  start: string;
  end: string;
  beds: number | null;
  baths: number | null;
  status: ListingStatus;
  createdAt: string;
  lat: number | null;
  lng: number | null;
  ownerName: string | null;
  ownerSince: string;
  photos: string[];
  amenities: string[];
  campuses: CampusCommute[];
  addressVisibility: AddressVisibility;
};

/**
 * Public view of one listing (active or taken), cached for a few minutes.
 * Uses the cookie-free client, so drafts and paused listings return null
 * here; owners will reach those through an edit page instead.
 */
export async function getListing(id: string): Promise<ListingDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`listing:${id}`);

  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const { data, error } = await createPublicClient().rpc("get_listing", { p_listing_id: id });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;

  const distances = (row.campus_distances ?? []) as { slug: string; name: string; distance_m: number }[];

  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    roomType: row.room_type,
    unitLabel: row.unit_label,
    street: row.street_name,
    neighborhood: row.neighborhood,
    price: row.price_monthly,
    start: row.starts_on,
    end: row.ends_on,
    beds: row.beds,
    baths: row.baths == null ? null : Number(row.baths),
    status: row.status,
    createdAt: row.created_at,
    lat: row.lat,
    lng: row.lng,
    ownerName: row.owner_name,
    ownerSince: row.owner_since,
    photos: (row.photo_paths ?? []).map((p) => photoUrl(p)!).filter(Boolean),
    amenities: row.amenities ?? [],
    campuses: distances.map((d) => ({
      slug: d.slug,
      name: d.name,
      distanceM: d.distance_m,
      commute: estimateCommute(d.distance_m)!,
    })),
    addressVisibility: row.address_visibility,
  };
}
