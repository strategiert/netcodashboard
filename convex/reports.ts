import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertWeeklyReport = mutation({
  args: {
    brandId: v.id("brands"),
    kw: v.string(),
    weekStart: v.string(),
    year: v.number(),
    visitors: v.optional(v.number()),
    sessions: v.optional(v.number()),
    pageviews: v.optional(v.number()),
    bounceRate: v.optional(v.number()),
    avgVisitDuration: v.optional(v.string()),
    chAds: v.optional(v.number()),
    chSeo: v.optional(v.number()),
    chDirect: v.optional(v.number()),
    chSocial: v.optional(v.number()),
    chReferral: v.optional(v.number()),
    chOther: v.optional(v.number()),
    visitorsDE: v.optional(v.number()),
    visitorsEN: v.optional(v.number()),
    visitorsFR: v.optional(v.number()),
    visitorsIT: v.optional(v.number()),
    leads: v.optional(v.number()),
    adSpend: v.optional(v.number()),
    topKeyword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weeklyReports")
      .withIndex("by_brand_year", (q) => q.eq("brandId", args.brandId).eq("year", args.year))
      .filter((q) => q.eq(q.field("kw"), args.kw))
      .first();
    if (existing) { await ctx.db.patch(existing._id, args); return existing._id; }
    return await ctx.db.insert("weeklyReports", args);
  },
});

export const upsertCrmLead = mutation({
  args: {
    brandId: v.id("brands"),
    kw: v.number(),
    date: v.string(),
    company: v.string(),
    contactChannel: v.optional(v.string()),
    leadType: v.optional(v.string()),
    description: v.optional(v.string()),
    offerMade: v.optional(v.boolean()),
    orderReceived: v.optional(v.boolean()),
    newCustomer: v.optional(v.boolean()),
    status: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("crmLeads")
      .withIndex("by_brand_date", (q) => q.eq("brandId", args.brandId).eq("date", args.date))
      .filter((q) => q.eq(q.field("company"), args.company))
      .first();
    if (existing) { await ctx.db.patch(existing._id, args); return existing._id; }
    return await ctx.db.insert("crmLeads", args);
  },
});

export const upsertAdsCampaign = mutation({
  args: {
    brandId: v.id("brands"),
    period: v.string(),
    campaignName: v.string(),
    campaignType: v.optional(v.string()),
    budgetPerDay: v.optional(v.number()),
    spend: v.optional(v.number()),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    ctr: v.optional(v.number()),
    conversions: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adsCampaigns")
      .withIndex("by_brand_period", (q) => q.eq("brandId", args.brandId).eq("period", args.period))
      .filter((q) => q.eq(q.field("campaignName"), args.campaignName))
      .first();
    if (existing) { await ctx.db.patch(existing._id, args); return existing._id; }
    return await ctx.db.insert("adsCampaigns", args);
  },
});

export const getWeeklyReports = query({
  args: { brandId: v.id("brands"), from: v.string(), to: v.string() },
  handler: async (ctx, { brandId, from, to }) => {
    const fromYear = parseInt(from.slice(0, 4));
    const toYear   = parseInt(to.slice(0, 4));
    const rows = [];
    for (let y = fromYear; y <= toYear; y++) {
      const yearRows = await ctx.db
        .query("weeklyReports")
        .withIndex("by_brand_year", (q) => q.eq("brandId", brandId).eq("year", y))
        .collect();
      rows.push(...yearRows);
    }
    return rows
      .filter(r => r.weekStart >= from && r.weekStart <= to)
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  },
});

// Returns latest 300 leads for the table view
export const getCrmLeads = query({
  args: { brandId: v.id("brands"), from: v.string(), to: v.string() },
  handler: async (ctx, { brandId, from, to }) => {
    return await ctx.db
      .query("crmLeads")
      .withIndex("by_brand_date", (q) =>
        q.eq("brandId", brandId).gte("date", from).lte("date", to)
      )
      .order("desc")
      .take(300);
  },
});

// Aggregated stats without returning all documents (for KPI cards + funnel)
export const getCrmLeadsStats = query({
  args: { brandId: v.id("brands"), from: v.string(), to: v.string() },
  handler: async (ctx, { brandId, from, to }) => {
    const leads = await ctx.db
      .query("crmLeads")
      .withIndex("by_brand_date", (q) =>
        q.eq("brandId", brandId).gte("date", from).lte("date", to)
      )
      .collect();
    return {
      total:       leads.length,
      offerMade:   leads.filter(l => l.offerMade).length,
      orderReceived: leads.filter(l => l.orderReceived).length,
      newCustomer: leads.filter(l => l.newCustomer).length,
    };
  },
});

export const getAdsCampaigns = query({
  args: { brandId: v.id("brands"), period: v.string() },
  handler: async (ctx, { brandId, period }) => {
    return await ctx.db
      .query("adsCampaigns")
      .withIndex("by_brand_period", (q) => q.eq("brandId", brandId).eq("period", period))
      .collect();
  },
});
