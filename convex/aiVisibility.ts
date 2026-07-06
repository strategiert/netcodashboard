import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const sourceProvider = v.union(
  v.literal("seranking"),
  v.literal("bing"),
  v.literal("manual"),
  v.literal("dataforseo"),
  v.literal("ahrefs")
);

const sentiment = v.union(
  v.literal("positive"),
  v.literal("neutral"),
  v.literal("negative"),
  v.literal("unknown")
);

const MICROVISTA_PROMPTS = [
  { prompt: "industrielle CT Dienstleister Deutschland", persona: "Einkauf", funnelStage: "decision", priority: 5, cluster: "Industrielle CT" },
  { prompt: "zerstoerungsfreie Pruefung mittels Computertomographie Anbieter", persona: "Qualitaetsleitung", funnelStage: "consideration", priority: 5, cluster: "ZfP" },
  { prompt: "beste Loesung fuer Bauteilanalyse per CT", persona: "Technik", funnelStage: "consideration", priority: 5, cluster: "Bauteilanalyse" },
  { prompt: "welche Firmen bieten industrielle Computertomographie als Dienstleistung an", persona: "Einkauf", funnelStage: "decision", priority: 5, cluster: "Industrielle CT" },
  { prompt: "Alternative zu klassischer 3D Messtechnik fuer innere Bauteilfehler", persona: "Qualitaetsleitung", funnelStage: "awareness", priority: 4, cluster: "Messtechnik" },
  { prompt: "Computertomographie fuer Kunststoffbauteile Dienstleister", persona: "Entwicklung", funnelStage: "consideration", priority: 4, cluster: "Kunststoff CT" },
  { prompt: "CT Analyse fuer Gussteile Anbieter Deutschland", persona: "Qualitaetsleitung", funnelStage: "decision", priority: 4, cluster: "Gussteilpruefung" },
  { prompt: "Porositaetsanalyse mit industrieller Computertomographie", persona: "Technik", funnelStage: "consideration", priority: 4, cluster: "Porositaet" },
  { prompt: "Lunker im Gussteil zerstoerungsfrei pruefen", persona: "Qualitaetsleitung", funnelStage: "awareness", priority: 4, cluster: "Gussteilpruefung" },
  { prompt: "industrielle CT fuer additive Fertigung", persona: "Entwicklung", funnelStage: "consideration", priority: 4, cluster: "Additive Fertigung" },
  { prompt: "3D CT Scan Bauteil Dienstleistung", persona: "Einkauf", funnelStage: "decision", priority: 4, cluster: "3D Scan" },
  { prompt: "Reverse Engineering mit CT Scan Anbieter", persona: "Entwicklung", funnelStage: "consideration", priority: 3, cluster: "Reverse Engineering" },
  { prompt: "industrielle CT Kosten Bauteilpruefung", persona: "Einkauf", funnelStage: "decision", priority: 3, cluster: "Kosten" },
  { prompt: "CT Messdienstleister fuer Automotive Bauteile", persona: "Automotive", funnelStage: "decision", priority: 4, cluster: "Automotive" },
  { prompt: "zerstoerungsfreie Bauteilpruefung Automotive CT", persona: "Automotive", funnelStage: "consideration", priority: 4, cluster: "Automotive" },
  { prompt: "industrielle Computertomographie fuer Medizintechnik", persona: "Medizintechnik", funnelStage: "consideration", priority: 3, cluster: "Medizintechnik" },
  { prompt: "Materialfehler im Bauteil sichtbar machen CT", persona: "Technik", funnelStage: "awareness", priority: 4, cluster: "Materialfehler" },
  { prompt: "Soll Ist Vergleich CT Bauteil", persona: "Qualitaetsleitung", funnelStage: "consideration", priority: 3, cluster: "Soll-Ist" },
  { prompt: "Faserorientierung Kunststoff CT Analyse", persona: "Entwicklung", funnelStage: "consideration", priority: 3, cluster: "Kunststoff CT" },
  { prompt: "Wandstaerkenanalyse mit industrieller CT", persona: "Technik", funnelStage: "consideration", priority: 3, cluster: "Wandstaerke" },
  { prompt: "Baugruppenanalyse CT Scan zerstoerungsfrei", persona: "Entwicklung", funnelStage: "consideration", priority: 3, cluster: "Baugruppen" },
  { prompt: "Mikro-CT Dienstleister Deutschland", persona: "Forschung", funnelStage: "decision", priority: 3, cluster: "Mikro-CT" },
  { prompt: "industrielle CT Prueflabor Deutschland", persona: "Einkauf", funnelStage: "decision", priority: 4, cluster: "Prueflabor" },
  { prompt: "Schadensanalyse Bauteil CT Anbieter", persona: "Qualitaetsleitung", funnelStage: "decision", priority: 4, cluster: "Schadensanalyse" },
  { prompt: "NDT CT Scan Service Germany", persona: "International", funnelStage: "decision", priority: 3, cluster: "NDT" },
  { prompt: "industrial computed tomography service Germany", persona: "International", funnelStage: "decision", priority: 3, cluster: "Industrial CT" },
  { prompt: "CT scanning service for industrial parts Germany", persona: "International", funnelStage: "consideration", priority: 3, cluster: "Industrial CT" },
  { prompt: "computed tomography quality inspection supplier Germany", persona: "International", funnelStage: "decision", priority: 3, cluster: "Quality Inspection" },
  { prompt: "micro CT service provider Germany", persona: "International", funnelStage: "decision", priority: 3, cluster: "Micro CT" },
  { prompt: "non destructive testing CT service provider", persona: "International", funnelStage: "consideration", priority: 3, cluster: "NDT" },
  { prompt: "industrielle CT ScanExpress Microvista", persona: "Bestandskunde", funnelStage: "decision", priority: 4, cluster: "ScanExpress" },
  { prompt: "Microvista industrielle Computertomographie", persona: "Brand", funnelStage: "decision", priority: 5, cluster: "Brand" },
];

