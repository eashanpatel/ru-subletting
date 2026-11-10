import { ChevronDown } from "lucide-react";
import { BubbleSelect, type BubbleOption } from "@/components/ui/bubble-select";
import { chipClass } from "./filter-chip";

/** A filter pill that opens a rounded list aligned under it. Tints olive when a value is set. */
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
  options: BubbleOption[];
  onChange: (value: string) => void;
}) {
  const active = value !== anyValue;
  const current = options.find((o) => o.value === value)?.label;

  return (
    <BubbleSelect label={label} value={value} options={options} onChange={onChange} className={chipClass(active)}>
      <span className={active ? "" : "text-muted-foreground"}>{label}</span>
      <span className="font-semibold">{current}</span>
      <ChevronDown className="size-4 opacity-60 transition-transform group-data-[popup-open]:rotate-180" aria-hidden />
    </BubbleSelect>
  );
}
