"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
// @ts-ignore
import data from "../data/bautvGscImport.json";

export const seedBautvGsc = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    const brand = (brands as any[]).find((b) => b.slug === (data as any).brand);
    if (!brand) throw new Error(`Brand '${(data as any).brand}' not found`);

    let saved = 0;
    for (const row of (data as any).gsc) {
      await ctx.runMutation(api.kpi.upsertSnapshot, {
        brandId: brand._id,
        date: row.date,
        source: "gsc",
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        avgPosition: row.avgPosition ?? undefined,
      });
      saved++;
    }
    return `Seeded ${saved} GSC days for ${brand.slug} (${(data as any).gsc[0]?.date} → ${(data as any).gsc[(data as any).gsc.length - 1]?.date})`;
  },
});
