import { v } from "convex/values";
import { internalMutation, internalQuery, query, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Datalake Paket B: Upsert/Sweep für Ad-Level-Kosten + click_view-Backstop.
// Plan: docs/superpowers/plans/2026-07-14-datalake-paket-b-kosten.md

const adCostRow = v.object({
  brandSlug: v.string(),
  channel: v.string(),
  sourceAccount: v.string(),
  date: v.string(),
  campaignId: v.string(),
  campaignName: v.optional(v.string()),
  adgroupId: v.string(),
  adId: v.string(),
  impressions: v.number(),
  clicks: v.number(),
  spend: v.number(),
  currency: v.string(),
});

async function brandMapBySlug(ctx: MutationCtx): Promise<Record<string, Id<"brands">>> {
  const brands = await ctx.db.query("brands").collect();
  return Object.fromEntries(brands.map((b) => [b.slug, b._id]));
}

export const upsertBatch = internalMutation({
  args: { rows: v.array(adCostRow) },
  handler: async (ctx, { rows }) => {
    const brandIds = await brandMapBySlug(ctx);
    const syncedAt = Date.now();
    let inserted = 0, updated = 0, skippedBrand = 0;

    for (const row of rows) {
      const brandId = brandIds[row.brandSlug];
      if (!brandId) { skippedBrand++; continue; }

      const existing = await ctx.db
        .query("adCosts")
        .withIndex("by_unique", (q) =>
          q.eq("channel", row.channel)
            .eq("sourceAccount", row.sourceAccount)
            .eq("date", row.date)
            .eq("campaignId", row.campaignId)
            .eq("adgroupId", row.adgroupId)
            .eq("adId", row.adId),
        )
        .unique();

      const doc = {
        brandId,
        channel: row.channel,
        sourceAccount: row.sourceAccount,
        date: row.date,
        campaignName: row.campaignName,
        campaignId: row.campaignId,
        adgroupId: row.adgroupId,
        adId: row.adId,
        impressions: row.impressions,
        clicks: row.clicks,
        spend: row.spend,
        currency: row.currency,
        syncedAt,
      };
      if (existing) { await ctx.db.patch(existing._id, doc); updated++; }
      else { await ctx.db.insert("adCosts", doc); inserted++; }
    }
    return { inserted, updated, skippedBrand };
  },
});

/**
 * Deletion-/Zero-Restatement: entfernt Zeilen im Fenster, die der aktuelle
 * (vollständige!) Lauf nicht mehr angefasst hat. NUR nach fehlerfreiem
 * Komplett-Fetch aufrufen — bei truncated/fehlerhaftem Lauf würde er
 * gültige Daten löschen.
 */
export const sweepStale = internalMutation({
  args: {
    channel: v.string(),
    sourceAccount: v.string(),
    dates: v.array(v.string()),
    runStartedAt: v.number(),
  },
  handler: async (ctx, { channel, sourceAccount, dates, runStartedAt }) => {
    let deleted = 0;
    for (const date of dates) {
      const docs = await ctx.db
        .query("adCosts")
        .withIndex("by_unique", (q) =>
          q.eq("channel", channel).eq("sourceAccount", sourceAccount).eq("date", date),
        )
        .collect();
      for (const doc of docs) {
        if (doc.syncedAt < runStartedAt) { await ctx.db.delete(doc._id); deleted++; }
      }
    }
    return { deleted };
  },
});

const clickViewRow = v.object({
  brandSlug: v.string(),
  sourceAccount: v.string(),
  gclid: v.string(),
  date: v.string(),
  campaignId: v.string(),
  adgroupId: v.string(),
  adId: v.string(),
  clickType: v.optional(v.string()),
  keyword: v.optional(v.string()),
});

export const upsertClickViews = internalMutation({
  args: { rows: v.array(clickViewRow) },
  handler: async (ctx, { rows }) => {
    const brandIds = await brandMapBySlug(ctx);
    const syncedAt = Date.now();
    let inserted = 0, updated = 0, skippedBrand = 0;

    for (const row of rows) {
      const brandId = brandIds[row.brandSlug];
      if (!brandId) { skippedBrand++; continue; }

      const existing = await ctx.db
        .query("clickViews")
        .withIndex("by_gclid", (q) => q.eq("gclid", row.gclid).eq("date", row.date))
        .first();

      const doc = {
        brandId,
        sourceAccount: row.sourceAccount,
        gclid: row.gclid,
        date: row.date,
        campaignId: row.campaignId,
        adgroupId: row.adgroupId,
        adId: row.adId,
        clickType: row.clickType,
        keyword: row.keyword,
        syncedAt,
      };
      if (existing) { await ctx.db.patch(existing._id, doc); updated++; }
      else { await ctx.db.insert("clickViews", doc); inserted++; }
    }
    return { inserted, updated, skippedBrand };
  },
});

// ── MS-Refresh-Token-Rotation (MS gibt bei jedem Refresh ggf. einen NEUEN Token aus) ──

export const getMsRefreshToken = internalQuery({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("oauthTokens")
      .withIndex("by_provider", (q) => q.eq("provider", "msads"))
      .unique();
    return doc?.refreshToken ?? null;
  },
});

export const saveMsRefreshToken = internalMutation({
  args: { refreshToken: v.string() },
  handler: async (ctx, { refreshToken }) => {
    const doc = await ctx.db
      .query("oauthTokens")
      .withIndex("by_provider", (q) => q.eq("provider", "msads"))
      .unique();
    if (doc) await ctx.db.patch(doc._id, { refreshToken, updatedAt: Date.now() });
    else await ctx.db.insert("oauthTokens", { provider: "msads", refreshToken, updatedAt: Date.now() });
  },
});

// ── Debug (nur Admin, exakt das requireAdmin-Muster aus convex/users.ts) ──

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Nicht angemeldet");
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") throw new Error("Keine Berechtigung (nur Admin)");
  return user;
}

/**
 * Tagessummen-Abgleich: adCosts je Kanal vs. kpiSnapshots-adSpend (source "ads",
 * Kampagnen-Aggregat aus syncAds). Google sollte ±Rundung übereinstimmen.
 */
export const verifyDay = internalQuery({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const brands = await ctx.db.query("brands").collect();
    const byChannel: Record<string, { spend: number; clicks: number; rows: number }> = {};
    for (const brand of brands) {
      const docs = await ctx.db
        .query("adCosts")
        .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).eq("date", date))
        .collect();
      for (const d of docs) {
        byChannel[d.channel] ??= { spend: 0, clicks: 0, rows: 0 };
        byChannel[d.channel].spend += d.spend;
        byChannel[d.channel].clicks += d.clicks;
        byChannel[d.channel].rows++;
      }
    }
    let kpiAdSpend = 0;
    for (const brand of brands) {
      const snap = await ctx.db
        .query("kpiSnapshots")
        .withIndex("by_brand_source_date", (q) =>
          q.eq("brandId", brand._id).eq("source", "ads").eq("date", date),
        )
        .first();
      kpiAdSpend += snap?.adSpend ?? 0;
    }
    return { date, byChannel, kpiAdSpendGoogle: kpiAdSpend };
  },
});

export const debugAdCosts = query({
  args: { brandSlug: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { brandSlug, limit }) => {
    await requireAdmin(ctx);
    const brand = await ctx.db
      .query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", brandSlug))
      .unique();
    if (!brand) return [];
    return await ctx.db
      .query("adCosts")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id))
      .order("desc")
      .take(Math.min(limit ?? 20, 200));
  },
});
