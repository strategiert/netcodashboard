"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

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

function CrmFunnel({ leads }: { leads: any[] }) {
  const total     = leads.length;
  const offers    = leads.filter(l => l.offerMade).length;
  const orders    = leads.filter(l => l.orderReceived).length;
  const newCusts  = leads.filter(l => l.newCustomer).length;

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
              style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }}
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

// ── Campaigns Table ───────────────────────────────────────────────────────────

function CampaignsTable({ campaigns }: { campaigns: any[] }) {
  if (!campaigns.length) return <p className="text-sm text-muted-foreground">Keine Kampagnen.</p>;

  const sorted = [...campaigns].sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="text-left pb-2 pr-4 font-medium">Kampagne</th>
            <th className="text-left pb-2 pr-3 font-medium">Typ</th>
            <th className="text-right pb-2 pr-3 font-medium">Budget/Tag</th>
            <th className="text-right pb-2 pr-3 font-medium">Ausgaben</th>
            <th className="text-right pb-2 pr-3 font-medium">Impressionen</th>
            <th className="text-right pb-2 pr-3 font-medium">Klicks</th>
            <th className="text-right pb-2 pr-3 font-medium">CTR</th>
            <th className="text-right pb-2 pr-3 font-medium">Konvers.</th>
            <th className="text-right pb-2 font-medium">Kosten/Conv.</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map(c => {
            const costPerConv = c.conversions && c.conversions > 0 && c.spend != null
              ? c.spend / c.conversions : null;
            return (
              <tr key={c._id} className="hover:bg-muted/30 transition-colors">
                <td className="py-2 pr-4 font-medium text-xs">{c.campaignName}</td>
                <td className="py-2 pr-3">
                  {c.campaignType && (
                    <Badge variant="outline" className="text-xs">{c.campaignType}</Badge>
                  )}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{c.budgetPerDay != null ? `${c.budgetPerDay} €` : "—"}</td>
                <td className="py-2 pr-3 text-right tabular-nums font-medium">{eur(c.spend)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmt(c.impressions)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmt(c.clicks)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{pct(c.ctr)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{c.conversions ?? "—"}</td>
                <td className="py-2 text-right tabular-nums font-medium">{eur(costPerConv)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t font-semibold text-xs">
            <td colSpan={3} className="pt-2 pr-4 text-muted-foreground">Gesamt</td>
            <td className="pt-2 pr-3 text-right tabular-nums">{eur(sorted.reduce((a, c) => a + (c.spend ?? 0), 0))}</td>
            <td className="pt-2 pr-3 text-right tabular-nums">{fmt(sorted.reduce((a, c) => a + (c.impressions ?? 0), 0))}</td>
            <td className="pt-2 pr-3 text-right tabular-nums">{fmt(sorted.reduce((a, c) => a + (c.clicks ?? 0), 0))}</td>
            <td className="pt-2 pr-3"></td>
            <td className="pt-2 pr-3 text-right tabular-nums">{sorted.reduce((a, c) => a + (c.conversions ?? 0), 0).toFixed(2)}</td>
            {(() => {
              const totalSpend = sorted.reduce((a, c) => a + (c.spend ?? 0), 0);
              const totalConv  = sorted.reduce((a, c) => a + (c.conversions ?? 0), 0);
              return <td className="pt-2 text-right tabular-nums">{totalConv > 0 ? eur(totalSpend / totalConv) : "—"}</td>;
            })()}
          </tr>
        </tfoot>
      </table>
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

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.fill ?? p.stroke }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold tabular-nums">{typeof p.value === "number" ? p.value.toLocaleString("de-DE") : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const { brand } = useParams<{ brand: string }>();
  const brandData = useQuery(api.brands.getBySlug, { slug: brand });

  const reports = useQuery(
    api.reports.getWeeklyReports,
    brandData ? { brandId: brandData._id, year: 2026 } : "skip"
  );
  const leads = useQuery(
    api.reports.getCrmLeads,
    brandData ? { brandId: brandData._id } : "skip"
  );
  const campaigns = useQuery(
    api.reports.getAdsCampaigns,
    brandData ? { brandId: brandData._id, period: "Q1 2026" } : "skip"
  );
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

  if (!brandData || reports === undefined) {
    return <div className="p-6 text-muted-foreground">Lädt…</div>;
  }

  // ── KPI Summaries ──────────────────────────────────────────────────────────
  const totalVisitors = reports.reduce((a, r) => a + (r.visitors ?? 0), 0);
  const totalLeads    = reports.reduce((a, r) => a + (r.leads ?? 0), 0);
  const totalAdSpendWeekly = reports.reduce((a, r) => a + (r.adSpend ?? 0), 0);
  const totalAdSpendGads   = gadsCampaigns?.reduce((a, c) => a + (c.cost ?? 0), 0) ?? 0;
  const totalAdSpend = totalAdSpendWeekly > 0 ? totalAdSpendWeekly : totalAdSpendGads;
  const totalCrmLeads = leads?.length ?? 0;
  const ordersWon     = leads?.filter(l => l.orderReceived).length ?? 0;
  const newCustomers  = leads?.filter(l => l.newCustomer).length ?? 0;

  // ── Weekly Chart Data ──────────────────────────────────────────────────────
  const weeklyData = reports.map(r => ({
    name:    r.kw,
    Ads:     r.chAds ?? 0,
    SEO:     r.chSeo ?? 0,
    "Type-in": r.chDirect ?? 0,
    Social:  r.chSocial ?? 0,
    Referral: r.chReferral ?? 0,
    Leads:   r.leads ?? 0,
    "Werbekosten": r.adSpend ?? 0,
  }));

  // ── Top Keywords ───────────────────────────────────────────────────────────
  const kwFreq: Record<string, { count: number; lastSeen: string }> = {};
  for (const r of reports) {
    if (!r.topKeyword) continue;
    if (!kwFreq[r.topKeyword]) kwFreq[r.topKeyword] = { count: 0, lastSeen: r.kw };
    kwFreq[r.topKeyword].count++;
    kwFreq[r.topKeyword].lastSeen = r.kw;
  }
  const topKeywords = Object.entries(kwFreq)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  // ── Language Data ──────────────────────────────────────────────────────────
  const langData = reports.map(r => ({
    name: r.kw,
    DE: r.visitorsDE ?? 0,
    EN: r.visitorsEN ?? 0,
    FR: r.visitorsFR ?? 0,
    IT: r.visitorsIT ?? 0,
  }));

  const CH_COLORS: Record<string, string> = {
    Ads:      "#ef4444",
    SEO:      "#22c55e",
    "Type-in": "#3b82f6",
    Social:   "#8b5cf6",
    Referral: "#f59e0b",
  };
  const LANG_COLORS: Record<string, string> = {
    DE: "#3b82f6",
    EN: "#f59e0b",
    FR: "#8b5cf6",
    IT: "#22c55e",
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wochenbericht Q1 2026</h1>
        <p className="text-muted-foreground">{brandData.name} · KW 1 – KW 11</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Besucher gesamt"  value={fmt(totalVisitors)}  color="#3b82f6" />
        <KpiCard label="Website-Leads"    value={String(totalLeads)}  color="#22c55e" />
        <KpiCard label="Werbekosten"      value={eur(totalAdSpend)}   color="#ef4444" />
        <KpiCard label="CRM Anfragen"     value={String(totalCrmLeads)} color="#8b5cf6" />
        <KpiCard label="Aufträge erhalten" value={String(ordersWon)} sub={`${Math.round((ordersWon / Math.max(totalCrmLeads, 1)) * 100)} % Conv.`} color="#22c55e" />
        <KpiCard label="Neukunden"        value={String(newCustomers)} color="#f59e0b" />
      </div>

      {/* Traffic by Channel Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Traffic-Kanäle pro KW</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {Object.entries(CH_COLORS).map(([key, color]) => (
                <Bar key={key} dataKey={key} stackId="a" fill={color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Leads + Ad Spend Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Website-Leads pro KW</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Leads" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Werbekosten pro KW (€)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line dataKey="Werbekosten" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Language Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Besucher nach Sprache</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={langData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {Object.entries(LANG_COLORS).map(([key, color]) => (
                <Bar key={key} dataKey={key} stackId="a" fill={color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Keywords (GSC)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Per-KW row */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left pb-2 pr-4 font-medium">KW</th>
                    <th className="text-left pb-2 font-medium">Top-Keyword</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reports.filter(r => r.topKeyword).map(r => (
                    <tr key={r._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-1.5 pr-4 text-xs text-muted-foreground tabular-nums">{r.kw}</td>
                      <td className="py-1.5 text-xs font-mono">{r.topKeyword}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Frequency summary */}
            {topKeywords.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Häufigkeit über alle KWs</p>
                <div className="space-y-1.5">
                  {topKeywords.map(([kw, { count }]) => (
                    <div key={kw} className="flex items-center gap-3">
                      <div className="flex-1 font-mono text-xs truncate">{kw}</div>
                      <div className="w-32 h-5 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full rounded bg-primary/60"
                          style={{ width: `${(count / reports.length) * 100}%` }}
                        />
                      </div>
                      <div className="w-20 text-right text-xs text-muted-foreground tabular-nums">
                        {count}× ({Math.round((count / reports.length) * 100)} %)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CRM Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CRM Pipeline (Gesamt)</CardTitle>
        </CardHeader>
        <CardContent>
          <CrmFunnel leads={leads ?? []} />
        </CardContent>
      </Card>

      {/* Google Ads Campaigns Q1 — only when data exists */}
      {campaigns && campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google Ads Kampagnen — Q1 2026</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignsTable campaigns={campaigns} />
          </CardContent>
        </Card>
      )}

      {/* Google Ads Editor — Campaign Stats */}
      {gadsCampaigns && gadsCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google Ads — Kampagnen (Gesamt)</CardTitle>
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

      {/* Ad Group Breakdown */}
      {gadsAdGroups && gadsAdGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google Ads — Anzeigengruppen</CardTitle>
          </CardHeader>
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
        const sorted = [...gadsKeywords].sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks);
        const topByConv   = sorted.filter(k => k.conversions > 0).slice(0, 20);
        const topByClicks = [...gadsKeywords].filter(k => k.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 20);
        const enabledKws  = gadsKeywords.filter(k => k.status === "Enabled");
        const qsKws       = enabledKws.filter(k => k.qualityScore != null);
        const avgQs       = qsKws.length > 0 ? qsKws.reduce((a, k) => a + (k.qualityScore ?? 0), 0) / qsKws.length : null;
        const qsDist = [1,2,3,4,5,6,7,8,9,10].map(n => ({
          qs: String(n), count: qsKws.filter(k => k.qualityScore === n).length
        }));

        return (
          <>
            {/* QS Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Google Ads — Quality Score Übersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-4">
                  <KpiCard label="Keywords gesamt" value={String(gadsKeywords.length)} color="#8b5cf6" />
                  <KpiCard label="Aktiv" value={String(enabledKws.length)} color="#22c55e" />
                  <KpiCard label="Mit QS" value={String(qsKws.length)} color="#3b82f6" />
                  <KpiCard label="Ø Quality Score" value={avgQs != null ? avgQs.toFixed(1) : "—"} color={avgQs && avgQs >= 7 ? "#22c55e" : avgQs && avgQs >= 4 ? "#f59e0b" : "#ef4444"} />
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={qsDist} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="qs" tick={{ fontSize: 11 }} label={{ value: "Quality Score", position: "insideBottom", offset: -2, fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Keywords" fill="#8b5cf6" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Keywords by Conversions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Keywords — nach Conversions</CardTitle>
              </CardHeader>
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
                        const qs = k.qualityScore;
                        const qsColor = qs != null ? (qs >= 7 ? "#22c55e" : qs >= 4 ? "#f59e0b" : "#ef4444") : "#94a3b8";
                        return (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="py-2 pr-4 font-medium text-xs max-w-[180px] truncate">{k.keyword}</td>
                            <td className="py-2 pr-3"><Badge variant="outline" className="text-xs">{k.matchType}</Badge></td>
                            <td className="py-2 pr-3 text-xs text-muted-foreground truncate max-w-[120px]">{k.adGroup}</td>
                            <td className="py-2 pr-3 text-center">
                              {qs != null ? (
                                <span className="text-xs font-bold" style={{ color: qsColor }}>{qs}</span>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
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

            {/* Top Keywords by Clicks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Keywords — nach Klicks</CardTitle>
              </CardHeader>
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
                        const qs = k.qualityScore;
                        const qsColor = qs != null ? (qs >= 7 ? "#22c55e" : qs >= 4 ? "#f59e0b" : "#ef4444") : "#94a3b8";
                        return (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="py-2 pr-4 font-medium text-xs max-w-[200px] truncate">{k.keyword}</td>
                            <td className="py-2 pr-3"><Badge variant="outline" className="text-xs">{k.matchType}</Badge></td>
                            <td className="py-2 pr-3 text-center">
                              {qs != null ? (
                                <span className="text-xs font-bold" style={{ color: qsColor }}>{qs}</span>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
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

      {/* CRM Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            CRM Anfragen
            <span className="text-xs font-normal text-muted-foreground">{(leads ?? []).length} Einträge</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeadsTable leads={leads ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
