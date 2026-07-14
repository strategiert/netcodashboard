"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { GoogleAuth } from "google-auth-library";

// GSC Brand/Non-Brand-Split: zwei Search-Analytics-Abfragen je Brand/Tag mit
// Regex-Filter (INCLUDING_/EXCLUDING_REGEX, RE2-Syntax). Brand-Traffic kommt
// ohnehin — die steuerbare SEO-Kennzahl ist Non-Brand. syncGSC (Totale in
// kpiSnapshots) bleibt unangetastet.

const GSC_PROPERTIES: Record<string, string> = {
  bodycam:      process.env.GSC_PROPERTY_BODYCAM      ?? "",
  "bodycam-nl": process.env.GSC_PROPERTY_BODYCAM_NL   ?? "",
  microvista:   process.env.GSC_PROPERTY_MICROVISTA   ?? "",
  bautv:        process.env.GSC_PROPERTY_BAUTV        ?? "",
  "bautv-nl":   process.env.GSC_PROPERTY_BAUTV_NL     ?? "",
};

// Heuristische Brand-Begriffe je Marke. Bewusst konservativ: Gattungsbegriffe
// (bodycam, baustellenkamera) sind NON-Brand — nur echte Namens-/Domain-Treffer.
const BRAND_REGEX: Record<string, string> = {
  bodycam:      "netco",
  "bodycam-nl": "netco",
  microvista:   "microvista|micro vista",
  bautv:        "bautv|bau tv|bouwtv|bouw tv",
  "bautv-nl":   "bautv|bau tv|bouwtv|bouw tv",
};

async function gscToken(): Promise<string> {
  const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON!),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const token = await (await auth.getClient()).getAccessToken();
  return token.token!;
}

async function queryGsc(token: string, property: string, body: unknown): Promise<any> {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`GSC API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return await res.json();
}

export const syncGSCBrandSplit = internalAction({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const token = await gscToken();
    const results: string[] = [];
    // GSC-Datenverzug ~3 Tage → die letzten 5 Tage nachziehen (idempotenter Upsert).
    const dates: string[] = [];
    for (let i = 1; i <= 5; i++) {
      dates.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
    }

    for (const [slug, property] of Object.entries(GSC_PROPERTIES)) {
      if (!property) continue;
      const regex = BRAND_REGEX[slug];
      let saved = 0;
      for (const date of dates) {
        try {
          const filter = (operator: string) => ({
            startDate: date, endDate: date, dimensions: [],
            dimensionFilterGroups: [{ filters: [{ dimension: "query", operator, expression: regex }] }],
          });
          const [brandRes, nonBrandRes, topRes] = [
            await queryGsc(token, property, filter("INCLUDING_REGEX")),
            await queryGsc(token, property, filter("EXCLUDING_REGEX")),
            await queryGsc(token, property, {
              startDate: date, endDate: date, dimensions: ["query"], rowLimit: 5,
              dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "EXCLUDING_REGEX", expression: regex }] }],
            }),
          ];
          const b = brandRes.rows?.[0] ?? { clicks: 0, impressions: 0 };
          const n = nonBrandRes.rows?.[0] ?? { clicks: 0, impressions: 0 };
          if (!brandRes.rows && !nonBrandRes.rows) continue; // Tag noch ohne Daten
          await ctx.runMutation(internal.gscExtras.upsertQuerySplit, {
            brandSlug: slug, date,
            brandClicks: b.clicks ?? 0, brandImpressions: b.impressions ?? 0,
            nonBrandClicks: n.clicks ?? 0, nonBrandImpressions: n.impressions ?? 0,
            topNonBrandQueries: JSON.stringify(
              (topRes.rows ?? []).map((r: any) => ({
                query: r.keys?.[0] ?? "", clicks: r.clicks, impressions: r.impressions,
                position: Math.round((r.position ?? 0) * 10) / 10,
              })),
            ),
          });
          saved++;
        } catch (e: any) {
          results.push(`ERROR ${slug} ${date}: ${e.message}`);
        }
      }
      results.push(`OK ${slug}: ${saved} Tage`);
    }
    return results;
  },
});
