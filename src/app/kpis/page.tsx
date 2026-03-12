"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi/kpi-card";

export default function ExecutiveOverviewPage() {
  const allBrands = useQuery(api.kpi.getAllBrandsLatest);
  const dateStr = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });

  if (!allBrands) return <div className="p-6 text-muted-foreground">Lädt…</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executive Overview</h1>
        <p className="text-muted-foreground">Alle Marken — {dateStr}</p>
      </div>

      {allBrands.map(({ brand, snapshots }) => {
        const merged = snapshots.reduce((acc, s) => ({ ...acc, ...s }), {} as any);
        return (
          <Card key={brand._id}>
            <CardHeader><CardTitle>{brand.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <KpiCard label="GSC Klicks"   value={merged.clicks      ?? "—"} accentColor="#22c55e" />
                <KpiCard label="Impressionen" value={merged.impressions  ?? "—"} accentColor="#3b82f6" />
                <KpiCard label="CTR"          value={merged.ctr ? `${(merged.ctr * 100).toFixed(1)}` : "—"} unit="%" accentColor="#8b5cf6" />
                <KpiCard label="Social Reach" value={merged.socialReach  ?? "—"} accentColor="#f59e0b" />
                <KpiCard label="Anfragen"     value={merged.leadsCount   ?? "—"} accentColor="#ff6600" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
