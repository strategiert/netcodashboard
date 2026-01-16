import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const phases = await ctx.db
      .query("phases")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
    return phases.sort((a, b) => a.order - b.order);
  },
});

export const get = query({
  args: { id: v.id("phases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    brandId: v.id("brands"),
    order: v.number(),
    name: v.string(),
    shortName: v.string(),
    color: v.string(),
    mindset: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("phases", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("phases"),
    order: v.optional(v.number()),
    name: v.optional(v.string()),
    shortName: v.optional(v.string()),
    color: v.optional(v.string()),
    mindset: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("phases") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
