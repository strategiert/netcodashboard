"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { TrendingUp, Link2, Users, Search, RefreshCw } from "lucide-react";

function posBadge(pos: number) {
  if (pos === 0) return <Badge variant="outline" className="text-muted-foreground">—</Badge>;
  if (pos <= 3) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{pos}</Badge>;
  if (pos <= 10) return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{pos}</Badge>;
  if (pos <= 30) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{pos}</Badge>;
  return <Badge variant="outline">{pos}</Badge>;
}

function changeCell(change?: number) {
  if (!change) return <span className="text-muted-foreground">·</span>;
  if (change > 0) return <span className="text-green-400">▲ {change}</span>;
  return <span className="text-red-400">▼ {Math.abs(change)}</span>;
}

const nf = new Intl.NumberFormat("de-DE");

export default function RankingsPage() {
  const params = useParams();
  const brandSlug = params.brand as string;
  const brand = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id as Id<"brands"> | undefined;

  const daily = useQuery(api.seranking.getDailyRange, brandId ? { brandId, days: 30 } : "skip");
  const keywords = useQuery(api.seranking.listKeywords, brandId ? { brandId } : "skip");
  const competitors = useQuery(api.seranking.listCompetitors, brandId ? { brandId } : "skip");
  const backlinks = useQuery(api.seranking.latestBacklinks, brandId ? { brandId } : "skip");
  const research = useQuery(api.seranking.listResearch, brandId ? { brandId } : "skip");

  const syncSE = useAction(api.actions.syncSERanking.syncSERanking);
  const researchKw = useAction(api.actions.serankingResearch.researchKeywords);

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string[] | null>(null);
  const [kwInput, setKwInput] = useState("");
  const [researching, setResearching] = useState(false);

  async function handleSync() {
    setSyncing(true); setSyncMsg(null);
    try { setSyncMsg(await syncSE()); }
    catch (e: any) { setSyncMsg([`ERROR: ${e.message}`]); }
    setSyncing(false);
  }

  async function handleResearch() {
    if (!kwInput.trim()) return;
    setResearching(true);
    try {
      await researchKw({
        keywords: kwInput.split("\n").map((k) => k.trim()).filter(Boolean),
        source: "de",
        brandId,
      });
      setKwInput("");
    } catch (e: any) { alert(`Research-Fehler: ${e.message}`); }
    setResearching(false);
  }

  if (!brand) {
    return <div className="h-8 w-48 animate-pulse rounded bg-muted" />;
  }

  // Trend: pro Datum über alle Sites der Brand aggregieren.
  const trendMap = new Map<string, { date: string; top10: number; ranked: number; vis: number; n: number }>();
  for (const d of daily ?? []) {
    const e = trendMap.get(d.date) ?? { date: d.date, top10: 0, ranked: 0, vis: 0, n: 0 };
    e.top10 += d.top10; e.ranked += d.ranked; e.vis += d.visibilityScore ?? 0; e.n += 1;
    trendMap.set(d.date, e);
  }
  const trend = Array.from(trendMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date.slice(5), Top10: e.top10, Sichtbarkeit: Math.round((e.vis / e.n) * 10) / 10 }));

  // Aktuellster Stand (letztes Datum) für KPI-Karten.
  const latestDate = (daily ?? []).reduce((m, d) => (d.date > m ? d.date : m), "");
  const latestRows = (daily ?? []).filter((d) => d.date === latestDate);
  const sumTop3 = latestRows.reduce((s, d) => s + d.top3, 0);
  const sumTop10 = latestRows.reduce((s, d) => s + d.top10, 0);
  const sumRanked = latestRows.reduce((s, d) => s + d.ranked, 0);
  const sumKw = latestRows.reduce((s, d) => s + d.totalKeywords, 0);
  const avgVis = latestRows.length
    ? Math.round((latestRows.reduce((s, d) => s + (d.visibilityScore ?? 0), 0) / latestRows.length) * 10) / 10
    : 0;
  const totalBacklinks = (backlinks ?? []).reduce((s, b) => s + b.backlinks, 0);
  const totalRefDomains = (backlinks ?? []).reduce((s, b) => s + b.refDomains, 0);

  const hasData = (daily?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rankings</h1>
          <p className="text-muted-foreground">
            SE Ranking — Sichtbarkeit, Keywords, Wettbewerber & Backlinks für {brand.name}
          </p>
        </div>
        <div className="space-y-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Synchronisiere…" : "SE Ranking aktualisieren"}
          </Button>
        </div>
      </div>

      {syncMsg && (
        <div className="rounded-md border p-3 text-xs space-y-1">
          {syncMsg.map((l, i) => (
            <div key={i} className={l.startsWith("ERROR") ? "text-destructive" : "text-muted-foreground"}>{l}</div>
          ))}
        </div>
      )}

      {!hasData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Noch keine SE-Ranking-Daten</p>
            <p className="text-sm text-muted-foreground">
              Klicke auf „SE Ranking aktualisieren“, um den ersten Sync zu starten.
            </p>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          {/* KPI-Karten */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <KpiCard label="Sichtbarkeit" value={`${avgVis}`} icon={<TrendingUp className="h-4 w-4" />} />
            <KpiCard label="Top 3" value={nf.format(sumTop3)} />
            <KpiCard label="Top 10" value={nf.format(sumTop10)} />
            <KpiCard label="Gerankt" value={`${nf.format(sumRanked)} / ${nf.format(sumKw)}`} />
            <KpiCard label="Backlinks" value={nf.format(totalBacklinks)} icon={<Link2 className="h-4 w-4" />} />
            <KpiCard label="Ref. Domains" value={nf.format(totalRefDomains)} />
          </div>

          {/* Trend */}
          {trend.length > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Sichtbarkeit & Top-10 (30 Tage)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line yAxisId="l" type="monotone" dataKey="Top10" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line yAxisId="r" type="monotone" dataKey="Sichtbarkeit" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Competitors */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Wettbewerber</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(competitors ?? []).slice(0, 12).map((c) => (
                    <div key={c._id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 text-sm">
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                        {c.name.replace(/^https?:\/\//, "")}
                      </a>
                      {c.domainTrust != null && <Badge variant="outline">DT {c.domainTrust}</Badge>}
                    </div>
                  ))}
                  {(competitors?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Keine Wettbewerber.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Backlinks pro Domain */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" /> Backlinks</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(backlinks ?? []).map((b) => (
                    <div key={b._id} className="rounded-lg bg-muted/40 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{b.domain}</span>
                        {b.domainInlinkRank != null && <Badge variant="outline">DT {b.domainInlinkRank}</Badge>}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {nf.format(b.backlinks)} Backlinks · {nf.format(b.refDomains)} Ref-Domains
                        {b.dofollowBacklinks != null && ` · ${nf.format(b.dofollowBacklinks)} dofollow`}
                      </div>
                    </div>
                  ))}
                  {(backlinks?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Keine Backlink-Daten.</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Keyword-Tabelle */}
          <Card>
            <CardHeader><CardTitle className="text-base">Getrackte Keywords ({keywords?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-[480px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead className="w-20 text-center">Pos.</TableHead>
                      <TableHead className="w-20 text-center">Δ</TableHead>
                      <TableHead className="w-24 text-right">Volumen</TableHead>
                      <TableHead className="w-20 text-right">CPC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(keywords ?? []).slice(0, 500).map((k) => (
                      <TableRow key={k._id}>
                        <TableCell className="max-w-[320px] truncate">
                          {k.url ? <a href={k.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{k.keyword}</a> : k.keyword}
                        </TableCell>
                        <TableCell className="text-center">{posBadge(k.position)}</TableCell>
                        <TableCell className="text-center text-xs">{changeCell(k.change)}</TableCell>
                        <TableCell className="text-right text-sm">{k.volume != null ? nf.format(k.volume) : "—"}</TableCell>
                        <TableCell className="text-right text-sm">{k.cpc != null ? `${k.cpc.toFixed(2)} €` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Keyword-Research (on-demand, Data API) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4" /> Keyword-Research</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Keywords (eins pro Zeile) — Volumen/Difficulty/Intent via SE Ranking Data API (DE). Kostet 100 Credits pro Abfrage.
          </p>
          <Textarea
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            placeholder={"baustellenkamera\nbody cam test\nindustrielle ct"}
            rows={4}
          />
          <Button size="sm" onClick={handleResearch} disabled={researching || !kwInput.trim()}>
            {researching ? "Recherchiere…" : "Recherchieren"}
          </Button>

          {(research?.length ?? 0) > 0 && (
            <div className="max-h-[360px] overflow-auto pt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead className="w-24 text-right">Volumen</TableHead>
                    <TableHead className="w-20 text-right">CPC</TableHead>
                    <TableHead className="w-20 text-center">Diff.</TableHead>
                    <TableHead className="w-24 text-center">Intent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(research ?? []).map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="max-w-[320px] truncate">{r.keyword}</TableCell>
                      <TableCell className="text-right text-sm">{r.volume != null ? nf.format(r.volume) : "—"}</TableCell>
                      <TableCell className="text-right text-sm">{r.cpc != null ? `${r.cpc.toFixed(2)} €` : "—"}</TableCell>
                      <TableCell className="text-center text-sm">{r.difficulty ?? "—"}</TableCell>
                      <TableCell className="text-center text-xs">{r.intents?.join(", ") ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
