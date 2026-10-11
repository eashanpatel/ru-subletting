import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { chipClass } from "./filter-chip";

type Option = { value: string; label: string };

/**
 * A filter chip backed by a native <select>, so it works with keyboards and
 * opens the OS picker on phones. Tints olive when a value is set.
 */
export function FilterSelect({
  label,
  value,
  anyValue = "any",
  options,
  onChange,
}: {
  label: string;
  value: string;
  anyValue?: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const active = value !== anyValue;
  const current = options.find((o) => o.value === value)?.label;

  return (
    <label
      className={cn(
        chipClass(active),
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
      )}
    >
      <span className={active ? "" : "text-muted-foreground"}>{label}</span>
      <span className="font-medium">{current}</span>
      <ChevronDown className="size-4 opacity-60" aria-hidden />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
