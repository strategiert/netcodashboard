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

// Wochensummen für den etracker-Parallelvergleich (CLI: npx convex run webSessions:parallelWeek --prod).
export const parallelWeek = internalQuery({
  args: { brandSlug: v.string(), startDate: v.string() }, // Montag YYYY-MM-DD
  handler: async (ctx, { brandSlug, startDate }) => {
    const brand = await ctx.db
      .query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", brandSlug))
      .unique();
    if (!brand) return null;
    const end = new Date(Date.parse(startDate) + 7 * 86_400_000).toISOString().slice(0, 10);
    const days = await ctx.db
      .query("webSessionDaily")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).gte("date", startDate).lt("date", end))
      .collect();
    const startTs = Date.parse(startDate + "T00:00:00Z");
    const conversions = await ctx.db
      .query("conversions")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id).gte("ts", startTs).lt("ts", startTs + 7 * 86_400_000))
      .collect();
    const leads = conversions.filter((c) => c.type === "lead");
    return {
      week: `${startDate}..${end}`,
      pageviews: days.reduce((a, d) => a + d.pageviews, 0),
      sessions: days.reduce((a, d) => a + d.sessions, 0),
      visitors: days.reduce((a, d) => a + d.visitors, 0),
      campaignSessions: days.reduce((a, d) => a + d.campaignSessions, 0),
      leads: leads.length,
      leadsWithClickId: leads.filter((c) => c.clickIds && (c.clickIds.gclid || c.clickIds.fbclid || c.clickIds.msclkid)).length,
      leadsWithPid: leads.filter((c) => c.pid).length,
      daysCovered: days.length,
    };
  },
});

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
