"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SessionState = { userId: string | null; email: string | null; ready: boolean };

/** The signed-in user's id and email, or null. `ready` is false until the first check. */
export function useSession() {
  const [state, setState] = useState<SessionState>({ userId: null, email: null, ready: false });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data }) =>
        setState({ userId: data.session?.user.id ?? null, email: data.session?.user.email ?? null, ready: true }),
      );
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setState({ userId: session?.user.id ?? null, email: session?.user.email ?? null, ready: true }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
