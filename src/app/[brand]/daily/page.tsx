"use client";

import { useQuery, useAction } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";

// ── Datums-Helfer ─────────────────────────────────────────────────────────────

const iso = (d: Date) => d.toISOString().slice(0, 10);
function mondayOf(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return date;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}
const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return `${WEEKDAYS[d.getUTCDay()]} ${dateStr.slice(8)}.${dateStr.slice(5, 7)}.`;
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString("de-DE");
}
function eur(n: number | undefined | null): string {
  if (n == null) return "—";
  return `${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

// ── KPI-Kachel mit Vergleich ──────────────────────────────────────────────────

function DeltaBadge({ cur, prev, invert }: { cur: number; prev: number; invert?: boolean }) {
  if (prev === 0 && cur === 0) return null;
  if (prev === 0) return <span className="text-xs text-muted-foreground">neu</span>;
  const pct = Math.round(((cur - prev) / prev) * 100);
  const good = invert ? pct <= 0 : pct >= 0;
  return (
    <span className={`text-xs font-medium tabular-nums ${good ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
      {pct > 0 ? "+" : ""}{pct} %
    </span>
  );
}

function KpiTile({ label, value, cur, prev, prevLabel, invert }: {
  label: string; value: string; cur: number; prev: number; prevLabel: string; invert?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <DeltaBadge cur={cur} prev={prev} invert={invert} />
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{prevLabel}</div>
    </div>
  );
}

// ── Funnel-Vergleich ──────────────────────────────────────────────────────────

