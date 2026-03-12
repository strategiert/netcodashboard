"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  fb_page: "Facebook", ig_business: "Instagram",
  in_profile: "LinkedIn Profil", in_page: "LinkedIn Seite",
  youtube: "YouTube", twitter: "Twitter/X", tiktok: "TikTok",
};
const PLATFORM_COLORS: Record<string, string> = {
  fb_page: "#1877F2", ig_business: "#E1306C",
  in_profile: "#0A66C2", in_page: "#0A66C2",
  youtube: "#FF0000", twitter: "#1DA1F2", tiktok: "#000000",
};

function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("de-DE");
}
function fmtPct(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return `${n.toFixed(2)}%`;
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

function TotalsBar({ snaps }: { snaps: any[] }) {
  const t = snaps.reduce((acc, s) => ({
    followers:   (acc.followers   ?? 0) + (s.followers   ?? 0),
    connections: (acc.connections ?? 0) + (s.connections ?? 0),
    reach:       (acc.reach       ?? 0) + (s.reach       ?? 0),
    engagement:  (acc.engagement  ?? 0) + (s.engagement  ?? 0),
    videoViews:  (acc.videoViews  ?? 0) + (s.videoViews  ?? 0),
  }), {} as any);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {[
        { label: "Follower gesamt", value: fmt(t.followers), color: "#8b5cf6" },
        { label: "Connections", value: fmt(t.connections), color: "#0A66C2" },
        { label: "Reichweite", value: fmt(t.reach), color: "#f59e0b" },
        { label: "Interaktionen", value: fmt(t.engagement), color: "#22c55e" },
        { label: "Video Views", value: fmt(t.videoViews), color: "#ef4444" },
      ].map(({ label, value, color }) => (
        <div key={label} className="rounded-lg border bg-card p-4" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
          <div className="text-xs text-muted-foreground mb-1">{label}</div>
          <div className="text-xl font-bold tabular-nums">{value}</div>
        </div>
      ))}
    </div>
  );
}

function AccountRow({ snap }: { snap: any }) {
  const color = PLATFORM_COLORS[snap.accountType] ?? "#888";
  return (
    <div className="flex items-start gap-4 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
      <div className="mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="w-44 flex-shrink-0">
        <div className="text-sm font-medium leading-tight">{snap.accountName}</div>
        <Badge variant="outline" className="mt-1 text-xs px-1.5 py-0" style={{ color, borderColor: color }}>
          {PLATFORM_LABELS[snap.accountType] ?? snap.accountType}
        </Badge>
        <div className="mt-1 text-xs text-muted-foreground">{snap.date}</div>
      </div>
      <div className="flex flex-1 flex-wrap gap-x-6 gap-y-2">
        {snap.followers != null && <Metric label="Follower" value={fmt(snap.followers)} />}
        {snap.connections != null && <Metric label="Connections" value={fmt(snap.connections)} />}
        {snap.reach != null && <Metric label="Reichweite" value={fmt(snap.reach)} sub={snap.reachRate ? fmtPct(snap.reachRate) : undefined} />}
        {snap.engagement != null && <Metric label="Interaktionen" value={fmt(snap.engagement)} sub={snap.engagementRate ? fmtPct(snap.engagementRate) : undefined} />}
        {!!snap.videoViews && <Metric label="Video Views" value={fmt(snap.videoViews)} />}
        {!!snap.profileViews && <Metric label="Kanal Views" value={fmt(snap.profileViews)} />}
        {!!snap.linkClicks && <Metric label="Link-Klicks" value={fmt(snap.linkClicks)} />}
        {!!snap.talking && <Metric label="Talking" value={fmt(snap.talking)} />}
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col min-w-[60px]">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

// ─── Posts Tab ───────────────────────────────────────────────────────────────

function PostsTable({ posts }: { posts: any[] }) {
  if (!posts.length) return <p className="text-muted-foreground text-sm">Keine Posts gefunden.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="text-left pb-2 pr-3 font-medium w-8"></th>
            <th className="text-left pb-2 pr-4 font-medium">Beitrag</th>
            <th className="text-left pb-2 pr-3 font-medium">Kanal</th>
            <th className="text-right pb-2 pr-3 font-medium">Reichw.</th>
            <th className="text-right pb-2 pr-3 font-medium">Videos</th>
            <th className="text-right pb-2 pr-3 font-medium">Likes</th>
            <th className="text-right pb-2 pr-3 font-medium">Komm.</th>
            <th className="text-right pb-2 pr-3 font-medium">Geteilt</th>
            <th className="text-right pb-2 font-medium">Eng.%</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {posts.map(p => (
            <tr key={p._id} className="hover:bg-muted/30 transition-colors">
              <td className="py-2 pr-3">
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt="" className="h-9 w-9 rounded object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded bg-muted" />
                )}
              </td>
              <td className="py-2 pr-4 max-w-[260px]">
                <div className="flex items-start gap-1">
                  <span className="line-clamp-2 text-xs leading-relaxed">{p.text ?? "—"}</span>
                  {p.postLink && (
                    <a href={p.postLink} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 mt-0.5">
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {p.publishedAt}
                  {p.postType && <span className="ml-2 uppercase">{p.postType}</span>}
                </div>
              </td>
              <td className="py-2 pr-3">
                <span className="text-xs" style={{ color: PLATFORM_COLORS[p.accountType] ?? "#888" }}>
                  {PLATFORM_LABELS[p.accountType] ?? p.accountType}
                </span>
                <div className="text-xs text-muted-foreground">{p.accountName}</div>
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.reach)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.videoViews)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.likes)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.comments)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.shares)}</td>
              <td className="py-2 text-right tabular-nums">{fmtPct(p.engagementRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TABS = ["Übersicht", "Beitrags-Insights"] as const;
type Tab = typeof TABS[number];

export default function SocialPage() {
  const { brand } = useParams<{ brand: string }>();
  const [tab, setTab] = useState<Tab>("Übersicht");

  const brandData = useQuery(api.brands.getBySlug, { slug: brand });
  const snaps = useQuery(
    api.publer.getAccountsLatest,
    brandData ? { brandId: brandData._id } : "skip"
  );
  const posts = useQuery(
    api.publer.getPostsForBrand,
    brandData ? { brandId: brandData._id, days: 90 } : "skip"
  );

  if (!brandData || snaps === undefined) {
    return <div className="p-6 text-muted-foreground">Lädt…</div>;
  }

  const typeOrder = ["fb_page", "ig_business", "youtube", "in_page", "in_profile"];
  const byType: Record<string, any[]> = {};
  for (const s of snaps ?? []) {
    if (!byType[s.accountType]) byType[s.accountType] = [];
    byType[s.accountType].push(s);
  }
  const sortedTypes = [
    ...typeOrder.filter(t => byType[t]),
    ...Object.keys(byType).filter(t => !typeOrder.includes(t)),
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Social Analytics</h1>
        <p className="text-muted-foreground">{brandData.name}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {t}
            {t === "Beitrags-Insights" && posts !== undefined && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{posts.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "Übersicht" && (
        <>
          <TotalsBar snaps={snaps ?? []} />
          {sortedTypes.map(type => (
            <Card key={type}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PLATFORM_COLORS[type] ?? "#888" }} />
                  {PLATFORM_LABELS[type] ?? type}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({byType[type].length} {byType[type].length === 1 ? "Account" : "Accounts"})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {byType[type].map(snap => <AccountRow key={snap._id} snap={snap} />)}
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {tab === "Beitrags-Insights" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jüngste Beiträge (90 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <PostsTable posts={posts ?? []} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
