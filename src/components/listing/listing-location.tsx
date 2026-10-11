"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import type { Campus } from "@/lib/browse";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const APPROX_RADIUS_M = 220;

function circle(lng: number, lat: number, radiusM: number, steps = 64): [number, number][] {
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * 2 * Math.PI;
    return [lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)];
  });
}

/**
 * Where the place is. Everyone sees an approximate area; signed-in visitors
 * also get the exact address and a pin.
 */
export function ListingLocation({
  listingId,
  lat,
  lng,
  neighborhood,
  campuses,
}: {
  listingId: string;
  lat: number | null;
  lng: number | null;
  neighborhood: string | null;
  campuses: Campus[];
}) {
  const { userId, ready } = useSession();
  const exact = useQuery({
    queryKey: ["listing-location", listingId, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await createClient().rpc("get_listing_location", { p_listing_id: listingId });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const pinRef = useRef<Marker | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!TOKEN || !container || lat == null || lng == null) return;
    let cancelled = false;
    let map: MapboxMap | undefined;

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled) return;
      mapboxgl.accessToken = TOKEN;
      map = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/light-v11",
        center: [lng, lat],
        zoom: 14.2,
        attributionControl: false,
        cooperativeGestures: true,
      });
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        map!.addSource("campuses", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: campuses.map((c) => ({
              type: "Feature",
              properties: { name: c.name },
              geometry: { type: "Polygon", coordinates: [circle(c.lng, c.lat, 650)] },
            })),
          },
        });
        map!.addLayer({ id: "campus-fill", type: "fill", source: "campuses", paint: { "fill-color": "#6b7a3a", "fill-opacity": 0.06 } });
        map!.addLayer({
          id: "campus-outline",
          type: "line",
          source: "campuses",
          paint: { "line-color": "#6b7a3a", "line-opacity": 0.4, "line-width": 1.25, "line-dasharray": [2, 2] },
        });
        map!.addLayer({
          id: "campus-label",
          type: "symbol",
          source: "campuses",
          layout: { "text-field": ["get", "name"], "text-size": 12, "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"], "text-offset": [0, -3.6] },
          paint: { "text-color": "#4a5428", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
        });
        map!.addSource("approx", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [circle(lng, lat, APPROX_RADIUS_M)] } },
        });
        map!.addLayer({ id: "approx-fill", type: "fill", source: "approx", paint: { "fill-color": "#6b7a3a", "fill-opacity": 0.18 } });
        map!.addLayer({ id: "approx-line", type: "line", source: "approx", paint: { "line-color": "#5c6a2e", "line-width": 1.5 } });
      });
    });

    return () => {
      cancelled = true;
      pinRef.current?.remove();
      map?.remove();
      mapRef.current = null;
    };
    // campuses are stable reference data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // Exact pin for signed-in visitors.
  useEffect(() => {
    const map = mapRef.current;
    const point = exact.data;
    if (!map || !point) return;
    let cancelled = false;
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled) return;
      pinRef.current?.remove();
      pinRef.current = new mapboxgl.Marker({ color: "#5c6a2e" }).setLngLat([point.lng, point.lat]).addTo(map);
      map.easeTo({ center: [point.lng, point.lat], zoom: 15.2, duration: 400 });
    });
    return () => {
      cancelled = true;
    };
  }, [exact.data]);

  return (
    <div>
      <div className="mb-3 flex items-start gap-2 text-sm">
        <MapPin className="mt-0.5 size-4 shrink-0 text-accent-foreground" aria-hidden />
        {exact.data ? (
          <p>
            <span className="font-medium">{exact.data.address}</span>
            <span className="block text-muted-foreground">Exact address, shown because you&apos;re signed in.</span>
          </p>
        ) : (
          <p>
            <span className="font-medium">{neighborhood ?? "New Brunswick area"}</span>
            <span className="block text-muted-foreground">
              The shaded area shows roughly where it is.{" "}
              {ready && !userId && (
                <>
                  <Link href="/sign-in" className="font-medium text-brand underline-offset-4 hover:underline">
                    Sign in
                  </Link>{" "}
                  to see the exact address.
                </>
              )}
            </span>
          </p>
        )}
      </div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-rule bg-map-ground">
        {TOKEN && lat != null && lng != null ? (
          <div ref={containerRef} className="h-full w-full" />
        ) : (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">Map unavailable</p>
        )}
      </div>
    </div>
  );
}
