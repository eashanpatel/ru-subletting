import { type Semester, formatShortDate } from "@/lib/browse";

const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/**
 * The listing's dates across the academic year, with each semester as a band.
 * The expanded form of the fit bar on browse cards.
 */
export function SemesterTimeline({ start, end, semesters }: { start: string; end: string; semesters: Semester[] }) {
  const starts = [start, ...semesters.map((s) => s.startsOn)].map(day);
  const ends = [end, ...semesters.map((s) => s.endsOn)].map(day);
  // Snap the window to whole months.
  const lo = new Date(Math.min(...starts));
  const hi = new Date(Math.max(...ends));
  const from = Date.UTC(lo.getUTCFullYear(), lo.getUTCMonth(), 1);
  const to = Date.UTC(hi.getUTCFullYear(), hi.getUTCMonth() + 1, 1);
  const pos = (t: number) => ((t - from) / (to - from)) * 100;

  const months: { label: string; left: number; year?: number }[] = [];
  for (let d = new Date(from); d.getTime() < to; d.setUTCMonth(d.getUTCMonth() + 1)) {
    months.push({
      label: MONTH_INITIALS[d.getUTCMonth()],
      left: pos(d.getTime()),
      year: d.getUTCMonth() === 0 ? d.getUTCFullYear() : undefined,
    });
  }

  const coverage = semesters
    .map((s) => {
      const overlap = Math.max(0, Math.min(day(end), day(s.endsOn)) - Math.max(day(start), day(s.startsOn)));
      return { label: s.label, pct: Math.round((overlap / (day(s.endsOn) - day(s.startsOn))) * 100) };
    })
    .filter((c) => c.pct > 0);

  return (
    <div>
      <div className="relative h-24" aria-hidden>
        {/* Semester bands */}
        {semesters.map((s) => (
          <div
            key={s.slug}
            className="absolute top-0 h-12 rounded-md border border-dashed border-foreground/20 bg-muted/60 px-2 pt-1.5"
            style={{ left: `${pos(day(s.startsOn))}%`, width: `${pos(day(s.endsOn)) - pos(day(s.startsOn))}%` }}
          >
            <span className="block truncate text-xs font-medium text-muted-foreground">{s.label}</span>
          </div>
        ))}
        {/* The listing */}
        <div
          className="absolute top-8 flex h-3 items-center"
          style={{ left: `${pos(day(start))}%`, width: `${Math.max(pos(day(end)) - pos(day(start)), 1)}%` }}
        >
          <span className="h-full w-full rounded-full bg-brand" />
        </div>
        <span
          className="absolute top-12 -translate-x-1/2 pt-1 font-mono text-[11px] whitespace-nowrap text-accent-foreground"
          style={{ left: `${pos(day(start))}%` }}
        >
          {formatShortDate(start)}
        </span>
        <span
          className="absolute top-12 -translate-x-1/2 pt-1 font-mono text-[11px] whitespace-nowrap text-accent-foreground"
          style={{ left: `${pos(day(end))}%` }}
        >
          {formatShortDate(end)}
        </span>
        {/* Month ticks */}
        <div className="absolute inset-x-0 bottom-0 h-5 border-t border-rule">
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
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {coverage.length === 0
          ? "Falls between semesters."
          : coverage.map((c, i) => (
              <span key={c.label}>
                {i > 0 && ", "}
                {c.pct >= 98 ? (
                  <>
                    covers <span className="font-medium text-accent-foreground">all of {c.label}</span>
                  </>
                ) : (
                  <>
                    covers <span className="font-mono text-foreground">{c.pct}%</span> of {c.label}
                  </>
                )}
              </span>
            ))}
      </p>
    </div>
  );
}
