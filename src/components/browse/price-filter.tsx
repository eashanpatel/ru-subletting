"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PRICE_SLIDER_MAX, PRICE_STEP, type PriceRange, formatPrice } from "@/lib/browse";
import { chipClass } from "./filter-chip";

function summary(v: PriceRange) {
  if (v.min != null && v.max != null) return `${formatPrice(v.min)} to ${formatPrice(v.max)}`;
  if (v.min != null) return `${formatPrice(v.min)}+`;
  if (v.max != null) return `Up to ${formatPrice(v.max)}`;
  return "Any";
}

const digits = (s: string) => s.replace(/[^0-9]/g, "");

/** Price filter: a two-handle slider plus min and max boxes for exact numbers. */
export function PriceFilter({ value, onChange }: { value: PriceRange; onChange: (value: PriceRange) => void }) {
  const [open, setOpen] = useState(false);
  const active = value.min != null || value.max != null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={chipClass(active)}>
        <span className={active ? "" : "text-muted-foreground"}>Price</span>
        <span className="font-medium">{summary(value)}</span>
        <ChevronDown className="size-4 opacity-60" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] gap-0 p-0">
        {open && (
          <PricePanel
            initial={value}
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

/**
 * Slider and boxes stay in sync. The slider tops out at PRICE_SLIDER_MAX,
 * where it means "no max"; the boxes accept any amount.
 */
function PricePanel({ initial, onApply }: { initial: PriceRange; onApply: (value: PriceRange) => void }) {
  const [minText, setMinText] = useState(initial.min != null ? String(initial.min) : "");
  const [maxText, setMaxText] = useState(initial.max != null ? String(initial.max) : "");

  const min = minText === "" ? 0 : Number(minText);
  const max = maxText === "" ? null : Number(maxText);
  const sliderValue: [number, number] = [
    Math.min(min, PRICE_SLIDER_MAX),
    max == null ? PRICE_SLIDER_MAX : Math.min(Math.max(max, 0), PRICE_SLIDER_MAX),
  ];
  const invalid = max != null && min > max;

  function fromSlider(v: number | readonly number[]) {
    if (!Array.isArray(v)) return;
    const [lo, hi] = v as number[];
    setMinText(lo > 0 ? String(lo) : "");
    setMaxText(hi >= PRICE_SLIDER_MAX ? "" : String(hi));
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-input bg-sheet pl-6 pr-3 font-mono text-base outline-none placeholder:font-sans placeholder:text-muted-foreground/80 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive";

  return (
    <div className="flex flex-col">
      <div className="p-4">
        <p className="text-sm font-medium">Monthly rent</p>
        <p className="mb-5 font-mono text-sm text-muted-foreground">
          {formatPrice(min)} to {max == null ? "no max" : formatPrice(max)}
        </p>
        <Slider
          min={0}
          max={PRICE_SLIDER_MAX}
          step={PRICE_STEP}
          minStepsBetweenValues={1}
          value={sliderValue}
          onValueChange={fromSlider}
          aria-label="Monthly rent range"
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="price-min" className="text-sm font-medium">
              Min
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">
                $
              </span>
              <input
                id="price-min"
                inputMode="numeric"
                placeholder="0"
                value={minText}
                onChange={(e) => setMinText(digits(e.target.value))}
                aria-invalid={invalid}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="price-max" className="text-sm font-medium">
              Max
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">
                $
              </span>
              <input
                id="price-max"
                inputMode="numeric"
                placeholder="No max"
                value={maxText}
                onChange={(e) => setMaxText(digits(e.target.value))}
                aria-invalid={invalid}
                aria-describedby={invalid ? "price-error" : undefined}
                className={inputClass}
              />
            </div>
          </div>
        </div>
        {invalid && (
          <p id="price-error" className="mt-2 text-sm text-destructive">
            Min has to be lower than max.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-rule p-3">
        <button
          type="button"
          onClick={() => onApply({ min: null, max: null })}
          className="h-10 rounded-lg px-3 text-sm font-medium hover:bg-muted"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={invalid}
          onClick={() => onApply({ min: min > 0 ? min : null, max })}
          className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground active:scale-[0.98] disabled:opacity-50"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
