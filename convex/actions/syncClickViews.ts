"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { detectBrand } from "../adsMapping";
import { dateWindow, fetchWithRetry } from "../../src/lib/adcosts-helpers";

// Datalake Paket B Task 6: click_view-Backstop (gclid → Kampagne/Adgroup/Ad).
// Google erlaubt nur EIN Datum pro click_view-Query und maximal 90 Tage Rückblick —
// deshalb Tages-Loop und expliziter startDate/endDate-Support für den Backfill
// (days allein hat KEINEN Offset; 3× days:30 würde dreimal dasselbe laden).

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

function isoRange(startDate: string, endDate: string): string[] {
  const out: string[] = [];
  const end = Date.parse(endDate + "T00:00:00Z");
  for (let t = Date.parse(startDate + "T00:00:00Z"); t <= end; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

type SyncResult = {
  days: number; fetched: number; skippedNoGclid: number; skippedNoBrand: number;
  skippedUnknownBrand: number; inserted: number; updated: number;
};

export const syncClickViews = internalAction({
  args: {
    days: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    const customerId = process.env.GADS_CUSTOMER_ID_NETCO!.replace(/-/g, "");
    const dates = args.startDate && args.endDate
      ? isoRange(args.startDate, args.endDate)
      : dateWindow(args.days ?? 3, Date.now()).dates;

    const token = await getAdsToken();

    // Kampagnen-Map einmalig für Brand-Zuordnung.
    const campaigns = await gaqlSearch(token, customerId,
      "SELECT campaign.id, campaign.name FROM campaign");
    const campaignBrand: Record<string, string | null> = {};
    for (const c of campaigns) {
      campaignBrand[String(c.campaign?.id ?? "")] = detectBrand(c.campaign?.name ?? "");
    }

    let fetched = 0, skippedNoGclid = 0, skippedNoBrand = 0, skippedUnknownBrand = 0,
      inserted = 0, updated = 0;

    for (const day of dates) {
      const results = await gaqlSearch(token, customerId, `
        SELECT click_view.gclid, segments.date, campaign.id, ad_group.id,
               click_view.ad_group_ad, click_view.keyword_info.text, segments.click_type
        FROM click_view WHERE segments.date = '${day}'
      `);
      fetched += results.length;

      const rows = [];
      for (const r of results) {
        const gclid = r.clickView?.gclid ?? "";
        // Klicks ohne gclid (z. B. App-Kampagnen) sind kein gültiger Backstop-Key.
        if (!gclid) { skippedNoGclid++; continue; }
        const campaignId = String(r.campaign?.id ?? "");
        const brandSlug = campaignBrand[campaignId];
        if (!brandSlug) { skippedNoBrand++; continue; }
        // "customers/…/adGroupAds/{agId}~{adId}" → adgroupId/adId
        const res = String(r.clickView?.adGroupAd ?? "");
        const tail = res.split("/").pop() ?? "";
        const [agId, adId] = tail.split("~");
        rows.push({
          brandSlug,
          sourceAccount: customerId,
          gclid,
          date: r.segments?.date ?? day,
          campaignId,
          adgroupId: agId ?? String(r.adGroup?.id ?? ""),
          adId: adId ?? "",
          clickType: r.segments?.clickType ?? undefined,
          keyword: r.clickView?.keywordInfo?.text ?? undefined,
        });
      }

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const res = await ctx.runMutation(internal.adCosts.upsertClickViews, { rows: rows.slice(i, i + BATCH_SIZE) });
        inserted += res.inserted; updated += res.updated; skippedUnknownBrand += res.skippedBrand;
      }
    }

    return { days: dates.length, fetched, skippedNoGclid, skippedNoBrand, skippedUnknownBrand, inserted, updated };
  },
});
