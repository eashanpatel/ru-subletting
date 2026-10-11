/**
 * Supabase project URL and public key. The URL is normalized to its origin, so
 * a pasted API address like ".../rest/v1/" still works.
 */
export const SUPABASE_URL = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set. See .env.example.");
  return new URL(raw).origin;
})();

export const SUPABASE_ANON_KEY = (() => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. See .env.example.");
  return key;
})();
