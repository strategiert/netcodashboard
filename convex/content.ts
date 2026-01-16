import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contentPieces")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
  },
});

export const listByPhase = query({
  args: { phaseId: v.id("phases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contentPieces")
      .withIndex("by_phase", (q) => q.eq("phaseId", args.phaseId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("contentPieces") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getStats = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("contentPieces")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();

    return {
      total: content.length,
      planned: content.filter((c) => c.status === "planned").length,
      inProgress: content.filter((c) => c.status === "in-progress").length,
      done: content.filter((c) => c.status === "done").length,
      priority: content.filter((c) => c.priority === "high").length,
    };
  },
});

export const create = mutation({
  args: {
    brandId: v.id("brands"),
    phaseId: v.id("phases"),
    title: v.string(),
    format: v.string(),
    description: v.string(),
    proximity: v.string(),
    status: v.string(),
    priority: v.optional(v.string()),
    goal: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contentPieces", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("contentPieces"),
    phaseId: v.optional(v.id("phases")),
    title: v.optional(v.string()),
    format: v.optional(v.string()),
    description: v.optional(v.string()),
    proximity: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    goal: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("contentPieces") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("contentPieces"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
