import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTodayAllSources = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    // Return most recent snapshot per source (up to 7 days back)
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().slice(0, 10);
    const all = await ctx.db
      .query("kpiSnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).gte("date", sinceStr))
      .order("desc")
      .collect();
    const bySource = new Map<string, typeof all[0]>();
    for (const snap of all) {
      if (!bySource.has(snap.source)) bySource.set(snap.source, snap);
    }
    return Array.from(bySource.values());
  },
});

export const getYesterdayAllSources = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    // Return most recent snapshot per source from 2-8 days ago (for delta comparison)
    const from = new Date();
    from.setDate(from.getDate() - 8);
    const to = new Date();
    to.setDate(to.getDate() - 2);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    const all = await ctx.db
      .query("kpiSnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).gte("date", fromStr).lte("date", toStr))
      .order("desc")
      .collect();
    const bySource = new Map<string, typeof all[0]>();
    for (const snap of all) {
      if (!bySource.has(snap.source)) bySource.set(snap.source, snap);
    }
    return Array.from(bySource.values());
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
    const result = [];
    for (const brand of brands) {
      // Get most recent snapshot per source (look back up to 14 days)
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const sinceStr = since.toISOString().slice(0, 10);
      const all = await ctx.db
        .query("kpiSnapshots")
        .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).gte("date", sinceStr))
        .order("desc")
        .collect();
      // deduplicate: keep most recent snapshot per source
      const bySource = new Map<string, typeof all[0]>();
      for (const snap of all) {
        if (!bySource.has(snap.source)) bySource.set(snap.source, snap);
      }
      result.push({ brand, snapshots: Array.from(bySource.values()) });
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
    socialVideoViews: v.optional(v.number()),
    socialLinkClicks: v.optional(v.number()),
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
