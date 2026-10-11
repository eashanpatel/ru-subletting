"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useFavorites } from "@/hooks/use-favorites";
import { type ReferenceData, SCHOOL_SLUG, toBrowseListing } from "@/lib/browse";
import { ListingCard, ListingCardSkeleton } from "./listing-card";

const COPY = {
  saved: {
    emptyTitle: "Nothing saved yet.",
    emptyBody: "Tap the bookmark on any listing to keep it here while you compare.",
    cta: { href: "/", label: "Browse places" },
  },
  mine: {
    emptyTitle: "You haven't posted a place yet.",
    emptyBody: "Leaving for the summer or a semester? Post your room and people near campus can find it.",
    cta: { href: "/listings/new", label: "Post a sublet" },
  },
} as const;

/** Saved listings or the signed-in user's own listings, as a card grid. */
export function ScopedListings({ scope, reference }: { scope: "saved" | "mine"; reference: ReferenceData }) {
  const { userId } = useSession();
  const { savedIds, toggle } = useFavorites(userId);
  const amenityLabels = useMemo(() => new Map(reference.amenities.map((a) => [a.slug, a.label])), [reference.amenities]);

  const query = useQuery({
    queryKey: ["listings", scope, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await createClient().rpc("search_listings", {
        p_school: SCHOOL_SLUG,
        p_sort: "newest",
        p_limit: 100,
        p_favorites_only: scope === "saved",
        p_mine: scope === "mine",
      });
      if (error) throw error;
      return data.map((row) => toBrowseListing(row, amenityLabels));
    },
  });

  if (query.isError) {
    return (
      <div role="alert" className="rounded-lg border border-dashed border-input bg-sheet px-6 py-14">
        <p className="text-lg font-semibold">This list didn&apos;t load.</p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="mt-4 h-11 rounded-lg bg-foreground px-5 text-sm font-semibold text-background"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (query.data.length === 0) {
    const copy = COPY[scope];
    return (
      <div className="rounded-lg border border-dashed border-input bg-sheet px-6 py-14">
        <p className="text-lg font-semibold">{copy.emptyTitle}</p>
        <p className="mt-1 max-w-[48ch] text-muted-foreground">{copy.emptyBody}</p>
        <Link
          href={copy.cta.href}
          className="mt-5 inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:brightness-110"
        >
          {copy.cta.label}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {query.data.map((l) => (
        <ListingCard
          key={l.id}
          listing={l}
          semesters={reference.semesters}
          range={null}
          saved={savedIds.has(l.id)}
          onToggleSave={scope === "saved" ? () => toggle.mutate({ listingId: l.id, save: !savedIds.has(l.id) }) : undefined}
        />
      ))}
    </div>
  );
}
