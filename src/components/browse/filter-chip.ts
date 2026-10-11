import { cn } from "@/lib/utils";

/** Shared look for filter-row chips; tints olive when a value is set. */
export function chipClass(active: boolean) {
  return cn(
    "relative inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
    active ? "border-brand bg-brand-soft text-accent-foreground" : "border-input bg-sheet hover:border-foreground/40",
  );
}
