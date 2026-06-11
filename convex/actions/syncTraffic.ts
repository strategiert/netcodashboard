"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { GoogleAuth } from "google-auth-library";

// Quellen je Marke. Eine Marke kann mehrere GA4-Quellen haben (Summe).
// pathPrefix filtert auf einen Seitenbereich (z. B. Brand-Sektion auf netco.de).
// Verifiziert 2026-06-11 per Hostname-/Pfad-Probe:
//  - microvista.de (397812718) = einzige Microvista-Property mit Traffic
//  - netco.de (358231771): /baustellen-webcam/* = BauTV, /body-cam/* = Body-Cam
//  - bouwtvplus.nl (446819425) = BauTV NL-Markt
//  - netco-bodycam.com [Total traffic] (500342936) = Body-Cam Eigendomain
// Neue Properties ohne Traffic (BK Italien, Bodycam EN/DE/NL-only, YoUScan) bewusst NICHT
// angebunden — erst wenn deren Tagging live ist.
type Source = { propertyId: string; pathPrefix?: string };
const BRAND_SOURCES: Record<string, Source[]> = {
  microvista: [{ propertyId: "397812718" }],
  bautv: [
    { propertyId: "358231771", pathPrefix: "/baustellen-webcam" },
    { propertyId: "446819425" },
  ],
  bodycam: [
    { propertyId: "500342936" },
    { propertyId: "358231771", pathPrefix: "/body-cam" },
  ],
};

function channelField(group: string): "chAds" | "chSeo" | "chDirect" | "chSocial" | "chReferral" | "chOther" {
  const g = group.toLowerCase();
  if (g.includes("paid") || g === "display" || g === "cross-network" || g === "shopping") return "chAds";
  if (g === "organic search") return "chSeo";
  if (g === "direct") return "chDirect";
  if (g.includes("social")) return "chSocial";
  if (g === "referral") return "chReferral";
  return "chOther";
}

function isoWeek(d: Date): { week: number; year: number } {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const ft = (firstThursday.getUTCDay() + 6) % 7;
  const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ft) / 7);
  return { week, year: date.getUTCFullYear() };
}
function mondayOf(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return date;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);

async function getToken(): Promise<string> {
  const json = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GSC_SERVICE_ACCOUNT_JSON not set");
  const auth = new GoogleAuth({
    credentials: JSON.parse(json),
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const t = await (await auth.getClient()).getAccessToken();
  if (!t.token) throw new Error("no GA4 token");
  return t.token;
}

async function runReport(propertyId: string, token: string, body: Record<string, unknown>): Promise<any> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
    if (res.ok) return res.json();
    if (res.status >= 500 && attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    throw new Error(`GA4 ${propertyId} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

function pathFilterClause(pathPrefix?: string) {
  if (!pathPrefix) return {};
  return {
    dimensionFilter: {
      filter: {
        fieldName: "pagePathPlusQueryString",
        stringFilter: { matchType: "BEGINS_WITH", value: pathPrefix },
      },
    },
  };
}

// Summiert alle Quellen einer Marke fuer einen Zeitraum in weeklyReports-Felder.
async function collectWeek(token: string, sources: Source[], startDate: string, endDate: string) {
  const fields: Record<string, number> = {
    sessions: 0, visitors: 0, pageviews: 0,
    chAds: 0, chSeo: 0, chDirect: 0, chSocial: 0, chReferral: 0, chOther: 0,
  };
  let bounceWeighted = 0;
  for (const src of sources) {
    const filter = pathFilterClause(src.pathPrefix);
    const tot = await runReport(src.propertyId, token, {
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: "bounceRate" }],
      ...filter,
    });
    const tm = tot.rows?.[0]?.metricValues ?? [];
    const num = (i: number) => Number(tm[i]?.value ?? 0);
    const sess = num(0);
    fields.sessions += Math.round(sess);
    fields.visitors += Math.round(num(1));
    fields.pageviews += Math.round(num(2));
    bounceWeighted += num(3) * sess;

    // Kanal-Split. Bei Pfadfilter: Sitzungs-Kanal der gefilterten Seitenaufrufe.
    const ch = await runReport(src.propertyId, token, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      ...filter,
    });
    for (const r of ch.rows ?? []) {
      fields[channelField(r.dimensionValues[0].value)] += Math.round(Number(r.metricValues[0].value || 0));
    }
  }
  if (fields.sessions > 0) {
    (fields as any).bounceRate = Math.round((bounceWeighted / fields.sessions) * 1000) / 10;
  }
  return fields;
}

// Taeglich per Cron: aktuelle Woche aktualisieren.
// Backfill in Chunks: { weeksBack: 24, weeksUntil: 17 } usw. (Action-Zeitlimit).
export const syncTraffic = action({
  args: { weeksBack: v.optional(v.number()), weeksUntil: v.optional(v.number()) },
  handler: async (ctx, { weeksBack = 0, weeksUntil = 0 }) => {
    const brands = await ctx.runQuery(api.brands.list);
    const token = await getToken();
    const today = new Date();

    const results: string[] = [];
    for (const brand of brands) {
      const sources = BRAND_SOURCES[brand.slug];
      if (!sources) { results.push(`SKIP ${brand.slug}: keine GA4-Quellen`); continue; }
      for (let back = weeksBack; back >= weeksUntil; back--) {
        const ref = new Date(today);
        ref.setUTCDate(ref.getUTCDate() - back * 7);
        const monday = mondayOf(ref);
        const sunday = new Date(monday); sunday.setUTCDate(sunday.getUTCDate() + 6);
        const end = back === 0 ? today : sunday;
        const { week, year } = isoWeek(ref);
        try {
          const fields = await collectWeek(token, sources, iso(monday), iso(end));
          await ctx.runMutation(api.reports.upsertWeeklyReport, {
            brandId: brand._id, kw: `KW ${week}`, weekStart: iso(monday), year, ...fields,
          });
          results.push(`OK ${brand.slug} KW ${week}: ${fields.sessions} Sitzungen`);
        } catch (e: any) {
          results.push(`ERROR ${brand.slug} KW ${week}: ${e.message}`);
        }
      }
    }
    return results;
  },
});
