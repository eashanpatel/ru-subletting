import { cn } from "@/lib/utils";
import type { Commute } from "@/lib/browse";

/**
 * Commute drawn as a plan dimension line under its label. Line length is
 * proportional to minutes (25 min fills the row), so a column of cards reads
 * as a distance comparison. Bus trips draw dashed.
 */
export function CommuteLine({ campusName, commute }: { campusName: string; commute: Commute }) {
  const width = Math.min(100, Math.max(6, (commute.minutes / 25) * 100));
  const label = `${commute.minutes} min ${commute.mode === "walk" ? "walk" : "by bus"}`;

  return (
    <div className="text-sm">
      <p className="mb-1.5 flex justify-between gap-2">
        <span className="font-mono text-[13px]">
          <span className="sr-only">About </span>
          {label}
          <span className="sr-only"> to {campusName}</span>
        </span>
        <span aria-hidden className="truncate font-medium text-muted-foreground">
          {campusName}
        </span>
      </p>
      <div className="flex h-3 items-center text-foreground" aria-hidden>
        <div className="flex h-full items-center" style={{ width: `${width}%` }}>
          <span className="h-full w-px shrink-0 bg-current" />
          <span className={cn("h-0 flex-1 border-t border-current", commute.mode === "bus" && "border-dashed")} />
          <span className="h-full w-px shrink-0 bg-current" />
        </div>
      </div>
    </div>
  );
}
