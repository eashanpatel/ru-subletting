import { type DateRange, type Semester, formatDateRange, formatShortDate } from "@/lib/browse";

const DAY = 86_400_000;
const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/**
 * The listing's dates (olive) across the academic year, with each semester as
 * a band. When the visitor has dates, they get their own lane (brick) and the
 * overlap is shaded across both lanes.
 */
export function SemesterTimeline({
  start,
  end,
  semesters,
  range,
}: {
  start: string;
  end: string;
  semesters: Semester[];
  range?: DateRange | null;
}) {
  const starts = [start, ...semesters.map((s) => s.startsOn), ...(range ? [range.start] : [])].map(day);
  const ends = [end, ...semesters.map((s) => s.endsOn), ...(range ? [range.end] : [])].map(day);
  // Snap the window to whole months.
  const lo = new Date(Math.min(...starts));
  const hi = new Date(Math.max(...ends));
  const from = Date.UTC(lo.getUTCFullYear(), lo.getUTCMonth(), 1);
  const to = Date.UTC(hi.getUTCFullYear(), hi.getUTCMonth() + 1, 1);
  const pos = (t: number) => ((t - from) / (to - from)) * 100;
  const span = (a: number, b: number) => ({ left: `${pos(a)}%`, width: `${Math.max(pos(b) - pos(a), 0.6)}%` });

  const months: { label: string; left: number; year?: number }[] = [];
  for (let d = new Date(from); d.getTime() < to; d.setUTCMonth(d.getUTCMonth() + 1)) {
    months.push({
      label: MONTH_INITIALS[d.getUTCMonth()],
      left: pos(d.getTime()),
      year: d.getUTCMonth() === 0 ? d.getUTCFullYear() : undefined,
    });
  }

  const overlap = range
    ? { start: Math.max(day(start), day(range.start)), end: Math.min(day(end), day(range.end)) }
    : null;
  const hasOverlap = !!overlap && overlap.end > overlap.start;

  const coverage = semesters
    .map((s) => {
      const o = Math.max(0, Math.min(day(end), day(s.endsOn)) - Math.max(day(start), day(s.startsOn)));
      return { label: s.label, pct: Math.round((o / (day(s.endsOn) - day(s.startsOn))) * 100) };
    })
    .filter((c) => c.pct > 0);

  // Lane geometry (px from the top of the chart).
  const BAND_H = range ? 92 : 56;
  const HOST_Y = 30;
  const YOU_Y = 62;

  return (
    <div>
      <div className="relative" style={{ height: BAND_H + 52 }} aria-hidden>
        {/* Semester bands */}
        {semesters.map((s) => (
          <div
            key={s.slug}
            className="absolute top-0 rounded-md border border-dashed border-foreground/20 bg-muted/60 px-2 pt-1.5"
            style={{ ...span(day(s.startsOn), day(s.endsOn)), height: BAND_H }}
          >
            <span className="block truncate text-xs font-medium text-muted-foreground">{s.label}</span>
          </div>
        ))}

        {/* Overlap, shaded across both lanes */}
        {hasOverlap && (
          <div
            className="absolute rounded-sm bg-brand/15 outline outline-1 outline-brand/40"
            style={{ ...span(overlap.start, overlap.end), top: HOST_Y - 6, height: YOU_Y - HOST_Y + 24 }}
          />
        )}

        {/* Host's dates */}
        <div className="absolute h-3 rounded-full bg-brand" style={{ ...span(day(start), day(end)), top: HOST_Y }} />
        {/* Visitor's dates */}
        {range && (
          <div className="absolute h-3 rounded-full bg-signal" style={{ ...span(day(range.start), day(range.end)), top: YOU_Y }} />
        )}

        {/* Month ticks */}
        <div className="absolute inset-x-0 h-5 border-t border-rule" style={{ top: BAND_H + 26 }}>
          {months.map((m, i) => (
            <span
              key={i}
              className="absolute top-1 font-mono text-[10px] text-muted-foreground"
              style={{ left: `calc(${m.left}% + 2px)` }}
            >
              {m.label}
              {m.year && <span className="ml-0.5 opacity-70">{String(m.year).slice(2)}</span>}
            </span>
          ))}
        </div>
        <span
          className="absolute -translate-x-1/2 font-mono text-[11px] whitespace-nowrap text-accent-foreground"
          style={{ left: `${pos(day(start))}%`, top: BAND_H + 6 }}
        >
          {formatShortDate(start)}
        </span>
        <span
          className="absolute -translate-x-1/2 font-mono text-[11px] whitespace-nowrap text-accent-foreground"
          style={{ left: `${pos(day(end))}%`, top: BAND_H + 6 }}
        >
          {formatShortDate(end)}
        </span>
      </div>

      {/* Legend */}
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-6 rounded-full bg-brand" aria-hidden />
          Available {formatDateRange(start, end)}
        </li>
        {range && (
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-6 rounded-full bg-signal" aria-hidden />
            Your dates {formatDateRange(range.start, range.end)}
          </li>
        )}
      </ul>

      <p className="mt-3 text-sm">
        {range ? (
          hasOverlap ? (
            <OverlapSummary range={range} overlapStart={overlap.start} overlapEnd={overlap.end} />
          ) : (
            <span className="text-muted-foreground">No overlap with your dates.</span>
          )
        ) : coverage.length === 0 ? (
          <span className="text-muted-foreground">Falls between semesters.</span>
        ) : (
          <span className="text-muted-foreground">
            {coverage.map((c, i) => (
              <span key={c.label}>
                {i > 0 ? ", " : "Covers "}
                {c.pct >= 98 ? (
                  <span className="font-medium text-accent-foreground">all of {c.label}</span>
                ) : (
                  <>
                    <span className="font-mono text-foreground">{c.pct}%</span> of {c.label}
                  </>
                )}
              </span>
            ))}
          </span>
        )}
      </p>
    </div>
  );
}

function OverlapSummary({ range, overlapStart, overlapEnd }: { range: DateRange; overlapStart: number; overlapEnd: number }) {
  const yourDays = Math.max(1, Math.round((day(range.end) - day(range.start)) / DAY));
  const overlapDays = Math.round((overlapEnd - overlapStart) / DAY);
  const pct = Math.min(100, Math.round((overlapDays / yourDays) * 100));
  if (pct >= 98) {
    return <span className="font-medium text-accent-foreground">Available for all of your dates.</span>;
  }
  return (
    <span className="text-muted-foreground">
      Available <span className="font-mono text-foreground">{formatDateRange(iso(overlapStart), iso(overlapEnd))}</span>,{" "}
      <span className="font-mono text-foreground">{overlapDays}</span> of your {yourDays} days (
      <span className="font-mono text-foreground">{pct}%</span>).
    </span>
  );
}
