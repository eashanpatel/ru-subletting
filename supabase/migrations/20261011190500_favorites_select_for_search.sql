-- search_listings references favorites (for p_favorites_only). Signed-out
-- callers need table-level SELECT for the query to plan; RLS has no anon
-- policy on favorites, so they still see zero rows.
grant select on public.favorites to anon;
