import { cn } from "@/lib/utils";
import { type DateRange, type Semester, formatDateRange, formatShortDate } from "@/lib/browse";

const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

function overlap(start: string, end: string, refStart: string, refEnd: string) {
  const s = Math.max(day(start), day(refStart));
  const e = Math.min(day(end), day(refEnd));
  return { start: s, end: e, ms: Math.max(0, e - s) };
}

/**
 * A listing's dates drawn against a reference span. With the visitor's dates
 * chosen, the reference is their dates: the covered part fills olive and
 * brick ticks mark their start and end. Otherwise the listing is drawn
 * against the semester it overlaps most.
 */
export function SemesterFitBar({
  start,
  end,
  semesters,
  range,
}: {
  start: string;
  end: string;
  semesters: Semester[];
  range: DateRange | null;
}) {
  let refStart: string;
  let refEnd: string;
  let refLabel: string;

  if (range) {
    refStart = range.start;
    refEnd = range.end;
    refLabel = "your dates";
  } else {
    if (semesters.length === 0) return null;
    const best = semesters.reduce((a, s) =>
      overlap(start, end, s.startsOn, s.endsOn).ms > overlap(start, end, a.startsOn, a.endsOn).ms ? s : a,
    );
    refStart = best.startsOn;
    refEnd = best.endsOn;
    refLabel = best.label;
  }

  const span = Math.max(1, day(refEnd) - day(refStart));
  const o = overlap(start, end, refStart, refEnd);
  const left = ((o.start - day(refStart)) / span) * 100;
  const width = (o.ms / span) * 100;
  const pct = Math.round(width);
  const full = pct >= 98;

  const label = !range
    ? `Mostly ${refLabel}`
    : full
      ? "Covers all your dates"
      : o.ms === 0
        ? "Doesn't overlap your dates"
        : `Covers ${formatDateRange(iso(o.start), iso(o.end))}, ${pct}% of your dates`;

  return (
    <div className="text-sm">
      <p className={cn("mb-1.5", range && full ? "font-medium text-accent-foreground" : "text-muted-foreground")}>
        {label}
      </p>
      <div className="relative h-1.5 rounded-full bg-muted" aria-hidden>
        {o.ms > 0 && (
          <div
            className={cn("absolute inset-y-0 rounded-full", range ? "bg-brand" : "bg-foreground/35")}
            style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
          />
        )}
        {range && (
          <>
            <span className="absolute -top-0.5 left-0 h-2.5 w-0.5 rounded-full bg-signal" />
            <span className="absolute -top-0.5 right-0 h-2.5 w-0.5 rounded-full bg-signal" />
          </>
        )}
      </div>
      {range && (
        <div className="mt-1 flex justify-between font-mono text-[11px] text-muted-foreground" aria-hidden>
          <span>{formatShortDate(refStart)}</span>
          <span>{formatShortDate(refEnd)}</span>
        </div>
      )}
    </div>
  );
}
