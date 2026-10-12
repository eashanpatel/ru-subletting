"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { NewPasswordForm, fieldClass, primaryButton } from "./password-forms";

/** Name shown on listings, the account email, password, and sign out. */
export function AccountSettings() {
  const { userId, email, ready } = useSession();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await createClient().from("profiles").select("full_name").eq("id", userId!).single();
      if (error) throw error;
      return data;
    },
  });

  if (!ready || (userId && profile.isPending)) {
    return <div className="h-64 animate-pulse rounded-lg bg-muted" aria-busy="true" aria-label="Loading your account" />;
  }

  return (
    <div className="flex flex-col">
      <Section title="Your name" description="Shown on your listings as who posted them. A first name is fine.">
        <NameForm
          key={profile.data?.full_name ?? ""}
          userId={userId!}
          initial={profile.data?.full_name ?? ""}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["profile", userId] })}
        />
      </Section>

      <Section title="Email" description="Used to sign in. It isn't shown on your listings unless you add it as a contact method.">
        <p className="font-mono text-sm">{email ?? "No email on this account"}</p>
      </Section>

      <Section title="Password" description="Set a password to sign in with your email, even if you usually use Google.">
        <NewPasswordForm afterSave="stay" />
      </Section>

      <Section title="Your listings and saves">
        <div className="flex flex-wrap gap-2">
          <Link href="/my-listings" className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm font-medium hover:border-foreground/40">
            My listings
          </Link>
          <Link href="/saved" className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm font-medium hover:border-foreground/40">
            Saved places
          </Link>
        </div>
      </Section>

      <Section title="Sign out">
        <form action="/auth/sign-out" method="post">
          <button type="submit" className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm font-medium hover:border-foreground/40">
            Sign out
          </button>
        </form>
      </Section>
    </div>
  );
}

function NameForm({ userId, initial, onSaved }: { userId: string; initial: string; onSaved: () => void }) {
  const [name, setName] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    const { error } = await createClient()
      .from("profiles")
      .update({ full_name: name.trim() || null })
      .eq("id", userId);
    if (error) {
      setState("error");
      return;
    }
    setState("saved");
    onSaved();
  }

  return (
    <>
      <form onSubmit={saveName} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="display-name" className="text-sm font-medium">
            Display name
          </label>
          <input
            id="display-name"
            value={name}
            maxLength={80}
            autoComplete="name"
            onChange={(e) => {
              setName(e.target.value);
              setState("idle");
            }}
            className={fieldClass}
          />
        </div>
        <button type="submit" disabled={state === "saving"} className={primaryButton}>
          {state === "saving" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save name
        </button>
      </form>
      <p role="status" className="mt-2 min-h-5 text-sm">
        {state === "saved" && <span className="text-accent-foreground">Saved.</span>}
        {state === "error" && <span className="text-destructive">That didn&apos;t save. Try again.</span>}
      </p>
    </>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-rule py-7 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mb-4 mt-1 max-w-[60ch] text-sm text-muted-foreground">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </section>
  );
}
