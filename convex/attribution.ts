import { v } from "convex/values";
import {
  internalMutation, internalQuery, query, QueryCtx, MutationCtx,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id, Doc } from "./_generated/dataModel";
import { normalizeChannel, MODELS } from "../src/lib/attribution-models";

// Datalake Paket D: Facts-Verwaltung (Generation-Swap) + Report-Queries.
// Plan: docs/superpowers/plans/2026-07-14-datalake-paket-d-attribution.md

// ── Engine-Interna ──────────────────────────────────────────────────────────

export const listBrandsWithConversions = internalQuery({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.db.query("brands").collect();
    const out = [];
    for (const b of brands) {
      const one = await ctx.db
        .query("conversions")
        .withIndex("by_brand_ts", (q) => q.eq("brandId", b._id))
        .first();
      if (one) out.push({ brandId: b._id, slug: b.slug });
    }
    return out;
  },
});

export const conversionsForBrand = internalQuery({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    return await ctx.db
      .query("conversions")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brandId))
      .collect();
  },
});

/** Touchpoints einer Conversion: über Person UND (falls vorhanden) pid, dedupliziert. */
export const touchpointsFor = internalQuery({
  args: {
    brandId: v.id("brands"),
    personId: v.id("persons"),
    pid: v.optional(v.string()),
  },
  handler: async (ctx, { brandId, personId, pid }) => {
    const byPerson = await ctx.db
      .query("touchpoints")
      .withIndex("by_person", (q) => q.eq("personId", personId))
      .collect();
    let byPid: Doc<"touchpoints">[] = [];
    if (pid) {
      byPid = await ctx.db
        .query("touchpoints")
        .withIndex("by_pid", (q) => q.eq("brandId", brandId).eq("pid", pid))
        .collect();
    }
    const seen = new Set<string>();
    const out = [];
    for (const t of [...byPerson, ...byPid]) {
      if (seen.has(t._id)) continue;
      seen.add(t._id);
      out.push({
        id: t._id, ts: t.ts, type: t.type, channel: t.channel || "direct",
        campaignId: t.campaignId, adgroupId: t.adgroupId, adId: t.adId,
      });
    }
    return out;
  },
});

/** gclid-Backstop: Ad-Zuordnung aus Paket-B-clickViews, wenn UTM nichts hergab. */
export const clickViewByGclid = internalQuery({
  args: { brandId: v.id("brands"), gclid: v.string() },
  handler: async (ctx, { brandId, gclid }) => {
    const rows = await ctx.db
      .query("clickViews")
      .withIndex("by_gclid", (q) => q.eq("gclid", gclid))
      .collect();
    const match = rows.find((r) => r.brandId === brandId) ?? rows[0] ?? null;
    return match
      ? { campaignId: match.campaignId, adgroupId: match.adgroupId, adId: match.adId, date: match.date }
      : null;
  },
});

const factRow = v.object({
  brandId: v.id("brands"),
  generation: v.number(),
  model: v.string(),
  conversionId: v.id("conversions"),
  conversionType: v.string(),
  conversionTs: v.number(),
  value: v.number(),
  currency: v.string(),
  weight: v.number(),
  touchpointId: v.optional(v.id("touchpoints")),
  channel: v.string(),
  campaignId: v.optional(v.string()),
  adgroupId: v.optional(v.string()),
  adId: v.optional(v.string()),
});

export const insertFacts = internalMutation({
  args: { facts: v.array(factRow) },
  handler: async (ctx, { facts }) => {
    for (const f of facts) await ctx.db.insert("attributionFacts", f);
    return facts.length;
  },
});

export const getActiveGeneration = internalQuery({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    const meta = await ctx.db
      .query("attributionMeta")
      .withIndex("by_brand", (q) => q.eq("brandId", brandId))
      .unique();
    return meta?.activeGeneration ?? 0;
  },
});

export const swapGeneration = internalMutation({
  args: {
    brandId: v.id("brands"),
    generation: v.number(),
    lookbackDays: v.number(),
    conversions: v.number(),
    facts: v.number(),
  },
  handler: async (ctx, args) => {
    const meta = await ctx.db
      .query("attributionMeta")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .unique();
    const doc = {
      brandId: args.brandId,
      activeGeneration: args.generation,
      computedAt: Date.now(),
      lookbackDays: args.lookbackDays,
      conversions: args.conversions,
      facts: args.facts,
    };
    if (meta) await ctx.db.patch(meta._id, doc);
    else await ctx.db.insert("attributionMeta", doc);
  },
});

