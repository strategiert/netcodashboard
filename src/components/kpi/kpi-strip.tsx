"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { KpiCard } from "./kpi-card";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PERIODS = ["Heute", "MTD", "30T"] as const;
type Period = typeof PERIODS[number];

function calcDelta(today: number | undefined, yesterday: number | undefined): number | undefined {
  if (!today || !yesterday || yesterday === 0) return undefined;
  return ((today - yesterday) / yesterday) * 100;
}

interface KpiStripProps {
  brandId: Id<"brands">;
}

export function KpiStrip({ brandId }: KpiStripProps) {
  const [period, setPeriod] = useState<Period>("Heute");

  const todaySnaps  = useQuery(api.kpi.getTodayAllSources,     { brandId });
  const yestSnaps   = useQuery(api.kpi.getYesterdayAllSources, { brandId });

  const loading = todaySnaps === undefined;

  const today = (todaySnaps ?? []).reduce((acc, s) => ({ ...acc, ...s }), {} as any);
  const yest  = (yestSnaps  ?? []).reduce((acc, s) => ({ ...acc, ...s }), {} as any);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Live KPIs</p>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn("rounded px-2 py-0.5 text-xs font-medium transition-colors",
                period === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
              )}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="GSC Klicks"   value={today.clicks       ?? "—"} delta={calcDelta(today.clicks,       yest.clicks)}       accentColor="#22c55e" loading={loading} />
        <KpiCard label="Impressionen" value={today.impressions   ?? "—"} delta={calcDelta(today.impressions,  yest.impressions)}   accentColor="#3b82f6" loading={loading} />
        <KpiCard label="CTR"          value={today.ctr ? `${(today.ctr * 100).toFixed(1)}` : "—"} unit="%" delta={calcDelta(today.ctr, yest.ctr)} accentColor="#8b5cf6" loading={loading} />
        <KpiCard label="Social Reach" value={today.socialReach  ?? "—"} delta={calcDelta(today.socialReach,  yest.socialReach)}   accentColor="#f59e0b" loading={loading} />
        <KpiCard label="Anfragen"     value={today.leadsCount   ?? "—"}                                                           accentColor="#ff6600" loading={loading} />
      </div>
    </div>
  );
}
