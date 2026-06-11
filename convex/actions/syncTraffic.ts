"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { GoogleAuth } from "google-auth-library";

// GA4-Property je Marke. Microvista bekannt; weitere bei Bedarf ergaenzen.
const GA4_PROPERTIES: Record<string, string> = {
  microvista: "397812718",
};

// GA4-Kanalgruppe -> weeklyReports-Kanalfeld
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
function mondayOf(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

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

async function runReport(propertyId: string, token: string, body: unknown): Promise<any> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`GA4 ${res.status}: ${await res.text()}`);
  return res.json();
}

// Holt die laufende Woche (Mo bis heute) je Marke aus GA4 und schreibt sie in weeklyReports.
// Taeglich per Cron -> die Report-Seite /[brand]/report ist immer aktuell, ohne manuellen Export.
export const syncTraffic = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    const token = await getToken();
    const now = new Date();
    const weekStart = mondayOf(now);
    const { week, year } = isoWeek(now);
    const kw = `KW ${week}`;
    const today = now.toISOString().slice(0, 10);

    const results: string[] = [];
    for (const brand of brands) {
      const prop = GA4_PROPERTIES[brand.slug];
      if (!prop) { results.push(`SKIP ${brand.slug}: keine GA4-Property`); continue; }
      try {
        // 1) Totals
        const tot = await runReport(prop, token, {
          dateRanges: [{ startDate: weekStart, endDate: today }],
          metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: "bounceRate" }],
        });
        const tm = tot.rows?.[0]?.metricValues ?? [];
        const num = (i: number) => Number(tm[i]?.value ?? 0);
        const fields: Record<string, number> = {
          sessions: Math.round(num(0)), visitors: Math.round(num(1)),
          pageviews: Math.round(num(2)), bounceRate: Math.round(num(3) * 1000) / 10,
          chAds: 0, chSeo: 0, chDirect: 0, chSocial: 0, chReferral: 0, chOther: 0,
        };
        // 2) Kanal-Split
        const ch = await runReport(prop, token, {
          dateRanges: [{ startDate: weekStart, endDate: today }],
          dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }],
        });
        for (const r of ch.rows ?? []) {
          fields[channelField(r.dimensionValues[0].value)] += Number(r.metricValues[0].value || 0);
        }
        // 3) Sprache (optional)
        try {
          const lang = await runReport(prop, token, {
            dateRanges: [{ startDate: weekStart, endDate: today }],
            dimensions: [{ name: "language" }], metrics: [{ name: "totalUsers" }],
          });
          const map: Record<string, string> = { german: "visitorsDE", english: "visitorsEN", french: "visitorsFR", italian: "visitorsIT" };
          for (const r of lang.rows ?? []) {
            const key = map[(r.dimensionValues[0].value || "").toLowerCase()];
            if (key) (fields as any)[key] = ((fields as any)[key] || 0) + Math.round(Number(r.metricValues[0].value || 0));
          }
        } catch { /* Sprache optional */ }

        await ctx.runMutation(api.reports.upsertWeeklyReport, {
          brandId: brand._id, kw, weekStart, year, ...fields,
        });
        results.push(`OK ${brand.slug}: ${kw} ${fields.sessions} Sitzungen`);
      } catch (e: any) {
        results.push(`ERROR ${brand.slug}: ${e.message}`);
      }
    }
    return results;
  },
});
