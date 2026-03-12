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
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);

    const results: string[] = [];
    for (const brand of brands) {
      const property = GSC_PROPERTIES[brand.slug];
      if (!property) { results.push(`SKIP ${brand.slug}: no property`); continue; }
      try {
        const data = await fetchGSCData(property, date);
        if (!data) { results.push(`SKIP ${brand.slug}: no data for ${date}`); continue; }
        await ctx.runMutation(api.kpi.upsertSnapshot, { brandId: brand._id, date, source: "gsc", ...data });
        results.push(`OK ${brand.slug}: clicks=${data.clicks}`);
      } catch (e: any) {
        results.push(`ERROR ${brand.slug}: ${e.message}`);
      }
    }
    return results;
  },
});
