import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTodayAllSources = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    const today = new Date().toISOString().slice(0, 10);
    return await ctx.db
      .query("kpiSnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).eq("date", today))
      .collect();
  },
});

export const getYesterdayAllSources = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);
    return await ctx.db
      .query("kpiSnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).eq("date", yesterday))
      .collect();
  },
});

export const getSnapshotsRange = query({
  args: { brandId: v.id("brands"), source: v.string(), days: v.number() },
  handler: async (ctx, { brandId, source, days }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    return await ctx.db
      .query("kpiSnapshots")
      .withIndex("by_brand_source_date", (q) =>
        q.eq("brandId", brandId).eq("source", source as any).gte("date", sinceStr)
      )
      .order("asc")
      .collect();
  },
});

export const getAllBrandsLatest = query({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.db.query("brands").collect();
    const today = new Date().toISOString().slice(0, 10);
    const result = [];
    for (const brand of brands) {
      const snapshots = await ctx.db
        .query("kpiSnapshots")
        .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).eq("date", today))
        .collect();
      result.push({ brand, snapshots });
    }
    return result;
  },
});

export const getTarget = query({
  args: { brandId: v.id("brands"), year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kpiTargets")
      .withIndex("by_brand_year_month", (q) =>
        q.eq("brandId", args.brandId).eq("year", args.year).eq("month", args.month)
      )
      .first() ?? null;
  },
});

export const upsertSnapshot = mutation({
  args: {
    brandId: v.id("brands"),
    date: v.string(),
    source: v.union(v.literal("gsc"), v.literal("publer"), v.literal("ads"), v.literal("manual")),
    clicks: v.optional(v.number()),
    impressions: v.optional(v.number()),
    ctr: v.optional(v.number()),
    avgPosition: v.optional(v.number()),
    socialReach: v.optional(v.number()),
    socialEngagement: v.optional(v.number()),
    socialFollowers: v.optional(v.number()),
    socialPosts: v.optional(v.number()),
    adSpend: v.optional(v.number()),
    adClicks: v.optional(v.number()),
    adImpressions: v.optional(v.number()),
    adConversions: v.optional(v.number()),
    adCpc: v.optional(v.number()),
    leadsCount: v.optional(v.number()),
    leadsNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kpiSnapshots")
      .withIndex("by_brand_source_date", (q) =>
        q.eq("brandId", args.brandId).eq("source", args.source).eq("date", args.date)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("kpiSnapshots", args);
  },
});

export const upsertTarget = mutation({
  args: {
    brandId: v.id("brands"),
    year: v.number(),
    month: v.number(),
    targetClicks: v.optional(v.number()),
    targetLeads: v.optional(v.number()),
    targetReach: v.optional(v.number()),
    targetAdSpend: v.optional(v.number()),
    targetConversions: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kpiTargets")
      .withIndex("by_brand_year_month", (q) =>
        q.eq("brandId", args.brandId).eq("year", args.year).eq("month", args.month)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("kpiTargets", args);
  },
});
