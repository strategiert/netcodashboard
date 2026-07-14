"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { unzipSync, strFromU8 } from "fflate";
import { detectBrand } from "../adsMapping";
import { dateWindow, parseMsAdsCsv, fetchWithRetry } from "../../src/lib/adcosts-helpers";

// Datalake Paket B Task 5: Microsoft-Ads-Kosten via Reporting API v13 (REST).
// Submit → Poll → ZIP-Download → CSV-Parse. Endpunkte gegen MS Learn verifiziert:
// /Reporting/v13/GenerateReport/Submit + /Reporting/v13/GenerateReport/Poll.

const WINDOW_DAYS = 35;
const BATCH_SIZE = 500;
const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 8 * 60_000; // Convex-Action-Limit 10 Min → hart bei 8 abbrechen
const REPORTING = "https://reporting.api.bingads.microsoft.com/Reporting/v13";

type SyncResult = {
  window: string; fetched: number;
  inserted: number; updated: number; deleted: number;
  skippedNoBrand: number; skippedUnknownBrand: number; refreshTokenRotated: boolean;
};

async function getMsAccessToken(ctx: any): Promise<{ accessToken: string; rotated: boolean }> {
  // Rotationsfest: neuester Refresh-Token liegt in oauthTokens, Seed in der Env.
  const stored: string | null = await ctx.runQuery(internal.adCosts.getMsRefreshToken, {});
  const refreshToken = stored ?? process.env.MS_ADS_REFRESH_TOKEN!;

  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MS_ADS_CLIENT_ID!,
      client_secret: process.env.MS_ADS_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: "https://ads.microsoft.com/msads.manage offline_access",
    }),
  });
  const data = await res.json() as any;
  if (!data.access_token) throw new Error(`MS token error: ${JSON.stringify(data).slice(0, 500)}`);

  let rotated = false;
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    await ctx.runMutation(internal.adCosts.saveMsRefreshToken, { refreshToken: data.refresh_token });
    rotated = true;
  }
  return { accessToken: data.access_token, rotated };
}

function msDate(iso: string): { Day: number; Month: number; Year: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { Day: d, Month: m, Year: y };
}

export const syncMsCosts = internalAction({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    const runStartedAt = Date.now();
    const accountId = process.env.MS_ADS_ACCOUNT_ID!;      // 141454913
    const customerId = process.env.MS_ADS_CUSTOMER_ID!;    // 251201552
    const win = dateWindow(WINDOW_DAYS, Date.now());
    const { accessToken, rotated } = await getMsAccessToken(ctx);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      DeveloperToken: process.env.MS_ADS_DEVELOPER_TOKEN!,
      CustomerId: customerId,
      CustomerAccountId: accountId,
      "Content-Type": "application/json",
    };

    // ReturnOnlyCompleteData bewusst false: das 35-Tage-Fenster refetcht täglich,
    // true würde frische Tage oft komplett verweigern.
    const submitRes = await fetchWithRetry(`${REPORTING}/GenerateReport/Submit`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ReportRequest: {
          Type: "AdPerformanceReportRequest",
          Format: "Csv",
          Aggregation: "Daily",
          ExcludeColumnHeaders: false,
          ExcludeReportFooter: true,
          ExcludeReportHeader: true,
          ReturnOnlyCompleteData: false,
          Columns: ["TimePeriod", "CampaignId", "CampaignName", "AdGroupId", "AdId",
                    "Impressions", "Clicks", "Spend", "CurrencyCode"],
          Scope: { AccountIds: [Number(accountId)] },
          Time: {
            CustomDateRangeStart: msDate(win.start),
            CustomDateRangeEnd: msDate(win.end),
            ReportTimeZone: "BrusselsCopenhagenMadridParis",
          },
        },
      }),
    });
    if (!submitRes.ok) throw new Error(`MS Submit ${submitRes.status}: ${await submitRes.text()}`);
    const { ReportRequestId } = await submitRes.json() as any;
    if (!ReportRequestId) throw new Error("MS Submit ohne ReportRequestId");

    // Poll bis Success/Error/Timeout. Response verschachtelt: ReportRequestStatus.{Status,ReportDownloadUrl}.
    let downloadUrl = "";
    const pollDeadline = Date.now() + POLL_TIMEOUT_MS;
    for (;;) {
      if (Date.now() > pollDeadline) throw new Error("MS Poll timeout (8 Min)");
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const pollRes = await fetchWithRetry(`${REPORTING}/GenerateReport/Poll`, {
        method: "POST", headers, body: JSON.stringify({ ReportRequestId }),
      });
      if (!pollRes.ok) throw new Error(`MS Poll ${pollRes.status}: ${await pollRes.text()}`);
      const poll = await pollRes.json() as any;
      const status = poll.ReportRequestStatus?.Status ?? poll.Status;
      if (status === "Success") {
        downloadUrl = poll.ReportRequestStatus?.ReportDownloadUrl ?? poll.ReportDownloadUrl ?? "";
        break;
      }
      if (status === "Error") throw new Error(`MS Report Error: ${JSON.stringify(poll).slice(0, 500)}`);
    }

    // Kein DownloadUrl bei leerem Report (keine Daten im Zeitraum) → gültig leer.
    let csv = "";
    if (downloadUrl) {
      const zipRes = await fetchWithRetry(downloadUrl, {});
      if (!zipRes.ok) throw new Error(`MS Download ${zipRes.status}`);
      const zip = unzipSync(new Uint8Array(await zipRes.arrayBuffer()));
      const csvName = Object.keys(zip).find((n) => n.toLowerCase().endsWith(".csv"));
      if (!csvName) throw new Error(`MS ZIP ohne CSV (Einträge: ${Object.keys(zip).join(", ")})`);
      csv = strFromU8(zip[csvName]);
    }

    const parsed = parseMsAdsCsv(csv);
    let skippedNoBrand = 0;
    const rows = parsed.map((r) => {
      // NL-Konto: Kampagnen ohne Keyword-Treffer gehören zur NL-Brand, nicht zur DE-"bautv".
      const brandSlug = detectBrand(r.CampaignName) ?? "bautv-nl";
      return {
        brandSlug,
        channel: "bing",
        sourceAccount: accountId,
        date: r.TimePeriod,
        campaignId: r.CampaignId,
        campaignName: r.CampaignName,
        adgroupId: r.AdGroupId,
        adId: r.AdId,
        impressions: r.Impressions,
        clicks: r.Clicks,
        spend: r.Spend,
        currency: r.CurrencyCode || "EUR",
      };
    });

    let inserted = 0, updated = 0, skippedUnknownBrand = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const res = await ctx.runMutation(internal.adCosts.upsertBatch, { rows: rows.slice(i, i + BATCH_SIZE) });
      inserted += res.inserted; updated += res.updated; skippedUnknownBrand += res.skippedBrand;
    }

    const swept = await ctx.runMutation(internal.adCosts.sweepStale, {
      channel: "bing", sourceAccount: accountId, dates: win.dates, runStartedAt,
    });

    return {
      window: `${win.start}..${win.end}`, fetched: parsed.length,
      inserted, updated, deleted: swept.deleted,
      skippedNoBrand, skippedUnknownBrand, refreshTokenRotated: rotated,
    };
  },
});
