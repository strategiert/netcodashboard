"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { GoogleAuth } from "google-auth-library";

const GSC_PROPERTIES: Record<string, string> = {
  bodycam: process.env.GSC_PROPERTY_BODYCAM ?? "",
  microvista: process.env.GSC_PROPERTY_MICROVISTA ?? "",
  bautv: process.env.GSC_PROPERTY_BAUTV ?? "",
};

async function fetchGSCData(property: string, date: string) {
  const serviceAccountJson = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("GSC_SERVICE_ACCOUNT_JSON not set");

  const auth = new GoogleAuth({
    credentials: JSON.parse(serviceAccountJson),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ startDate: date, endDate: date, dimensions: [] }),
    }
  );

  if (!res.ok) throw new Error(`GSC API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const row = data.rows?.[0];
  if (!row) return null;
  return {
    clicks: row.clicks as number,
    impressions: row.impressions as number,
    ctr: row.ctr as number,
    avgPosition: row.position as number,
  };
}

export const syncGSC = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    // GSC has ~3 day delay — fetch last 5 days to catch newly available data
    const dates: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const results: string[] = [];
    for (const brand of brands) {
      const property = GSC_PROPERTIES[brand.slug];
      if (!property) { results.push(`SKIP ${brand.slug}: no property`); continue; }
      let saved = 0;
      for (const date of dates) {
        try {
          const data = await fetchGSCData(property, date);
          if (!data) continue;
          await ctx.runMutation(api.kpi.upsertSnapshot, { brandId: brand._id, date, source: "gsc", ...data });
          saved++;
        } catch (e: any) {
          results.push(`ERROR ${brand.slug} ${date}: ${e.message}`);
        }
      }
      results.push(`OK ${brand.slug}: ${saved} days (${dates[dates.length - 1]} → ${dates[0]})`);
    }
    return results;
  },
});
