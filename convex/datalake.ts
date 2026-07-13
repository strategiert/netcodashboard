import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { verifyIngestSignature } from "./datalakeHmac";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

const recordValidator = v.object({
  kind: v.string(),
  sourceAccount: v.string(),
  objectType: v.string(),
  externalId: v.string(),
  eventType: v.string(),
  ts: v.number(),
  type: v.string(),
  channel: v.optional(v.string()),
  campaignId: v.optional(v.string()),
  adgroupId: v.optional(v.string()),
  adId: v.optional(v.string()),
  keyword: v.optional(v.string()),
  device: v.optional(v.string()),
  urlPath: v.optional(v.string()),
  pid: v.optional(v.string()),
  clickIds: v.optional(v.object({
    gclid: v.optional(v.string()),
    fbclid: v.optional(v.string()),
    msclkid: v.optional(v.string()),
  })),
  value: v.optional(v.number()),
  currency: v.optional(v.string()),
  emailHmac: v.optional(v.string()),
  phoneHmac: v.optional(v.string()),
  eventId: v.optional(v.string()),
});

export const ingest = internalMutation({
  args: { brandSlug: v.string(), nonce: v.string(), nonceTs: v.number(), records: v.array(recordValidator) },
  handler: async (ctx, args) => {
    // Nonce-Replay-Schutz
    const seen = await ctx.db.query("ingestNonces")
      .withIndex("by_nonce", (q) => q.eq("nonce", args.nonce)).unique();
    if (seen) return { ok: false, reason: "replay" };
    await ctx.db.insert("ingestNonces", { nonce: args.nonce, ts: args.nonceTs });

    const brand = await ctx.db.query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", args.brandSlug)).unique();
    if (!brand) return { ok: false, reason: "unknown_brand" };

    let inserted = 0, deduped = 0;
    for (const r of args.records) {
      const source = "web", sourceVersion = 1;
      const existing = await ctx.db.query("sourceRecords")
        .withIndex("by_unique", (q) => q
          .eq("brandId", brand._id).eq("source", source).eq("sourceAccount", r.sourceAccount)
          .eq("objectType", r.objectType).eq("externalId", r.externalId)
          .eq("eventType", r.eventType).eq("sourceVersion", sourceVersion))
        .unique();
      if (existing) { deduped++; continue; }
      const sourceRecordId = await ctx.db.insert("sourceRecords", {
        brandId: brand._id, source, sourceAccount: r.sourceAccount,
        objectType: r.objectType, externalId: r.externalId,
        eventType: r.eventType, sourceVersion,
      });

      if (r.kind === "conversion") {
        // Person über emailHmac finden oder anlegen (konfliktfreier Schlüssel)
        let personId: Id<"persons"> | null = null;
        if (r.emailHmac) {
          const key = await ctx.db.query("identityKeys")
            .withIndex("by_key", (q) => q
              .eq("brandId", brand._id).eq("keyType", "emailHmac").eq("keyValue", r.emailHmac!))
            .first();
          if (key) personId = key.personId;
        }
        if (!personId) {
          personId = await ctx.db.insert("persons", { brandId: brand._id, firstSeen: r.ts });
          const mkKey = (keyType: string, keyValue: string) => ctx.db.insert("identityKeys", {
            personId: personId!, brandId: brand._id, keyType, keyValue,
            validFrom: r.ts, evidence: `web:${r.externalId}`, conflictStatus: "unique",
          });
          if (r.emailHmac) await mkKey("emailHmac", r.emailHmac);
          if (r.phoneHmac) await mkKey("phoneHmac", r.phoneHmac);
          if (r.pid) await mkKey("pid", r.pid);
          await ctx.db.insert("consentLedger", {
            personId, brandId: brand._id, purpose: "analytics",
            legalBasis: "consent", grantedAt: r.ts,
          });
        }
        await ctx.db.insert("conversions", {
          personId, brandId: brand._id, ts: r.ts, type: r.type,
          value: r.value, currency: r.currency ?? "EUR",
          eventId: r.eventId ?? r.externalId, sourceRecordId,
          pid: r.pid, clickIds: r.clickIds,
        });
      } else {
        await ctx.db.insert("touchpoints", {
          brandId: brand._id, ts: r.ts, type: r.type,
          channel: r.channel ?? "direct",
          campaignId: r.campaignId, adgroupId: r.adgroupId, adId: r.adId,
          keyword: r.keyword, device: r.device, urlPath: r.urlPath,
          pid: r.pid, clickIds: r.clickIds, sourceRecordId,
        });
      }
      inserted++;
    }
    return { ok: true, inserted, deduped };
  },
});

export const ingestHttp = httpAction(async (ctx, request) => {
  const secret = process.env.DATALAKE_INGEST_SECRET;
  if (!secret) return new Response("not configured", { status: 503 });
  const ts = request.headers.get("x-datalake-ts") ?? "";
  const nonce = request.headers.get("x-datalake-nonce") ?? "";
  const sig = request.headers.get("x-datalake-sig") ?? "";
  const body = await request.text();
  const verdict = await verifyIngestSignature(secret, ts, nonce, body, sig);
  if (!verdict.ok) return new Response(verdict.reason, { status: 401 });
  let parsed: { brandSlug: string; records: unknown[] };
  try { parsed = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }
  const result = await ctx.runMutation(internal.datalake.ingest, {
    brandSlug: parsed.brandSlug, nonce, nonceTs: Number(ts),
    records: parsed.records as never,
  });
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 409, headers: { "content-type": "application/json" },
  });
});

