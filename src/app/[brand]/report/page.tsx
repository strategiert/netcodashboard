"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { SyncButton } from "@/components/kpi/sync-button";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { useState, useCallback } from "react";
import {
  aggregateSourceCoverage,
  COVERAGE_METRIC_CONFIG,
  type CoverageMetricView,
} from "@/lib/source-coverage";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("de-DE");
}
function eur(n: number | undefined | null): string {
  if (n == null) return "—";
  return `${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
function pct(n: number | undefined | null): string {
  if (n == null) return "—";
  return `${n.toFixed(2)} %`;
}

// ── Summary KPI Cards ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4" style={{ borderLeftColor: color ?? "#8b5cf6", borderLeftWidth: 3 }}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  "Erteilt":          "#22c55e",
  "Erledigt":         "#16a34a",
  "offen":            "#f59e0b",
  "Abgesprungen":     "#ef4444",
  "Verloren":         "#dc2626",
  "Nicht qualifiziert": "#94a3b8",
  "Kein Bedarf":      "#94a3b8",
};

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const color = STATUS_COLORS[status] ?? "#94a3b8";
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}>
      {status}
    </span>
  );
}

// ── CRM Funnel ────────────────────────────────────────────────────────────────

function CrmFunnel({ stats }: { stats: { total: number; offerMade: number; orderReceived: number; newCustomer: number } }) {
  const total    = stats.total;
  const offers   = stats.offerMade;
  const orders   = stats.orderReceived;
  const newCusts = stats.newCustomer;

  const steps = [
    { label: "Anfragen",      count: total,    color: "#8b5cf6" },
    { label: "Angebote",      count: offers,   color: "#3b82f6" },
    { label: "Aufträge",      count: orders,   color: "#22c55e" },
    { label: "Neukunden",     count: newCusts, color: "#f59e0b" },
  ];

  return (
    <div className="flex flex-col gap-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-3">
          <div className="w-28 text-sm text-right text-muted-foreground">{s.label}</div>
          <div className="flex-1 h-8 rounded relative bg-muted overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{ width: total > 0 ? `${(s.count / total) * 100}%` : "0%", backgroundColor: s.color }}
            />
          </div>
          <div className="w-16 text-sm font-semibold tabular-nums">
            {s.count}
            {i > 0 && total > 0 && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({Math.round((s.count / total) * 100)} %)
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CRM Lead Table ────────────────────────────────────────────────────────────

function LeadsTable({ leads }: { leads: any[] }) {
  if (!leads.length) return <p className="text-sm text-muted-foreground">Keine Leads.</p>;

  const sorted = [...leads].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="text-left pb-2 pr-3 font-medium">KW</th>
            <th className="text-left pb-2 pr-3 font-medium">Datum</th>
            <th className="text-left pb-2 pr-4 font-medium">Unternehmen</th>
            <th className="text-left pb-2 pr-3 font-medium">Typ</th>
            <th className="text-left pb-2 pr-3 font-medium">Kanal</th>
            <th className="text-left pb-2 pr-4 font-medium">Beschreibung</th>
            <th className="text-center pb-2 pr-2 font-medium">Ang.</th>
            <th className="text-center pb-2 pr-2 font-medium">Auftrag</th>
            <th className="text-center pb-2 pr-3 font-medium">NK</th>
            <th className="text-left pb-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map(l => (
            <tr key={l._id} className="hover:bg-muted/30 transition-colors">
              <td className="py-2 pr-3 text-xs text-muted-foreground tabular-nums">KW {l.kw}</td>
              <td className="py-2 pr-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">{l.date}</td>
              <td className="py-2 pr-4 font-medium text-xs max-w-[180px] truncate">{l.company}</td>
              <td className="py-2 pr-3">
                <Badge variant={l.leadType === "Lead" ? "default" : "secondary"} className="text-xs">
                  {l.leadType ?? "—"}
                </Badge>
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground max-w-[120px] truncate">{l.contactChannel ?? "—"}</td>
              <td className="py-2 pr-4 text-xs max-w-[220px] truncate">{l.description ?? "—"}</td>
              <td className="py-2 pr-2 text-center">{l.offerMade ? "✓" : "—"}</td>
              <td className="py-2 pr-2 text-center">{l.orderReceived ? "✓" : "—"}</td>
              <td className="py-2 pr-3 text-center">{l.newCustomer ? "✓" : "—"}</td>
              <td className="py-2"><StatusBadge status={l.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── SEO Keyword Helpers ───────────────────────────────────────────────────────

function PosBadge({ pos }: { pos: number }) {
  if (pos === 0) return <Badge variant="outline" className="text-muted-foreground">—</Badge>;
  if (pos <= 3) return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">{pos}</Badge>;
  if (pos <= 10) return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">{pos}</Badge>;
  if (pos <= 30) return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">{pos}</Badge>;
  return <Badge variant="outline">{pos}</Badge>;
}

function ChangeCell({ change }: { change?: number }) {
  if (!change) return <span className="text-muted-foreground">·</span>;
  if (change > 0) return <span className="text-green-600 dark:text-green-400">▲ {change}</span>;
  return <span className="text-red-600 dark:text-red-400">▼ {Math.abs(change)}</span>;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, isCurrency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.fill ?? p.stroke }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold tabular-nums">
            {typeof p.value === "number"
              ? isCurrency
                ? p.value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
                : p.value.toLocaleString("de-DE")
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

// CSV-Export der GA4-Wochendaten (Excel-kompatibel: Semikolon + BOM)
function downloadWeeklyCsv(brandName: string, rows: any[]) {
  const cols = ["kw", "weekStart", "sessions", "visitors", "pageviews", "bounceRate",
    "chAds", "chSeo", "chDirect", "chSocial", "chReferral", "chOther", "leads", "adSpend"];
  const header = ["KW", "Wochenstart", "Sitzungen", "Nutzer", "Seitenaufrufe", "Bounce %",
    "Ads", "SEO", "Direkt", "Social", "Referral", "Sonstige", "Leads", "Werbekosten"];
  const lines = [header.join(";")];
  for (const r of rows) {
    lines.push(cols.map((c) => {
      const v = (r as any)[c];
      if (v == null) return "";
      return typeof v === "number" ? String(v).replace(".", ",") : String(v);
    }).join(";"));
  }
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `traffic-report-${brandName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ReportPage() {
  const { brand } = useParams<{ brand: string }>();
  const { dateFrom, dateTo, granularity } = useGlobalFilters();
  const brandData = useQuery(api.brands.getBySlug, { slug: brand });

  // Primary data source: kpiSnapshots (filled by Sync button)
  const snapshots = useQuery(
    api.kpi.getAllByDateRange,
    brandData ? { brandId: brandData._id, from: dateFrom, to: dateTo } : "skip"
  );
  const dailyTraffic = useQuery(
    api.dailyTraffic.getRange,
    brandData ? { brandId: brandData._id, from: dateFrom, to: dateTo } : "skip"
  );
  const bingRows = useQuery(
    api.aiVisibility.listBingByDateRange,
    brandData ? { brandId: brandData._id, from: dateFrom, to: dateTo } : "skip"
  );

  // CRM data
  const leads = useQuery(
    api.reports.getCrmLeads,
    brandData ? { brandId: brandData._id, from: dateFrom, to: dateTo } : "skip"
  );
  const leadsStats = useQuery(
    api.reports.getCrmLeadsStats,
    brandData ? { brandId: brandData._id, from: dateFrom, to: dateTo } : "skip"
  );

  // Google Ads detail data
  const gadsCampaigns = useQuery(
    api.gads.getCampaignStats,
    brandData ? { brandId: brandData._id, period: "all-time" } : "skip"
  );
  const gadsAdGroups = useQuery(
    api.gads.getAdGroups,
    brandData ? { brandId: brandData._id, period: "all-time" } : "skip"
  );
  const gadsKeywords = useQuery(
    api.gads.getKeywords,
    brandData ? { brandId: brandData._id, period: "all-time" } : "skip"
  );

  // Wochen-Traffic aus GA4 (syncTraffic-Cron -> weeklyReports)
  const weekly = useQuery(
    api.reports.getWeeklyReports,
    brandData ? { brandId: brandData._id, from: dateFrom, to: dateTo } : "skip"
  );

  // SEO-Keywords aus SE Ranking (gleiche Quelle wie Rankings-Seite)
  const seKeywords = useQuery(
    api.seranking.listKeywords,
    brandData ? { brandId: brandData._id } : "skip"
  );

  // Metric view toggle (must be before conditional returns!)
  const [metricView, setMetricView] = useState<CoverageMetricView>("coverage");
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const handleLegendClick = useCallback((entry: any) => {
    // entry.value is the display name (e.g. "Ads"), entry.dataKey is the field.
    const clicked = entry.value ?? entry.dataKey;
    setActiveChannel(prev => prev === clicked ? null : clicked);
  }, []);

  if (!brandData || snapshots === undefined || dailyTraffic === undefined || bingRows === undefined) {
    return <div className="p-6 text-muted-foreground">Lädt…</div>;
  }

  // ── KPI Summaries from kpiSnapshots ──────────────────────────────────────
  // Aggregate totals across all days & sources
  let totalClicks = 0, totalImpressions = 0, totalAdSpend = 0, totalAdClicks = 0;
  let totalSocialReach = 0, totalSocialEngagement = 0;
  let avgPosition = 0, avgPositionCount = 0;

  for (const s of snapshots) {
    if (s.source === "gsc") {
      totalClicks += s.clicks ?? 0;
      totalImpressions += s.impressions ?? 0;
      if (s.avgPosition) { avgPosition += s.avgPosition; avgPositionCount++; }
    }
    if (s.source === "ads") {
      totalAdSpend += s.adSpend ?? 0;
      totalAdClicks += s.adClicks ?? 0;
    }
    if (s.source === "publer") {
      totalSocialReach += s.socialReach ?? 0;
      totalSocialEngagement += s.socialEngagement ?? 0;
    }
  }

  const totalCrmLeads = leadsStats?.total ?? 0;
  const ordersWon     = leadsStats?.orderReceived ?? 0;
  const newCustomers  = leadsStats?.newCustomer ?? 0;

  // ── Subtitle ──────────────────────────────────────────────────────────────
  const fmtShort = (s: string) => new Date(s + "T12:00:00Z").toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
  const multiYear = dateFrom.slice(0, 4) !== dateTo.slice(0, 4);

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const chartData = aggregateSourceCoverage({
    snapshots,
    bingRows,
    dailyTraffic,
    granularity,
    multiYear,
  });
  const granLabel = granularity === "daily" ? "Tage" : granularity === "weekly" ? "Wochen" : "Monate";
  const subtitle = `${fmtShort(dateFrom)} – ${fmtShort(dateTo)} · ${chartData.length} ${granLabel}`;

  const currentMetric = COVERAGE_METRIC_CONFIG[metricView];
  const periodLabel = granularity === "daily" ? "Tag" : granularity === "weekly" ? "KW" : "Monat";

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bericht</h1>
          <p className="text-muted-foreground">{brandData.name} · {subtitle}</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => downloadWeeklyCsv(brandData.name, weekly ?? [])} disabled={!weekly?.length}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> PDF
          </Button>
          <SyncButton />
        </div>
      </div>

      {/* KPI Summary — from kpiSnapshots */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="SEO Klicks"          value={fmt(totalClicks)}       color="#22c55e" />
        <KpiCard label="SEO Impressionen"    value={fmt(totalImpressions)}  color="#3b82f6"
          sub={avgPositionCount > 0 ? `Ø Pos. ${(avgPosition / avgPositionCount).toFixed(1)}` : undefined} />
        <KpiCard label="Werbekosten"         value={eur(totalAdSpend)}      color="#ef4444"
          sub={totalAdClicks > 0 ? `${fmt(totalAdClicks)} Klicks` : undefined} />
        <KpiCard label="Social Reichweite"   value={fmt(totalSocialReach)}  color="#8b5cf6"
          sub={totalSocialEngagement > 0 ? `${fmt(totalSocialEngagement)} Engagement` : undefined} />
        <KpiCard label="CRM Anfragen"        value={String(totalCrmLeads)}  color="#f59e0b" />
        <KpiCard label="Aufträge"            value={String(ordersWon)}      color="#22c55e"
          sub={totalCrmLeads > 0 ? `${Math.round((ordersWon / totalCrmLeads) * 100)} % Conv.` : undefined} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="traffic">
        <TabsList>
          <TabsTrigger value="traffic">Traffic &amp; SEO</TabsTrigger>
          <TabsTrigger value="weeks">Wochen (GA4)</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="ads">Google Ads</TabsTrigger>
          <TabsTrigger value="keywords">SEO Keywords</TabsTrigger>
        </TabsList>

        {/* ── Tab: Wochen-Traffic aus GA4 ──────────────────────────────────── */}
        <TabsContent value="weeks" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Website-Traffic je Kalenderwoche (GA4, täglich automatisch)</CardTitle>
            </CardHeader>
            <CardContent>
              {!weekly?.length ? (
                <p className="text-sm text-muted-foreground">Noch keine Wochendaten — Sync läuft täglich 08:25.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-3">KW</th>
                        <th className="text-right py-2 px-3">Sitzungen</th>
                        <th className="text-right py-2 px-3">Nutzer</th>
                        <th className="text-right py-2 px-3">Seitenaufrufe</th>
                        <th className="text-right py-2 px-3">Bounce</th>
                        <th className="text-right py-2 px-3">Ads</th>
                        <th className="text-right py-2 px-3">SEO</th>
                        <th className="text-right py-2 px-3">Direkt</th>
                        <th className="text-right py-2 px-3">Social</th>
                        <th className="text-right py-2 pl-3">Referral</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...weekly].reverse().map((w) => (
                        <tr key={w._id} className="border-b border-border/50">
                          <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{w.kw} <span className="text-muted-foreground text-xs">({w.weekStart})</span></td>
                          <td className="text-right py-1.5 px-3 tabular-nums">{fmt(w.sessions)}</td>
                          <td className="text-right py-1.5 px-3 tabular-nums">{fmt(w.visitors)}</td>
                          <td className="text-right py-1.5 px-3 tabular-nums">{fmt(w.pageviews)}</td>
                          <td className="text-right py-1.5 px-3 tabular-nums">{w.bounceRate != null ? `${w.bounceRate.toFixed(1)} %` : "—"}</td>
                          <td className="text-right py-1.5 px-3 tabular-nums">{fmt(w.chAds)}</td>
                          <td className="text-right py-1.5 px-3 tabular-nums">{fmt(w.chSeo)}</td>
                          <td className="text-right py-1.5 px-3 tabular-nums">{fmt(w.chDirect)}</td>
                          <td className="text-right py-1.5 px-3 tabular-nums">{fmt(w.chSocial)}</td>
                          <td className="text-right py-1.5 pl-3 tabular-nums">{fmt(w.chReferral)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Traffic & SEO ─────────────────────────────────────────── */}
        <TabsContent value="traffic" className="space-y-4 mt-4">
          {chartData.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Keine Daten im gewählten Zeitraum. Klicke oben auf den Sync-Button um Daten zu laden.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Metric Switcher */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">
                    {currentMetric.label} pro {periodLabel}
                  </CardTitle>
                  <div className="flex gap-1 rounded-lg border p-0.5">
                    {(Object.entries(COVERAGE_METRIC_CONFIG) as [CoverageMetricView, typeof currentMetric][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => { setMetricView(key); setActiveChannel(null); }}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          metricView === key
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cfg.label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={metricView === "costs" ? (v: number) => `${v.toLocaleString("de-DE")}€` : undefined} />
                      <Tooltip content={<CustomTooltip isCurrency={metricView === "costs"} />} />
                      <Legend
                        wrapperStyle={{ fontSize: 12, cursor: "pointer" }}
                        onClick={handleLegendClick}
                        formatter={(value: string) => (
                          <span style={{
                            opacity: activeChannel && activeChannel !== value ? 0.3 : 1,
                            fontWeight: activeChannel === value ? 700 : 400,
                          }}>{value}</span>
                        )}
                      />
                      {currentMetric.channels.map(ch => (
                        <Bar
                          key={ch.key}
                          dataKey={ch.key}
                          name={ch.label}
                          stackId="a"
                          fill={ch.color}
                          hide={activeChannel !== null && activeChannel !== ch.label}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                  {activeChannel && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Nur <strong>{activeChannel}</strong> — klicke erneut zum Zurücksetzen
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Tab: CRM ──────────────────────────────────────────────────────── */}
        <TabsContent value="crm" className="space-y-4 mt-4">
          {/* CRM Funnel */}
          <Card>
            <CardHeader><CardTitle className="text-base">CRM Pipeline</CardTitle></CardHeader>
            <CardContent>
              <CrmFunnel stats={leadsStats ?? { total: 0, offerMade: 0, orderReceived: 0, newCustomer: 0 }} />
            </CardContent>
          </Card>

          {/* CRM Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Anfragen
                <span className="text-xs font-normal text-muted-foreground">
                  {totalCrmLeads} gesamt{(leads?.length ?? 0) < totalCrmLeads
                    ? ` · neueste ${leads?.length ?? 0} angezeigt` : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeadsTable leads={leads ?? []} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Google Ads ───────────────────────────────────────────────── */}
        <TabsContent value="ads" className="space-y-4 mt-4">
          {/* Date-filtered Ads summary from kpiSnapshots */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Werbekosten" value={eur(totalAdSpend)} color="#ef4444" />
            <KpiCard label="Klicks" value={fmt(totalAdClicks)} color="#3b82f6" />
            <KpiCard label="Impressionen" value={fmt(snapshots.filter(s => s.source === "ads").reduce((a, s) => a + (s.adImpressions ?? 0), 0))} color="#f59e0b" />
            <KpiCard label="Conversions" value={fmt(snapshots.filter(s => s.source === "ads").reduce((a, s) => a + (s.adConversions ?? 0), 0))} color="#22c55e" />
          </div>

          {/* Campaigns — all-time detail data */}
          {gadsCampaigns && gadsCampaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Kampagnen
                  <span className="text-xs font-normal text-muted-foreground">Gesamtlaufzeit</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left pb-2 pr-4 font-medium">Kampagne</th>
                        <th className="text-left pb-2 pr-3 font-medium">Typ</th>
                        <th className="text-right pb-2 pr-3 font-medium">Budget/Tag</th>
                        <th className="text-right pb-2 pr-3 font-medium">Ausgaben</th>
                        <th className="text-right pb-2 pr-3 font-medium">Impr.</th>
                        <th className="text-right pb-2 pr-3 font-medium">Klicks</th>
                        <th className="text-right pb-2 pr-3 font-medium">CTR</th>
                        <th className="text-right pb-2 pr-3 font-medium">Conv.</th>
                        <th className="text-right pb-2 font-medium">Kosten/Conv.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[...gadsCampaigns].sort((a, b) => b.cost - a.cost).map(c => {
                        const ctr = c.clicks && c.impressions ? (c.clicks / c.impressions * 100) : null;
                        const cpc = c.conversions > 0 ? c.cost / c.conversions : null;
                        return (
                          <tr key={c._id} className="hover:bg-muted/30">
                            <td className="py-2 pr-4 font-medium text-xs">{c.campaign}</td>
                            <td className="py-2 pr-3"><Badge variant="outline" className="text-xs">{c.campaignType ?? "—"}</Badge></td>
                            <td className="py-2 pr-3 text-right tabular-nums text-xs">{c.budget ? `${c.budget} €` : "—"}</td>
                            <td className="py-2 pr-3 text-right tabular-nums font-medium">{eur(c.cost)}</td>
                            <td className="py-2 pr-3 text-right tabular-nums">{fmt(c.impressions)}</td>
                            <td className="py-2 pr-3 text-right tabular-nums">{fmt(c.clicks)}</td>
                            <td className="py-2 pr-3 text-right tabular-nums">{pct(ctr)}</td>
                            <td className="py-2 pr-3 text-right tabular-nums">{c.conversions.toFixed(1)}</td>
                            <td className="py-2 text-right tabular-nums font-medium">{eur(cpc)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ad Groups */}
          {gadsAdGroups && gadsAdGroups.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2">Anzeigengruppen <span className="text-xs font-normal text-muted-foreground">Gesamtlaufzeit</span></CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left pb-2 pr-3 font-medium">Kampagne</th>
                        <th className="text-left pb-2 pr-4 font-medium">Anzeigengruppe</th>
                        <th className="text-right pb-2 pr-3 font-medium">Ausgaben</th>
                        <th className="text-right pb-2 pr-3 font-medium">Klicks</th>
                        <th className="text-right pb-2 pr-3 font-medium">CTR</th>
                        <th className="text-right pb-2 pr-3 font-medium">Conv.</th>
                        <th className="text-right pb-2 pr-3 font-medium">Kosten/Conv.</th>
                        <th className="text-right pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[...gadsAdGroups]
                        .filter(ag => ag.clicks > 0)
                        .sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks)
                        .map(ag => {
                          const ctr = ag.clicks && ag.impressions ? (ag.clicks / ag.impressions * 100) : null;
                          const cpc = ag.conversions > 0 ? ag.cost / ag.conversions : null;
                          return (
                            <tr key={ag._id} className="hover:bg-muted/30">
                              <td className="py-2 pr-3 text-xs text-muted-foreground">{ag.campaign}</td>
                              <td className="py-2 pr-4 font-medium text-xs">{ag.adGroup}</td>
                              <td className="py-2 pr-3 text-right tabular-nums">{eur(ag.cost)}</td>
                              <td className="py-2 pr-3 text-right tabular-nums">{fmt(ag.clicks)}</td>
                              <td className="py-2 pr-3 text-right tabular-nums">{pct(ctr)}</td>
                              <td className="py-2 pr-3 text-right tabular-nums">{ag.conversions.toFixed(1)}</td>
                              <td className="py-2 pr-3 text-right tabular-nums font-medium">{eur(cpc)}</td>
                              <td className="py-2 text-right">
                                <span className={`text-xs ${ag.status === "Enabled" ? "text-green-600" : "text-muted-foreground"}`}>
                                  {ag.status === "Enabled" ? "Aktiv" : "Pausiert"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Keywords */}
          {gadsKeywords && gadsKeywords.length > 0 && (() => {
            const sorted      = [...gadsKeywords].sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks);
            const topByConv   = sorted.filter(k => k.conversions > 0).slice(0, 20);
            const topByClicks = [...gadsKeywords].filter(k => k.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 20);
            const enabledKws  = gadsKeywords.filter(k => k.status === "Enabled");
            const qsKws       = enabledKws.filter(k => k.qualityScore != null);
            const avgQs       = qsKws.length > 0 ? qsKws.reduce((a, k) => a + (k.qualityScore ?? 0), 0) / qsKws.length : null;
            const qsDist      = [1,2,3,4,5,6,7,8,9,10].map(n => ({
              qs: String(n), count: qsKws.filter(k => k.qualityScore === n).length,
            }));
            return (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-base">Quality Score Übersicht</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 mb-4">
                      <KpiCard label="Keywords gesamt" value={String(gadsKeywords.length)} color="#8b5cf6" />
                      <KpiCard label="Aktiv"           value={String(enabledKws.length)}  color="#22c55e" />
                      <KpiCard label="Mit QS"          value={String(qsKws.length)}        color="#3b82f6" />
                      <KpiCard label="Ø Quality Score" value={avgQs != null ? avgQs.toFixed(1) : "—"}
                        color={avgQs && avgQs >= 7 ? "#22c55e" : avgQs && avgQs >= 4 ? "#f59e0b" : "#ef4444"} />
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={qsDist} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="qs" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Keywords" fill="#8b5cf6" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Top Keywords — nach Conversions</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-xs text-muted-foreground">
                            <th className="text-left pb-2 pr-4 font-medium">Keyword</th>
                            <th className="text-left pb-2 pr-3 font-medium">Match</th>
                            <th className="text-left pb-2 pr-3 font-medium">Anzeigengruppe</th>
                            <th className="text-center pb-2 pr-3 font-medium">QS</th>
                            <th className="text-right pb-2 pr-3 font-medium">Klicks</th>
                            <th className="text-right pb-2 pr-3 font-medium">Impr.</th>
                            <th className="text-right pb-2 pr-3 font-medium">CTR</th>
                            <th className="text-right pb-2 pr-3 font-medium">Ausgaben</th>
                            <th className="text-right pb-2 pr-3 font-medium">Conv.</th>
                            <th className="text-right pb-2 font-medium">Kosten/Conv.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {topByConv.map((k, i) => {
                            const ctr = k.clicks && k.impressions ? (k.clicks / k.impressions * 100) : null;
                            const cpc = k.conversions > 0 ? k.cost / k.conversions : null;
                            const qs  = k.qualityScore;
                            const qsColor = qs != null ? (qs >= 7 ? "#22c55e" : qs >= 4 ? "#f59e0b" : "#ef4444") : "#94a3b8";
                            return (
                              <tr key={i} className="hover:bg-muted/30">
                                <td className="py-2 pr-4 font-medium text-xs max-w-[180px] truncate">{k.keyword}</td>
                                <td className="py-2 pr-3"><Badge variant="outline" className="text-xs">{k.matchType}</Badge></td>
                                <td className="py-2 pr-3 text-xs text-muted-foreground truncate max-w-[120px]">{k.adGroup}</td>
                                <td className="py-2 pr-3 text-center">
                                  {qs != null ? <span className="text-xs font-bold" style={{ color: qsColor }}>{qs}</span>
                                    : <span className="text-xs text-muted-foreground">—</span>}
                                </td>
                                <td className="py-2 pr-3 text-right tabular-nums">{fmt(k.clicks)}</td>
                                <td className="py-2 pr-3 text-right tabular-nums">{fmt(k.impressions)}</td>
                                <td className="py-2 pr-3 text-right tabular-nums">{pct(ctr)}</td>
                                <td className="py-2 pr-3 text-right tabular-nums">{eur(k.cost)}</td>
                                <td className="py-2 pr-3 text-right tabular-nums font-medium">{k.conversions.toFixed(1)}</td>
                                <td className="py-2 text-right tabular-nums">{eur(cpc)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Top Keywords — nach Klicks</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-xs text-muted-foreground">
                            <th className="text-left pb-2 pr-4 font-medium">Keyword</th>
                            <th className="text-left pb-2 pr-3 font-medium">Match</th>
                            <th className="text-center pb-2 pr-3 font-medium">QS</th>
                            <th className="text-right pb-2 pr-3 font-medium">Klicks</th>
                            <th className="text-right pb-2 pr-3 font-medium">Impr.</th>
                            <th className="text-right pb-2 pr-3 font-medium">CTR</th>
                            <th className="text-right pb-2 pr-3 font-medium">Ø CPC</th>
                            <th className="text-right pb-2 pr-3 font-medium">Ausgaben</th>
                            <th className="text-right pb-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {topByClicks.map((k, i) => {
                            const ctr = k.clicks && k.impressions ? (k.clicks / k.impressions * 100) : null;
                            const qs  = k.qualityScore;
                            const qsColor = qs != null ? (qs >= 7 ? "#22c55e" : qs >= 4 ? "#f59e0b" : "#ef4444") : "#94a3b8";
                            return (
                              <tr key={i} className="hover:bg-muted/30">
                                <td className="py-2 pr-4 font-medium text-xs max-w-[200px] truncate">{k.keyword}</td>
                                <td className="py-2 pr-3"><Badge variant="outline" className="text-xs">{k.matchType}</Badge></td>
                                <td className="py-2 pr-3 text-center">
                                  {qs != null ? <span className="text-xs font-bold" style={{ color: qsColor }}>{qs}</span>
                                    : <span className="text-xs text-muted-foreground">—</span>}
                                </td>
                                <td className="py-2 pr-3 text-right tabular-nums font-medium">{fmt(k.clicks)}</td>
                                <td className="py-2 pr-3 text-right tabular-nums">{fmt(k.impressions)}</td>
                                <td className="py-2 pr-3 text-right tabular-nums">{pct(ctr)}</td>
                                <td className="py-2 pr-3 text-right tabular-nums">{eur(k.avgCpc)}</td>
                                <td className="py-2 pr-3 text-right tabular-nums">{eur(k.cost)}</td>
                                <td className="py-2 text-right">
                                  <span className={`text-xs ${k.status === "Enabled" ? "text-green-600" : "text-muted-foreground"}`}>
                                    {k.status === "Enabled" ? "Aktiv" : "Pausiert"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}

          {(!gadsCampaigns || gadsCampaigns.length === 0) && (!gadsAdGroups || gadsAdGroups.length === 0) && (
            <p className="text-sm text-muted-foreground">Keine Google Ads Daten vorhanden.</p>
          )}
        </TabsContent>

        {/* ── Tab: SEO Keywords (SE Ranking) ────────────────────────────────── */}
        <TabsContent value="keywords" className="space-y-4 mt-4">
          {seKeywords === undefined ? (
            <p className="text-sm text-muted-foreground">Lädt Keywords…</p>
          ) : seKeywords.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Keine SEO-Keyword-Daten vorhanden — Sync läuft täglich automatisch.
                </p>
              </CardContent>
            </Card>
          ) : (() => {
            const ranked = seKeywords.filter(k => k.position > 0);
            const top3   = ranked.filter(k => k.position <= 3).length;
            const top10  = ranked.filter(k => k.position <= 10).length;
            return (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <KpiCard label="Keywords getrackt" value={String(seKeywords.length)} color="#8b5cf6" />
                  <KpiCard label="Gerankt"           value={String(ranked.length)}     color="#3b82f6" />
                  <KpiCard label="Top 10"            value={String(top10)}             color="#22c55e" />
                  <KpiCard label="Top 3"             value={String(top3)}              color="#f59e0b" />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      Organische Keywords
                      <span className="text-xs font-normal text-muted-foreground">
                        SE Ranking · aktueller Stand
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[520px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-card">
                          <tr className="border-b text-xs text-muted-foreground">
                            <th className="text-left pb-2 pr-4 font-medium">Keyword</th>
                            <th className="text-center pb-2 pr-3 font-medium">Position</th>
                            <th className="text-center pb-2 pr-3 font-medium">Δ</th>
                            <th className="text-right pb-2 pr-3 font-medium">Suchvolumen</th>
                            <th className="text-right pb-2 font-medium">CPC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {seKeywords.slice(0, 500).map((k) => (
                            <tr key={k._id} className="hover:bg-muted/30">
                              <td className="py-2 pr-4 text-xs font-medium max-w-[320px] truncate">
                                {k.url
                                  ? <a href={k.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{k.keyword}</a>
                                  : k.keyword}
                              </td>
                              <td className="py-2 pr-3 text-center"><PosBadge pos={k.position} /></td>
                              <td className="py-2 pr-3 text-center text-xs"><ChangeCell change={k.change} /></td>
                              <td className="py-2 pr-3 text-right tabular-nums">{k.volume != null ? fmt(k.volume) : "—"}</td>
                              <td className="py-2 text-right tabular-nums">{k.cpc != null ? `${k.cpc.toFixed(2)} €` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
