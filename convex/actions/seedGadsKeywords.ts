"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
// @ts-ignore
import data from "../data/gadsExport.json";

const PERIOD = "all-time";

export const seedGadsKeywords = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    const mv = brands.find((b: any) => b.slug === "microvista");
    if (!mv) throw new Error("microvista brand not found");

    let kw = 0, ag = 0, c = 0;

    // Campaigns
    for (const camp of (data as any).campaigns) {
      await ctx.runMutation(api.gads.upsertCampaignStat, {
        brandId: mv._id,
        period: PERIOD,
        campaign: camp.name,
        campaignType: camp.campaignType || undefined,
        budget: camp.budget || undefined,
        status: camp.status || "Enabled",
        clicks: camp.clicks,
        cost: camp.cost,
        impressions: camp.impressions,
        conversions: camp.conversions,
      });
      c++;
    }

    // Ad groups (batch to avoid timeout)
    for (const group of (data as any).adGroups) {
      await ctx.runMutation(api.gads.upsertAdGroup, {
        brandId: mv._id,
        period: PERIOD,
        campaign: group.campaign,
        adGroup: group.adGroup,
        status: group.status || "Enabled",
        clicks: group.clicks,
        cost: group.cost,
        impressions: group.impressions,
        conversions: group.conversions,
      });
      ag++;
    }

    // Keywords in chunks of 50 to stay within limits
    const keywords = (data as any).keywords as any[];
    const CHUNK = 50;
    for (let i = 0; i < keywords.length; i += CHUNK) {
      const chunk = keywords.slice(i, i + CHUNK);
      for (const kword of chunk) {
        await ctx.runMutation(api.gads.upsertKeyword, {
          brandId: mv._id,
          period: PERIOD,
          campaign: kword.campaign,
          adGroup: kword.adGroup,
          keyword: kword.keyword,
          matchType: kword.matchType || undefined,
          qualityScore: kword.qualityScore ?? undefined,
          status: kword.status || "Enabled",
          clicks: kword.clicks,
          cost: kword.cost,
          impressions: kword.impressions,
          conversions: kword.conversions,
          avgCpc: kword.avgCpc || undefined,
        });
        kw++;
      }
    }

    return `Seeded: ${c} campaigns, ${ag} ad groups, ${kw} keywords`;
  },
});
