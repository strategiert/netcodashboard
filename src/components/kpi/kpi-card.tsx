import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number; // % vs yesterday: positive = up, negative = down
  unit?: string;
  accentColor?: string;
  loading?: boolean;
}

export function KpiCard({ label, value, delta, unit, accentColor = "#3b82f6", loading }: KpiCardProps) {
  const deltaEl = delta !== undefined ? (
    <span className={cn("flex items-center gap-0.5 text-xs font-medium",
      delta > 0 ? "text-emerald-500" : delta < 0 ? "text-red-500" : "text-muted-foreground"
    )}>
      {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  ) : null;

  return (
    <div className="relative rounded-lg border bg-card p-3 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg" style={{ backgroundColor: accentColor }} />
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 pl-1">{label}</p>
      {loading ? (
        <div className="h-6 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <div className="flex items-end gap-2 pl-1">
          <span className="text-xl font-bold leading-none">
            {typeof value === "number" ? value.toLocaleString("de-DE") : value}
            {unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}
          </span>
          {deltaEl}
        </div>
      )}
    </div>
  );
}