/** Alte Generation batchweise löschen (Index-Präfix brandId+generation). */
export const deleteGeneration = internalMutation({
  args: { brandId: v.id("brands"), generation: v.number(), batch: v.number() },
  handler: async (ctx, { brandId, generation, batch }) => {
    const docs = await ctx.db
      .query("attributionFacts")
      .withIndex("by_brand_gen_model_ts", (q) =>
        q.eq("brandId", brandId).eq("generation", generation),
      )
      .take(batch);
    for (const d of docs) await ctx.db.delete(d._id);
    return { deleted: docs.length, done: docs.length < batch };
  },
});

// ── Admin-Queries (exakt das requireAdmin-Muster aus convex/users.ts) ──────

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Nicht angemeldet");
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") throw new Error("Keine Berechtigung (nur Admin)");
  return user;
}

async function brandBySlug(ctx: QueryCtx, slug: string) {
  return await ctx.db
    .query("brands")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

type AggRow = {
  channel: string; campaignId: string; campaignName?: string;
  adgroupId: string; adId: string;
  spend: number; clicks: number; leads: number; revenue: number;
};

export const attributionSummary = query({
  args: { brandSlug: v.string(), model: v.string(), days: v.number() },
  handler: async (ctx, { brandSlug, model, days }) => {
    await requireAdmin(ctx);
    if (!(MODELS as readonly string[]).includes(model)) throw new Error(`Unbekanntes Modell: ${model}`);
    const brand = await brandBySlug(ctx, brandSlug);
    if (!brand) return null;

    const meta = await ctx.db
      .query("attributionMeta")
      .withIndex("by_brand", (q) => q.eq("brandId", brand._id))
      .unique();
    if (!meta) return { computedAt: null, byChannel: [], byCampaign: [], byAd: [] };

    const fromTs = Date.now() - days * 86_400_000;
    const facts = await ctx.db
      .query("attributionFacts")
      .withIndex("by_brand_gen_model_ts", (q) =>
        q.eq("brandId", brand._id)
          .eq("generation", meta.activeGeneration)
          .eq("model", model)
          .gte("conversionTs", fromTs),
      )
      .collect();

    // Kosten desselben Zeitraums (date als YYYY-MM-DD; ts→Tag in UTC — Kostentage
    // sind Plattform-Konto-Tage, die Differenz ist für Trends akzeptabel, Kommentar §Plan).
    const fromDate = new Date(fromTs).toISOString().slice(0, 10);
    const costs = await ctx.db
      .query("adCosts")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).gte("date", fromDate))
      .collect();

    // Aggregation: Key channel|campaign|adgroup|ad. Facts-Kanäle über normalizeChannel
    // auf Kostenkanäle gemappt; organische Kanäle bleiben eigene Zeilen ohne Spend.
    const rows = new Map<string, AggRow>();
    const rowFor = (channel: string, campaignId = "", adgroupId = "", adId = "", campaignName?: string) => {
      const key = [channel, campaignId, adgroupId, adId].join("|");
      let r = rows.get(key);
      if (!r) {
        r = { channel, campaignId, adgroupId, adId, campaignName, spend: 0, clicks: 0, leads: 0, revenue: 0 };
        rows.set(key, r);
      }
      if (campaignName && !r.campaignName) r.campaignName = campaignName;
      return r;
    };

    for (const c of costs) {
      const r = rowFor(c.channel, c.campaignId, c.adgroupId, c.adId, c.campaignName);
      r.spend += c.spend; r.clicks += c.clicks;
    }
    for (const f of facts) {
      const costChannel = normalizeChannel(f.channel);
      const channel = costChannel ?? f.channel;
      const r = rowFor(channel, f.campaignId ?? "", f.adgroupId ?? "", f.adId ?? "");
      if (f.conversionType === "lead") r.leads += f.weight;
      if (f.conversionType === "deal_won") r.revenue += f.weight * f.value;
    }

    const all = [...rows.values()];
    const rollup = (keyFn: (r: AggRow) => string, labelFn: (r: AggRow) => Partial<AggRow>) => {
      const m = new Map<string, AggRow>();
      for (const r of all) {
        const k = keyFn(r);
        let t = m.get(k);
        if (!t) { t = { channel: r.channel, campaignId: "", adgroupId: "", adId: "", spend: 0, clicks: 0, leads: 0, revenue: 0, ...labelFn(r) }; m.set(k, t); }
        if (r.campaignName && !t.campaignName && labelFn(r).campaignId) t.campaignName = r.campaignName;
        t.spend += r.spend; t.clicks += r.clicks; t.leads += r.leads; t.revenue += r.revenue;
      }
      return [...m.values()].sort((a, b) => b.spend - a.spend);
    };

    return {
      computedAt: meta.computedAt,
      generation: meta.activeGeneration,
      byChannel: rollup((r) => r.channel, () => ({})),
      byCampaign: rollup((r) => `${r.channel}|${r.campaignId}`, (r) => ({ campaignId: r.campaignId, campaignName: r.campaignName })),
      byAd: all.filter((r) => r.adId || r.leads > 0 || r.revenue > 0).sort((a, b) => b.spend - a.spend).slice(0, 100),
    };
  },
});

