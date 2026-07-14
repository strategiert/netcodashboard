"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { detectBrand } from "../adsMapping";
import { dateWindow, fetchWithRetry } from "../../src/lib/adcosts-helpers";

// Datalake Paket B Task 4: Meta-Kosten auf Ad-Ebene via Insights API,
// 35-Tage-Restatement-Fenster (deckt Metas 28-Tage-Attribution).

const WINDOW_DAYS = 35;
const BATCH_SIZE = 500;
const MAX_PAGES = 50;
const GRAPH = "https://graph.facebook.com/v21.0";

type SyncResult = {
  window: string; currency: string; pages: number; fetched: number;
  inserted: number; updated: number; deleted: number;
  skippedNoBrand: number; skippedNoBrandSpend: number; skippedUnknownBrand: number;
};

export const syncMetaCosts = internalAction({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    const runStartedAt = Date.now();
    const account = process.env.META_AD_ACCOUNT_ID!;   // "act_…"
    const token = process.env.META_ADS_READ_TOKEN_NETCO!;
    const win = dateWindow(WINDOW_DAYS, Date.now());

    // Token als Header, nie in der URL — Fehlermeldungen/Logs dürfen ihn nicht enthalten.
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Währung/Zeitzone vom Konto lesen statt hart anzunehmen. Meta liefert
    // Insights in Konto-Zeitzonen-Tagen — date bleibt der Plattform-Konto-Tag.
    const accRes = await fetchWithRetry(
      `${GRAPH}/${account}?fields=currency,timezone_name`, { headers: authHeaders },
    );
    if (!accRes.ok) throw new Error(`Meta account ${accRes.status}: ${await accRes.text()}`);
    const acc = await accRes.json() as any;
    const currency: string = acc.currency ?? "EUR";
    console.log(`Meta-Konto ${account}: currency=${currency}, tz=${acc.timezone_name}`);

    const timeRange = JSON.stringify({ since: win.start, until: win.end });
    let url =
      `${GRAPH}/${account}/insights?level=ad` +
      `&fields=campaign_id,campaign_name,adset_id,ad_id,spend,impressions,clicks,inline_link_clicks` +
      `&time_increment=1&time_range=${encodeURIComponent(timeRange)}&limit=500`;

    const raw: any[] = [];
    let pages = 0;
    let truncated = false;
    while (url) {
      if (pages >= MAX_PAGES) { truncated = true; break; }
      const res = await fetchWithRetry(url, { headers: authHeaders });
      if (!res.ok) throw new Error(`Meta insights ${res.status}: ${await res.text()}`);
      const data = await res.json() as any;
      raw.push(...(data.data ?? []));
      url = data.paging?.next ?? "";
      pages++;
    }

    let skippedNoBrand = 0, skippedNoBrandSpend = 0;
    const rows = [];
    for (const r of raw) {
      // Identität muss vollständig sein — leere IDs würden Dedupe-Keys kollabieren
      // (Response-Drift soll auffallen, nicht still "last row wins" produzieren).
      if (!r.date_start || !r.campaign_id || !r.adset_id || !r.ad_id) {
        throw new Error(`Meta-Row ohne vollständige Identität: ${JSON.stringify(r).slice(0, 300)}`);
      }
      const brandSlug = detectBrand(r.campaign_name ?? "");
      if (!brandSlug) { skippedNoBrand++; skippedNoBrandSpend += Number(r.spend ?? 0); continue; }
      rows.push({
        brandSlug,
        channel: "facebook",
        sourceAccount: account,
        date: r.date_start ?? "",
        campaignId: String(r.campaign_id ?? ""),
        campaignName: r.campaign_name ?? "",
        adgroupId: String(r.adset_id ?? ""),
        adId: String(r.ad_id ?? ""),
        impressions: Number(r.impressions ?? 0),
        // Link-Klicks statt Meta-"clicks" (alle Interaktionen) — vergleichbar mit Google-Klicks.
        clicks: Number(r.inline_link_clicks ?? 0),
        spend: Number(r.spend ?? 0),
        currency,
      });
    }

    let inserted = 0, updated = 0, skippedUnknownBrand = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const res = await ctx.runMutation(internal.adCosts.upsertBatch, { rows: rows.slice(i, i + BATCH_SIZE) });
      inserted += res.inserted; updated += res.updated; skippedUnknownBrand += res.skippedBrand;
    }

    // Truncated = unvollständig: Upserts behalten, aber KEIN Sweep und sichtbar scheitern.
    if (truncated) {
      throw new Error(
        `syncMetaCosts truncated: ${MAX_PAGES}-Seiten-Kappung erreicht (${raw.length} Zeilen geladen, ` +
        `${inserted} inserted / ${updated} updated). Fenster verkleinern oder Limit erhöhen.`,
      );
    }

    const swept = await ctx.runMutation(internal.adCosts.sweepStale, {
      channel: "facebook", sourceAccount: account, dates: win.dates, runStartedAt,
    });

    return {
      window: `${win.start}..${win.end}`, currency, pages, fetched: raw.length,
      inserted, updated, deleted: swept.deleted,
      skippedNoBrand, skippedNoBrandSpend, skippedUnknownBrand,
    };
  },
});
