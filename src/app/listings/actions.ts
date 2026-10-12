"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ListingFormValues, listingSchema, listingTitle, unitLabel } from "@/lib/listing-form";
import type { ListingStatus } from "@/lib/browse";

type Result = { ok: true; id: string; status: ListingStatus } | { ok: false; error: string };

const BUCKET = "listing-photos";

// Generated RPC types mark these params as required numbers; SQL accepts null
// (a draft may not have an address or room counts yet).
const nullable = (n: number | null | undefined) => (n ?? null) as unknown as number;

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return { supabase, userId: typeof userId === "string" ? userId : null };
}

/** Remove files in the listing's photo folder that the listing no longer uses. */
async function pruneStoragePhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  folder: string,
  keep: string[],
) {
  const { data: files } = await supabase.storage.from(BUCKET).list(folder, { limit: 100 });
  const stale = (files ?? []).map((f) => `${folder}/${f.name}`).filter((p) => !keep.includes(p));
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale);
}

/** Create or update a listing. Drafts can be incomplete; publishing cannot. */
export async function saveListing(values: ListingFormValues): Promise<Result> {
  const parsed = listingSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Some details need fixing." };
  }
  const v = parsed.data;

  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "Your session ended. Sign in again to save." };

  // Photos must live in this user's folder for this listing.
  const folder = `${userId}/${v.id}`;
  if (v.photos.some((p) => !p.startsWith(`${folder}/`))) {
    return { ok: false, error: "One of the photos didn't upload correctly. Remove it and try again." };
  }

  const unit = unitLabel(v.roomType, v.homeType, v.bedrooms);
  const status: ListingStatus = v.intent === "publish" ? "active" : "draft";

  const { error } = await supabase.rpc("save_listing", {
    p_id: v.id,
    p_status: status,
    p_title: listingTitle(v.roomType, unit),
    p_room_type: v.roomType,
    p_unit_label: unit,
    p_description: v.description,
    p_price: v.price,
    p_starts_on: v.dates!.start,
    p_ends_on: v.dates!.end,
    p_beds: nullable(v.bedrooms ?? (v.roomType === "studio" ? 1 : null)),
    p_baths: nullable(v.bathrooms),
    p_neighborhood: v.neighborhood,
    p_street_name: v.address?.street ?? "",
    p_address: v.address?.full ?? "",
    p_lat: nullable(v.address?.lat),
    p_lng: nullable(v.address?.lng),
    p_amenities: v.amenities,
    p_photos: v.photos,
    p_contacts: v.contacts.filter((c) => c.value),
    p_address_visibility: v.addressVisibility,
  });

  if (error) {
    // Messages raised by save_listing and the rate-limit trigger are written for people.
    const friendly = error.code === "P0001" || error.code === "22023" || error.code === "28000" || error.code === "42501";
    return { ok: false, error: friendly ? error.message : "Your listing didn't save. Try again in a moment." };
  }

  await pruneStoragePhotos(supabase, folder, v.photos);
  updateTag(`listing:${v.id}`);
  return { ok: true, id: v.id, status };
}

/** Pause, resume, or mark taken. Drafts are published from the form instead. */
export async function setListingStatus(id: string, status: Exclude<ListingStatus, "draft">): Promise<Result> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "Sign in again to change this listing." };

  const { data: current } = await supabase.from("listings").select("status").eq("id", id).eq("owner_id", userId).single();
  if (!current) return { ok: false, error: "That listing wasn't found." };
  if (current.status === "draft") return { ok: false, error: "Open the draft to finish it and publish." };

  const { error } = await supabase.from("listings").update({ status }).eq("id", id).eq("owner_id", userId);
  if (error) return { ok: false, error: "That didn't save. Try again." };
  updateTag(`listing:${id}`);
  return { ok: true, id, status };
}

/** Delete a listing and its photos. */
export async function deleteListing(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "Sign in again to delete this listing." };

  const { error, count } = await supabase
    .from("listings")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("owner_id", userId);
  if (error || !count) return { ok: false, error: "That listing couldn't be deleted. Try again." };

  await pruneStoragePhotos(supabase, `${userId}/${id}`, []);
  updateTag(`listing:${id}`);
  return { ok: true };
}
