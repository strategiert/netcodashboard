"use client";

import type { Granularity } from "@/hooks/use-global-filters";

export function GranularityToggle({ value, onChange }: { value: Granularity; onChange: (g: Granularity) => void }) {
  const opts: { key: Granularity; label: string }[] = [
    { key: "daily",   label: "Täglich" },
    { key: "weekly",  label: "Wöchentlich" },
    { key: "monthly", label: "Monatlich" },
  ];
  return (
    <div className="inline-flex rounded-lg border bg-muted/30 p-0.5">
      {opts.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            value === o.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
