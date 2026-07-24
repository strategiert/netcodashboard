import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifyIngestSignature } from "./datalakeHmac";
import { requireSection } from "./authz";
import type { Id } from "./_generated/dataModel";

// Forecast (Chronos-2, externer nächtlicher Python-Prozess): 14-Tage-Prognosen
// (p10/p50/p90) je Marke/Metrik + Anomalien aus 7-Tage-Backtest. HMAC-Ingest
// analog convex/datalake.ts (verifyIngestSignature wiederverwendet, eigenes
// Secret FORECAST_INGEST_SECRET). Generation-Swap analog convex/adCosts.ts.

const metricValidator = v.union(
  v.literal("sessions"),
  v.literal("adSpend"),
  v.literal("adConversions"),
);

const forecastRow = v.object({
  brandSlug: v.string(),
  metric: metricValidator,
  date: v.string(),   // YYYY-MM-DD
  p10: v.number(),
  p50: v.number(),
  p90: v.number(),
});

const anomalyRow = v.object({
  brandSlug: v.string(),
  metric: metricValidator,
  date: v.string(),   // YYYY-MM-DD
  actual: v.number(),
  p10: v.number(),
  p90: v.number(),
  severity: v.union(v.literal("warn"), v.literal("critical")),
});

async function brandMapBySlug(ctx: { db: { query: (t: "brands") => { collect: () => Promise<Array<{ _id: Id<"brands">; slug: string }>> } } }) {
  const brands = await ctx.db.query("brands").collect();
  return Object.fromEntries(brands.map((b) => [b.slug, b._id])) as Record<string, Id<"brands">>;
}

export const upsertBatch = internalMutation({
  args: {
    rows: v.array(forecastRow),
    anomalies: v.array(anomalyRow),
    generation: v.number(),
  },
  handler: async (ctx, { rows, anomalies, generation }) => {
    const brandIds = await brandMapBySlug(ctx);
    const computedAt = Date.now();
    let forecastsUpserted = 0, anomaliesUpserted = 0, skippedBrand = 0;

    for (const row of rows) {
      const brandId = brandIds[row.brandSlug];
      if (!brandId) { skippedBrand++; continue; }

      const existing = await ctx.db
        .query("forecasts")
        .withIndex("by_brand_metric_date", (q) =>
          q.eq("brandId", brandId).eq("metric", row.metric).eq("date", row.date),
        )
        .unique();

      const doc = {
        brandId,
        metric: row.metric,
        date: row.date,
        p10: row.p10,
        p50: row.p50,
        p90: row.p90,
        generation,
        computedAt,
      };
      if (existing) await ctx.db.patch(existing._id, doc);
      else await ctx.db.insert("forecasts", doc);
      forecastsUpserted++;
    }

    for (const row of anomalies) {
      const brandId = brandIds[row.brandSlug];
      if (!brandId) { skippedBrand++; continue; }

      // forecastAnomalies hat nur den Index by_brand_date (kein Metric-Feld
      // im Index) — Metric-Match daher im Code, analog clickViews-Upsert.
      const candidates = await ctx.db
        .query("forecastAnomalies")
        .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).eq("date", row.date))
        .collect();
      const existing = candidates.find((c) => c.metric === row.metric) ?? null;

      const doc = {
        brandId,
        metric: row.metric,
        date: row.date,
        actual: row.actual,
        p10: row.p10,
        p90: row.p90,
        severity: row.severity,
        generation,
        computedAt,
      };
      if (existing) await ctx.db.patch(existing._id, doc);
      else await ctx.db.insert("forecastAnomalies", doc);
      anomaliesUpserted++;
    }

    return { forecastsUpserted, anomaliesUpserted, skippedBrand };
  },
});

/**
 * Generation-Sweep: löscht forecasts + forecastAnomalies mit generation < der
 * übergebenen (aktuellen) Generation. NUR nach fehlerfreiem Komplettlauf
 * aufrufen (done=true) — Muster convex/adCosts.ts sweepStale.
 */
