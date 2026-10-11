"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type PickedAddress = { full: string; street: string | null; lat: number; lng: number };

type Suggestion = PickedAddress & { id: string; primary: string; secondary: string };

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
// New Brunswick, Piscataway, Highland Park, and nearby.
const BBOX = "-74.56,40.44,-74.34,40.57";
const PROXIMITY = "-74.4474,40.5008";

type GeocodeFeature = {
  id: string;
  properties: {
    name: string;
    place_formatted?: string;
    full_address?: string;
    coordinates: { latitude: number; longitude: number };
    context?: { street?: { name: string } };
  };
};

async function search(q: string, signal: AbortSignal): Promise<Suggestion[]> {
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.search = new URLSearchParams({
    q,
    access_token: TOKEN ?? "",
    types: "address",
    autocomplete: "true",
    limit: "5",
    country: "us",
    bbox: BBOX,
    proximity: PROXIMITY,
  }).toString();
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("search failed");
  const json = (await res.json()) as { features: GeocodeFeature[] };
  return json.features.map((f) => ({
    id: f.id,
    primary: f.properties.name,
    secondary: f.properties.place_formatted ?? "",
    full: f.properties.full_address ?? `${f.properties.name}, ${f.properties.place_formatted ?? ""}`,
    street: f.properties.context?.street?.name ?? null,
    lat: f.properties.coordinates.latitude,
    lng: f.properties.coordinates.longitude,
  }));
}

/**
 * Address combobox backed by Mapbox geocoding, limited to the New Brunswick
 * area. Only a picked suggestion counts; free text is never saved as a location.
 */
export function AddressSearch({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: PickedAddress | null;
  onChange: (v: PickedAddress | null) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState(value?.full ?? "");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  // The query the current results belong to, so "no matches" only shows after a real search.
  const [searched, setSearched] = useState("");
  const picked = useRef(value?.full ?? "");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || q === picked.current) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const found = await search(q, controller.signal);
        setResults(found);
        setSearched(q);
        setActive(0);
        setOpen(true);
        setStatus("idle");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("error");
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function choose(s: Suggestion) {
    picked.current = s.full;
    setQuery(s.full);
    setOpen(false);
    setResults([]);
    onChange({ full: s.full, street: s.street, lat: s.lat, lng: s.lng });
  }

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        id="address"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        autoComplete="off"
        placeholder="Start typing the street address"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onChange(null);
        }}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!open || results.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % results.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a - 1 + results.length) % results.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={cn(
          "h-11 w-full rounded-lg border border-input bg-sheet pl-9 pr-10 text-base outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive",
        )}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2">
        {status === "loading" ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
        ) : value ? (
          <Check className="size-4 text-accent-foreground" aria-label="Address confirmed" />
        ) : null}
      </span>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-rule bg-popover shadow-md"
        >
          {results.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("cursor-pointer px-3 py-2.5", i === active && "bg-muted")}
            >
              <span className="block text-sm font-medium">{s.primary}</span>
              <span className="block text-xs text-muted-foreground">{s.secondary}</span>
            </li>
          ))}
        </ul>
      )}
      {status === "error" && (
        <p className="mt-1.5 text-sm text-destructive">Address search isn&apos;t responding. Try again in a moment.</p>
      )}
      {!value && status === "idle" && results.length === 0 && searched !== "" && searched === query.trim() && (
        <p className="mt-1.5 text-sm text-muted-foreground">No matches near Rutgers yet. Keep typing the full street address.</p>
      )}
    </div>
  );
}