function positionToScore(position: number | undefined): number {
  if (!position || position < 1) return 0;
  if (position === 1) return 1;
  if (position <= 3) return 0.75;
  if (position <= 5) return 0.5;
  return 0.25;
}

function clampRate(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function scoreVisibility(input: {
  mentionRate: number;
  citationShare: number;
  linkPresenceRate: number;
  averagePositionScore: number;
}) {
  const score =
    clampRate(input.mentionRate) * 45 +
    clampRate(input.citationShare) * 30 +
    clampRate(input.linkPresenceRate) * 15 +
    clampRate(input.averagePositionScore) * 10;
  return Math.round(score * 10) / 10;
}

export const upsertPrompt = mutation({
  args: {
    brandId: v.id("brands"),
    prompt: v.string(),
    language: v.string(),
    region: v.string(),
    persona: v.string(),
    funnelStage: v.string(),
    priority: v.number(),
    cluster: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiPrompts")
      .withIndex("by_brand_prompt", (q) => q.eq("brandId", args.brandId).eq("prompt", args.prompt))
      .first();
    const doc = { ...args, createdAt: existing?.createdAt ?? Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert("aiPrompts", doc);
  },
});

export const seedMicrovistaPrompts = mutation({
  args: {},
  handler: async (ctx) => {
    const brand = await ctx.db
      .query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", "microvista"))
      .first();
    if (!brand) throw new Error("Brand microvista not found");

    let saved = 0;
    for (const prompt of MICROVISTA_PROMPTS) {
      const existing = await ctx.db
        .query("aiPrompts")
        .withIndex("by_brand_prompt", (q) => q.eq("brandId", brand._id).eq("prompt", prompt.prompt))
        .first();
      const doc = {
        brandId: brand._id,
        prompt: prompt.prompt,
        language: prompt.prompt.match(/[äöüÄÖÜß]/) || prompt.prompt.includes("zerstoerungs")
          ? "de"
          : "en",
        region: "DE",
        persona: prompt.persona,
        funnelStage: prompt.funnelStage,
        priority: prompt.priority,
        cluster: prompt.cluster,
        active: true,
        createdAt: existing?.createdAt ?? Date.now(),
      };
      if (existing) await ctx.db.patch(existing._id, doc);
      else await ctx.db.insert("aiPrompts", doc);
      saved++;
    }
    return saved;
  },
});

export const upsertVisibilitySnapshot = mutation({
  args: {
    brandId: v.id("brands"),
    promptId: v.id("aiPrompts"),
    date: v.string(),
    engine: v.string(),
    region: v.string(),
    brandMentioned: v.boolean(),
    brandPosition: v.optional(v.number()),
    mentionRate: v.optional(v.number()),
    linkPresent: v.boolean(),
    citationShare: v.optional(v.number()),
    sentiment,
    competitorsMentioned: v.array(v.string()),
    sourceProvider,
    rawUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiVisibilitySnapshots")
      .withIndex("by_prompt_engine_date", (q) =>
        q.eq("promptId", args.promptId).eq("engine", args.engine).eq("date", args.date)
      )
      .first();
    const doc = { ...args, fetchedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert("aiVisibilitySnapshots", doc);
  },
});

export const upsertResponseSnapshot = mutation({
  args: {
    brandId: v.id("brands"),
    promptId: v.id("aiPrompts"),
    date: v.string(),
    engine: v.string(),
    answerSummary: v.optional(v.string()),
    mentionedBrands: v.array(v.string()),
    citedUrls: v.array(v.string()),
    citedDomains: v.array(v.string()),
    missingAngles: v.array(v.string()),
    rawResponse: v.optional(v.string()),
    sourceProvider,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiResponseSnapshots")
      .withIndex("by_prompt_engine_date", (q) =>
        q.eq("promptId", args.promptId).eq("engine", args.engine).eq("date", args.date)
      )
      .first();
    const doc = { ...args, fetchedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert("aiResponseSnapshots", doc);
  },
});

export const upsertBingSearchSnapshot = mutation({
  args: {
    brandId: v.id("brands"),
    date: v.string(),
    query: v.optional(v.string()),
    page: v.optional(v.string()),
    country: v.optional(v.string()),
    device: v.optional(v.string()),
    clicks: v.optional(v.number()),
    impressions: v.optional(v.number()),
    ctr: v.optional(v.number()),
    position: v.optional(v.number()),
    aiImpressions: v.optional(v.number()),
    aiClicks: v.optional(v.number()),
    aiCitations: v.optional(v.number()),
    aiCitationShare: v.optional(v.number()),
    topic: v.optional(v.string()),
    intent: v.optional(v.string()),
    sourceProvider: v.union(v.literal("bing-api"), v.literal("bing-export")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bingSearchSnapshots", { ...args, importedAt: Date.now() });
  },
});

export const listPrompts = query({
  args: { brandId: v.id("brands"), activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { brandId, activeOnly }) => {
    const rows = activeOnly
      ? await ctx.db
          .query("aiPrompts")
          .withIndex("by_brand_active", (q) => q.eq("brandId", brandId).eq("active", true))
          .collect()
      : await ctx.db
          .query("aiPrompts")
          .withIndex("by_brand", (q) => q.eq("brandId", brandId))
          .collect();
    return rows.sort((a, b) => b.priority - a.priority || a.prompt.localeCompare(b.prompt));
  },
});

export const listRecentSnapshots = query({
  args: { brandId: v.id("brands"), days: v.number() },
  handler: async (ctx, { brandId, days }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return await ctx.db
      .query("aiVisibilitySnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).gte("date", since.toISOString().slice(0, 10)))
      .order("desc")
      .collect();
  },
});

export const dashboardSummary = query({
  args: { brandId: v.id("brands"), days: v.number() },
  handler: async (ctx, { brandId, days }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const snapshots = await ctx.db
      .query("aiVisibilitySnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).gte("date", since.toISOString().slice(0, 10)))
      .collect();

    const total = snapshots.length || 1;
    const mentionRate = snapshots.filter((row) => row.brandMentioned).length / total;
    const linkPresenceRate = snapshots.filter((row) => row.linkPresent).length / total;
    const citationShare =
      snapshots.reduce((sum, row) => sum + clampRate(row.citationShare), 0) / total;
    const averagePositionScore =
      snapshots.reduce((sum, row) => sum + positionToScore(row.brandPosition), 0) / total;
    const engines = Array.from(new Set(snapshots.map((row) => row.engine))).sort();

    return {
      score: scoreVisibility({ mentionRate, citationShare, linkPresenceRate, averagePositionScore }),
      mentionRate,
      linkPresenceRate,
      citationShare,
      averagePositionScore,
      snapshotCount: snapshots.length,
      engines,
    };
  },
});

export const listPromptRows = query({
  args: { brandId: v.id("brands"), days: v.number() },
  handler: async (ctx, { brandId, days }) => {
    const prompts = await ctx.db
      .query("aiPrompts")
      .withIndex("by_brand", (q) => q.eq("brandId", brandId))
      .collect();
    const since = new Date();
    since.setDate(since.getDate() - days);
    const snapshots = await ctx.db
      .query("aiVisibilitySnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).gte("date", since.toISOString().slice(0, 10)))
      .collect();

    return prompts
      .map((prompt) => {
        const rows = snapshots.filter((row) => row.promptId === prompt._id);
        const total = rows.length || 1;
        return {
          ...prompt,
          mentionRate: rows.filter((row) => row.brandMentioned).length / total,
          linkPresenceRate: rows.filter((row) => row.linkPresent).length / total,
          bestPosition: rows.reduce<number | undefined>(
            (best, row) => row.brandPosition && (!best || row.brandPosition < best) ? row.brandPosition : best,
            undefined
          ),
          engines: Array.from(new Set(rows.map((row) => row.engine))).sort(),
          lastSeen: rows.reduce((latest, row) => row.date > latest ? row.date : latest, ""),
        };
      })
      .sort((a, b) => b.priority - a.priority || b.mentionRate - a.mentionRate);
  },
});

export const listCitations = query({
  args: { brandId: v.id("brands"), days: v.number() },
  handler: async (ctx, { brandId, days }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const responses = await ctx.db
      .query("aiResponseSnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).gte("date", since.toISOString().slice(0, 10)))
      .collect();
    const counts = new Map<string, number>();
    for (const response of responses) {
      for (const domain of response.citedDomains) counts.set(domain, (counts.get(domain) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  },
});

export const listBingRows = query({
  args: { brandId: v.id("brands"), days: v.number() },
  handler: async (ctx, { brandId, days }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return await ctx.db
      .query("bingSearchSnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).gte("date", since.toISOString().slice(0, 10)))
      .order("desc")
      .take(100);
  },
});
