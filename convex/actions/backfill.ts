"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { GoogleAuth } from "google-auth-library";
import { v } from "convex/values";
import { getBrandWorkspaceMap, publerGet } from "./publerHelpers";

const GSC_PROPERTIES: Record<string, string> = {
  bodycam:   process.env.GSC_PROPERTY_BODYCAM   ?? "",
  microvista: process.env.GSC_PROPERTY_MICROVISTA ?? "",
  bautv:     process.env.GSC_PROPERTY_BAUTV      ?? "",
};

// Google Ads brand detection (same as syncAds.ts)
const BRAND_KEYWORDS: Record<string, string[]> = {
  bodycam:    ["bodycam", "body-cam", "body cam", "netco-bc", "bc-"],
  microvista: ["microvista", "micro vista", "ndt-"],
  bautv:      ["bautv", "bau-tv", "baustellenkamera", "btv-", "bk-"],
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

async function fetchPublerPostsForDate(workspaceId: string, date: string, apiKey: string): Promise<number> {
  const res = await fetch(
    `https://app.publer.com/api/v1/posts?state=published&from=${date}&to=${date}`,
    {
      headers: {
        Authorization: `Bearer-API ${apiKey}`,
        "Publer-Workspace-Id": workspaceId,
      },
    }
  );
  if (!res.ok) throw new Error(`Publer ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.total ?? data.posts?.length ?? 0) as number;
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

export const backfillPubler = action({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 90 }) => {
    const brands = await ctx.runQuery(api.brands.list);
    const brandWorkspaces = await getBrandWorkspaceMap(ctx);
    const dates = dateRange(days);

    const results: string[] = [];
    for (const brand of brands) {
      const wsIds = brandWorkspaces[brand._id];
      if (!wsIds?.length) { results.push(`SKIP ${brand.slug}: keine Workspaces`); continue; }
      let saved = 0;
      let errors = 0;
      for (const date of dates) {
        let totalPosts = 0;
        for (const workspaceId of wsIds) {
          try {
            const data = await publerGet(
              `/api/v1/posts?state=published&from=${date}&to=${date}`,
              workspaceId
            );
            totalPosts += (data.total ?? data.posts?.length ?? 0) as number;
          } catch { errors++; }
        }
        await ctx.runMutation(api.kpi.upsertSnapshot, {
          brandId: brand._id, date, source: "publer", socialPosts: totalPosts,
        });
        saved++;
        await new Promise(r => setTimeout(r, 300));
      }
      results.push(`OK ${brand.slug}: ${saved} days, ${errors} errors`);
    }
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

function detectBrand(campaignName: string): string | null {
  const lower = campaignName.toLowerCase();
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return brand;
  }
  return null;
}

export const backfillAds = action({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
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
    end.setDate(end.getDate() - 1);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    const query = `
      SELECT campaign.name, segments.date, metrics.cost_micros, metrics.clicks,
             metrics.impressions, metrics.conversions, metrics.average_cpc
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status = 'ENABLED'
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
    for (const [key, agg] of Object.entries(byBrandDate)) {
      const [slug, date] = key.split(":");
      const brand = brandMap[slug];
      if (!brand) continue;
      await ctx.runMutation(api.kpi.upsertSnapshot, {
        brandId: brand._id, date, source: "ads",
        adSpend: agg.adSpend, adClicks: agg.adClicks,
        adImpressions: agg.adImpressions, adConversions: agg.adConversions,
        adCpc: agg.count > 0 ? agg.cpcSum / agg.count : 0,
      });
      saved++;
    }
    return [`OK: ${saved} brand-day rows from ${rows.length} campaigns (${startDate} → ${endDate})`];
  },
});
