"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Minus, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type BrowseListing, type Campus, formatPrice } from "@/lib/browse";

export type Bounds = { west: number; south: number; east: number; north: number };

type Pin = { key: string; items: BrowseListing[]; lng: number; lat: number; el: HTMLButtonElement; marker: Marker };

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const CAMPUS_RADIUS_M = 650;

const PIN_BASE =
  "rounded-md border px-2 py-1 font-mono text-sm font-semibold leading-none shadow-sm transition-[background-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]";
const PIN_DEFAULT = "border-foreground/15 bg-sheet text-foreground hover:border-brand";
const PIN_SAVED = "border-brand bg-brand-soft text-accent-foreground";
const PIN_ACTIVE = "z-10 scale-110 border-brand bg-brand text-brand-foreground";
const PIN_TAKEN = "border-rule bg-muted text-muted-foreground line-through";
const CLUSTER_BASE =
  "flex size-14 flex-col items-center justify-center rounded-full border-2 border-brand leading-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]";

/** A circle polygon around a point, for campus zones. */
function circle(lng: number, lat: number, radiusM: number, steps = 64): [number, number][] {
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * 2 * Math.PI;
    return [lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)];
  });
}

export function MapView({
  listings,
  campuses,
  activeId,
  savedIds,
  areaActive,
  onPinHover,
  onPinClick,
  onSearchArea,
  onClearArea,
  className,
}: {
  listings: BrowseListing[];
  campuses: Campus[];
  activeId: string | null;
  savedIds: Set<string>;
  areaActive: boolean;
  onPinHover: (id: string | null) => void;
  onPinClick: (id: string) => void;
  onSearchArea: (bounds: Bounds) => void;
  onClearArea: () => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerCtor = useRef<typeof Marker | null>(null);
  const pinsRef = useRef<Pin[]>([]);
  const [ready, setReady] = useState(false);
  const [moved, setMoved] = useState(false);

  // Latest values for marker event handlers, without re-creating markers.
  const latest = useRef({ listings, activeId, savedIds, onPinHover, onPinClick });
  latest.current = { listings, activeId, savedIds, onPinHover, onPinClick };

  // Create the map once its container has a real size (it starts hidden
  // behind the list on phones), then keep it sized to the container.
  useEffect(() => {
    const container = containerRef.current;
    if (!TOKEN || !container) return;
    let cancelled = false;
    let starting = false;
    let map: MapboxMap | undefined;

    function start() {
      if (starting) return;
      starting = true;
      import("mapbox-gl").then(({ default: mapboxgl }) => {
        if (cancelled || !container) return;
        mapboxgl.accessToken = TOKEN!;
        markerCtor.current = mapboxgl.Marker;
        const center: [number, number] = campuses.length
          ? [
              campuses.reduce((s, c) => s + c.lng, 0) / campuses.length,
              campuses.reduce((s, c) => s + c.lat, 0) / campuses.length,
            ]
          : [-74.4474, 40.5008];
        map = new mapboxgl.Map({
          container,
          style: "mapbox://styles/mapbox/light-v11",
          center,
          zoom: 12.4,
          attributionControl: false,
        });
        map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
        mapRef.current = map;

        map.on("load", () => {
          map!.addSource("campuses", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: campuses.map((c) => ({
                type: "Feature",
                properties: { name: c.name },
                geometry: { type: "Polygon", coordinates: [circle(c.lng, c.lat, CAMPUS_RADIUS_M)] },
              })),
            },
          });
          map!.addLayer({
            id: "campus-fill",
            type: "fill",
            source: "campuses",
            paint: { "fill-color": "#6b7a3a", "fill-opacity": 0.07 },
          });
          map!.addLayer({
            id: "campus-outline",
            type: "line",
            source: "campuses",
            paint: { "line-color": "#6b7a3a", "line-opacity": 0.45, "line-width": 1.25, "line-dasharray": [2, 2] },
          });
          map!.addLayer({
            id: "campus-label",
            type: "symbol",
            source: "campuses",
            layout: {
              "text-field": ["get", "name"],
              "text-size": 12,
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
              "text-offset": [0, -3.6],
            },
            paint: { "text-color": "#4a5428", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
          });
          setReady(true);
        });

        map.on("moveend", (e) => {
          if ((e as { originalEvent?: unknown }).originalEvent) setMoved(true);
        });
      });
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;
      if (mapRef.current) mapRef.current.resize();
      else start();
    });
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      pinsRef.current.forEach((p) => p.marker.remove());
      pinsRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
    // campuses are stable reference data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re)build pins and clusters when listings change or the view settles.
  useEffect(() => {
    const map = mapRef.current;
    const MarkerCtor = markerCtor.current;
    if (!ready || !map || !MarkerCtor) return;
    const NewMarker: typeof Marker = MarkerCtor;

    function build() {
      pinsRef.current.forEach((p) => p.marker.remove());
      pinsRef.current = [];

      const groups: { items: BrowseListing[]; x: number; y: number }[] = [];
      for (const l of latest.current.listings) {
        if (l.lat == null || l.lng == null) continue;
        const { x, y } = map!.project([l.lng, l.lat]);
        const hit = groups.find((g) => Math.abs(g.x - x) < 64 && Math.abs(g.y - y) < 30);
        if (hit) hit.items.push(l);
        else groups.push({ items: [l], x, y });
      }

      for (const g of groups) {
        const lng = g.items.reduce((s, l) => s + l.lng!, 0) / g.items.length;
        const lat = g.items.reduce((s, l) => s + l.lat!, 0) / g.items.length;
        const el = document.createElement("button");
        el.type = "button";

        if (g.items.length > 1) {
          const open = g.items.filter((l) => l.status === "active");
          const pool = open.length ? open : g.items;
          const from = Math.min(...pool.map((l) => l.price));
          el.setAttribute("aria-label", `${pool.length} places here, from ${formatPrice(from)} per month. Zoom in`);
          el.innerHTML = `<span class="font-mono text-base font-semibold">${pool.length}</span><span class="mt-0.5 font-mono text-[10px] opacity-70">${formatPrice(from)}+</span>`;
          el.addEventListener("click", () => {
            const lngs = g.items.map((l) => l.lng!);
            const lats = g.items.map((l) => l.lat!);
            map!.fitBounds(
              [
                [Math.min(...lngs), Math.min(...lats)],
                [Math.max(...lngs), Math.max(...lats)],
              ],
              { padding: 120, maxZoom: 16.5, duration: 400 },
            );
          });
        } else {
          const l = g.items[0];
          el.textContent = formatPrice(l.price);
          el.setAttribute("aria-label", `${l.street ?? "Listing"}, ${formatPrice(l.price)} per month${l.status === "taken" ? ", taken" : ""}`);
          el.addEventListener("mouseenter", () => latest.current.onPinHover(l.id));
          el.addEventListener("mouseleave", () => latest.current.onPinHover(null));
          el.addEventListener("focus", () => latest.current.onPinHover(l.id));
          el.addEventListener("blur", () => latest.current.onPinHover(null));
          el.addEventListener("click", () => latest.current.onPinClick(l.id));
        }

        const marker = new NewMarker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(map!);
        pinsRef.current.push({ key: g.items.map((l) => l.id).join("-"), items: g.items, lng, lat, el, marker });
      }
      paint();
    }

    build();
    map.on("zoomend", build);
    return () => {
      map.off("zoomend", build);
    };
  }, [ready, listings]);

  // Restyle pins for hover, focus, and saved state without rebuilding them.
  function paint() {
    const { activeId: active, savedIds: saved } = latest.current;
    for (const p of pinsRef.current) {
      if (p.items.length > 1) {
        const on = p.items.some((l) => l.id === active);
        p.el.className = cn(CLUSTER_BASE, on ? "bg-brand text-brand-foreground" : "bg-sheet text-foreground hover:bg-brand-soft");
      } else {
        const l = p.items[0];
        p.el.className = cn(
          PIN_BASE,
          l.status === "taken" ? PIN_TAKEN : l.id === active ? PIN_ACTIVE : saved.has(l.id) ? PIN_SAVED : PIN_DEFAULT,
        );
      }
    }
  }
  useEffect(paint, [activeId, savedIds]);

  function searchHere() {
    const b = mapRef.current?.getBounds();
    if (!b) return;
    onSearchArea({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
    setMoved(false);
  }

  return (
    <div className={cn("relative isolate overflow-hidden bg-map-ground", className)} role="region" aria-label="Map of listings">
      {TOKEN ? (
        /* Sized directly: mapbox-gl.css forces position: relative on this element. */
        <div ref={containerRef} className="h-full w-full" />
      ) : (
        <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
          The map needs NEXT_PUBLIC_MAPBOX_TOKEN in .env.local.
        </p>
      )}

      <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-2">
        {moved && (
          <button
            type="button"
            onClick={searchHere}
            className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-rule bg-sheet px-3 text-sm font-medium shadow-sm transition-colors hover:border-foreground/40 active:scale-[0.98]"
          >
            <Search className="size-4" aria-hidden />
            Search this area
          </button>
        )}
        {areaActive && !moved && (
          <button
            type="button"
            onClick={onClearArea}
            className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-brand bg-brand-soft px-3 text-sm font-medium text-accent-foreground shadow-sm active:scale-[0.98]"
          >
            Showing this area only
            <X className="size-4" aria-label="Show all areas" />
          </button>
        )}
      </div>

      <div className="absolute bottom-20 right-3 flex flex-col overflow-hidden rounded-lg border border-rule bg-sheet shadow-sm lg:bottom-8">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => mapRef.current?.zoomIn()}
          className="inline-flex size-10 items-center justify-center hover:bg-muted"
        >
          <Plus className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => mapRef.current?.zoomOut()}
          className="inline-flex size-10 items-center justify-center border-t border-rule hover:bg-muted"
        >
          <Minus className="size-4" aria-hidden />
        </button>
      </div>

      <p className="absolute bottom-20 left-3 max-w-[60%] rounded-md bg-sheet/90 px-2 py-1 text-xs text-muted-foreground lg:bottom-8">
        Pins show approximate locations. Sign in to see exact addresses.
      </p>
    </div>
  );
}
