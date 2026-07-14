"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// Anonyme Sessionisierung (Datalake-Punkt 7): liest die First-Party-Beacon-Rohdaten
// aus Cloudflare Analytics Engine (SQL API) und aggregiert Sessions nach der
// dokumentierten Definition: gleiche Tages-Hash-Kennung, Inaktivitätslücke < 30 Min,
// harte Tagesgrenze (der Hash rotiert täglich — bewusst KEINE tagesübergreifende
// Wiedererkennung; DSB-Prüfpunkt IP+UA-Tageshash siehe Governance-Paket).
// Envs: CF_AE_ACCOUNT_ID, CF_AE_TOKEN (Analytics Read), Dataset fest bautv_analytics.

const SESSION_GAP_MS = 30 * 60 * 1000;
const DATASET = "bautv_analytics";
const BRAND_SLUG = "bautv";

type DayAgg = {
  date: string; sessions: number; visitors: number; pageviews: number;
  pagesPerSession: number; campaignSessions: number;
};

export const syncWebSessions = internalAction({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args): Promise<DayAgg[]> => {
    const accountId = process.env.CF_AE_ACCOUNT_ID;
    const token = process.env.CF_AE_TOKEN;
    if (!accountId || !token) throw new Error("CF_AE_ACCOUNT_ID / CF_AE_TOKEN fehlen");

    const days = Math.min(args.days ?? 3, 30);
    const out: DayAgg[] = [];

    for (let i = days; i >= 1; i--) {
      const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      // AE-SQL: nur Pageviews des Tages; Spalten: timestamp, index1 (Tages-Hash),
      // blob5 (utm_source). Volumen aktuell ~1.500/Tag — unkritisch.
      const sql =
        `SELECT timestamp, index1, blob5 FROM ${DATASET} ` +
        `WHERE blob1 = 'pageview' AND timestamp >= toDateTime('${date} 00:00:00') ` +
        `AND timestamp < toDateTime('${date} 23:59:59') + INTERVAL '1' SECOND ` +
        `ORDER BY index1, timestamp LIMIT 100000 FORMAT JSON`;
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: sql },
      );
      if (!res.ok) throw new Error(`AE SQL ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json() as { data: { timestamp: string; index1: string; blob5: string }[] };

      // Sessionisierung in JS (AE-SQL kann keine Fensterlogik).
      let sessions = 0, campaignSessions = 0;
      const visitors = new Set<string>();
      let lastHash = "", lastTs = 0;
      for (const row of data.data) {
        const ts = Date.parse(row.timestamp.replace(" ", "T") + "Z");
        visitors.add(row.index1);
        const newSession = row.index1 !== lastHash || ts - lastTs > SESSION_GAP_MS;
        if (newSession) {
          sessions++;
          if (row.blob5) campaignSessions++; // Einstieg trug utm_source
        }
        lastHash = row.index1; lastTs = ts;
      }
      const pageviews = data.data.length;
      const agg: DayAgg = {
        date, sessions, visitors: visitors.size, pageviews,
        pagesPerSession: sessions > 0 ? Math.round((pageviews / sessions) * 100) / 100 : 0,
        campaignSessions,
      };
      await ctx.runMutation(internal.webSessions.upsertDay, { brandSlug: BRAND_SLUG, ...agg });
      out.push(agg);
    }
    return out;
  },
});
