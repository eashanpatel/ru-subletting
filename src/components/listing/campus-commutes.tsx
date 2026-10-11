import { cn } from "@/lib/utils";
import type { CampusCommute } from "@/lib/listing";

/** Every campus, nearest first, each with a commute ruler on one shared scale. */
export function CampusCommutes({ campuses }: { campuses: CampusCommute[] }) {
  if (campuses.length === 0) return <p className="text-sm text-muted-foreground">Location not set yet.</p>;
  const scale = Math.max(25, ...campuses.map((c) => c.commute.minutes));

  return (
    <ul className="flex flex-col gap-4">
      {campuses.map((c, i) => {
        const label = `${c.commute.minutes} min ${c.commute.mode === "walk" ? "walk" : "by bus"}`;
        return (
          <li key={c.slug} className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[10rem_minmax(0,1fr)_7rem]">
            <span className={cn("text-sm", i === 0 ? "font-semibold" : "text-muted-foreground")}>{c.name}</span>
            <div className="flex h-3 items-center text-foreground" aria-hidden>
              <div className="flex h-full items-center" style={{ width: `${Math.max(4, (c.commute.minutes / scale) * 100)}%` }}>
                <span className="h-full w-px shrink-0 bg-current" />
                <span className={cn("h-0 flex-1 border-t border-current", c.commute.mode === "bus" && "border-dashed")} />
                <span className="h-full w-px shrink-0 bg-current" />
              </div>
            </div>
            <span className="col-start-2 font-mono text-[13px] sm:col-start-3 sm:text-right">
              {label}
              <span className="sr-only"> to {c.name}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
