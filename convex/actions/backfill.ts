"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { GoogleAuth } from "google-auth-library";
import { v } from "convex/values";

const GSC_PROPERTIES: Record<string, string> = {
  bodycam:   process.env.GSC_PROPERTY_BODYCAM   ?? "",
  microvista: process.env.GSC_PROPERTY_MICROVISTA ?? "",
  bautv:     process.env.GSC_PROPERTY_BAUTV      ?? "",
};

const PUBLER_WORKSPACE_IDS: Record<string, string> = {
  bodycam:    process.env.PUBLER_WORKSPACE_ID_BODYCAM    ?? "696f3a3bb78f919a25b9305f",
  microvista: process.env.PUBLER_WORKSPACE_ID_MICROVISTA ?? "696f505084f533b382144900",
  bautv:      process.env.PUBLER_WORKSPACE_ID_BAUTV      ?? "696f4dc48e944500a16a52ae",
};

function dateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = days; i >= 3; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

async function getGSCToken() {
  const json = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GSC_SERVICE_ACCOUNT_JSON not set");
  const auth = new GoogleAuth({
    credentials: JSON.parse(json),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token!;
}

async function fetchGSCRange(property: string, startDate: string, endDate: string, token: string) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["date"] }),
    }
  );
  if (!res.ok) throw new Error(`GSC ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // rows: [{ keys: ["2026-01-01"], clicks, impressions, ctr, position }]
  return (data.rows ?? []) as Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

async function fetchPublerPostsForDate(workspaceId: string, date: string, apiKey: string): Promise<number> {
  const res = await fetch(
    `https://app.publer.com/api/v1/posts?state=published&from=${date}&to=${date}`,
    {
      headers: {
        Authorization: `Bearer-API ${apiKey}`,
        "Publer-Workspace-Id": workspaceId,
      },
    }
  );
  if (!res.ok) throw new Error(`Publer ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.total ?? data.posts?.length ?? 0) as number;
}

export const backfillGSC = action({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 90 }) => {
    const brands = await ctx.runQuery(api.brands.list);
    const token = await getGSCToken();
    const end = new Date();
    end.setDate(end.getDate() - 3); // GSC has ~3 day delay
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    const results: string[] = [];
    for (const brand of brands) {
      const property = GSC_PROPERTIES[brand.slug];
      if (!property) { results.push(`SKIP ${brand.slug}: no property`); continue; }
      try {
        const rows = await fetchGSCRange(property, startDate, endDate, token);
        let saved = 0;
        for (const row of rows) {
          const date = row.keys[0];
          await ctx.runMutation(api.kpi.upsertSnapshot, {
            brandId: brand._id,
            date,
            source: "gsc",
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            avgPosition: row.position,
          });
          saved++;
        }
        results.push(`OK ${brand.slug}: ${saved} days (${startDate} → ${endDate})`);
      } catch (e: any) {
        results.push(`ERROR ${brand.slug}: ${e.message}`);
      }
    }
    return results;
  },
});

export const backfillPubler = action({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 90 }) => {
    const brands = await ctx.runQuery(api.brands.list);
    const apiKey = process.env.PUBLER_API_KEY;
    if (!apiKey) throw new Error("PUBLER_API_KEY not set");
    const dates = dateRange(days);

    const results: string[] = [];
    for (const brand of brands) {
      const workspaceId = PUBLER_WORKSPACE_IDS[brand.slug];
      if (!workspaceId) { results.push(`SKIP ${brand.slug}: no workspace ID`); continue; }
      let saved = 0;
      let errors = 0;
      for (const date of dates) {
        try {
          const socialPosts = await fetchPublerPostsForDate(workspaceId, date, apiKey);
          await ctx.runMutation(api.kpi.upsertSnapshot, {
            brandId: brand._id, date, source: "publer", socialPosts,
          });
          saved++;
        } catch {
          errors++;
        }
        // small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 200));
      }
      results.push(`OK ${brand.slug}: ${saved} days saved, ${errors} errors`);
    }
    return results;
  },
});
