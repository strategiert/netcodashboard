import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertKeyword = mutation({
  args: {
    brandId: v.id("brands"),
    period: v.string(),
    campaign: v.string(),
    adGroup: v.string(),
    keyword: v.string(),
    matchType: v.optional(v.string()),
    qualityScore: v.optional(v.number()),
    status: v.string(),
    clicks: v.number(),
    cost: v.number(),
    impressions: v.number(),
    conversions: v.number(),
    avgCpc: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("gadsKeywords")
      .withIndex("by_brand_campaign", (q) => q.eq("brandId", args.brandId).eq("campaign", args.campaign))
      .filter((q) =>
        q.and(
          q.eq(q.field("adGroup"), args.adGroup),
          q.eq(q.field("keyword"), args.keyword),
          q.eq(q.field("period"), args.period),
        )
      )
      .first();
    if (existing) { await ctx.db.patch(existing._id, args); return existing._id; }
    return await ctx.db.insert("gadsKeywords", args);
  },
});

export const upsertCampaignStat = mutation({
  args: {
    brandId: v.id("brands"),
    period: v.string(),
    campaign: v.string(),
    campaignType: v.optional(v.string()),
    budget: v.optional(v.number()),
    status: v.string(),
    clicks: v.number(),
    cost: v.number(),
    impressions: v.number(),
    conversions: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("gadsCampaignStats")
      .withIndex("by_brand_period", (q) => q.eq("brandId", args.brandId).eq("period", args.period))
      .filter((q) => q.eq(q.field("campaign"), args.campaign))
      .first();
    if (existing) { await ctx.db.patch(existing._id, args); return existing._id; }
    return await ctx.db.insert("gadsCampaignStats", args);
  },
});

export const upsertAdGroup = mutation({
  args: {
    brandId: v.id("brands"),
    period: v.string(),
    campaign: v.string(),
    adGroup: v.string(),
    status: v.string(),
    clicks: v.number(),
    cost: v.number(),
    impressions: v.number(),
    conversions: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("gadsAdGroups")
      .withIndex("by_brand_campaign", (q) => q.eq("brandId", args.brandId).eq("campaign", args.campaign))
      .filter((q) => q.and(q.eq(q.field("adGroup"), args.adGroup), q.eq(q.field("period"), args.period)))
      .first();
    if (existing) { await ctx.db.patch(existing._id, args); return existing._id; }
    return await ctx.db.insert("gadsAdGroups", args);
  },
});

export const getKeywords = query({
  args: { brandId: v.id("brands"), period: v.string() },
  handler: async (ctx, { brandId, period }) => {
    return await ctx.db
      .query("gadsKeywords")
      .withIndex("by_brand_period", (q) => q.eq("brandId", brandId).eq("period", period))
      .collect();
  },
});

export const getCampaignStats = query({
  args: { brandId: v.id("brands"), period: v.string() },
  handler: async (ctx, { brandId, period }) => {
    return await ctx.db
      .query("gadsCampaignStats")
      .withIndex("by_brand_period", (q) => q.eq("brandId", brandId).eq("period", period))
      .collect();
  },
});

export const getAdGroups = query({
  args: { brandId: v.id("brands"), period: v.string() },
  handler: async (ctx, { brandId, period }) => {
    return await ctx.db
      .query("gadsAdGroups")
      .withIndex("by_brand_period", (q) => q.eq("brandId", brandId).eq("period", period))
      .collect();
  },
});
