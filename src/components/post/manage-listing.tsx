"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, Loader2, Pause, Pencil, Play, Trash2 } from "lucide-react";
import type { ListingStatus } from "@/lib/browse";
import { deleteListing, setListingStatus } from "@/app/listings/actions";

const STATUS_COPY: Record<ListingStatus, { label: string; hint: string }> = {
  active: { label: "Live", hint: "Showing in browse." },
  draft: { label: "Draft", hint: "Only you can see this. Finish it to publish." },
  paused: { label: "Paused", hint: "Hidden from browse until you resume it." },
  taken: { label: "Taken", hint: "Shown as taken. Contact details are hidden." },
};

const actionClass =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-sheet px-3 text-sm font-medium transition-colors hover:border-foreground/40 disabled:opacity-50";

/** Owner controls under each card on My listings. */
export function ManageListing({ id, status }: { id: string; status: ListingStatus }) {
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLDialogElement>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "That didn't work. Try again.");
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
    });
  }

  const copy = STATUS_COPY[status];

  return (
    <div className="mt-2 rounded-lg border border-rule bg-sheet p-3">
      <p className="text-sm">
        <span className="font-medium">{copy.label}.</span> <span className="text-muted-foreground">{copy.hint}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/listings/${id}/edit`} className={actionClass}>
          <Pencil className="size-4" aria-hidden />
          {status === "draft" ? "Finish draft" : "Edit"}
        </Link>
        {(status === "active" || status === "taken") && (
          <Link href={`/listings/${id}`} className={actionClass}>
            <Eye className="size-4" aria-hidden />
            View
          </Link>
        )}
        {status === "active" && (
          <button type="button" disabled={pending} onClick={() => run(() => setListingStatus(id, "paused"))} className={actionClass}>
            <Pause className="size-4" aria-hidden />
            Pause
          </button>
        )}
        {status === "paused" && (
          <button type="button" disabled={pending} onClick={() => run(() => setListingStatus(id, "active"))} className={actionClass}>
            <Play className="size-4" aria-hidden />
            Resume
          </button>
        )}
        {(status === "active" || status === "paused") && (
          <button type="button" disabled={pending} onClick={() => run(() => setListingStatus(id, "taken"))} className={actionClass}>
            <CheckCircle2 className="size-4" aria-hidden />
            Mark as taken
          </button>
        )}
        {status === "taken" && (
          <button type="button" disabled={pending} onClick={() => run(() => setListingStatus(id, "active"))} className={actionClass}>
            <Play className="size-4" aria-hidden />
            Relist
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => confirmRef.current?.showModal()}
          className={`${actionClass} text-destructive hover:border-destructive/60`}
        >
          <Trash2 className="size-4" aria-hidden />
          Delete
        </button>
        {pending && <Loader2 className="size-4 animate-spin self-center text-muted-foreground" aria-label="Saving" />}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <dialog
        ref={confirmRef}
        aria-labelledby={`delete-title-${id}`}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-rule bg-sheet p-5 text-foreground backdrop:bg-foreground/30"
      >
        <h2 id={`delete-title-${id}`} className="text-lg font-semibold">
          Delete this listing?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          It and its photos are removed for good. To hide it for now, pause it instead.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => confirmRef.current?.close()}
            className="h-10 rounded-lg px-4 text-sm font-medium hover:bg-muted"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={() => {
              confirmRef.current?.close();
              run(() => deleteListing(id));
            }}
            className="h-10 rounded-lg bg-destructive px-4 text-sm font-semibold text-white"
          >
            Delete listing
          </button>
        </div>
      </dialog>
    </div>
  );
}
