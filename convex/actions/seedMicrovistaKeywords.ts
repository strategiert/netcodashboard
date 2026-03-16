"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
// @ts-ignore
import data from "../data/microvistaGadsExport.json";

export const seedMicrovistaKeywords = action({
  args: { offset: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, { offset = 0, limit = 500 }) => {
    const keywords = (data as any).keywords as any[];
    const batch = keywords.slice(offset, offset + limit);
    let count = 0;
    for (const kw of batch) {
      await ctx.runMutation(api.gads.upsertKeyword, {
        brandId: kw.brandId as any,
        period: "all-time",
        campaign: kw.campaign,
        adGroup: kw.adGroup,
        keyword: kw.keyword,
        matchType: kw.matchType || undefined,
        qualityScore: kw.qualityScore ?? undefined,
        status: kw.status || "Enabled",
        clicks: kw.clicks,
        cost: kw.cost,
        impressions: kw.impressions,
        conversions: kw.conversions,
        avgCpc: kw.avgCpc || undefined,
      });
      count++;
    }
    return `Imported ${count} keywords (offset ${offset}, total ${keywords.length})`;
  },
});
