"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { GoogleAuth } from "google-auth-library";

// Gleiche Quellen wie syncTraffic (dort dokumentiert/verifiziert).
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

const FB_FIELDS: Record<string, "fbStart" | "fbSchritt" | "fbErgebnis" | "fbLead" | "fbAbbruch"> = {
  fragebogen_start: "fbStart",
  fragebogen_schritt: "fbSchritt",
  fragebogen_ergebnis: "fbErgebnis",
  fragebogen_lead: "fbLead",
  fragebogen_abbruch: "fbAbbruch",
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
// GA4 liefert "20260702" → "2026-07-02"
const gaDate = (s: string) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

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

type DayFields = {
  sessions: number; visitors: number; pageviews: number;
  chAds: number; chSeo: number; chDirect: number; chSocial: number; chReferral: number; chOther: number;
  fbStart: number; fbSchritt: number; fbErgebnis: number; fbLead: number; fbAbbruch: number;
};
const emptyDay = (): DayFields => ({
  sessions: 0, visitors: 0, pageviews: 0,
  chAds: 0, chSeo: 0, chDirect: 0, chSocial: 0, chReferral: 0, chOther: 0,
  fbStart: 0, fbSchritt: 0, fbErgebnis: 0, fbLead: 0, fbAbbruch: 0,
});

// Sammelt Tageswerte aller Quellen einer Marke für [startDate, endDate].
async function collectDays(token: string, sources: Source[], startDate: string, endDate: string): Promise<Map<string, DayFields>> {
  const days = new Map<string, DayFields>();
  const day = (d: string) => {
    if (!days.has(d)) days.set(d, emptyDay());
    return days.get(d)!;
  };

  for (const src of sources) {
    const filter = pathFilterClause(src.pathPrefix);

    // Totals pro Tag — dimensionslos bis auf date, autoritativ für sessions/visitors.
    const tot = await runReport(src.propertyId, token, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }],
      ...filter,
    });
    for (const r of tot.rows ?? []) {
      const f = day(gaDate(r.dimensionValues[0].value));
      f.sessions += Math.round(Number(r.metricValues[0]?.value ?? 0));
      f.visitors += Math.round(Number(r.metricValues[1]?.value ?? 0));
      f.pageviews += Math.round(Number(r.metricValues[2]?.value ?? 0));
    }

    // Kanal-Split pro Tag.
    const ch = await runReport(src.propertyId, token, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }, { name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      ...filter,
    });
    for (const r of ch.rows ?? []) {
      const f = day(gaDate(r.dimensionValues[0].value));
      f[channelField(r.dimensionValues[1].value)] += Math.round(Number(r.metricValues[0].value || 0));
    }

    // Fragebogen-Funnel-Events (nur ganze Properties; bei Pfad-Sektionen gibt es keinen Fragebogen).
    if (!src.pathPrefix) {
      const fb = await runReport(src.propertyId, token, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }, { name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            stringFilter: { matchType: "BEGINS_WITH", value: "fragebogen_" },
          },
        },
      });
      for (const r of fb.rows ?? []) {
        const field = FB_FIELDS[r.dimensionValues[1].value];
        if (!field) continue;
        day(gaDate(r.dimensionValues[0].value))[field] += Math.round(Number(r.metricValues[0].value || 0));
      }
    }
  }
  return days;
}

// Täglich per Cron (daysBack=3 aktualisiert nachlaufende GA4-Daten mit).
// Backfill: { daysBack: 42 } — bei Timeout in Chunks via daysUntil.
export const syncDailyTraffic = action({
  args: { daysBack: v.optional(v.number()), daysUntil: v.optional(v.number()) },
  handler: async (ctx, { daysBack = 3, daysUntil = 0 }) => {
    const brands = await ctx.runQuery(api.brands.list);
    const token = await getToken();
    const today = new Date();
    const start = new Date(today); start.setUTCDate(start.getUTCDate() - daysBack);
    const end = new Date(today); end.setUTCDate(end.getUTCDate() - daysUntil);

    const results: string[] = [];
    for (const brand of brands) {
      const sources = BRAND_SOURCES[brand.slug];
      if (!sources) { results.push(`SKIP ${brand.slug}: keine GA4-Quellen`); continue; }
      try {
        const days = await collectDays(token, sources, iso(start), iso(end));
        let n = 0;
        for (const [date, fields] of days) {
          await ctx.runMutation(api.dailyTraffic.upsertDay, { brandId: brand._id, date, ...fields });
          n++;
        }
        results.push(`OK ${brand.slug}: ${n} Tage (${iso(start)}–${iso(end)})`);
      } catch (e: any) {
        results.push(`ERROR ${brand.slug}: ${e.message}`);
      }
    }
    return results;
  },
});
