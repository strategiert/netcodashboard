"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

function getISOWeek(dateStr: string): { kw: string; weekStart: string; year: number } {
  const d = new Date(dateStr);
  // Get Monday of that week
  const day = d.getUTCDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  const weekStart = monday.toISOString().slice(0, 10);
  const year = monday.getUTCFullYear();

  // ISO week number
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const dayOfYear = Math.floor((monday.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((dayOfYear + startOfYear.getUTCDay() + 1) / 7);

  return { kw: `KW ${weekNum}`, weekStart, year };
}

export const aggregateBautvWeekly = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const brands = await ctx.runQuery(api.brands.list);
    const brand = (brands as any[]).find((b) => b.slug === "bautv");
    if (!brand) throw new Error("Brand 'bautv' not found");

    // Get all GSC snapshots for bautv (500+ days back)
    const snapshots = await ctx.runQuery(api.kpi.getSnapshotsRange, {
      brandId: brand._id,
      source: "gsc",
      days: 600,
    });

    // Aggregate by week
    const weeks: Record<string, {
      kw: string; weekStart: string; year: number;
      clicks: number; impressions: number; days: number;
    }> = {};

    for (const snap of snapshots as any[]) {
      const { kw, weekStart, year } = getISOWeek(snap.date);
      const key = weekStart;
      if (!weeks[key]) {
        weeks[key] = { kw, weekStart, year, clicks: 0, impressions: 0, days: 0 };
      }
      weeks[key].clicks += snap.clicks ?? 0;
      weeks[key].impressions += snap.impressions ?? 0;
      weeks[key].days++;
    }

    let saved = 0;
    for (const w of Object.values(weeks)) {
      await ctx.runMutation(api.reports.upsertWeeklyReport, {
        brandId: brand._id,
        year: w.year,
        kw: w.kw,
        weekStart: w.weekStart,
        visitors: w.clicks,   // GSC clicks = organic visitors (proxy)
        chSeo: w.clicks,
      });
      saved++;
    }

    return `Aggregated ${saved} weeks for bautv from ${(snapshots as any[]).length} GSC days`;
  },
});
