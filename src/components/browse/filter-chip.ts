import { cn } from "@/lib/utils";

/** Shared look for filter-row chips; outlines in ink when a value is set. */
export function chipClass(active: boolean) {
  return cn(
    "relative inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
    active
      ? "border-foreground bg-sheet shadow-[inset_0_0_0_1px_var(--foreground)]"
      : "border-rule bg-sheet hover:border-foreground/50",
  );
}
