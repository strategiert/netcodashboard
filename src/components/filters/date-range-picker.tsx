"use client";

import { useState, useRef, useEffect } from "react";

function today() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
}
function startOfYear(y: number) { return `${y}-01-01`; }
function endOfYear(y: number)   { return `${y}-12-31`; }

const PRESETS: { label: string; from: () => string; to: () => string }[] = [
  { label: "Letzte 7 Tage",   from: () => daysAgo(7),  to: today },
  { label: "Letzte 14 Tage",  from: () => daysAgo(14), to: today },
  { label: "Letzte 30 Tage",  from: () => daysAgo(30), to: today },
  { label: "Letzte 90 Tage",  from: () => daysAgo(90), to: today },
  { label: "Dieses Jahr",     from: () => startOfYear(new Date().getFullYear()), to: today },
  { label: "2025",            from: () => startOfYear(2025), to: () => endOfYear(2025) },
  { label: "2024",            from: () => startOfYear(2024), to: () => endOfYear(2024) },
  { label: "2023",            from: () => startOfYear(2023), to: () => endOfYear(2023) },
  { label: "Gesamte Zeit",    from: () => "2013-01-01", to: today },
];

function formatDateLabel(from: string, to: string) {
  const fmt = (s: string) => new Date(s).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(from)} – ${fmt(to)}`;
}

function matchPreset(from: string, to: string): string | null {
  for (const p of PRESETS) {
    if (p.from() === from && p.to() === to) return p.label;
  }
  return null;
}

export function DateRangePicker({ from, to, onChange }: {
  from: string; to: string;
  onChange: (f: string, t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo,   setCustomTo]   = useState(to);
  const activePreset = matchPreset(from, to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setCustomFrom(from); setCustomTo(to); }, [from, to]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function applyPreset(p: typeof PRESETS[0]) {
    const f = p.from(), t = p.to();
    setCustomFrom(f); setCustomTo(t);
    onChange(f, t);
    setOpen(false);
  }

  function applyCustom() {
    if (customFrom && customTo && customFrom <= customTo) {
      onChange(customFrom, customTo);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm hover:bg-muted/50 transition-colors"
      >
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="font-medium">{activePreset ?? formatDateLabel(from, to)}</span>
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 flex rounded-xl border bg-popover shadow-xl overflow-hidden min-w-[480px]">
          <div className="w-48 border-r bg-muted/30 p-2 flex flex-col gap-0.5">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                  activePreset === p.label
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Benutzerdefiniert</p>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Startdatum</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <span className="text-muted-foreground mt-4">—</span>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Enddatum</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={applyCustom}
                className="flex-1 rounded-md bg-primary text-primary-foreground text-sm py-1.5 font-medium hover:bg-primary/90 transition-colors"
              >
                Anwenden
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md border text-sm py-1.5 hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