function FunnelCompare({ steps }: { steps: { label: string; cur: number; prev: number }[] }) {
  const max = Math.max(1, ...steps.map(s => Math.max(s.cur, s.prev)));
  return (
    <div className="flex flex-col gap-3">
      {steps.map(s => (
        <div key={s.label} className="flex items-center gap-3">
          <div className="w-24 text-sm text-right text-muted-foreground shrink-0">{s.label}</div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-5 rounded bg-muted overflow-hidden">
              <div className="h-full rounded bg-[#2a78d6] dark:bg-[#3987e5]" style={{ width: `${(s.cur / max) * 100}%` }} />
            </div>
            <div className="h-5 rounded bg-muted overflow-hidden">
              <div className="h-full rounded bg-slate-400/60" style={{ width: `${(s.prev / max) * 100}%` }} />
            </div>
          </div>
          <div className="w-20 text-sm tabular-nums shrink-0">
            <div className="font-semibold">{s.cur}</div>
            <div className="text-xs text-muted-foreground">{s.prev}</div>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm bg-[#2a78d6] dark:bg-[#3987e5]" /> Diese Woche</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm bg-slate-400/60" /> Vorwoche (gleiche Tage)</span>
      </div>
    </div>
  );
}

// ── Chart-Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, isCurrency }: any) {
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

// ── Sync-Button (nur Tages-Traffic + Ads) ─────────────────────────────────────

function DailySyncButton() {
  const syncDaily = useAction(api.actions.syncDailyTraffic.syncDailyTraffic);
  const syncAds = useAction(api.actions.syncAds.syncAds);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handle() {
    setSyncing(true); setMsg(null);
    try {
      const a = await syncDaily({});
      const b = await syncAds();
      const err = [...a, ...b].filter(l => l.startsWith("ERROR"));
      setMsg(err.length ? err.join(" · ") : "Aktualisiert ✓");
    } catch (e: any) {
      setMsg(`Fehler: ${e.message}`);
    }
    setSyncing(false);
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" onClick={handle} disabled={syncing}>
        {syncing ? "Synchronisiere…" : "Zahlen aktualisieren"}
      </Button>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type DayRow = {
  date: string;
  sessions: number; visitors: number; pageviews: number;
  chAds?: number; chSeo?: number; chDirect?: number; chSocial?: number; chReferral?: number; chOther?: number;
  fbStart?: number; fbSchritt?: number; fbErgebnis?: number; fbLead?: number; fbAbbruch?: number;
};

function sumField(rows: DayRow[], field: keyof DayRow): number {
  return rows.reduce((s, r) => s + (Number(r[field]) || 0), 0);
}

export default function DailyReportPage() {
  const { brand } = useParams<{ brand: string }>();
  const brandData = useQuery(api.brands.getBySlug, { slug: brand });

  // Fenster: heute, diese Woche (Mo–heute), Vorwoche gleiche Tage, Vorwoche voll.
  const today = new Date();
  const todayIso = iso(today);
  const thisMon = mondayOf(today);
  const lastMon = addDays(thisMon, -7);
  const lastSun = addDays(thisMon, -1);
  const daysIntoWeek = Math.round((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - thisMon.getTime()) / 86400000) + 1;
  const lastSame = addDays(lastMon, daysIntoWeek - 1);

  const from = iso(addDays(thisMon, -28));
  const traffic = useQuery(
    api.dailyTraffic.getRange,
    brandData ? { brandId: brandData._id, from, to: todayIso } : "skip"
  );
  const adsSnaps = useQuery(
    api.kpi.getAllByDateRange,
    brandData ? { brandId: brandData._id, from, to: todayIso } : "skip"
  );

  if (!brandData || traffic === undefined || adsSnaps === undefined) {
    return <div className="p-6 text-sm text-muted-foreground">Lade Tagesreport…</div>;
  }

  const rows = traffic as DayRow[];
  const inRange = (r: { date: string }, a: Date, b: Date) => r.date >= iso(a) && r.date <= iso(b);

  const cur = rows.filter(r => inRange(r, thisMon, today));
  const prevSame = rows.filter(r => inRange(r, lastMon, lastSame));
  const prevFull = rows.filter(r => inRange(r, lastMon, lastSun));
  const todayRow = rows.find(r => r.date === todayIso);

  const ads = adsSnaps.filter((s: any) => s.source === "ads");
  const adsCur = ads.filter((s: any) => inRange(s, thisMon, today));
  const adsPrevSame = ads.filter((s: any) => inRange(s, lastMon, lastSame));
  const sumAds = (list: any[], f: string) => list.reduce((s, r) => s + (r[f] ?? 0), 0);

  const spendCur = sumAds(adsCur, "adSpend");
  const spendPrev = sumAds(adsPrevSame, "adSpend");
  const convCur = sumAds(adsCur, "adConversions");
  const convPrev = sumAds(adsPrevSame, "adConversions");
  const cplCur = convCur > 0 ? spendCur / convCur : 0;
  const cplPrev = convPrev > 0 ? spendPrev / convPrev : 0;

  // Liniendaten: Sitzungen letzte 28 Tage + Vorwochen-Vergleichslinie ab Wochenstart
  const lineData = rows.map(r => ({
    name: dayLabel(r.date),
    date: r.date,
    Sitzungen: r.sessions,
  }));
  const weekStartLabel = lineData.find(d => d.date === iso(thisMon))?.name;

  // Kanal-Vergleich (diese Woche vs Vorwoche gleiche Tage)
  const channels: { key: keyof DayRow; label: string }[] = [
    { key: "chAds", label: "Ads" },
    { key: "chSeo", label: "SEO" },
    { key: "chDirect", label: "Direkt" },
    { key: "chSocial", label: "Social" },
    { key: "chReferral", label: "Referral" },
    { key: "chOther", label: "Sonstige" },
  ];
  const channelData = channels.map(c => ({
    name: c.label,
    "Diese Woche": sumField(cur, c.key),
    "Vorwoche": sumField(prevSame, c.key),
  }));

  const hasFunnel = rows.some(r => (r.fbStart ?? 0) > 0);
  const funnelSteps = [
    { label: "Starts", cur: sumField(cur, "fbStart"), prev: sumField(prevSame, "fbStart") },
    { label: "Ergebnisse", cur: sumField(cur, "fbErgebnis"), prev: sumField(prevSame, "fbErgebnis") },
    { label: "Leads", cur: sumField(cur, "fbLead"), prev: sumField(prevSame, "fbLead") },
    { label: "Abbrüche", cur: sumField(cur, "fbAbbruch"), prev: sumField(prevSame, "fbAbbruch") },
  ];

  // Tages-Tabelle (letzte 14 Tage, neueste zuerst)
  const adsByDate = new Map(ads.map((s: any) => [s.date, s]));
  const tableRows = [...rows].reverse().slice(0, 14);

  const prevLabel = `Vorwoche gleiche Tage (Mo–${WEEKDAYS[lastSame.getUTCDay()]})`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tagesreport</h1>
          <p className="text-sm text-muted-foreground">
            {brandData.name} · Diese Woche (Mo {iso(thisMon).slice(8)}.{iso(thisMon).slice(5, 7)}. – heute) vs. Vorwoche gleiche Tage
          </p>
        </div>
        <DailySyncButton />
      </div>

      {/* KPI-Kacheln */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiTile label="Sitzungen heute" value={fmt(todayRow?.sessions ?? 0)}
          cur={todayRow?.sessions ?? 0}
          prev={rows.find(r => r.date === iso(addDays(today, -7)))?.sessions ?? 0}
          prevLabel="vs. gleicher Tag Vorwoche" />
        <KpiTile label="Sitzungen (Woche)" value={fmt(sumField(cur, "sessions"))}
          cur={sumField(cur, "sessions")} prev={sumField(prevSame, "sessions")}
          prevLabel={prevLabel} />
        <KpiTile label="Nutzer (Woche)" value={fmt(sumField(cur, "visitors"))}
          cur={sumField(cur, "visitors")} prev={sumField(prevSame, "visitors")}
          prevLabel={prevLabel} />
        <KpiTile label="Ads-Leads (Woche)" value={fmt(Math.round(convCur * 10) / 10)}
          cur={convCur} prev={convPrev}
          prevLabel={prevLabel} />
        <KpiTile label="Ad-Spend (Woche)" value={eur(spendCur)}
          cur={spendCur} prev={spendPrev} invert
          prevLabel={prevLabel} />
        <KpiTile label="Kosten je Lead" value={convCur > 0 ? eur(cplCur) : "—"}
          cur={cplCur} prev={cplPrev} invert
          prevLabel={prevLabel} />
      </div>

      {/* Sitzungen-Verlauf */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Sitzungen pro Tag (letzte 4 Wochen)
            <span className="ml-2 text-xs font-normal text-muted-foreground">gestrichelte Linie = Start der laufenden Woche</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="0" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                {weekStartLabel && (
                  <ReferenceLine x={weekStartLabel} stroke="#2a78d6" strokeDasharray="4 3" />
                )}
                <Line type="monotone" dataKey="Sitzungen" stroke="#2a78d6" strokeWidth={2} dot={false}
                  activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Kanäle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sitzungen nach Kanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="0" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Diese Woche" fill="#2a78d6" radius={[3, 3, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="Vorwoche" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fragebogen-Funnel */}
        {hasFunnel ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fragebogen-Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <FunnelCompare steps={funnelSteps} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Werbekosten pro Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows.map(r => ({ name: dayLabel(r.date), Kosten: (adsByDate.get(r.date) as any)?.adSpend ?? 0 }))}
                    margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="0" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip isCurrency />} />
                    <Bar dataKey="Kosten" fill="#2a78d6" radius={[3, 3, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tages-Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tageswerte (letzte 14 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left pb-2 pr-3 font-medium">Tag</th>
                  <th className="text-right pb-2 pr-3 font-medium">Sitzungen</th>
                  <th className="text-right pb-2 pr-3 font-medium">Nutzer</th>
                  {hasFunnel && <th className="text-right pb-2 pr-3 font-medium">FB-Starts</th>}
                  {hasFunnel && <th className="text-right pb-2 pr-3 font-medium">FB-Leads</th>}
                  <th className="text-right pb-2 pr-3 font-medium">Ads-Kosten</th>
                  <th className="text-right pb-2 font-medium">Ads-Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tableRows.map(r => {
                  const a = adsByDate.get(r.date) as any;
                  const isCur = r.date >= iso(thisMon);
                  return (
                    <tr key={r.date} className={`hover:bg-muted/30 transition-colors ${isCur ? "font-medium" : ""}`}>
                      <td className="py-1.5 pr-3 whitespace-nowrap tabular-nums">{dayLabel(r.date)}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{fmt(r.sessions)}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{fmt(r.visitors)}</td>
                      {hasFunnel && <td className="py-1.5 pr-3 text-right tabular-nums">{fmt(r.fbStart ?? 0)}</td>}
                      {hasFunnel && <td className="py-1.5 pr-3 text-right tabular-nums">{fmt(r.fbLead ?? 0)}</td>}
                      <td className="py-1.5 pr-3 text-right tabular-nums">{a?.adSpend != null ? eur(a.adSpend) : "—"}</td>
                      <td className="py-1.5 text-right tabular-nums">{a?.adConversions != null ? fmt(Math.round(a.adConversions * 10) / 10) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Sitzungen/Nutzer: GA4 (dimensionslose Totals, autoritativ). Ads: Google Ads API, Conversions können ±1 Tag nachlaufen.
            Kanal-Summen können attributionsbedingt leicht von den Totals abweichen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
