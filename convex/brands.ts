import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("brands").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const get = query({
  args: { id: v.id("brands") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    colors: v.object({
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
    }),
    logo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("brands", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("brands"),
    name: v.optional(v.string()),
    colors: v.optional(
      v.object({
        primary: v.string(),
        secondary: v.string(),
        accent: v.string(),
      })
    ),
    logo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
