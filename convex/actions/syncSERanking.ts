"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";

// SE Ranking Site → Brand-Mapping (verifiziert via /v1/project-management/sites).
// Eine Brand kann mehrere Sites haben (Länder/Subsites).
type SiteCfg = { siteId: number; title: string; domain: string };
const BRAND_SITES: Record<string, SiteCfg[]> = {
  bodycam: [{ siteId: 7818764, title: "BC DE", domain: "netco.de" }],
  "bodycam-nl": [{ siteId: 9984911, title: "BC NL", domain: "netco-bodycam.com" }],
  microvista: [{ siteId: 7818656, title: "MV DE", domain: "microvista.de" }],
  bautv: [
    { siteId: 7818788, title: "BK DE", domain: "netco.de" },
    { siteId: 8777207, title: "BK IT", domain: "ediltvpiu.it" },
  ],
  "bautv-nl": [{ siteId: 7818701, title: "BK NL", domain: "bouwtvplus.nl" }],
};

const BASE = "https://api.seranking.com/v1";

function authHeaders() {
  const key = process.env.SERANKING_API_KEY;
  if (!key) throw new Error("SERANKING_API_KEY not set");
  return { Authorization: `Token ${key}`, "Content-Type": "application/json" };
}

async function seGet(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`SE Ranking ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

type PosRow = {
  id: string;
  name: string;
  volume?: number;
  competition?: number;
  cpc?: number;
  positions: Array<{ date: string; pos: number; change?: number }>;
  landing_pages?: Array<{ url: string; date: string }>;
};

export const syncSERanking = action({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const brands = await ctx.runQuery(api.brands.list);
    const results: string[] = [];

    for (const brand of brands) {
      const sites = BRAND_SITES[brand.slug];
      if (!sites) {
        results.push(`SKIP ${brand.slug}: keine SE-Ranking-Site`);
        continue;
      }

      for (const site of sites) {
        try {
          // ── Positions → Keywords + Tages-Aggregat ──────────────────────────
          const engines: Array<{ keywords: PosRow[] }> = await seGet(
            `/project-management/sites/positions?site_id=${site.siteId}&with_landing_pages=1`
          );
          const keywords: PosRow[] = engines.flatMap((e) => e.keywords ?? []);

          // Neuestes Datum im Datensatz bestimmen.
          let latestDate = "";
          for (const kw of keywords)
            for (const p of kw.positions ?? [])
              if (p.date > latestDate) latestDate = p.date;
          if (!latestDate) latestDate = new Date().toISOString().slice(0, 10);

          let ranked = 0, top3 = 0, top10 = 0, top30 = 0, top100 = 0;
          let totalVolume = 0, posSum = 0, weightedVol = 0, sumVol = 0;

          for (const kw of keywords) {
            const latest = (kw.positions ?? []).find((p) => p.date === latestDate);
            const pos = latest?.pos ?? 0;
            const vol = kw.volume ?? 0;
            totalVolume += vol;
            sumVol += vol;
            if (pos > 0) {
              ranked++;
              posSum += pos;
              if (pos <= 3) top3++;
              if (pos <= 10) top10++;
              if (pos <= 30) top30++;
              if (pos <= 100) top100++;
              weightedVol += vol * (Math.max(0, 101 - pos) / 100);
            }
            await ctx.runMutation(api.seranking.upsertKeyword, {
              brandId: brand._id,
              siteId: site.siteId,
              keywordId: kw.id,
              keyword: kw.name,
              date: latestDate,
              position: pos,
              change: latest?.change,
              volume: kw.volume,
              cpc: kw.cpc,
              competition: kw.competition,
              url: kw.landing_pages?.[0]?.url,
            });
          }

          await ctx.runMutation(api.seranking.upsertDaily, {
            brandId: brand._id,
            siteId: site.siteId,
            siteTitle: site.title,
            domain: site.domain,
            date: latestDate,
            totalKeywords: keywords.length,
            ranked,
            top3,
            top10,
            top30,
            top100,
            avgPosition: ranked > 0 ? Math.round((posSum / ranked) * 10) / 10 : undefined,
            totalVolume,
            visibilityScore:
              sumVol > 0 ? Math.round((weightedVol / sumVol) * 1000) / 10 : undefined,
          });

          // ── Competitors ────────────────────────────────────────────────────
          try {
            const comps: Array<{ id: number; name: string; url: string; domain_trust?: number }> =
              await seGet(`/project-management/competitors?site_id=${site.siteId}`);
            await ctx.runMutation(api.seranking.replaceCompetitors, {
              brandId: brand._id,
              siteId: site.siteId,
              competitors: comps.map((c) => ({
                competitorId: c.id,
                name: c.name,
                url: c.url,
                domainTrust: c.domain_trust,
              })),
            });
          } catch (e: any) {
            results.push(`WARN ${brand.slug}/${site.title} competitors: ${e.message}`);
          }

          // ── Backlinks-Summary ──────────────────────────────────────────────
          try {
            const bl = await seGet(
              `/backlinks/summary?target=${encodeURIComponent(site.domain)}&mode=domain`
            );
            const s = bl.summary?.[0];
            if (s) {
              await ctx.runMutation(api.seranking.upsertBacklinks, {
                brandId: brand._id,
                domain: site.domain,
                date: latestDate,
                backlinks: s.backlinks ?? 0,
                refDomains: s.refdomains ?? 0,
                dofollowBacklinks: s.dofollow_backlinks,
                nofollowBacklinks: s.nofollow_backlinks,
                inlinkRank: s.inlink_rank,
                domainInlinkRank: s.domain_inlink_rank,
              });
            }
          } catch (e: any) {
            results.push(`WARN ${brand.slug}/${site.title} backlinks: ${e.message}`);
          }

          results.push(
            `OK ${brand.slug}/${site.title}: ${keywords.length} KW, ${ranked} gerankt, Top10=${top10} (${latestDate})`
          );
        } catch (e: any) {
          results.push(`ERROR ${brand.slug}/${site.title}: ${e.message}`);
        }
      }
    }
    return results;
  },
});

// Backfill: Die Positions-API liefert Ranking-Historie pro Keyword; ohne
// date_from/date_to nur die letzten ~Tage. Schreibt serankingDaily-Aggregate
// für JEDEN Datumspunkt im Zeitraum (der normale Sync schreibt nur den neuesten Tag).
// Lange Zeiträume in Stücken aufrufen: { dateFrom: "2025-01-01", dateTo: "2025-06-30" } usw.
export const backfillSERanking = action({
  args: { dateFrom: v.optional(v.string()), dateTo: v.optional(v.string()) },
  handler: async (ctx, { dateFrom, dateTo }): Promise<string[]> => {
    const brands = await ctx.runQuery(api.brands.list);
    const results: string[] = [];

    for (const brand of brands) {
      const sites = BRAND_SITES[brand.slug];
      if (!sites) continue;

      for (const site of sites) {
        try {
          const range =
            dateFrom && dateTo ? `&date_from=${dateFrom}&date_to=${dateTo}` : "";
          const engines: Array<{ keywords: PosRow[] }> = await seGet(
            `/project-management/sites/positions?site_id=${site.siteId}&with_landing_pages=1${range}`
          );
          const keywords: PosRow[] = engines.flatMap((e) => e.keywords ?? []);

          const allDates = new Set<string>();
          for (const kw of keywords)
            for (const p of kw.positions ?? []) allDates.add(p.date);

          let written = 0;
          for (const date of [...allDates].sort()) {
            let ranked = 0, top3 = 0, top10 = 0, top30 = 0, top100 = 0;
            let totalVolume = 0, posSum = 0, weightedVol = 0, sumVol = 0;
            for (const kw of keywords) {
              const entry = (kw.positions ?? []).find((p) => p.date === date);
              const pos = entry?.pos ?? 0;
              const vol = kw.volume ?? 0;
              totalVolume += vol;
              sumVol += vol;
              if (pos > 0) {
                ranked++;
                posSum += pos;
                if (pos <= 3) top3++;
                if (pos <= 10) top10++;
                if (pos <= 30) top30++;
                if (pos <= 100) top100++;
                weightedVol += vol * (Math.max(0, 101 - pos) / 100);
              }
            }
            await ctx.runMutation(api.seranking.upsertDaily, {
              brandId: brand._id,
              siteId: site.siteId,
              siteTitle: site.title,
              domain: site.domain,
              date,
              totalKeywords: keywords.length,
              ranked,
              top3,
              top10,
              top30,
              top100,
              avgPosition: ranked > 0 ? Math.round((posSum / ranked) * 10) / 10 : undefined,
              totalVolume,
              visibilityScore:
                sumVol > 0 ? Math.round((weightedVol / sumVol) * 1000) / 10 : undefined,
            });
            written++;
          }
          results.push(`OK ${brand.slug}/${site.title}: ${written} Tage Historie`);
        } catch (e: any) {
          results.push(`ERROR ${brand.slug}/${site.title}: ${e.message}`);
        }
      }
    }
    return results;
  },
});
