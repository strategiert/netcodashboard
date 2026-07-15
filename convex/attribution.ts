import { v } from "convex/values";
import {
  internalMutation, internalQuery, query, QueryCtx,
} from "./_generated/server";
import { requireSection } from "./authz";
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
        id: t._id, ts: t.ts, type: t.type, channel: normalizeRawChannel(t.channel),
        campaignId: t.campaignId, adgroupId: t.adgroupId, adId: t.adId,
      });
    }
    return out;
  },
});

/** Roh-Kanal säubern, BEVOR Modelle rechnen — "Direct"/"(direct)"/"" sind alle direct. */
function normalizeRawChannel(raw: string | undefined | null): string {
  const s = (raw ?? "").trim().toLowerCase().replace(/^\(|\)$/g, "");
  return s === "" || s === "direct" || s === "none" ? "direct" : s;
}

/** gclid-Backstop: Ad-Zuordnung aus Paket-B-clickViews, wenn UTM nichts hergab. */
export const clickViewByGclid = internalQuery({
  args: { brandId: v.id("brands"), gclid: v.string() },
  handler: async (ctx, { brandId, gclid }) => {
    const rows = await ctx.db
      .query("clickViews")
      .withIndex("by_gclid", (q) => q.eq("gclid", gclid))
      .collect();
    // NUR Brand-Match — ein Cross-Brand-Fallback würde Conversions bewusst falsch klassifizieren.
    const match = rows.find((r) => r.brandId === brandId) ?? null;
    return match
      ? {
          campaignId: match.campaignId,
          // clickViews liefern für PMax "0" — Kosten speichern "" (Join-Kompatibilität).
          adgroupId: match.adgroupId === "0" ? "" : match.adgroupId,
          adId: match.adId,
          date: match.date,
          sourceAccount: match.sourceAccount,
        }
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
  modelVersion: v.string(),
  touchpointId: v.optional(v.id("touchpoints")),
  channel: v.string(),
  sourceAccount: v.optional(v.string()),
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
    expectedGeneration: v.number(), // CAS: Schutz gegen parallele Läufe
    lookbackDays: v.number(),
    conversions: v.number(),
    facts: v.number(),
  },
  handler: async (ctx, args) => {
    const meta = await ctx.db
      .query("attributionMeta")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .unique();
    // Compare-and-swap: Hat ein paralleler Lauf inzwischen aktiviert, brechen wir ab,
    // statt dessen Generation zu überschreiben (Mutation ist transaktional).
    if ((meta?.activeGeneration ?? 0) !== args.expectedGeneration) {
      throw new Error(
        `swapGeneration: aktive Generation ist ${meta?.activeGeneration ?? 0}, erwartet ${args.expectedGeneration} — paralleler Lauf?`,
      );
    }
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

// ── UI-Queries (Section-Recht "attribution", siehe convex/authz.ts) ────────

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
    await requireSection(ctx, "attribution");
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
      // "0"→"" wie beim Backstop: Kosten-PMax-Zeilen tragen leere Dimensionen.
      const norm = (s?: string) => (s === "0" ? "" : (s ?? ""));
      const r = rowFor(channel, norm(f.campaignId), norm(f.adgroupId), norm(f.adId));
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
    await requireSection(ctx, "attribution");
    const brand = await brandBySlug(ctx, brandSlug);
    if (!brand) return [];
    const conversions = await ctx.db
      .query("conversions")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id))
      .order("desc")
      .take(Math.min(limit ?? 20, 50));

    const out = [];
    const LOOKBACK_MS = 90 * 86_400_000;
    for (const c of conversions) {
      // Gleiche Join-Logik wie die Engine: Person UND pid, dedupliziert —
      // und NUR Touchpoints vor der Conversion im Lookback (spätere Pageviews
      // gehören nicht zur Journey dieser Conversion).
      const byPerson = await ctx.db
        .query("touchpoints")
        .withIndex("by_person", (q) => q.eq("personId", c.personId))
        .collect();
      let byPid: Doc<"touchpoints">[] = [];
      if (c.pid) {
        byPid = await ctx.db
          .query("touchpoints")
          .withIndex("by_pid", (q) => q.eq("brandId", brand._id).eq("pid", c.pid))
          .collect();
      }
      const seen = new Set<string>();
      const tps = [...byPerson, ...byPid].filter((t) => {
        if (seen.has(t._id)) return false;
        seen.add(t._id);
        return t.ts <= c.ts && t.ts >= c.ts - LOOKBACK_MS;
      });
      out.push({
        conversionId: c._id,
        ts: c.ts,
        type: c.type,
        value: c.value ?? 0,
        clickIds: c.clickIds,
        timeline: tps
          .sort((a, b) => a.ts - b.ts)
          .map((t) => ({
            ts: t.ts, type: t.type, channel: normalizeRawChannel(t.channel),
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
    await requireSection(ctx, "attribution");
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
      let unattributed = 0;
      for (const c of sample) {
        const facts = await ctx.db
          .query("attributionFacts")
          .withIndex("by_conversion", (q) => q.eq("conversionId", c._id).eq("generation", meta.activeGeneration))
          .collect();
        if (facts.length === 0) {
          alerts.push(`Conversion ${c._id} hat KEINE Facts in der aktiven Generation — Engine-Lauf prüfen.`);
          break;
        }
        if (facts.some((f) => f.channel === "unattributed")) unattributed++;
        const linear = facts.filter((f) => f.model === "linear");
        if (linear.length > 0) {
          const s = linear.reduce((a, f) => a + f.weight, 0);
          if (Math.abs(s - 1) > 1e-6) {
            alerts.push(`Σweight ≠ 1 bei Conversion ${c._id} (linear: ${s.toFixed(6)}).`);
            break;
          }
        }
      }
      if (unattributed > 0) {
        alerts.push(
          `${unattributed}/${sample.length} der letzten Conversions sind NICHT zuordenbar (kein pid-/Klick-Match) — Beacon-/pid-Coverage prüfen.`,
        );
      }
    }

    // (e) Kosten-Sync-Ausfall je Kanal: Kanal hatte in den 7 Tagen davor Spend,
    // aber für gestern existiert keine einzige Zeile → Connector prüfen.
    const yesterday = new Date(now - 86_400_000).toISOString().slice(0, 10);
    const weekAgo = new Date(now - 8 * 86_400_000).toISOString().slice(0, 10);
    const recentCosts = await ctx.db
      .query("adCosts")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).gte("date", weekAgo))
      .collect();
    const channelsWithSpend = new Set(recentCosts.filter((c) => c.spend > 0 && c.date < yesterday).map((c) => c.channel));
    const channelsYesterday = new Set(recentCosts.filter((c) => c.date === yesterday).map((c) => c.channel));
    for (const ch of channelsWithSpend) {
      if (!channelsYesterday.has(ch)) {
        alerts.push(`Kanal ${ch}: keine Kostenzeilen für ${yesterday}, obwohl zuvor Spend floss — Sync/Konto prüfen.`);
      }
    }

    // (f) Kosten-Daten veraltet: neuester syncedAt aller adCosts älter als 26 h.
    if (recentCosts.length > 0) {
      const newestSync = Math.max(...recentCosts.map((c) => c.syncedAt));
      if (now - newestSync > 26 * 3_600_000) {
        alerts.push(`Kosten zuletzt vor ${Math.round((now - newestSync) / 3_600_000)} h synchronisiert — Crons prüfen.`);
      }
    }

    // (g) Fremdwährung eingeschleppt: alles außer EUR verfälscht Summen ungewarnt.
    const foreignCurrency = recentCosts.find((c) => c.currency && c.currency !== "EUR");
    if (foreignCurrency) {
      alerts.push(`adCosts enthält Währung ${foreignCurrency.currency} (${foreignCurrency.channel}) — Summen sind nicht mehr EUR-rein.`);
    }

    // (h) Unbekannte utm_source-Werte: bezahlter Traffic, der keinem Kostenkanal
    // zuordenbar ist (Tippfehler im Template?), ab 5 Vorkommen in 7 Tagen.
    const recentTps = await ctx.db
      .query("touchpoints")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id).gte("ts", now - 7 * 86_400_000))
      .collect();
    const unknownSources = new Map<string, number>();
    for (const t of recentTps) {
      const ch = (t.channel || "direct").toLowerCase();
      if (ch !== "direct" && !normalizeChannel(ch) && !["newsletter", "email", "linkedin"].includes(ch)) {
        unknownSources.set(ch, (unknownSources.get(ch) ?? 0) + 1);
      }
    }
    for (const [src, count] of unknownSources) {
      if (count >= 5) alerts.push(`Unbekannte utm_source „${src}" (${count}× in 7 Tagen) — Kampagnen-Template prüfen.`);
    }

    // (i) ClickID-Verlust: Ad-Touchpoints (google/bing/facebook) ohne gespeicherte Click-ID.
    const adTps = recentTps.filter((t) => normalizeChannel(t.channel || ""));
    if (adTps.length >= 10) {
      const withClickId = adTps.filter((t) => t.clickIds && (t.clickIds.gclid || t.clickIds.fbclid || t.clickIds.msclkid)).length;
      const lossPct = Math.round((1 - withClickId / adTps.length) * 100);
      if (lossPct > 50) {
        alerts.push(`${lossPct} % der Anzeigen-Touchpoints (7 Tage) ohne Click-ID — Auto-Tagging/Consent-Kopplung prüfen.`);
      }
    }

    // (j) Conversion-Duplikate: gleiche eventId mehrfach (Dedupe-Anker verletzt).
    const recentConvs = await ctx.db
      .query("conversions")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id).gte("ts", now - 7 * 86_400_000))
      .collect();
    const eventIds = new Map<string, number>();
    for (const c of recentConvs) eventIds.set(c.eventId, (eventIds.get(c.eventId) ?? 0) + 1);
    for (const [id, count] of eventIds) {
      if (count > 1) { alerts.push(`Conversion-eventId ${id.slice(0, 8)}… existiert ${count}× — Dedupe verletzt.`); break; }
    }

    // (k) click_view-Register veraltet (Backstop verliert Tage; 90-Tage-Frist!).
    const newestClick = await ctx.db
      .query("clickViews")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id))
      .order("desc")
      .first();
    if (newestClick && now - newestClick.syncedAt > 26 * 3_600_000) {
      alerts.push(`click_view-Register zuletzt vor ${Math.round((now - newestClick.syncedAt) / 3_600_000)} h aktualisiert — Cron prüfen.`);
    }

    // (l) Indexierungs-Stichprobe: Sitemap-URLs, die Google nicht im Index führt.
    const coverage = await ctx.db
      .query("indexCoverage")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id))
      .order("desc")
      .first();
    if (coverage && coverage.notIndexed > 0) {
      alerts.push(
        `${coverage.notIndexed}/${coverage.inspected} geprüfte Sitemap-URLs nicht im Google-Index (Stichprobe ${coverage.date}) — Details in indexCoverage.`,
      );
    }

    return alerts;
  },
});
