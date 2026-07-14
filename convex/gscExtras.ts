import { v } from "convex/values";
import { internalMutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Upserts + Admin-Queries für GSC-Erweiterungen (Brand-Split, Index-Coverage).

async function brandBySlug(ctx: QueryCtx | MutationCtx, slug: string) {
  return await ctx.db.query("brands").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
}

export const upsertQuerySplit = internalMutation({
  args: {
    brandSlug: v.string(), date: v.string(),
    brandClicks: v.number(), brandImpressions: v.number(),
    nonBrandClicks: v.number(), nonBrandImpressions: v.number(),
    topNonBrandQueries: v.string(),
  },
  handler: async (ctx, { brandSlug, ...day }) => {
    const brand = await brandBySlug(ctx, brandSlug);
    if (!brand) throw new Error(`Brand ${brandSlug} fehlt`);
    const existing = await ctx.db
      .query("gscQuerySplitDaily")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).eq("date", day.date))
      .unique();
    const doc = { brandId: brand._id, ...day, syncedAt: Date.now() };
    if (existing) await ctx.db.patch(existing._id, doc);
    else await ctx.db.insert("gscQuerySplitDaily", doc);
  },
});

export const upsertIndexCoverage = internalMutation({
  args: {
    brandSlug: v.string(), date: v.string(),
    inspected: v.number(), indexed: v.number(), notIndexed: v.number(),
    failures: v.string(),
  },
  handler: async (ctx, { brandSlug, ...day }) => {
    const brand = await brandBySlug(ctx, brandSlug);
    if (!brand) throw new Error(`Brand ${brandSlug} fehlt`);
    const existing = await ctx.db
      .query("indexCoverage")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).eq("date", day.date))
      .unique();
    const doc = { brandId: brand._id, ...day, syncedAt: Date.now() };
    if (existing) await ctx.db.patch(existing._id, doc);
    else await ctx.db.insert("indexCoverage", doc);
  },
});

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Nicht angemeldet");
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") throw new Error("Keine Berechtigung (nur Admin)");
  return user;
}

export const brandSplitRange = query({
  args: { brandSlug: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, { brandSlug, days }) => {
    await requireAdmin(ctx);
    const brand = await brandBySlug(ctx, brandSlug);
    if (!brand) return [];
    const from = new Date(Date.now() - (days ?? 28) * 86_400_000).toISOString().slice(0, 10);
    return await ctx.db
      .query("gscQuerySplitDaily")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).gte("date", from))
      .collect();
  },
});

export const latestIndexCoverage = query({
  args: { brandSlug: v.string() },
  handler: async (ctx, { brandSlug }) => {
    await requireAdmin(ctx);
    const brand = await brandBySlug(ctx, brandSlug);
    if (!brand) return null;
    return await ctx.db
      .query("indexCoverage")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id))
      .order("desc")
      .first();
  },
});
