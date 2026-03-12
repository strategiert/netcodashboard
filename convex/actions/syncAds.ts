"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

// Campaign name keywords per brand slug (case-insensitive match)
const BRAND_KEYWORDS: Record<string, string[]> = {
  bodycam:    ["bodycam", "body-cam", "body cam", "netco-bc"],
  microvista: ["microvista", "micro vista"],
  bautv:      ["bautv", "bau-tv", "baustellenkamera"],
};

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

async function fetchAdsCampaigns(token: string, date: string) {
  const customerId =        process.env.GADS_CUSTOMER_ID_NETCO!.replace(/-/g, "");
  const developerToken =    process.env.GADS_DEVELOPER_TOKEN!;
  const managerCustomerId = process.env.GADS_MANAGER_CUSTOMER_ID!.replace(/-/g, "");

  const query = `
    SELECT campaign.name, metrics.cost_micros, metrics.clicks,
           metrics.impressions, metrics.conversions, metrics.average_cpc
    FROM campaign
    WHERE segments.date = '${date}' AND campaign.status = 'ENABLED'
  `;

  const res = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
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
  return (data.results ?? []) as any[];
}

function detectBrand(campaignName: string): string | null {
  const lower = campaignName.toLowerCase();
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return brand;
  }
  return null;
}

export const syncAds = action({
  args: {},
  handler: async (ctx) => {
    if (!process.env.GADS_REFRESH_TOKEN) {
      return ["SKIP: GADS_REFRESH_TOKEN not set — run: npm run ads:auth"];
    }

    const brands = await ctx.runQuery(api.brands.list);
    const brandMap = Object.fromEntries(brands.map((b) => [b.slug, b]));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);

    const token = await getAdsToken();
    const campaigns = await fetchAdsCampaigns(token, date);

    type Agg = { adSpend: number; adClicks: number; adImpressions: number; adConversions: number; cpcSum: number; count: number };
    const aggregated: Record<string, Agg> = {};

    for (const row of campaigns) {
      const slug = detectBrand(row.campaign?.name ?? "");
      if (!slug) continue;
      if (!aggregated[slug]) aggregated[slug] = { adSpend: 0, adClicks: 0, adImpressions: 0, adConversions: 0, cpcSum: 0, count: 0 };
      const m = row.metrics;
      aggregated[slug].adSpend       += (m.cost_micros   ?? 0) / 1_000_000;
      aggregated[slug].adClicks      += m.clicks         ?? 0;
      aggregated[slug].adImpressions += m.impressions    ?? 0;
      aggregated[slug].adConversions += m.conversions    ?? 0;
      aggregated[slug].cpcSum        += (m.average_cpc   ?? 0) / 1_000_000;
      aggregated[slug].count++;
    }

    const results: string[] = [];
    for (const [slug, agg] of Object.entries(aggregated)) {
      const brand = brandMap[slug];
      if (!brand) continue;
      await ctx.runMutation(api.kpi.upsertSnapshot, {
        brandId: brand._id, date, source: "ads",
        adSpend: agg.adSpend, adClicks: agg.adClicks,
        adImpressions: agg.adImpressions, adConversions: agg.adConversions,
        adCpc: agg.count > 0 ? agg.cpcSum / agg.count : 0,
      });
      results.push(`OK ${slug}: spend=${agg.adSpend.toFixed(2)}€ conv=${agg.adConversions}`);
    }
    return results;
  },
});
