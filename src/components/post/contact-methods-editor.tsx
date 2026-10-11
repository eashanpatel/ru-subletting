"use client";

import { Plus, X } from "lucide-react";
import { CONTACT_KINDS, type ContactKind } from "@/lib/listing-form";

type Row = { kind: ContactKind; value: string };

const ORDER: ContactKind[] = ["email", "phone", "whatsapp", "instagram", "snapchat", "other"];

/** Up to six ways to reach the lister, in the order they want people to try. */
export function ContactMethodsEditor({
  value,
  onChange,
  errors,
}: {
  value: Row[];
  onChange: (rows: Row[]) => void;
  errors?: (string | undefined)[];
}) {
  function update(i: number, patch: Partial<Row>) {
    onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  const unused = ORDER.filter((k) => k === "other" || !value.some((r) => r.kind === k));

  return (
    <div className="flex flex-col gap-3">
      {value.map((row, i) => {
        const meta = CONTACT_KINDS[row.kind];
        const error = errors?.[i];
        return (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <label className="sr-only" htmlFor={`contact-kind-${i}`}>
                Contact method {i + 1}
              </label>
              <select
                id={`contact-kind-${i}`}
                value={row.kind}
                onChange={(e) => update(i, { kind: e.target.value as ContactKind })}
                className="h-11 w-36 shrink-0 rounded-lg border border-input bg-sheet px-2 text-sm font-medium outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {ORDER.map((k) => (
                  <option key={k} value={k}>
                    {CONTACT_KINDS[k].label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor={`contact-value-${i}`}>
                {meta.label}
              </label>
              <input
                id={`contact-value-${i}`}
                value={row.value}
                inputMode={meta.inputMode}
                placeholder={meta.placeholder}
                autoComplete={row.kind === "email" ? "email" : row.kind === "phone" ? "tel" : "off"}
                onChange={(e) => update(i, { value: e.target.value })}
                aria-invalid={!!error}
                aria-describedby={error ? `contact-error-${i}` : undefined}
                className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-sheet px-3 text-base outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label={`Remove ${meta.label}`}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            {error && (
              <p id={`contact-error-${i}`} className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        );
      })}

      {value.length < 6 && (
        <button
          type="button"
          onClick={() => onChange([...value, { kind: unused[0] ?? "other", value: "" }])}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium hover:border-foreground/40"
        >
          <Plus className="size-4" aria-hidden />
          Add a way to reach you
        </button>
      )}
    </div>
  );
}
