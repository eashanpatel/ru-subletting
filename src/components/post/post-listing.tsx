"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import type { ReferenceData } from "@/lib/browse";
import type { ContactKind, HomeType, ListingFormValues } from "@/lib/listing-form";
import { ListingForm } from "./listing-form";

function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading the form" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-4">
        <div className="h-6 w-56 animate-pulse rounded bg-muted" />
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-80 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

/** New listing: a fresh id (so photos can upload before saving) and the user's email pre-filled. */
export function NewListing({ reference }: { reference: ReferenceData }) {
  const { userId, email, ready } = useSession();
  if (!ready) return <FormSkeleton />;
  if (!userId) return <SignInPrompt />;
  return <NewListingForm reference={reference} userId={userId} email={email} />;
}

/** Mounts only in the browser (after the session check), so the id is never generated during prerender. */
function NewListingForm({ reference, userId, email }: { reference: ReferenceData; userId: string; email: string | null }) {
  const [id] = useState(() => crypto.randomUUID());
  const initial: ListingFormValues = {
    id,
    intent: "publish",
    roomType: "private_room",
    homeType: "apartment",
    bedrooms: null,
    bathrooms: null,
    price: Number.NaN,
    dates: null,
    address: null,
    neighborhood: "",
    description: "",
    amenities: [],
    photos: [],
    contacts: email ? [{ kind: "email", value: email }] : [{ kind: "phone", value: "" }],
  };
  return <ListingForm reference={reference} userId={userId} initial={initial} mode="new" />;
}

type EditRow = {
  id: string;
  status: string;
  room_type: ListingFormValues["roomType"];
  unit_label: string | null;
  description: string | null;
  price: number;
  starts_on: string;
  ends_on: string;
  beds: number | null;
  baths: number | null;
  neighborhood: string | null;
  street_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  amenities: string[];
  photos: string[];
  contacts: { kind: ContactKind; value: string }[];
};

/** Edit an existing listing. Only its owner gets data back. */
export function EditListing({ id, reference }: { id: string; reference: ReferenceData }) {
  const { userId, ready } = useSession();
  const listing = useQuery({
    queryKey: ["listing-edit", id, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await createClient().rpc("get_listing_for_edit", { p_listing_id: id });
      if (error) throw error;
      return (data as unknown as EditRow | null) ?? null;
    },
  });

  if (!ready || (userId && listing.isPending)) return <FormSkeleton />;
  if (!userId) return <SignInPrompt />;
  if (listing.isError) {
    return (
      <div role="alert" className="rounded-lg border border-dashed border-input bg-sheet px-6 py-14">
        <p className="text-lg font-semibold">This listing didn&apos;t load.</p>
        <button
          type="button"
          onClick={() => listing.refetch()}
          className="mt-4 h-11 rounded-lg bg-foreground px-5 text-sm font-semibold text-background"
        >
          Try again
        </button>
      </div>
    );
  }
  const row = listing.data;
  if (!row) {
    return (
      <div className="rounded-lg border border-dashed border-input bg-sheet px-6 py-14">
        <p className="text-lg font-semibold">You can only edit your own listings.</p>
        <Link href="/my-listings" className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground">
          Go to My listings
        </Link>
      </div>
    );
  }

  const initial: ListingFormValues = {
    id: row.id,
    intent: "publish",
    roomType: row.room_type,
    homeType: row.unit_label?.includes("house") ? ("house" as HomeType) : "apartment",
    bedrooms: row.room_type === "studio" ? null : row.beds,
    bathrooms: row.baths == null ? null : Number(row.baths),
    price: row.price,
    dates: { start: row.starts_on, end: row.ends_on },
    address:
      row.address && row.lat != null && row.lng != null
        ? { full: row.address, street: row.street_name, lat: row.lat, lng: row.lng }
        : null,
    neighborhood: row.neighborhood ?? "",
    description: row.description ?? "",
    amenities: row.amenities,
    photos: row.photos,
    contacts: row.contacts,
  };
  return <ListingForm reference={reference} userId={userId} initial={initial} mode="edit" />;
}

function SignInPrompt() {
  return (
    <div className="rounded-lg border border-dashed border-input bg-sheet px-6 py-14">
      <p className="text-lg font-semibold">Sign in to post a sublet.</p>
      <Link href="/sign-in" className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground">
        Sign in
      </Link>
    </div>
  );
}
