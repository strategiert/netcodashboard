import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("seoClusters")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("seoClusters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    brandId: v.id("brands"),
    name: v.string(),
    proximity: v.string(),
    description: v.string(),
    topics: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("seoClusters", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("seoClusters"),
    name: v.optional(v.string()),
    proximity: v.optional(v.string()),
    description: v.optional(v.string()),
    topics: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("seoClusters") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
