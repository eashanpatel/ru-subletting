"use client";

import { useState } from "react";
import { differenceInCalendarDays, format, parseISO, startOfToday } from "date-fns";
import type { DateRange as DayRange } from "react-day-picker";
import { ChevronDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { type DateRange, type Semester, formatDateRange } from "@/lib/browse";
import { chipClass } from "./filter-chip";

const toISO = (d: Date) => format(d, "yyyy-MM-dd");

/** "When" filter: pick move-in and move-out on a calendar, or tap a semester. */
export function DateRangeFilter({
  value,
  semesters,
  onChange,
  label = "When",
}: {
  value: DateRange | null;
  semesters: Semester[];
  onChange: (value: DateRange | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={chipClass(!!value)}>
        <span className={value ? "" : "text-muted-foreground"}>{label}</span>
        <span className="font-medium">{value ? formatDateRange(value.start, value.end) : "Any dates"}</span>
        <ChevronDown className="size-4 opacity-60" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-auto max-w-[calc(100vw-2rem)] gap-0 p-0">
        {open && (
          <DateRangePanel
            initial={value}
            semesters={semesters}
            onApply={(v) => {
              onChange(v);
              setOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function DateRangePanel({
  initial,
  semesters,
  onApply,
}: {
  initial: DateRange | null;
  semesters: Semester[];
  onApply: (value: DateRange | null) => void;
}) {
  const wide = useMediaQuery("(min-width: 768px)");
  const [today] = useState(startOfToday);
  const [draft, setDraft] = useState<DayRange | undefined>(
    initial ? { from: parseISO(initial.start), to: parseISO(initial.end) } : undefined,
  );
  const [month, setMonth] = useState<Date>(draft?.from ?? today);

  const from = draft?.from;
  const to = draft?.to;
  const complete = !!from && !!to;
  const weeks = from && to ? Math.max(1, Math.round(differenceInCalendarDays(to, from) / 7)) : 0;
  const activeSemester =
    from && to ? semesters.find((s) => s.startsOn === toISO(from) && s.endsOn === toISO(to)) : undefined;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-2 border-b border-rule p-3">
        {semesters.map((s) => (
          <button
            key={s.slug}
            type="button"
            aria-pressed={activeSemester?.slug === s.slug}
            onClick={() => {
              const start = parseISO(s.startsOn);
              setDraft({ from: start, to: parseISO(s.endsOn) });
              setMonth(start);
            }}
            className={cn(
              "h-9 rounded-lg border px-3 text-sm font-medium transition-colors",
              activeSemester?.slug === s.slug
                ? "border-brand bg-brand-soft text-accent-foreground"
                : "border-input hover:border-foreground/40",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Calendar
        mode="range"
        selected={draft}
        onSelect={setDraft}
        month={month}
        onMonthChange={setMonth}
        numberOfMonths={wide ? 2 : 1}
        disabled={{ before: today }}
        className="p-3 [--cell-size:--spacing(10)]"
      />

      <div className="flex items-center gap-3 border-t border-rule p-3">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground" aria-live="polite">
          {from && to
            ? `${format(from, "MMM d")} to ${format(to, "MMM d")}, about ${weeks} ${weeks === 1 ? "week" : "weeks"}`
            : from
              ? "Now pick your move-out date"
              : "Pick your move-in date"}
        </p>
        <button
          type="button"
          onClick={() => onApply(null)}
          className="h-10 rounded-lg px-3 text-sm font-medium hover:bg-muted"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={!complete}
          onClick={() => from && to && onApply({ start: toISO(from), end: toISO(to) })}
          className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground active:scale-[0.98] disabled:opacity-50"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
