"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadEntryForm } from "@/components/kpi/lead-entry-form";
import { KpiCard } from "@/components/kpi/kpi-card";

export default function KpisPage() {
  const { brand: brandSlug } = useParams() as { brand: string };
  const brand   = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id as Id<"brands"> | undefined;

  const now = new Date();
  const monthPrefix = now.toISOString().slice(0, 7); // YYYY-MM

  const today  = useQuery(api.kpi.getTodayAllSources, brandId ? { brandId } : "skip");
  const gsc30  = useQuery(api.kpi.getSnapshotsRange,  brandId ? { brandId, source: "gsc",    days: 30 } : "skip");
  const leads30= useQuery(api.kpi.getSnapshotsRange,  brandId ? { brandId, source: "manual", days: 30 } : "skip");
  const target = useQuery(api.kpi.getTarget,          brandId ? { brandId, year: now.getFullYear(), month: now.getMonth() + 1 } : "skip");

  const merged        = (today   ?? []).reduce((acc, s) => ({ ...acc, ...s }), {} as any);
  const totalClicksMTD = (gsc30  ?? []).filter(s => s.date.startsWith(monthPrefix)).reduce((sum, s) => sum + (s.clicks ?? 0), 0);
  const totalLeadsMTD  = (leads30 ?? []).filter(s => s.date.startsWith(monthPrefix)).reduce((sum, s) => sum + (s.leadsCount ?? 0), 0);

  if (!brand) return <div className="p-6 text-muted-foreground">Lädt…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">KPIs</h1>
        <p className="text-muted-foreground">{brand.name} — Metriken & Ziele</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Klicks MTD"  value={totalClicksMTD}                                              accentColor="#22c55e" />
        <KpiCard label="Anfragen MTD" value={totalLeadsMTD}                                              accentColor="#ff6600" />
        <KpiCard label="CTR heute"   value={merged.ctr ? `${(merged.ctr * 100).toFixed(1)}` : "—"} unit="%" accentColor="#8b5cf6" />
        <KpiCard label="Ø Position"  value={merged.avgPosition ? merged.avgPosition.toFixed(1) : "—"}   accentColor="#3b82f6" />
      </div>

      {target && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Monatsziele {now.toLocaleString("de-DE", { month: "long" })}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {target.targetClicks && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Klicks</span><span>{totalClicksMTD.toLocaleString()} / {target.targetClicks.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (totalClicksMTD / target.targetClicks) * 100)}%` }} />
                </div>
              </div>
            )}
            {target.targetLeads && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Anfragen</span><span>{totalLeadsMTD} / {target.targetLeads}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-orange-500" style={{ width: `${Math.min(100, (totalLeadsMTD / target.targetLeads) * 100)}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {brandId && <LeadEntryForm brandId={brandId} />}
    </div>
  );
}
