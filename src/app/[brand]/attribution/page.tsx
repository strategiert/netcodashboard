"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";

const MODELS = [
  { key: "last_non_direct", label: "Last Non-Direct" },
  { key: "last", label: "Last Click" },
  { key: "first", label: "First Click" },
  { key: "linear", label: "Linear" },
  { key: "position", label: "Position (40/20/40)" },
  { key: "time_decay", label: "Time Decay (7 T)" },
] as const;

const RANGES = [30, 90, 180] as const;

function eur(n: number) {
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function num(n: number, digits = 1) {
  return n.toLocaleString("de-DE", { maximumFractionDigits: digits });
}
function fmtTs(ts: number) {
  return new Date(ts).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

type Row = {
  channel: string; campaignId: string; campaignName?: string;
  adgroupId: string; adId: string;
  spend: number; clicks: number; leads: number; revenue: number;
};

function PerfTable({ rows, labelFn }: { rows: Row[]; labelFn: (r: Row) => string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Keine Daten im Zeitraum.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Dimension</th>
            <th className="py-2 pr-4 font-medium text-right">Spend</th>
            <th className="py-2 pr-4 font-medium text-right">Klicks</th>
            <th className="py-2 pr-4 font-medium text-right">Leads</th>
            <th className="py-2 pr-4 font-medium text-right">Umsatz</th>
            <th className="py-2 pr-4 font-medium text-right">CPL</th>
            <th className="py-2 font-medium text-right">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const cpl = r.leads > 0 ? r.spend / r.leads : null;
            const roas = r.spend > 0 ? r.revenue / r.spend : null;
            return (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 pr-4 max-w-[340px] truncate" title={labelFn(r)}>{labelFn(r)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{eur(r.spend)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{num(r.clicks, 0)}</td>
                <td className="py-2 pr-4 text-right tabular-nums font-medium">{num(r.leads)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{eur(r.revenue)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{cpl === null ? "—" : eur(cpl)}</td>
                <td className="py-2 text-right tabular-nums">{roas === null ? "—" : num(roas, 2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Journey({ j }: { j: NonNullable<ReturnType<typeof useJourneys>>[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg">
      <button className="flex w-full items-center gap-2 p-3 text-left" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        <Badge variant={j.type === "lead" ? "default" : "outline"}>{j.type}</Badge>
        <span className="text-sm">{fmtTs(j.ts)}</span>
        <span className="text-sm text-muted-foreground">· {j.timeline.length} Touchpoints</span>
        {j.value > 0 && <span className="ml-auto text-sm tabular-nums">{eur(j.value)}</span>}
      </button>
      {open && (
        <div className="border-t px-4 py-3 space-y-1.5">
          {j.timeline.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Keine zuordenbaren Touchpoints — Conversion konnte nicht mit einer getrackten Sitzung
              verknüpft werden (fehlender pid-/Klick-Match). Das ist ein Coverage-Signal, nicht zwingend „direct".
            </p>
          )}
          {j.timeline.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground tabular-nums w-28 shrink-0">{fmtTs(t.ts)}</span>
              <Badge variant="outline">{t.channel}</Badge>
              <span className="text-muted-foreground">{t.type}</span>
              {t.campaignId && <span className="text-xs text-muted-foreground">K:{t.campaignId}</span>}
              {t.urlPath && <span className="truncate text-muted-foreground max-w-[260px]">{t.urlPath}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function useJourneys() {
  const params = useParams();
  return useQuery(api.attribution.journeyList, { brandSlug: params.brand as string, limit: 20 });
}

export default function AttributionPage() {
  const params = useParams();
  const brandSlug = params.brand as string;
  const [model, setModel] = useState<string>("last_non_direct");
  const [days, setDays] = useState<number>(90);

  const summary = useQuery(api.attribution.attributionSummary, { brandSlug, model, days });
  const alerts = useQuery(api.attribution.qaAlerts, { brandSlug });
  const journeys = useJourneys();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Attribution</h1>
        <Badge variant="outline">Paket D · Regelmodelle</Badge>
        {summary?.computedAt && (
          <span className="ml-auto text-xs text-muted-foreground">
            Stand: {fmtTs(summary.computedAt)} · Generation {summary.generation}
          </span>
        )}
      </div>

      {alerts && alerts.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-950">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{a}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {MODELS.map((m) => (
          <button
            key={m.key}
            onClick={() => setModel(m.key)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              model === m.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {m.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`rounded border px-2 py-1 text-xs ${days === r ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {r} T
            </button>
          ))}
        </div>
      </div>

      {summary === undefined ? (
        <div className="text-sm text-muted-foreground">Lade Attribution …</div>
      ) : summary === null ? (
        <div className="text-sm text-muted-foreground">Keine Marke „{brandSlug}" gefunden.</div>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>Nach Kanal</CardTitle></CardHeader>
            <CardContent>
              <PerfTable
                rows={summary.byChannel}
                labelFn={(r) => (r.channel === "unattributed" ? "nicht zuordenbar (Coverage-Lücke)" : r.channel)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Nach Kampagne</CardTitle></CardHeader>
            <CardContent>
              <PerfTable rows={summary.byCampaign} labelFn={(r) => r.campaignName || r.campaignId || `(${r.channel} ohne Kampagne)`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Nach Anzeige (Top 100 nach Spend)</CardTitle></CardHeader>
            <CardContent>
              <PerfTable
                rows={summary.byAd}
                labelFn={(r) => `${r.campaignName || r.campaignId || r.channel} › ${r.adId || (r.adgroupId ? `AG ${r.adgroupId}` : "—")}`}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader><CardTitle>Journeys (letzte Conversions)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {journeys === undefined && <p className="text-sm text-muted-foreground">Lade Journeys …</p>}
          {journeys && journeys.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Conversions.</p>}
          {journeys?.map((j) => <Journey key={j.conversionId} j={j} />)}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Leads/Umsatz sind modellgewichtet (Nachkommastellen entstehen durch Aufteilung auf mehrere Touchpoints).
        Kosten kommen tagesgenau aus den Ad-Plattformen (Paket B); organische Kanäle haben keinen Spend.
        Umsatz füllt sich erst mit dem HubSpot-Sync (deal_won).
      </p>
    </div>
  );
}
