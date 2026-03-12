"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

// Publer Account IDs per Brand — set via Convex env vars
// To find IDs: GET https://app.publer.io/api/v1/accounts (with valid API key)
const PUBLER_ACCOUNT_IDS: Record<string, string> = {
  bodycam:    process.env.PUBLER_ACCOUNT_ID_BODYCAM    ?? "",
  microvista: process.env.PUBLER_ACCOUNT_ID_MICROVISTA ?? "",
  bautv:      process.env.PUBLER_ACCOUNT_ID_BAUTV      ?? "",
};

// Publer analytics response shape (verified against /api/v1/analytics):
// {
//   data: {
//     reach: number,          // or impressions
//     engagements: number,    // or engagement
//     followers: number,
//     posts_count: number,    // or posts
//   }
// }
// NOTE: Field names use fallbacks — update once API key is valid and response confirmed.
async function fetchPublerAnalytics(accountId: string, date: string) {
  const apiKey = process.env.PUBLER_API_KEY;
  if (!apiKey) throw new Error("PUBLER_API_KEY not set");

  const res = await fetch(
    `https://app.publer.io/api/v1/analytics?account_id=${accountId}&start=${date}&end=${date}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (!res.ok) throw new Error(`Publer ${res.status}: ${await res.text()}`);
  const data = await res.json();

  // Handle both flat response and nested { data: {...} } response shapes
  const d = data.data ?? data;

  return {
    socialReach:      (d.reach        ?? d.impressions  ?? 0) as number,
    socialEngagement: (d.engagements  ?? d.engagement   ?? 0) as number,
    socialFollowers:  (d.followers    ?? 0)                   as number,
    socialPosts:      (d.posts_count  ?? d.posts        ?? 0) as number,
  };
}

export const syncPubler = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);

    const results: string[] = [];
    for (const brand of brands) {
      const accountId = PUBLER_ACCOUNT_IDS[brand.slug];
      if (!accountId) {
        results.push(`SKIP ${brand.slug}: no account ID`);
        continue;
      }
      try {
        const data = await fetchPublerAnalytics(accountId, date);
        await ctx.runMutation(api.kpi.upsertSnapshot, {
          brandId: brand._id,
          date,
          source: "publer",
          ...data,
        });
        results.push(`OK ${brand.slug}: reach=${data.socialReach} engagement=${data.socialEngagement} followers=${data.socialFollowers} posts=${data.socialPosts}`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push(`ERROR ${brand.slug}: ${msg}`);
      }
    }
    return results;
  },
});
