"use client";

import type { ReactNode } from "react";
import { Select } from "@base-ui/react/select";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type BubbleOption = { value: string; label: string };

/** Shared look for the rounded panel under a pill: popovers and select menus use it. */
export const BUBBLE_PANEL =
  "rounded-2xl border border-rule bg-popover text-popover-foreground shadow-[0_16px_40px_-18px_oklch(0.25_0.02_60/0.45)] outline-none origin-(--transform-origin) transition-[opacity,transform] duration-150 ease-out data-[starting-style]:-translate-y-1 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 motion-reduce:transition-none";

/**
 * A pill that opens a rounded list directly under it, left edges aligned and
 * at least as wide as the pill. Built on Base UI Select, so arrow keys,
 * type-ahead, Escape, and screen readers work as they do on a native select.
 */
export function BubbleSelect({
  value,
  onChange,
  options,
  label,
  className,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  options: BubbleOption[];
  /** Accessible name for the control. */
  label: string;
  className?: string;
  /** What the pill shows. */
  children: ReactNode;
}) {
  return (
    <Select.Root value={value} onValueChange={(v) => v != null && onChange(String(v))} items={options}>
      <Select.Trigger aria-label={label} className={className}>
        {children}
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner side="bottom" align="start" sideOffset={8} alignItemWithTrigger={false} className="z-50 outline-none">
          <Select.Popup className={cn(BUBBLE_PANEL, "min-w-(--anchor-width) p-1.5")}>
            <Select.List className="max-h-[min(22rem,var(--available-height))] overflow-y-auto">
              {options.map((o) => (
                <Select.Item
                  key={o.value}
                  value={o.value}
                  className="flex h-10 cursor-pointer select-none items-center gap-6 rounded-xl px-3 text-sm font-medium outline-none transition-colors data-[highlighted]:bg-muted data-[selected]:text-accent-foreground"
                >
                  <Select.ItemText className="flex-1 whitespace-nowrap">{o.label}</Select.ItemText>
                  <Select.ItemIndicator className="text-brand">
                    <Check className="size-4" strokeWidth={2.5} aria-hidden />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
