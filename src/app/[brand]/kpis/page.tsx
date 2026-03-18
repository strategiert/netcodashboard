"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi/kpi-card";
import { SyncButton } from "@/components/kpi/sync-button";

function eur(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export default function KpisPage() {
  const { brand: brandSlug } = useParams() as { brand: string };
  const brand   = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id as Id<"brands"> | undefined;

  const now = new Date();
  const monthPrefix = now.toISOString().slice(0, 7);
  const monthStart = `${monthPrefix}-01`;
  const today = now.toISOString().slice(0, 10);

  const todaySnaps = useQuery(api.kpi.getTodayAllSources, brandId ? { brandId } : "skip");
  const gsc30  = useQuery(api.kpi.getSnapshotsRange, brandId ? { brandId, source: "gsc", days: 30 } : "skip");
  const ads30  = useQuery(api.kpi.getSnapshotsRange, brandId ? { brandId, source: "ads", days: 30 } : "skip");
  const crmLeads = useQuery(api.reports.getCrmLeads, brandId ? { brandId, from: monthStart, to: today } : "skip");
  const crmStats = useQuery(api.reports.getCrmLeadsStats, brandId ? { brandId, from: monthStart, to: today } : "skip");
  const target = useQuery(api.kpi.getTarget, brandId ? { brandId, year: now.getFullYear(), month: now.getMonth() + 1 } : "skip");

  const merged = (todaySnaps ?? []).reduce((acc, s) => ({ ...acc, ...s }), {} as any);
  const gscMTD = (gsc30 ?? []).filter(s => s.date.startsWith(monthPrefix));
  const adsMTD = (ads30 ?? []).filter(s => s.date.startsWith(monthPrefix));

  const seoClicksMTD = gscMTD.reduce((sum, s) => sum + (s.clicks ?? 0), 0);
  const adsClicksMTD = adsMTD.reduce((sum, s) => sum + (s.adClicks ?? 0), 0);
  const adsSpendMTD  = adsMTD.reduce((sum, s) => sum + (s.adSpend ?? 0), 0);
  const totalCrmMTD  = crmStats?.total ?? 0;
  const ordersMTD    = crmStats?.orderReceived ?? 0;
  const newCustMTD   = crmStats?.newCustomer ?? 0;

  if (!brand) return <div className="p-6 text-muted-foreground">Lädt…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPIs</h1>
          <p className="text-muted-foreground">{brand.name} — {now.toLocaleString("de-DE", { month: "long", year: "numeric" })}</p>
        </div>
        <SyncButton />
      </div>

      {/* Row 1: Traffic */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="SEO Klicks MTD"  value={seoClicksMTD}  accentColor="#22c55e" />
        <KpiCard label="Ads Klicks MTD"  value={adsClicksMTD}  accentColor="#ef4444" />
        <KpiCard label="Werbekosten MTD" value={eur(adsSpendMTD)} accentColor="#f59e0b" />
        <KpiCard label="Ø Position"      value={merged.avgPosition ? merged.avgPosition.toFixed(1) : "—"} accentColor="#3b82f6" />
      </div>

      {/* Row 2: CRM */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="CRM Anfragen MTD" value={totalCrmMTD}  accentColor="#8b5cf6" />
        <KpiCard label="Aufträge MTD"     value={ordersMTD}    accentColor="#22c55e" />
        <KpiCard label="Neukunden MTD"    value={newCustMTD}   accentColor="#f59e0b" />
        <KpiCard label="Conv.-Rate"       value={totalCrmMTD > 0 ? `${Math.round((ordersMTD / totalCrmMTD) * 100)}` : "—"} unit="%" accentColor="#3b82f6" />
      </div>

      {/* Monatsziele */}
      {target && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Monatsziele {now.toLocaleString("de-DE", { month: "long" })}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {target.targetClicks && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>SEO Klicks</span><span>{seoClicksMTD.toLocaleString()} / {target.targetClicks.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: `${Math.min(100, (seoClicksMTD / target.targetClicks) * 100)}%` }} />
                </div>
              </div>
            )}
            {target.targetLeads && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Anfragen</span><span>{totalCrmMTD} / {target.targetLeads}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-orange-500" style={{ width: `${Math.min(100, (totalCrmMTD / target.targetLeads) * 100)}%` }} />
                </div>
              </div>
            )}
            {target.targetAdSpend && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Werbekosten</span><span>{eur(adsSpendMTD)} / {eur(target.targetAdSpend)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.min(100, (adsSpendMTD / target.targetAdSpend) * 100)}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Letzte CRM Anfragen */}
      {crmLeads && crmLeads.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Letzte Anfragen ({now.toLocaleString("de-DE", { month: "long" })})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...crmLeads].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(l => (
                <div key={l._id} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-muted-foreground tabular-nums w-20">{l.date}</span>
                  <span className="font-medium flex-1 truncate">{l.company}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">{l.description}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    l.status === "Erteilt" ? "bg-green-100 text-green-700" :
                    l.status === "Erledigt" ? "bg-green-100 text-green-700" :
                    l.status === "offen" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{l.status ?? "offen"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
