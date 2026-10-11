"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** The signed-in user's id, or null. `ready` is false until the first check. */
export function useSession() {
  const [state, setState] = useState<{ userId: string | null; ready: boolean }>({ userId: null, ready: false });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setState({ userId: data.session?.user.id ?? null, ready: true }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setState({ userId: session?.user.id ?? null, ready: true }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
