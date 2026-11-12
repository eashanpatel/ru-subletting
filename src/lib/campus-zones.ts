import type { Campus, CampusBoundary } from "@/lib/browse";

type Zones = {
  type: "FeatureCollection";
  features: { type: "Feature"; properties: { name: string }; geometry: CampusBoundary }[];
};

/** Radius of the fallback circle for a campus with no border drawn. */
const FALLBACK_RADIUS_M = 650;

/** A circle polygon around a point, in [lng, lat] pairs. */
export function circle(lng: number, lat: number, radiusM: number, steps = 64): [number, number][] {
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * 2 * Math.PI;
    return [lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)];
  });
}

/** Campus areas for the map: the drawn border when there is one, otherwise a circle. */
export function campusZones(campuses: Campus[]): Zones {
  return {
    type: "FeatureCollection",
    features: campuses.map((c) => ({
      type: "Feature",
      properties: { name: c.name },
      geometry: c.boundary ?? { type: "Polygon", coordinates: [circle(c.lng, c.lat, FALLBACK_RADIUS_M)] },
    })),
  };
}

/** Labels sit inside a drawn border; a fallback circle keeps its label above the circle. */
export function campusLabelOffset(campuses: Campus[]): [number, number] {
  return campuses.some((c) => c.boundary) ? [0, 0] : [0, -3.6];
}
