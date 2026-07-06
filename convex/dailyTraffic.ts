import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertDay = mutation({
  args: {
    brandId: v.id("brands"),
    date: v.string(),
    sessions: v.number(),
    visitors: v.number(),
    pageviews: v.number(),
    chAds: v.optional(v.number()),
    chSeo: v.optional(v.number()),
    chDirect: v.optional(v.number()),
    chSocial: v.optional(v.number()),
    chReferral: v.optional(v.number()),
    chOther: v.optional(v.number()),
    fbStart: v.optional(v.number()),
    fbSchritt: v.optional(v.number()),
    fbErgebnis: v.optional(v.number()),
    fbLead: v.optional(v.number()),
    fbAbbruch: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyTraffic")
      .withIndex("by_brand_date", (q) => q.eq("brandId", args.brandId).eq("date", args.date))
      .first();
    if (existing) { await ctx.db.patch(existing._id, args); return existing._id; }
    return await ctx.db.insert("dailyTraffic", args);
  },
});

export const getRange = query({
  args: { brandId: v.id("brands"), from: v.string(), to: v.string() },
  handler: async (ctx, { brandId, from, to }) => {
    return await ctx.db
      .query("dailyTraffic")
      .withIndex("by_brand_date", (q) =>
        q.eq("brandId", brandId).gte("date", from).lte("date", to)
      )
      .order("asc")
      .collect();
  },
});
