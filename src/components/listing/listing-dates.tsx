"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange, Semester } from "@/lib/browse";
import { DateRangeFilter } from "@/components/browse/date-range-filter";
import { SemesterTimeline } from "./semester-timeline";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Reads ?from=&to= (set when arriving from browse with dates), validated. */
function rangeFromParams(params: URLSearchParams): DateRange | null {
  const start = params.get("from");
  const end = params.get("to");
  if (!start || !end || !ISO.test(start) || !ISO.test(end) || end <= start) return null;
  return { start, end };
}

/**
 * The host's dates against the visitor's. Dates come from the URL so they
 * carry over from browse and survive a refresh or a shared link.
 */
export function ListingDates({ start, end, semesters }: { start: string; end: string; semesters: Semester[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const range = rangeFromParams(params);

  function setRange(next: DateRange | null) {
    const q = new URLSearchParams(params);
    if (next) {
      q.set("from", next.start);
      q.set("to", next.end);
    } else {
      q.delete("from");
      q.delete("to");
    }
    const query = q.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <DateRangeFilter value={range} semesters={semesters} onChange={setRange} label="Your dates" />
        {!range && <span className="text-sm text-muted-foreground">Add your dates to see how they line up.</span>}
      </div>
      <SemesterTimeline start={start} end={end} semesters={semesters} range={range} />
    </div>
  );
}
