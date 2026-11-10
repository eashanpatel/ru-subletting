import { cn } from "@/lib/utils";

/** Shared look for filter pills; tints olive when a value is set. */
export function chipClass(active: boolean) {
  return cn(
    "group relative inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none data-[popup-open]:border-foreground/50",
    active ? "border-brand bg-brand-soft text-accent-foreground" : "border-input bg-sheet hover:border-foreground/40",
  );
}