// Nonce-Aufräumen: Stale-Check (±5 min) läuft vor dem Nonce-Lookup, daher ist
// Löschen von Nonces älter als 15 min sicher (großzügiger Puffer über die Stale-Grenze).
export const cleanupNonces = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    const old = await ctx.db.query("ingestNonces")
      .withIndex("by_ts", (q) => q.lt("ts", cutoff))
      .take(500);
    for (const n of old) await ctx.db.delete(n._id);
    return { deleted: old.length };
  },
});

// Admin-Debug: letzte Datalake-Zeilen je Brand (requireAdmin-Muster aus convex/users.ts)
export const debugLast = query({
  args: { brandSlug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Nicht angemeldet");
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") throw new Error("Keine Berechtigung (nur Admin)");
    const brand = await ctx.db.query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", args.brandSlug)).unique();
    if (!brand) return { touchpoints: [], conversions: [] };
    const touchpoints = await ctx.db.query("touchpoints")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id)).order("desc").take(10);
    const conversions = await ctx.db.query("conversions")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id)).order("desc").take(10);
    return { touchpoints, conversions };
  },
});

// Datalake-Übersicht für die Dashboard-Ansicht (admin-gated). Liefert
// Tages-Aggregate der letzten `days` Tage, Gesamtzahlen, Top-Kampagnen/Anzeigen
// nach Touchpoints und die jüngsten Leads. Reine Sammel-Sicht (Paket A) —
// echte Attribution folgt in Paket D.
export const overview = query({
  args: { brandSlug: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Nicht angemeldet");
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") throw new Error("Keine Berechtigung (nur Admin)");

    const brand = await ctx.db.query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", args.brandSlug)).unique();
    if (!brand) return { found: false as const };

    const days = Math.min(Math.max(args.days ?? 14, 1), 60);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const dayKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);

    const touchpoints = await ctx.db.query("touchpoints")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id).gte("ts", cutoff))
      .order("desc").take(8000);
    const conversions = await ctx.db.query("conversions")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id).gte("ts", cutoff))
      .order("desc").take(2000);
    const persons = await ctx.db.query("persons")
      .withIndex("by_brand", (q) => q.eq("brandId", brand._id)).take(2000);

    // Tages-Buckets
    const buckets: Record<string, { date: string; pageviews: number; otherTouch: number; leads: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = dayKey(Date.now() - i * 24 * 60 * 60 * 1000);
      buckets[d] = { date: d, pageviews: 0, otherTouch: 0, leads: 0 };
    }
    for (const t of touchpoints) {
      const b = buckets[dayKey(t.ts)];
      if (!b) continue;
      if (t.type === "pageview") b.pageviews++; else b.otherTouch++;
    }
    for (const c of conversions) {
      const b = buckets[dayKey(c.ts)];
      if (b && c.type === "lead") b.leads++;
    }
    const daily = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));

    // Top-Kampagnen + Top-Anzeigen nach Touchpoint-Zahl
    const countBy = (key: "campaignId" | "adId") => {
      const m: Record<string, number> = {};
      for (const t of touchpoints) {
        const v0 = t[key];
        if (v0) m[v0] = (m[v0] ?? 0) + 1;
      }
      return Object.entries(m).map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count).slice(0, 8);
    };

    const recentLeads = conversions.filter((c) => c.type === "lead").slice(0, 12).map((c) => ({
      ts: c.ts, value: c.value, currency: c.currency,
      gclid: c.clickIds?.gclid, msclkid: c.clickIds?.msclkid, fbclid: c.clickIds?.fbclid,
      pid: c.pid,
    }));

    // Kanal-Verteilung der Touchpoints
    const channels: Record<string, number> = {};
    for (const t of touchpoints) channels[t.channel || "direct"] = (channels[t.channel || "direct"] ?? 0) + 1;

    return {
      found: true as const,
      days,
      totals: {
        persons: persons.length,
        touchpoints: touchpoints.length,
        conversions: conversions.length,
        leads: conversions.filter((c) => c.type === "lead").length,
      },
      daily,
      topCampaigns: countBy("campaignId"),
      topAds: countBy("adId"),
      channels: Object.entries(channels).map(([channel, count]) => ({ channel, count })).sort((a, b) => b.count - a.count),
      recentLeads,
    };
  },
});

// Ops-/CLI-Debug (internal → nur über `npx convex run` bzw. andere Functions
// aufrufbar, NICHT client-exponiert). Zählt Datalake-Zeilen je Brand und gibt
// die jüngsten Touchpoints/Conversions zurück — für E2E- und Health-Checks.
export const recentCounts = internalQuery({
  args: { brandSlug: v.string() },
  handler: async (ctx, args) => {
    const brand = await ctx.db.query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", args.brandSlug)).unique();
    if (!brand) return { brand: args.brandSlug, found: false };
    const touchpoints = await ctx.db.query("touchpoints")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id)).order("desc").take(5);
    const conversions = await ctx.db.query("conversions")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id)).order("desc").take(5);
    const persons = await ctx.db.query("persons")
      .withIndex("by_brand", (q) => q.eq("brandId", brand._id)).take(200);
    return {
      brand: args.brandSlug,
      found: true,
      personCount: persons.length,
      recentTouchpoints: touchpoints.map((t) => ({ ts: t.ts, type: t.type, channel: t.channel, campaignId: t.campaignId, adId: t.adId, pid: t.pid, clickIds: t.clickIds })),
      recentConversions: conversions.map((c) => ({ ts: c.ts, type: c.type, value: c.value, pid: c.pid, clickIds: c.clickIds, eventId: c.eventId })),
    };
  },
});
