"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const data = require("../data/bautvGscImport.json") as { brand: string; gsc: Array<{ date: string; avgPosition: number | null; clicks: number; impressions: number; ctr: number }> };

export const seedBautvGsc = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    const brand = (brands as any[]).find((b) => b.slug === data.brand);
    if (!brand) throw new Error(`Brand '${data.brand}' not found`);

    let saved = 0;
    for (const row of data.gsc) {
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
    return `Seeded ${saved} GSC days for ${brand.slug} (${data.gsc[0]?.date} → ${data.gsc[data.gsc.length - 1]?.date})`;
  },
});
