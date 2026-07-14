import { v } from "convex/values";
import { internalMutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Anonyme Web-Sessions: Upsert (Engine) + Admin-Query (Dashboard).
// Session-Definition siehe convex/actions/syncWebSessions.ts + Governance-Paket.

export const upsertDay = internalMutation({
  args: {
    brandSlug: v.string(),
    date: v.string(),
    sessions: v.number(),
    visitors: v.number(),
    pageviews: v.number(),
    pagesPerSession: v.number(),
    campaignSessions: v.number(),
  },
  handler: async (ctx, { brandSlug, ...day }) => {
    const brand = await ctx.db
      .query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", brandSlug))
      .unique();
    if (!brand) throw new Error(`Brand ${brandSlug} fehlt`);
    const existing = await ctx.db
      .query("webSessionDaily")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).eq("date", day.date))
      .unique();
    const doc = { brandId: brand._id, ...day, syncedAt: Date.now() };
    if (existing) await ctx.db.patch(existing._id, doc);
    else await ctx.db.insert("webSessionDaily", doc);
  },
});

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Nicht angemeldet");
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") throw new Error("Keine Berechtigung (nur Admin)");
  return user;
}

export const range = query({
  args: { brandSlug: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, { brandSlug, days }) => {
    await requireAdmin(ctx);
    const brand = await ctx.db
      .query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", brandSlug))
      .unique();
    if (!brand) return [];
    const from = new Date(Date.now() - (days ?? 14) * 86_400_000).toISOString().slice(0, 10);
    return await ctx.db
      .query("webSessionDaily")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).gte("date", from))
      .collect();
  },
});
