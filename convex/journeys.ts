import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journeys")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("journeys") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithSteps = query({
  args: { id: v.id("journeys") },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.id);
    if (!journey) return null;

    const steps = await ctx.db
      .query("journeySteps")
      .withIndex("by_journey", (q) => q.eq("journeyId", args.id))
      .collect();

    return {
      ...journey,
      steps: steps.sort((a, b) => a.order - b.order),
    };
  },
});

export const create = mutation({
  args: {
    brandId: v.id("brands"),
    name: v.string(),
    role: v.string(),
    situation: v.string(),
    icon: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("journeys", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("journeys"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    situation: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("journeys") },
  handler: async (ctx, args) => {
    // Delete all journey steps first
    const steps = await ctx.db
      .query("journeySteps")
      .withIndex("by_journey", (q) => q.eq("journeyId", args.id))
      .collect();

    for (const step of steps) {
      await ctx.db.delete(step._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Journey Steps
export const createStep = mutation({
  args: {
    journeyId: v.id("journeys"),
    phaseId: v.id("phases"),
    order: v.number(),
    trigger: v.string(),
    searchQuery: v.optional(v.string()),
    contentIds: v.array(v.id("contentPieces")),
    insight: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("journeySteps", args);
  },
});

export const updateStep = mutation({
  args: {
    id: v.id("journeySteps"),
    phaseId: v.optional(v.id("phases")),
    order: v.optional(v.number()),
    trigger: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    contentIds: v.optional(v.array(v.id("contentPieces"))),
    insight: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const removeStep = mutation({
  args: { id: v.id("journeySteps") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
