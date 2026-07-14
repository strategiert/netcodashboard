"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { detectBrand } from "../adsMapping";
import { dateWindow, microsToEur, fetchWithRetry } from "../../src/lib/adcosts-helpers";

// Datalake Paket B Task 3: Google-Ads-Kosten auf Ad-Tiefe, 35-Tage-Restatement-Fenster.
// Bewusst googleAds:search (wie syncAds.ts) statt searchStream — andere Response-Shape.

const WINDOW_DAYS = 35;
const BATCH_SIZE = 500;

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

async function gaqlSearch(token: string, customerId: string, query: string): Promise<any[]> {
  const results: any[] = [];
  let pageToken: string | undefined;
  do {
    const res = await fetchWithRetry(
      `https://googleads.googleapis.com/v22/customers/${customerId}/googleAds:search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "developer-token": process.env.GADS_DEVELOPER_TOKEN!,
          "login-customer-id": process.env.GADS_MANAGER_CUSTOMER_ID!.replace(/-/g, ""),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pageToken ? { query, pageToken } : { query }),
      },
    );
    if (!res.ok) throw new Error(`Ads API ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    results.push(...(data.results ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return results;
}

type Row = {
  brandSlug: string; channel: string; sourceAccount: string; date: string;
  campaignId: string; campaignName?: string; adgroupId: string; adId: string;
  impressions: number; clicks: number; spend: number; currency: string;
};

type SyncResult = {
  window: string; currency: string; fetched: number; pmaxRows: number;
  inserted: number; updated: number; deleted: number;
  skippedNoBrand: number; skippedNoBrandSpend: number; skippedUnknownBrand: number;
};

export const syncGadsCosts = internalAction({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    const runStartedAt = Date.now();
    const customerId = process.env.GADS_CUSTOMER_ID_NETCO!.replace(/-/g, "");
    const win = dateWindow(WINDOW_DAYS, Date.now());
    const token = await getAdsToken();

    // Währungsinvariante einmal pro Lauf prüfen statt blind "EUR" zu etikettieren.
    const customerRows = await gaqlSearch(token, customerId,
      "SELECT customer.currency_code FROM customer");
    const currency: string = customerRows[0]?.customer?.currencyCode ?? "EUR";

    // Kein campaign.status-Filter: sonst veralten Zeilen entfernter Kampagnen im Fenster.
    const adRows = await gaqlSearch(token, customerId, `
      SELECT segments.date, campaign.id, campaign.name, ad_group.id,
             ad_group_ad.ad.id, metrics.cost_micros, metrics.clicks, metrics.impressions
      FROM ad_group_ad
      WHERE segments.date BETWEEN '${win.start}' AND '${win.end}'
    `);

    // PMax hat keine ad_group_ad-Zeilen → Kampagnen-Level-Fallback (adgroupId/adId = "").
    const pmaxRows = await gaqlSearch(token, customerId, `
      SELECT segments.date, campaign.id, campaign.name, metrics.cost_micros,
             metrics.clicks, metrics.impressions
      FROM campaign
      WHERE segments.date BETWEEN '${win.start}' AND '${win.end}'
        AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
    `);

    let skippedNoBrand = 0, skippedNoBrandSpend = 0;
    const rows: Row[] = [];
    const mapRow = (r: any, adgroupId: string, adId: string, pmax: boolean) => {
      const date = r.segments?.date ?? "";
      const campaignId = String(r.campaign?.id ?? "");
      // Identität vollständig? Leere IDs sind nur beim PMax-Fallback legitim —
      // sonst kollabieren Dedupe-Keys und Zeilen überschreiben sich gegenseitig.
      if (!date || !campaignId || (!pmax && (!adgroupId || !adId))) {
        throw new Error(`Google-Row ohne vollständige Identität: ${JSON.stringify(r).slice(0, 300)}`);
      }
      const name = r.campaign?.name ?? "";
      const spend = microsToEur(Number(r.metrics?.costMicros ?? r.metrics?.cost_micros ?? 0));
      const brandSlug = detectBrand(name);
      if (!brandSlug) { skippedNoBrand++; skippedNoBrandSpend += spend; return; }
      rows.push({
        brandSlug,
        channel: "google",
        sourceAccount: customerId,
        date,
        campaignId,
        campaignName: name,
        adgroupId,
        adId,
        impressions: Number(r.metrics?.impressions ?? 0),
        clicks: Number(r.metrics?.clicks ?? 0),
        spend,
        currency,
      });
    };
    for (const r of adRows) mapRow(r, String(r.adGroup?.id ?? ""), String(r.adGroupAd?.ad?.id ?? ""), false);
    for (const r of pmaxRows) mapRow(r, "", "", true);

    let inserted = 0, updated = 0, skippedUnknownBrand = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const res = await ctx.runMutation(internal.adCosts.upsertBatch, { rows: rows.slice(i, i + BATCH_SIZE) });
      inserted += res.inserted; updated += res.updated;
      // brandSlug ohne brands-Doc (z. B. "netco" — bewusst kein Dashboard-Brand): zählen, nicht verstecken.
      skippedUnknownBrand += res.skippedBrand;
    }

    // Fetch war vollständig (jede Seite geladen, sonst wäre oben geworfen) → Sweep erlaubt.
    const swept = await ctx.runMutation(internal.adCosts.sweepStale, {
      channel: "google", sourceAccount: customerId, dates: win.dates, runStartedAt,
    });

    return {
      window: `${win.start}..${win.end}`, currency,
      fetched: adRows.length + pmaxRows.length,
      pmaxRows: pmaxRows.length,
      inserted, updated, deleted: swept.deleted,
      skippedNoBrand, skippedNoBrandSpend, skippedUnknownBrand,
    };
  },
});
