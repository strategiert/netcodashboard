"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";

// Bing Webmaster Tools API — Sites analog GSC verifiziert (Pfad-Properties!).
// netco-bodycam.com (bodycam-nl) ist in Bing WMT noch NICHT verifiziert —
// nachtragen, sobald die Site im Bing-Konto ist.
const BING_SITES: Record<string, string> = {
  bodycam: "https://www.netco.de/body-cam/",
  bautv: "https://www.netco.de/baustellen-webcam/",
  "bautv-nl": "https://bouwtvplus.nl/",
  microvista: "https://www.microvista.de/",
};

// "/Date(1783148400000-0700)/" → "2026-07-04" (Bing liefert Mitternacht Pacific;
// UTC-Anteil des Zeitstempels fällt auf denselben Kalendertag).
function parseBingDate(raw: string): string | null {
  const ms = raw.match(/\/Date\((\d+)/)?.[1];
  if (!ms) return null;
  return new Date(Number(ms)).toISOString().slice(0, 10);
}

async function bingGet(method: string, params: Record<string, string>) {
  const key = process.env.BING_API_KEY;
  if (!key) throw new Error("BING_API_KEY not set");
  const qs = new URLSearchParams({ apikey: key, ...params });
  const res = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/${method}?${qs}`);
  if (!res.ok) throw new Error(`Bing ${method} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// GetRankAndTrafficStats liefert die volle Historie (~16 Monate) in EINEM Call.
// daysBack begrenzt nur, wie weit zurück geschrieben wird (Cron: 7, Backfill: 480).
export const syncBing = action({
  args: { daysBack: v.optional(v.number()) },
  handler: async (ctx, { daysBack = 7 }) => {
    const brands = await ctx.runQuery(api.brands.list);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const results: string[] = [];
    for (const brand of brands) {
      const site = BING_SITES[brand.slug];
      if (!site) { results.push(`SKIP ${brand.slug}: keine Bing-Site`); continue; }
      try {
        const data = await bingGet("GetRankAndTrafficStats", { siteUrl: site });
        let saved = 0;
        for (const row of data.d ?? []) {
          const date = parseBingDate(row.Date ?? "");
          if (!date || date < cutoffStr) continue;
          const clicks = Number(row.Clicks ?? 0);
          const impressions = Number(row.Impressions ?? 0);
          await ctx.runMutation(api.aiVisibility.upsertBingDaily, {
            brandId: brand._id,
            date,
            clicks,
            impressions,
            ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 10000 : undefined,
          });
          saved++;
        }
        results.push(`OK ${brand.slug}: ${saved} Tage (ab ${cutoffStr})`);
      } catch (e: any) {
        results.push(`ERROR ${brand.slug}: ${e.message}`);
      }
    }
    return results;
  },
});
