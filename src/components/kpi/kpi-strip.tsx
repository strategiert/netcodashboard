"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { KpiCard } from "./kpi-card";

function calcDelta(today: number | undefined, yesterday: number | undefined): number | undefined {
  if (!today || !yesterday || yesterday === 0) return undefined;
  return ((today - yesterday) / yesterday) * 100;
}

function eur(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

interface KpiStripProps {
  brandId: Id<"brands">;
}

export function KpiStrip({ brandId }: KpiStripProps) {
  const now = new Date();
  const monthStart = `${now.toISOString().slice(0, 7)}-01`;
  const today = now.toISOString().slice(0, 10);
  const monthPrefix = now.toISOString().slice(0, 7);

  const todaySnaps = useQuery(api.kpi.getTodayAllSources, { brandId });
  const yestSnaps  = useQuery(api.kpi.getYesterdayAllSources, { brandId });
  const gsc30      = useQuery(api.kpi.getSnapshotsRange, { brandId, source: "gsc", days: 30 });
  const ads30      = useQuery(api.kpi.getSnapshotsRange, { brandId, source: "ads", days: 30 });
  const crmStats   = useQuery(api.reports.getCrmLeadsStats, { brandId, from: monthStart, to: today });

  const loading = todaySnaps === undefined;

  const t = (todaySnaps ?? []).reduce((acc, s) => ({ ...acc, ...s }), {} as any);
  const y = (yestSnaps  ?? []).reduce((acc, s) => ({ ...acc, ...s }), {} as any);

  const seoMTD   = (gsc30 ?? []).filter(s => s.date.startsWith(monthPrefix)).reduce((sum, s) => sum + (s.clicks ?? 0), 0);
  const adsMTD   = (ads30 ?? []).filter(s => s.date.startsWith(monthPrefix)).reduce((sum, s) => sum + (s.adClicks ?? 0), 0);
  const spendMTD = (ads30 ?? []).filter(s => s.date.startsWith(monthPrefix)).reduce((sum, s) => sum + (s.adSpend ?? 0), 0);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        KPIs {now.toLocaleString("de-DE", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="SEO Klicks MTD" value={seoMTD}  accentColor="#22c55e" loading={loading} />
        <KpiCard label="Ads Klicks MTD" value={adsMTD}   accentColor="#ef4444" loading={loading} />
        <KpiCard label="Werbekosten MTD" value={eur(spendMTD)} accentColor="#f59e0b" loading={loading} />
        <KpiCard label="CRM Anfragen"   value={crmStats?.total ?? "—"} accentColor="#8b5cf6" loading={loading} />
        <KpiCard label="Aufträge"       value={crmStats?.orderReceived ?? "—"} accentColor="#22c55e" loading={loading} />
        <KpiCard label="Ø Position"     value={t.avgPosition ? t.avgPosition.toFixed(1) : "—"} accentColor="#3b82f6" loading={loading} />
      </div>
    </div>
  );
}
