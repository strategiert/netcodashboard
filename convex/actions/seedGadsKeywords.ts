"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
// @ts-ignore
import data from "../data/gadsExportFull.json";

const PERIOD = "all-time";

export const seedGadsKeywords = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    const brandMap: Record<string, string> = {};
    for (const b of brands as any[]) brandMap[b.slug] = b._id;

    const require = (slug: string) => {
      if (!brandMap[slug]) throw new Error(`Brand '${slug}' not found`);
      return brandMap[slug] as any;
    };

    let kw = 0, ag = 0, c = 0;

    for (const camp of (data as any).campaigns) {
      const brandId = require(camp.brand);
      await ctx.runMutation(api.gads.upsertCampaignStat, {
        brandId, period: PERIOD,
        campaign: camp.name, campaignType: camp.campaignType || undefined,
        budget: camp.budget || undefined, status: camp.status || "Enabled",
        clicks: camp.clicks, cost: camp.cost,
        impressions: camp.impressions, conversions: camp.conversions,
      });
      c++;
    }

    for (const group of (data as any).adGroups) {
      const brandId = require(group.brand);
      await ctx.runMutation(api.gads.upsertAdGroup, {
        brandId, period: PERIOD,
        campaign: group.campaign, adGroup: group.adGroup,
        status: group.status || "Enabled",
        clicks: group.clicks, cost: group.cost,
        impressions: group.impressions, conversions: group.conversions,
      });
      ag++;
    }

    const keywords = (data as any).keywords as any[];
    for (const kword of keywords) {
      const brandId = require(kword.brand);
      await ctx.runMutation(api.gads.upsertKeyword, {
        brandId, period: PERIOD,
        campaign: kword.campaign, adGroup: kword.adGroup,
        keyword: kword.keyword, matchType: kword.matchType || undefined,
        qualityScore: kword.qualityScore ?? undefined,
        status: kword.status || "Enabled",
        clicks: kword.clicks, cost: kword.cost,
        impressions: kword.impressions, conversions: kword.conversions,
        avgCpc: kword.avgCpc || undefined,
      });
      kw++;
    }

    return `Seeded: ${c} campaigns, ${ag} ad groups, ${kw} keywords across 4 brands`;
  },
});
