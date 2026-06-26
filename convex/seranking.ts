import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Mutations (vom Sync-Action aufgerufen) ──────────────────────────────────

export const upsertDaily = mutation({
  args: {
    brandId: v.id("brands"),
    siteId: v.number(),
    siteTitle: v.string(),
    domain: v.string(),
    date: v.string(),
    totalKeywords: v.number(),
    ranked: v.number(),
    top3: v.number(),
    top10: v.number(),
    top30: v.number(),
    top100: v.number(),
    avgPosition: v.optional(v.number()),
    totalVolume: v.number(),
    visibilityScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("serankingDaily")
      .withIndex("by_site_date", (q) => q.eq("siteId", args.siteId).eq("date", args.date))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("serankingDaily", args);
  },
});

export const upsertKeyword = mutation({
  args: {
    brandId: v.id("brands"),
    siteId: v.number(),
    keywordId: v.string(),
    keyword: v.string(),
    date: v.string(),
    position: v.number(),
    change: v.optional(v.number()),
    volume: v.optional(v.number()),
    cpc: v.optional(v.number()),
    competition: v.optional(v.number()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("serankingKeywords")
      .withIndex("by_site_keyword", (q) =>
        q.eq("siteId", args.siteId).eq("keywordId", args.keywordId)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("serankingKeywords", args);
  },
});

// Competitors: kompletter Austausch pro Site (Snapshot).
export const replaceCompetitors = mutation({
  args: {
    brandId: v.id("brands"),
    siteId: v.number(),
    competitors: v.array(
      v.object({
        competitorId: v.number(),
        name: v.string(),
        url: v.string(),
        domainTrust: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { brandId, siteId, competitors }) => {
    const old = await ctx.db
      .query("serankingCompetitors")
      .withIndex("by_site", (q) => q.eq("siteId", siteId))
      .collect();
    for (const o of old) await ctx.db.delete(o._id);
    for (const c of competitors) {
      await ctx.db.insert("serankingCompetitors", { brandId, siteId, ...c });
    }
    return competitors.length;
  },
});

export const upsertBacklinks = mutation({
  args: {
    brandId: v.id("brands"),
    domain: v.string(),
    date: v.string(),
    backlinks: v.number(),
    refDomains: v.number(),
    dofollowBacklinks: v.optional(v.number()),
    nofollowBacklinks: v.optional(v.number()),
    inlinkRank: v.optional(v.number()),
    domainInlinkRank: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("serankingBacklinks")
      .withIndex("by_domain_date", (q) => q.eq("domain", args.domain).eq("date", args.date))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("serankingBacklinks", args);
  },
});

export const saveResearch = mutation({
  args: {
    brandId: v.optional(v.id("brands")),
    source: v.string(),
    results: v.array(
      v.object({
        keyword: v.string(),
        volume: v.optional(v.number()),
        cpc: v.optional(v.number()),
        competition: v.optional(v.number()),
        difficulty: v.optional(v.number()),
        intents: v.optional(v.array(v.string())),
        isDataFound: v.boolean(),
      })
    ),
  },
  handler: async (ctx, { brandId, source, results }) => {
    const now = Date.now();
    for (const r of results) {
      const existing = await ctx.db
        .query("serankingResearch")
        .withIndex("by_keyword", (q) => q.eq("source", source).eq("keyword", r.keyword))
        .first();
      const doc = { brandId, source, ...r, fetchedAt: now };
      if (existing) await ctx.db.patch(existing._id, doc);
      else await ctx.db.insert("serankingResearch", doc);
    }
    return results.length;
  },
});

// ── Queries (von der UI gelesen) ────────────────────────────────────────────

export const getDailyRange = query({
  args: { brandId: v.id("brands"), days: v.number() },
  handler: async (ctx, { brandId, days }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    return await ctx.db
      .query("serankingDaily")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).gte("date", sinceStr))
      .order("asc")
      .collect();
  },
});

export const listKeywords = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    const rows = await ctx.db
      .query("serankingKeywords")
      .withIndex("by_brand", (q) => q.eq("brandId", brandId))
      .collect();
    // Gerankte zuerst (Position aufsteigend), nicht-gerankte (0) ans Ende.
    return rows.sort((a, b) => {
      const pa = a.position === 0 ? 1e9 : a.position;
      const pb = b.position === 0 ? 1e9 : b.position;
      return pa - pb;
    });
  },
});

export const listCompetitors = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    const rows = await ctx.db
      .query("serankingCompetitors")
      .withIndex("by_brand", (q) => q.eq("brandId", brandId))
      .collect();
    return rows.sort((a, b) => (b.domainTrust ?? 0) - (a.domainTrust ?? 0));
  },
});

export const latestBacklinks = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    const rows = await ctx.db
      .query("serankingBacklinks")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId))
      .order("desc")
      .collect();
    // Neuester Eintrag pro Domain.
    const byDomain = new Map<string, (typeof rows)[0]>();
    for (const r of rows) if (!byDomain.has(r.domain)) byDomain.set(r.domain, r);
    return Array.from(byDomain.values());
  },
});

export const listResearch = query({
  args: { brandId: v.optional(v.id("brands")) },
  handler: async (ctx, { brandId }) => {
    if (!brandId) {
      return await ctx.db.query("serankingResearch").order("desc").take(100);
    }
    const rows = await ctx.db
      .query("serankingResearch")
      .withIndex("by_brand", (q) => q.eq("brandId", brandId))
      .order("desc")
      .take(200);
    return rows;
  },
});