export const sweepStale = internalMutation({
  args: { generation: v.number() },
  handler: async (ctx, { generation }) => {
    let deletedForecasts = 0, deletedAnomalies = 0;

    const staleForecasts = await ctx.db
      .query("forecasts")
      .withIndex("by_generation", (q) => q.lt("generation", generation))
      .collect();
    for (const doc of staleForecasts) { await ctx.db.delete(doc._id); deletedForecasts++; }

    const staleAnomalies = await ctx.db
      .query("forecastAnomalies")
      .withIndex("by_generation", (q) => q.lt("generation", generation))
      .collect();
    for (const doc of staleAnomalies) { await ctx.db.delete(doc._id); deletedAnomalies++; }

    return { deletedForecasts, deletedAnomalies };
  },
});

// Anders als datalake.ingest bewusst OHNE Nonce-Replay-Store: verifyIngestSignature
// verwirft Requests außerhalb ±5 Minuten, der Upsert ist idempotent je
// (brand,metric,date), und ein Replay mit alter generation kann via sweepStale
// (löscht nur generation < X) keine neueren Daten entfernen. Ein Replay im
// 5-Minuten-Fenster schreibt also nur identische Werte doppelt — folgenlos.
export const ingestHttp = httpAction(async (ctx, request) => {
  const secret = process.env.FORECAST_INGEST_SECRET;
  if (!secret) return new Response("not configured", { status: 503 });
  const ts = request.headers.get("x-datalake-ts") ?? "";
  const nonce = request.headers.get("x-datalake-nonce") ?? "";
  const sig = request.headers.get("x-datalake-sig") ?? "";
  const body = await request.text();
  const verdict = await verifyIngestSignature(secret, ts, nonce, body, sig);
  if (!verdict.ok) return new Response(verdict.reason, { status: 401 });

  let parsed: { generation: number; rows?: unknown[]; anomalies?: unknown[]; done?: boolean };
  try { parsed = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }
  if (typeof parsed.generation !== "number" || !Number.isFinite(parsed.generation)) {
    return new Response("bad generation", { status: 400 });
  }
  if ((parsed.rows !== undefined && !Array.isArray(parsed.rows)) ||
      (parsed.anomalies !== undefined && !Array.isArray(parsed.anomalies))) {
    return new Response("bad payload", { status: 400 });
  }

  const result = await ctx.runMutation(internal.forecast.upsertBatch, {
    rows: (parsed.rows ?? []) as never,
    anomalies: (parsed.anomalies ?? []) as never,
    generation: parsed.generation,
  });

  if (parsed.done) {
    await ctx.runMutation(internal.forecast.sweepStale, { generation: parsed.generation });
  }

  const upserted = result.forecastsUpserted + result.anomaliesUpserted;
  return new Response(JSON.stringify({ ok: true, upserted, ...result }), {
    status: 200, headers: { "content-type": "application/json" },
  });
});

export const getForecast = query({
  args: { brandSlug: v.string(), metric: metricValidator, from: v.string(), to: v.string() },
  handler: async (ctx, { brandSlug, metric, from, to }) => {
    await requireSection(ctx, "daily");
    const brand = await ctx.db
      .query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", brandSlug))
      .unique();
    if (!brand) return [];
    return await ctx.db
      .query("forecasts")
      .withIndex("by_brand_metric_date", (q) =>
        q.eq("brandId", brand._id).eq("metric", metric).gte("date", from).lte("date", to),
      )
      .order("asc")
      .collect();
  },
});

export const getAnomalies = query({
  args: { brandSlug: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, { brandSlug, days }) => {
    await requireSection(ctx, "daily");
    const brand = await ctx.db
      .query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", brandSlug))
      .unique();
    if (!brand) return [];
    const from = new Date(Date.now() - (days ?? 7) * 86_400_000).toISOString().slice(0, 10);
    return await ctx.db
      .query("forecastAnomalies")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).gte("date", from))
      .order("desc")
      .collect();
  },
});
