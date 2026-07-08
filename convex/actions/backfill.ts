"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { GoogleAuth } from "google-auth-library";
import { v } from "convex/values";
import { publerGet, resolveAccountBrand } from "./publerHelpers";
import { shouldIncludeInPerformanceSnapshot, detectBrand, TRACKED_ADS_BRANDS } from "../adsMapping";

const GSC_PROPERTIES: Record<string, string> = {
  bodycam:      process.env.GSC_PROPERTY_BODYCAM      ?? "",
  "bodycam-nl": process.env.GSC_PROPERTY_BODYCAM_NL   ?? "",
  microvista:   process.env.GSC_PROPERTY_MICROVISTA   ?? "",
  bautv:        process.env.GSC_PROPERTY_BAUTV        ?? "",
  "bautv-nl":   process.env.GSC_PROPERTY_BAUTV_NL     ?? "",
};

function dateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = days; i >= 3; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function eachDate(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const d = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  while (d <= end) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

async function getGSCToken() {
  const json = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GSC_SERVICE_ACCOUNT_JSON not set");
  const auth = new GoogleAuth({
    credentials: JSON.parse(json),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token!;
}

async function fetchGSCRange(property: string, startDate: string, endDate: string, token: string) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["date"] }),
    }
  );
  if (!res.ok) throw new Error(`GSC ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // rows: [{ keys: ["2026-01-01"], clicks, impressions, ctr, position }]
  return (data.rows ?? []) as Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export const backfillGSC = action({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 90 }) => {
    const brands = await ctx.runQuery(api.brands.list);
    const token = await getGSCToken();
    const end = new Date();
    end.setDate(end.getDate() - 3); // GSC has ~3 day delay
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    const results: string[] = [];
    for (const brand of brands) {
      const property = GSC_PROPERTIES[brand.slug];
      if (!property) { results.push(`SKIP ${brand.slug}: no property`); continue; }
      try {
        const rows = await fetchGSCRange(property, startDate, endDate, token);
        let saved = 0;
        for (const row of rows) {
          const date = row.keys[0];
          await ctx.runMutation(api.kpi.upsertSnapshot, {
            brandId: brand._id,
            date,
            source: "gsc",
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            avgPosition: row.position,
          });
          saved++;
        }
        results.push(`OK ${brand.slug}: ${saved} days (${startDate} → ${endDate})`);
      } catch (e: any) {
        results.push(`ERROR ${brand.slug}: ${e.message}`);
      }
    }
    return results;
  },
});

// Posts-only-Backfill. Zählt Posts je ZIEL-Brand (Account-Overrides wie in syncPubler);
// für volle Social-Analytics syncPublerRange nutzen.
export const backfillPubler = action({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 90 }) => {
    const brands = await ctx.runQuery(api.brands.list);
    const brandBySlug = Object.fromEntries(brands.map((b) => [b.slug, b]));
    const slugById = Object.fromEntries(brands.map((b) => [b._id, b.slug]));
    const workspaces = (await ctx.runQuery(api.publer.listWorkspaces)).filter((ws) => ws.brandId);
    const dates = dateRange(days);

    // brandId → date → Anzahl Posts
    const counts: Record<string, Record<string, number>> = {};
    let errors = 0;

    for (const ws of workspaces) {
      for (let i = 0; i < dates.length; i += 7) {
        const chunk = dates.slice(i, i + 7);
        try {
          const data = await publerGet(
            `/api/v1/posts?state=published&from=${chunk[0]}&to=${chunk[chunk.length - 1]}`,
            ws.workspaceId
          );
          for (const post of data.posts ?? []) {
            const d = (post.published_at ?? post.created_at ?? post.scheduled_at ?? "").slice(0, 10);
            if (!d || !dates.includes(d)) continue;
            const brandId = resolveAccountBrand(post.account_id, ws.brandId!, brandBySlug);
            counts[brandId] ??= {};
            counts[brandId][d] = (counts[brandId][d] ?? 0) + 1;
          }
        } catch { errors++; }
        await new Promise(r => setTimeout(r, 800));
      }
    }

    const results: string[] = [];
    for (const [brandId, byDate] of Object.entries(counts)) {
      let saved = 0;
      for (const [date, socialPosts] of Object.entries(byDate)) {
        await ctx.runMutation(api.kpi.upsertSnapshot, {
          brandId: brandId as any, date, source: "publer", socialPosts,
        });
        saved++;
      }
      results.push(`OK ${slugById[brandId] ?? brandId}: ${saved} Tage`);
    }
    if (errors) results.push(`${errors} Fenster-Fehler`);
    return results;
  },
});

// ── Google Ads Backfill ──────────────────────────────────────────────────────

async function getAdsToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GADS_OAUTH_CLIENT_ID!,
      client_secret: process.env.GADS_OAUTH_CLIENT_SECRET!,
      refresh_token: process.env.GADS_REFRESH_TOKEN!,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json() as any;
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

// Backfill in Fenstern: { days: 550, daysUntil: 490 } usw. — die Ads-API liefert
// pro Suchanfrage max. ~10k Zeilen ohne Paging, lange Zeiträume daher stückeln.
export const backfillAds = action({
  args: { days: v.optional(v.number()), daysUntil: v.optional(v.number()) },
  handler: async (ctx, { days = 30, daysUntil = 0 }) => {
    if (!process.env.GADS_REFRESH_TOKEN) return ["SKIP: no GADS_REFRESH_TOKEN"];

    const brands = await ctx.runQuery(api.brands.list);
    const brandMap = Object.fromEntries(brands.map((b) => [b.slug, b]));
    const token = await getAdsToken();

    const customerId =        process.env.GADS_CUSTOMER_ID_NETCO!.replace(/-/g, "");
    const developerToken =    process.env.GADS_DEVELOPER_TOKEN!;
    const managerCustomerId = process.env.GADS_MANAGER_CUSTOMER_ID!.replace(/-/g, "");

    // Fetch all days in one query using segments.date
    const start = new Date();
    start.setDate(start.getDate() - days);
    const end = new Date();
    end.setDate(end.getDate() - Math.max(1, daysUntil));
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    const query = `
      SELECT campaign.name, campaign.advertising_channel_type,
             segments.date, metrics.cost_micros, metrics.clicks,
             metrics.impressions, metrics.conversions, metrics.average_cpc
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    `;

    const res = await fetch(
      `https://googleads.googleapis.com/v22/customers/${customerId}/googleAds:search`,
      {
        method: "POST",
        headers: {
          Authorization:      `Bearer ${token}`,
          "developer-token":  developerToken,
          "login-customer-id": managerCustomerId,
          "Content-Type":     "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );
    if (!res.ok) throw new Error(`Ads API ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    const rows = (data.results ?? []) as any[];

    // Aggregate by brand + date
    type Agg = { adSpend: number; adClicks: number; adImpressions: number; adConversions: number; cpcSum: number; count: number };
    const byBrandDate: Record<string, Agg> = {};

    for (const row of rows) {
      const slug = detectBrand(row.campaign?.name ?? "");
      if (!slug) continue;
      if (!shouldIncludeInPerformanceSnapshot(row.campaign?.advertisingChannelType)) continue;
      const date = row.segments?.date;
      if (!date) continue;
      const key = `${slug}:${date}`;
      if (!byBrandDate[key]) byBrandDate[key] = { adSpend: 0, adClicks: 0, adImpressions: 0, adConversions: 0, cpcSum: 0, count: 0 };
      const m = row.metrics;
      byBrandDate[key].adSpend       += Number(m.costMicros ?? m.cost_micros ?? 0) / 1_000_000;
      byBrandDate[key].adClicks      += Number(m.clicks ?? 0);
      byBrandDate[key].adImpressions += Number(m.impressions ?? 0);
      byBrandDate[key].adConversions += Number(m.conversions ?? 0);
      byBrandDate[key].cpcSum        += Number(m.averageCpc ?? m.average_cpc ?? 0) / 1_000_000;
      byBrandDate[key].count++;
    }

    let saved = 0;
    for (const slug of TRACKED_ADS_BRANDS) {
      const brand = brandMap[slug];
      if (!brand) continue;
      for (const date of eachDate(startDate, endDate)) {
        const agg = byBrandDate[`${slug}:${date}`] ?? { adSpend: 0, adClicks: 0, adImpressions: 0, adConversions: 0, cpcSum: 0, count: 0 };
        await ctx.runMutation(api.kpi.upsertSnapshot, {
          brandId: brand._id, date, source: "ads",
          adSpend: agg.adSpend, adClicks: agg.adClicks,
          adImpressions: agg.adImpressions, adConversions: agg.adConversions,
          adCpc: agg.count > 0 ? agg.cpcSum / agg.count : 0,
        });
        saved++;
      }
    }
    return [`OK: ${saved} brand-day rows from ${rows.length} search campaign rows (${startDate} → ${endDate})`];
  },
});
