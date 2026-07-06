"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bot, ExternalLink, Link2, Search, Sparkles, Target } from "lucide-react";
import { summarizeAiVisibility } from "@/lib/ai-visibility";

const pct = new Intl.NumberFormat("de-DE", {
  style: "percent",
  maximumFractionDigits: 0,
});
const nf = new Intl.NumberFormat("de-DE");

function formatPct(value: number | undefined) {
  return pct.format(value ?? 0);
}

function engineLabel(engine: string) {
  const labels: Record<string, string> = {
    chatgpt: "ChatGPT",
    perplexity: "Perplexity",
    gemini: "Gemini",
    "ai-overview": "AI Overviews",
    "ai-mode": "AI Mode",
    "bing-ai": "Bing AI",
  };
  return labels[engine] ?? engine;
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function AiVisibilityPage() {
  const params = useParams();
  const brandSlug = params.brand as string;
  const brand = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id as Id<"brands"> | undefined;

  const summary = useQuery(
    api.aiVisibility.dashboardSummary,
    brandId ? { brandId, days: 120 } : "skip"
  );
  const snapshots = useQuery(
    api.aiVisibility.listRecentSnapshots,
    brandId ? { brandId, days: 120 } : "skip"
  );
  const promptRows = useQuery(
    api.aiVisibility.listPromptRows,
    brandId ? { brandId, days: 120 } : "skip"
  );
  const citations = useQuery(
    api.aiVisibility.listCitations,
    brandId ? { brandId, days: 120 } : "skip"
  );
  const bingRows = useQuery(
    api.aiVisibility.listBingRows,
    brandId ? { brandId, days: 120 } : "skip"
  );

  const engineRows = useMemo(() => {
    const rows = snapshots ?? [];
    return Array.from(new Set(rows.map((row) => row.engine)))
      .sort()
      .map((engine) => {
        const engineSnapshots = rows.filter((row) => row.engine === engine);
        const engineSummary = summarizeAiVisibility(engineSnapshots);
        return {
          engine: engineLabel(engine),
          score: engineSummary.score,
          mentions: Math.round(engineSummary.mentionRate * 100),
          links: Math.round(engineSummary.linkPresenceRate * 100),
        };
      });
  }, [snapshots]);

  if (!brand || !summary || !promptRows || !citations || !bingRows) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const hasSnapshots = summary.snapshotCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Visibility</h1>
        <p className="text-muted-foreground">
          GEO, AI Search und Bing-Signale fuer {brand.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Visibility Score"
          value={`${summary.score}`}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <KpiCard
          label="Mention Rate"
          value={formatPct(summary.mentionRate)}
          icon={<Bot className="h-4 w-4" />}
        />
        <KpiCard
          label="Citation Share"
          value={formatPct(summary.citationShare)}
          icon={<Link2 className="h-4 w-4" />}
        />
        <KpiCard
          label="Link Presence"
          value={formatPct(summary.linkPresenceRate)}
          icon={<ExternalLink className="h-4 w-4" />}
        />
        <KpiCard
          label="Prompts"
          value={nf.format(promptRows.length)}
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      {!hasSnapshots && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Noch keine AI-Visibility-Daten</p>
            <p className="text-sm text-muted-foreground">
              Der woechentliche SE-Ranking-AI-Sync fuellt diese Ansicht.
            </p>
          </CardContent>
        </Card>
      )}

      {hasSnapshots && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engine-Vergleich</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={engineRows}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="engine" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" name="Score" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mentions" name="Mentions %" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="links" name="Links %" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Citation-Domains</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {citations.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Citation-Domains im Zeitraum.</p>
              )}
              {citations.map((citation) => (
                <div
                  key={citation.domain}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 p-2 text-sm"
                >
                  <span className="truncate">{citation.domain}</span>
                  <Badge variant="outline">{citation.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt-Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[520px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prompt</TableHead>
                  <TableHead className="w-28">Cluster</TableHead>
                  <TableHead className="w-24 text-right">Mention</TableHead>
                  <TableHead className="w-24 text-right">Link</TableHead>
                  <TableHead className="w-24 text-center">Beste Pos.</TableHead>
                  <TableHead className="w-32">Engines</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promptRows.slice(0, 80).map((row) => (
                  <TableRow key={row._id}>
                    <TableCell className="max-w-[420px]">
                      <div className="truncate font-medium">{row.prompt}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.persona} · {row.funnelStage} · Prio {row.priority}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{row.cluster}</TableCell>
                    <TableCell className="text-right text-sm">{formatPct(row.mentionRate)}</TableCell>
                    <TableCell className="text-right text-sm">{formatPct(row.linkPresenceRate)}</TableCell>
                    <TableCell className="text-center text-sm">{row.bestPosition ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.engines.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        {row.engines.map((engine) => (
                          <Badge key={engine} variant="outline" className="text-[10px]">
                            {engineLabel(engine)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bing Search / AI Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[360px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Query / Topic</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Impr.</TableHead>
                  <TableHead className="text-right">AI Cit.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bingRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Keine Bing-Daten im Zeitraum.
                    </TableCell>
                  </TableRow>
                )}
                {bingRows.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell className="text-sm">{row.date}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate text-sm">{row.query ?? row.topic ?? "—"}</div>
                      {row.intent && <div className="text-xs text-muted-foreground">{row.intent}</div>}
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate text-sm">{row.page ?? "—"}</TableCell>
                    <TableCell className="text-right text-sm">{row.clicks != null ? nf.format(row.clicks) : "—"}</TableCell>
                    <TableCell className="text-right text-sm">{row.impressions != null ? nf.format(row.impressions) : "—"}</TableCell>
                    <TableCell className="text-right text-sm">{row.aiCitations != null ? nf.format(row.aiCitations) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
