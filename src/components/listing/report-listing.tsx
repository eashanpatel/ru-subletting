"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";

const REASONS = [
  "Looks like a scam",
  "The place isn't available or doesn't exist",
  "Wrong price, dates, or photos",
  "Something else",
];

/** Inline report form. Reports go to the reports table for manual review. */
export function ReportListing({ listingId, ownerId }: { listingId: string; ownerId: string }) {
  const router = useRouter();
  const { userId, ready } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "duplicate" | "error">("idle");

  if (ready && userId === ownerId) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return router.push("/sign-in");
    setState("sending");
    const text = details.trim() ? `${reason}: ${details.trim()}` : reason;
    const { error } = await createClient().from("reports").insert({ listing_id: listingId, reporter_id: userId, reason: text });
    if (!error) setState("sent");
    else if (error.code === "23505") setState("duplicate");
    else setState("error");
  }

  if (state === "sent" || state === "duplicate") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {state === "sent"
          ? "Thanks. We'll review this listing."
          : "You've already reported this listing. We'll review it."}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => (userId || !ready ? setOpen(true) : router.push("/sign-in"))}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <Flag className="size-4" aria-hidden />
        Report this listing
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex max-w-lg flex-col gap-3 rounded-lg border border-rule bg-sheet p-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">What&apos;s wrong?</legend>
        {REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="size-4 accent-[var(--brand)]"
            />
            {r}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="report-details" className="text-sm font-medium">
          Details <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="report-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={900}
          rows={3}
          className="rounded-lg border border-input bg-sheet px-3 py-2 text-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>
      {state === "error" && (
        <p role="alert" className="text-sm text-destructive">
          The report didn&apos;t send. Try again in a moment.
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60"
        >
          {state === "sending" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Send report
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg px-3 text-sm font-medium hover:bg-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}
