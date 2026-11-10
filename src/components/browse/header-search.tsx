"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type ReferenceData, formatDateRange } from "@/lib/browse";
import { useBrowseFilters } from "@/hooks/use-browse-filters";
import { DateRangePanel } from "./date-range-filter";
import { PricePanel, summary as priceSummary } from "./price-filter";

const SEGMENT =
  "flex min-w-0 flex-col items-start justify-center rounded-full px-4 py-1 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[popup-open]:bg-sheet data-[popup-open]:shadow-[0_4px_14px_-6px_oklch(0.25_0.02_60/0.4)]";
const PANEL = "gap-0 rounded-2xl p-0 shadow-[0_16px_40px_-18px_oklch(0.25_0.02_60/0.45)]";

function SegmentText({ label, value, set }: { label: string; value: string; set: boolean }) {
  return (
    <>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn("max-w-full truncate text-sm", set ? "font-semibold" : "text-muted-foreground")}>{value}</span>
    </>
  );
}

/**
 * The search pill: Near, When, and Budget in one rounded bar. It reads and
 * writes the same URL filters as the filter row, so both stay in sync.
 */
export function HeaderSearch({ reference, className }: { reference: ReferenceData; className?: string }) {
  const { campuses, semesters } = reference;
  const campusSlugs = useMemo(() => campuses.map((c) => c.slug), [campuses]);
  const { filters, update } = useBrowseFilters(campusSlugs);
  const [openWhen, setOpenWhen] = useState(false);
  const [openBudget, setOpenBudget] = useState(false);

  const campusOptions = [{ value: "any", label: "Any campus" }, ...campuses.map((c) => ({ value: c.slug, label: c.name }))];
  const campusName = campuses.find((c) => c.slug === filters.campus)?.name;
  const priceSet = filters.price.min != null || filters.price.max != null;

  return (
    <div
      role="search"
      aria-label="Search sublets"
      className={cn(
        "grid h-14 grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-stretch rounded-full border border-input bg-sheet p-1 shadow-[0_2px_10px_-4px_oklch(0.25_0.02_60/0.3)]",
        className,
      )}
    >
      <BubbleSelect
        label="Near campus"
        value={filters.campus}
        options={campusOptions}
        onChange={(campus) => update({ campus })}
        className={SEGMENT}
      >
        <SegmentText label="Near" value={campusName ?? "Any campus"} set={!!campusName} />
      </BubbleSelect>

      <span aria-hidden className="my-3 w-px bg-rule" />

      <Popover open={openWhen} onOpenChange={setOpenWhen}>
        <PopoverTrigger className={SEGMENT} aria-label="When">
          <SegmentText
            label="When"
            value={filters.dates ? formatDateRange(filters.dates.start, filters.dates.end) : "Any dates"}
            set={!!filters.dates}
          />
        </PopoverTrigger>
        <PopoverContent align="center" sideOffset={10} className={cn(PANEL, "w-auto max-w-[calc(100vw-2rem)]")}>
          {openWhen && (
            <DateRangePanel
              initial={filters.dates}
              semesters={semesters}
              onApply={(dates) => {
                update({ dates });
                setOpenWhen(false);
              }}
            />
          )}
        </PopoverContent>
      </Popover>

      <span aria-hidden className="my-3 w-px bg-rule" />

      <Popover open={openBudget} onOpenChange={setOpenBudget}>
        <PopoverTrigger className={SEGMENT} aria-label="Budget">
          <SegmentText label="Budget" value={priceSet ? priceSummary(filters.price) : "Any price"} set={priceSet} />
        </PopoverTrigger>
        <PopoverContent align="center" sideOffset={10} className={cn(PANEL, "w-80 max-w-[calc(100vw-2rem)]")}>
          {openBudget && (
            <PricePanel
              initial={filters.price}
              onApply={(price) => {
                update({ price });
                setOpenBudget(false);
              }}
            />
          )}
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        aria-label="Show results"
        className="ml-1 inline-flex aspect-square h-full items-center justify-center rounded-full bg-brand text-brand-foreground transition-[filter,transform] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
      >
        <Search className="size-[18px]" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
