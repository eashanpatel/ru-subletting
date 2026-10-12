"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type BrowseListing,
  type ReferenceData,
  distanceM,
  estimateCommute,
  formatDateRange,
  photoUrl,
} from "@/lib/browse";
import {
  ADDRESS_VISIBILITY,
  type ListingFormValues,
  NEIGHBORHOODS,
  ROOM_TYPES,
  listingSchema,
  listingTitle,
  unitLabel,
} from "@/lib/listing-form";
import { saveListing } from "@/app/listings/actions";
import { DateRangeFilter } from "@/components/browse/date-range-filter";
import { ListingCard } from "@/components/browse/listing-card";
import { AddressSearch } from "./address-search";
import { ContactMethodsEditor } from "./contact-methods-editor";
import { PhotoUploader } from "./photo-uploader";

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-sheet px-3 text-base outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive";

export function ListingForm({
  reference,
  userId,
  initial,
  mode,
}: {
  reference: ReferenceData;
  userId: string;
  initial: ListingFormValues;
  mode: "new" | "edit";
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Which button is saving. Cleared on any failure; on success the page navigates away.
  const [pendingIntent, setPendingIntent] = useState<ListingFormValues["intent"] | null>(null);
  const saving = pendingIntent != null;
  const [serverError, setServerError] = useState<string | null>(null);
  const [now] = useState(() => new Date().toISOString());

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ListingFormValues>({ resolver: zodResolver(listingSchema), defaultValues: initial, mode: "onTouched" });

  const v = useWatch({ control }) as ListingFormValues;
  const [otherHood, setOtherHood] = useState(
    initial.neighborhood !== "" && !NEIGHBORHOODS.includes(initial.neighborhood),
  );

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isDirty || saving) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, saving]);

  const preview = useMemo<BrowseListing>(() => {
    let nearest: { name: string; d: number } | null = null;
    if (v.address) {
      for (const c of reference.campuses) {
        const d = distanceM(v.address.lat, v.address.lng, c.lat, c.lng);
        if (!nearest || d < nearest.d) nearest = { name: c.name, d };
      }
    }
    const unit = unitLabel(v.roomType, v.homeType, v.bedrooms ?? null);
    return {
      id: initial.id,
      title: listingTitle(v.roomType, unit),
      roomType: v.roomType,
      unitLabel: unit || null,
      street: v.address?.street ?? null,
      neighborhood: v.neighborhood || null,
      price: Number.isFinite(v.price) && v.price > 0 ? v.price : 0,
      start: v.dates?.start ?? now.slice(0, 10),
      end: v.dates?.end ?? now.slice(0, 10),
      status: "active",
      createdAt: now,
      lat: v.address?.lat ?? null,
      lng: v.address?.lng ?? null,
      campusName: nearest?.name ?? null,
      commute: nearest ? estimateCommute(nearest.d) : null,
      photoUrl: photoUrl(v.photos?.[0] ?? null),
      photoCount: v.photos?.length ?? 0,
      amenities: (v.amenities ?? []).map((s) => reference.amenities.find((a) => a.slug === s)?.label ?? s),
    };
  }, [v, reference, initial.id, now]);

  const checklist = [
    { label: "Photos", done: (v.photos?.length ?? 0) > 0 },
    { label: "Dates", done: !!v.dates },
    { label: "Rent", done: Number.isFinite(v.price) && v.price >= 50 },
    { label: "Address", done: !!v.address },
    { label: "Way to reach you", done: (v.contacts ?? []).some((c) => c.value) },
  ];

  function submit(intent: ListingFormValues["intent"]) {
    if (saving) return;
    setServerError(null);
    setValue("intent", intent);
    setPendingIntent(intent);
    handleSubmit(
      async (values) => {
        let result: Awaited<ReturnType<typeof saveListing>>;
        try {
          result = await saveListing(values);
        } catch {
          setServerError("We couldn't reach the server. Check your connection and try again.");
          setPendingIntent(null);
          return;
        }
        if (!result.ok) {
          setServerError(result.error);
          setPendingIntent(null);
          return;
        }
        // My listings and the edit form read through React Query; drop their cached copies.
        // The listing page itself was refreshed by the server action (updateTag).
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["listings"] }),
          queryClient.removeQueries({ queryKey: ["listing-edit", result.id] }),
        ]);
        router.push(result.status === "active" ? `/listings/${result.id}` : "/my-listings");
      },
      () => {
        setPendingIntent(null);
        requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      },
    )();
  }

  const busy = saving;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit("publish");
      }}
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div className="min-w-0">
        <Section title="What are you subletting?">
          <Controller
            control={control}
            name="roomType"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Type of place" className="grid gap-2 sm:grid-cols-2">
                {ROOM_TYPES.map((t) => {
                  const on = field.value === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => field.onChange(t.value)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        on ? "border-brand bg-brand-soft" : "border-input bg-sheet hover:border-foreground/40",
                      )}
                    >
                      <span className={cn("block font-medium", on && "text-accent-foreground")}>{t.label}</span>
                      <span className="block text-sm text-muted-foreground">{t.hint}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field label="Building" htmlFor="homeType">
              <select id="homeType" className={inputClass} {...register("homeType")}>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
              </select>
            </Field>
            {v.roomType !== "studio" && (
              <Field label="Bedrooms in the place" htmlFor="bedrooms" error={errors.bedrooms?.message}>
                <select
                  id="bedrooms"
                  className={inputClass}
                  aria-invalid={!!errors.bedrooms}
                  {...register("bedrooms", { setValueAs: (x) => (x === "" ? null : Number(x)) })}
                >
                  <option value="">Choose</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Bathrooms" htmlFor="bathrooms" error={errors.bathrooms?.message}>
              <select
                id="bathrooms"
                className={inputClass}
                aria-invalid={!!errors.bathrooms}
                {...register("bathrooms", { setValueAs: (x) => (x === "" ? null : Number(x)) })}
              >
                <option value="">Choose</option>
                {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="When is it available?">
          <Controller
            control={control}
            name="dates"
            render={({ field }) => (
              <div className="flex flex-wrap items-center gap-3">
                <DateRangeFilter value={field.value} semesters={reference.semesters} onChange={field.onChange} label="Available" />
                {field.value && (
                  <span className="font-mono text-sm text-muted-foreground">
                    {formatDateRange(field.value.start, field.value.end)}
                  </span>
                )}
              </div>
            )}
          />
          {errors.dates && <p className="mt-2 text-sm text-destructive">{errors.dates.message}</p>}
          <p className="mt-2 text-sm text-muted-foreground">
            Pick move-in and move-out, or tap a semester. Renters see how your dates line up with theirs.
          </p>
        </Section>

        <Section title="Monthly rent">
          <div className="max-w-56">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">$</span>
              <input
                id="price"
                inputMode="numeric"
                aria-label="Monthly rent in dollars"
                aria-invalid={!!errors.price}
                aria-describedby="price-help"
                className={cn(inputClass, "pl-7 font-mono")}
                {...register("price", { setValueAs: (x) => (x === "" ? Number.NaN : Number(String(x).replace(/[^0-9]/g, ""))) })}
              />
            </div>
          </div>
          {errors.price && <p className="mt-2 text-sm text-destructive">{errors.price.message}</p>}
          <p id="price-help" className="mt-2 text-sm text-muted-foreground">
            What the renter pays you each month. Mention utilities in the description if they&apos;re extra.
          </p>
        </Section>

        <Section title="Where is it?">
          <Field label="Street address" htmlFor="address" error={errors.address?.message}>
            <Controller
              control={control}
              name="address"
              render={({ field }) => (
                <AddressSearch
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors.address}
                  describedBy="address-help"
                />
              )}
            />
          </Field>
          <p id="address-help" className="mt-2 text-sm text-muted-foreground">
            {v.address?.street
              ? `The street (${v.address.street}) and an area about two blocks wide are always shown. You choose who sees the exact address.`
              : "The street name and an area about two blocks wide are always shown. You choose who sees the exact address."}
          </p>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-medium">Who can see the exact address?</legend>
            <Controller
              control={control}
              name="addressVisibility"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  {ADDRESS_VISIBILITY.map((o) => {
                    const on = field.value === o.value;
                    return (
                      <label
                        key={o.value}
                        className={cn(
                          "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
                          on ? "border-brand bg-brand-soft" : "border-input bg-sheet hover:border-foreground/40",
                        )}
                      >
                        <input
                          type="radio"
                          name="addressVisibility"
                          value={o.value}
                          checked={on}
                          onChange={() => field.onChange(o.value)}
                          className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
                        />
                        <span>
                          <span className={cn("block text-sm font-medium", on && "text-accent-foreground")}>{o.label}</span>
                          <span className="block text-sm text-muted-foreground">{o.hint}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </fieldset>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Neighborhood" htmlFor="neighborhood-select" error={errors.neighborhood?.message}>
              <select
                id="neighborhood-select"
                className={inputClass}
                aria-invalid={!!errors.neighborhood}
                value={otherHood ? "__other" : v.neighborhood}
                onChange={(e) => {
                  const other = e.target.value === "__other";
                  setOtherHood(other);
                  setValue("neighborhood", other ? "" : e.target.value, { shouldDirty: true, shouldValidate: true });
                }}
              >
                <option value="">Choose</option>
                {NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                <option value="__other">Somewhere else</option>
              </select>
            </Field>
            {otherHood && (
              <Field label="Neighborhood name" htmlFor="neighborhood">
                <input id="neighborhood" className={inputClass} maxLength={60} {...register("neighborhood")} />
              </Field>
            )}
          </div>
        </Section>

        <Section title="Photos">
          <Controller
            control={control}
            name="photos"
            render={({ field }) => (
              <PhotoUploader
                userId={userId}
                listingId={initial.id}
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.photos}
              />
            )}
          />
          {errors.photos && <p className="mt-2 text-sm text-destructive">{errors.photos.message}</p>}
        </Section>

        <Section title="What's included">
          <Controller
            control={control}
            name="amenities"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {reference.amenities.map((a) => {
                  const on = field.value.includes(a.slug);
                  return (
                    <label
                      key={a.slug}
                      className={cn(
                        "flex h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                        on ? "border-brand bg-brand-soft text-accent-foreground" : "border-input bg-sheet hover:border-foreground/40",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => field.onChange(on ? field.value.filter((x) => x !== a.slug) : [...field.value, a.slug])}
                        className="size-4 accent-[var(--brand)]"
                      />
                      {a.label}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </Section>

        <Section title="Describe the place">
          <label htmlFor="description" className="sr-only">
            Description
          </label>
          <textarea
            id="description"
            rows={6}
            maxLength={2000}
            aria-invalid={!!errors.description}
            placeholder="Roommates, what's nearby, utilities, parking, lease details, anything a renter would ask."
            className="w-full rounded-lg border border-input bg-sheet px-3 py-2.5 text-base leading-relaxed outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
            {...register("description")}
          />
          <p className="mt-1 text-right font-mono text-xs text-muted-foreground">{(v.description ?? "").length} / 2000</p>
        </Section>

        <Section title="How should people reach you?">
          <Controller
            control={control}
            name="contacts"
            render={({ field }) => (
              <ContactMethodsEditor
                value={field.value}
                onChange={field.onChange}
                errors={(errors.contacts as unknown as { value?: { message?: string } }[] | undefined)?.map?.(
                  (e) => e?.value?.message,
                )}
              />
            )}
          />
          {errors.contacts?.message && <p className="mt-2 text-sm text-destructive">{errors.contacts.message}</p>}
          <p className="mt-2 text-sm text-muted-foreground">
            Only signed-in people can see these. Put the one you check most first.
          </p>
        </Section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-sm font-medium text-muted-foreground">How it shows up in browse</p>
        <div inert>
          <ListingCard listing={preview} semesters={reference.semesters} range={null} saved={false} />
        </div>

        <ul className="mt-5 flex flex-col gap-1.5 text-sm" aria-label="Needed to publish">
          {checklist.map((c) => (
            <li key={c.label} className={cn("flex items-center gap-2", c.done ? "text-foreground" : "text-muted-foreground")}>
              {c.done ? (
                <Check className="size-4 text-accent-foreground" aria-hidden />
              ) : (
                <Circle className="size-4" aria-hidden />
              )}
              {c.label}
              <span className="sr-only">{c.done ? " done" : " still needed"}</span>
            </li>
          ))}
        </ul>

        {serverError && (
          <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-rule bg-sheet/95 px-4 py-3 backdrop-blur-sm lg:static lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0">
          <button
            type="button"
            disabled={busy}
            onClick={() => submit("draft")}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-input bg-sheet text-sm font-semibold hover:border-foreground/40 disabled:opacity-60"
          >
            {pendingIntent === "draft" && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Save draft
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-brand-foreground hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {pendingIntent === "publish" && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {mode === "edit" ? "Save and publish" : "Publish"}
          </button>
        </div>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-rule py-7 first:border-t-0 first:pt-0">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
