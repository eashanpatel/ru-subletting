"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const EMPTY = new Set<string>();

/** Saved listing ids for the signed-in user, with an optimistic toggle. */
export function useFavorites(userId: string | null) {
  const queryClient = useQueryClient();
  const key = ["favorites", userId];

  const { data } = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await createClient().from("favorites").select("listing_id");
      if (error) throw error;
      return new Set(data.map((f) => f.listing_id));
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ listingId, save }: { listingId: string; save: boolean }) => {
      const supabase = createClient();
      const { error } = save
        ? await supabase.from("favorites").insert({ user_id: userId!, listing_id: listingId })
        : await supabase.from("favorites").delete().eq("user_id", userId!).eq("listing_id", listingId);
      if (error) throw error;
    },
    onMutate: async ({ listingId, save }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Set<string>>(key);
      const next = new Set(previous);
      if (save) next.add(listingId);
      else next.delete(listingId);
      queryClient.setQueryData(key, next);
      return { previous };
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ["listings", "saved"] });
    },
  });

  return { savedIds: data ?? EMPTY, toggle };
}