export const journeyList = query({
  args: { brandSlug: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { brandSlug, limit }) => {
    await requireAdmin(ctx);
    const brand = await brandBySlug(ctx, brandSlug);
    if (!brand) return [];
    const conversions = await ctx.db
      .query("conversions")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id))
      .order("desc")
      .take(Math.min(limit ?? 20, 50));

    const out = [];
    for (const c of conversions) {
      const tps = await ctx.db
        .query("touchpoints")
        .withIndex("by_person", (q) => q.eq("personId", c.personId))
        .collect();
      out.push({
        conversionId: c._id,
        ts: c.ts,
        type: c.type,
        value: c.value ?? 0,
        clickIds: c.clickIds,
        timeline: tps
          .sort((a, b) => a.ts - b.ts)
          .map((t) => ({
            ts: t.ts, type: t.type, channel: t.channel || "direct",
            campaignId: t.campaignId, urlPath: t.urlPath, device: t.device,
          })),
      });
    }
    return out;
  },
});

export const qaAlerts = query({
  args: { brandSlug: v.string() },
  handler: async (ctx, { brandSlug }) => {
    await requireAdmin(ctx);
    const brand = await brandBySlug(ctx, brandSlug);
    if (!brand) return [];
    const alerts: string[] = [];
    const now = Date.now();

    // (a) Beacon still? Kein Touchpoint in 24 h.
    const lastTp = await ctx.db
      .query("touchpoints")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id))
      .order("desc")
      .first();
    if (!lastTp) alerts.push("Keine Touchpoints vorhanden — Beacon/Consent prüfen.");
    else if (now - lastTp.ts > 86_400_000) {
      alerts.push(`Letzter Touchpoint vor ${Math.round((now - lastTp.ts) / 3_600_000)} h — Beacon still?`);
    }

    // (b) Kosten der letzten 7 Tage ohne einen einzigen getrackten Klick-Touchpoint derselben Kampagne.
    const from = new Date(now - 7 * 86_400_000).toISOString().slice(0, 10);
    const costs = await ctx.db
      .query("adCosts")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).gte("date", from))
      .collect();
    const spendByCampaign = new Map<string, number>();
    for (const c of costs) {
      if (c.spend > 0) spendByCampaign.set(`${c.channel}|${c.campaignId}`, (spendByCampaign.get(`${c.channel}|${c.campaignId}`) ?? 0) + c.spend);
    }
    if (spendByCampaign.size > 0) {
      const tps = await ctx.db
        .query("touchpoints")
        .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id).gte("ts", now - 7 * 86_400_000))
        .collect();
      const trackedCampaigns = new Set(
        tps.filter((t) => t.campaignId).map((t) => `${normalizeChannel(t.channel) ?? t.channel}|${t.campaignId}`),
      );
      let untrackedSpend = 0;
      for (const [key, spend] of spendByCampaign) if (!trackedCampaigns.has(key)) untrackedSpend += spend;
      if (untrackedSpend > 0) {
        alerts.push(`${untrackedSpend.toFixed(2)} € Spend (7 Tage) ohne getrackte Klicks — UTM-Templates/Consent-Quote prüfen.`);
      }
    }

    // (c) Facts stale?
    const meta = await ctx.db
      .query("attributionMeta")
      .withIndex("by_brand", (q) => q.eq("brandId", brand._id))
      .unique();
    if (!meta) alerts.push("Noch keine Attribution berechnet.");
    else if (now - meta.computedAt > 26 * 3_600_000) {
      alerts.push(`Attribution zuletzt vor ${Math.round((now - meta.computedAt) / 3_600_000)} h berechnet — Cron prüfen.`);
    }

    // (d) Σweight-Stichprobe (bis 10 Conversions, Modell linear).
    if (meta) {
      const sample = await ctx.db
        .query("conversions")
        .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id))
        .order("desc")
        .take(10);
      for (const c of sample) {
        const facts = await ctx.db
          .query("attributionFacts")
          .withIndex("by_conversion", (q) => q.eq("conversionId", c._id).eq("generation", meta.activeGeneration))
          .collect();
        const linear = facts.filter((f) => f.model === "linear");
        if (linear.length > 0) {
          const s = linear.reduce((a, f) => a + f.weight, 0);
          if (Math.abs(s - 1) > 1e-6) {
            alerts.push(`Σweight ≠ 1 bei Conversion ${c._id} (linear: ${s.toFixed(6)}).`);
            break;
          }
        }
      }
    }
    return alerts;
  },
});
