import {
  AirVent,
  CircleParking,
  Dumbbell,
  type LucideIcon,
  PawPrint,
  Sofa,
  Sparkles,
  Trees,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
  Zap,
} from "lucide-react";
import type { Amenity } from "@/lib/browse";

const ICONS: Record<string, LucideIcon> = {
  furnished: Sofa,
  laundry: WashingMachine,
  "utilities-included": Zap,
  ac: AirVent,
  parking: CircleParking,
  "pets-ok": PawPrint,
  wifi: Wifi,
  dishwasher: UtensilsCrossed,
  gym: Dumbbell,
  backyard: Trees,
};

export function AmenityList({ slugs, amenities }: { slugs: string[]; amenities: Amenity[] }) {
  if (slugs.length === 0) return <p className="text-sm text-muted-foreground">No amenities listed.</p>;
  const label = new Map(amenities.map((a) => [a.slug, a.label]));

  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {slugs.map((slug) => {
        const Icon = ICONS[slug] ?? Sparkles;
        return (
          <li key={slug} className="flex items-center gap-2.5 text-sm">
            <Icon className="size-4 text-accent-foreground" strokeWidth={1.75} aria-hidden />
            {label.get(slug) ?? slug}
          </li>
        );
      })}
    </ul>
  );
}
