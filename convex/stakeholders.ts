import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stakeholders")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("stakeholders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    brandId: v.id("brands"),
    name: v.string(),
    role: v.string(),
    type: v.string(),
    ageRange: v.string(),
    painPoints: v.array(v.string()),
    gains: v.array(v.string()),
    preferredChannels: v.array(v.string()),
    quote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("stakeholders", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("stakeholders"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    type: v.optional(v.string()),
    ageRange: v.optional(v.string()),
    painPoints: v.optional(v.array(v.string())),
    gains: v.optional(v.array(v.string())),
    preferredChannels: v.optional(v.array(v.string())),
    quote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("stakeholders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
