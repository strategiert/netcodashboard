import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertPost = mutation({
  args: {
    brandId: v.id("brands"),
    workspaceId: v.string(),
    publerPostId: v.number(),
    accountId: v.string(),
    accountType: v.string(),
    accountName: v.string(),
    publishedAt: v.string(),
    postLink: v.optional(v.string()),
    postType: v.optional(v.string()),
    text: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    reach: v.optional(v.number()),
    reachRate: v.optional(v.number()),
    videoViews: v.optional(v.number()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    postClicks: v.optional(v.number()),
    engagementRate: v.optional(v.number()),
    linkClicks: v.optional(v.number()),
    ctr: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("publerPosts")
      .withIndex("by_publer_id", (q) => q.eq("publerPostId", args.publerPostId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("publerPosts", args);
  },
});

export const getPostsForBrand = query({
  args: { brandId: v.id("brands"), days: v.optional(v.number()) },
  handler: async (ctx, { brandId, days = 30 }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    return await ctx.db
      .query("publerPosts")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).gte("publishedAt", sinceStr))
      .order("desc")
      .collect();
  },
});

export const upsertAccountSnapshot = mutation({
  args: {
    brandId: v.id("brands"),
    date: v.string(),
    accountId: v.string(),
    accountType: v.string(),
    accountName: v.string(),
    workspaceId: v.string(),
    followers: v.optional(v.number()),
    connections: v.optional(v.number()),
    profileViews: v.optional(v.number()),
    talking: v.optional(v.number()),
    reach: v.optional(v.number()),
    reachRate: v.optional(v.number()),
    engagement: v.optional(v.number()),
    engagementRate: v.optional(v.number()),
    videoViews: v.optional(v.number()),
    linkClicks: v.optional(v.number()),
    ctr: v.optional(v.number()),
    posts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("publerSnapshots")
      .withIndex("by_account_date", (q) => q.eq("accountId", args.accountId).eq("date", args.date))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("publerSnapshots", args);
  },
});

export const getAccountsLatest = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().slice(0, 10);
    const all = await ctx.db
      .query("publerSnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).gte("date", sinceStr))
      .order("desc")
      .collect();
    // keep most recent per accountId
    const byAccount = new Map<string, typeof all[0]>();
    for (const snap of all) {
      if (!byAccount.has(snap.accountId)) byAccount.set(snap.accountId, snap);
    }
    return Array.from(byAccount.values());
  },
});

export const getAccountRange = query({
  args: { accountId: v.string(), days: v.number() },
  handler: async (ctx, { accountId, days }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    return await ctx.db
      .query("publerSnapshots")
      .withIndex("by_account_date", (q) => q.eq("accountId", accountId).gte("date", sinceStr))
      .order("asc")
      .collect();
  },
});

export const getBrandRange = query({
  args: { brandId: v.id("brands"), days: v.number() },
  handler: async (ctx, { brandId, days }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    return await ctx.db
      .query("publerSnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).gte("date", sinceStr))
      .order("asc")
      .collect();
  },
});
