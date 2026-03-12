"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

// Publer Workspace IDs per brand (from GET /api/v1/workspaces)
// Body-Cam: 696f3a3bb78f919a25b9305f
// BauTV+:   696f4dc48e944500a16a52ae
// Microvista: 696f505084f533b382144900
const PUBLER_WORKSPACE_IDS: Record<string, string> = {
  bodycam:    process.env.PUBLER_WORKSPACE_ID_BODYCAM    ?? "696f3a3bb78f919a25b9305f",
  microvista: process.env.PUBLER_WORKSPACE_ID_MICROVISTA ?? "696f505084f533b382144900",
  bautv:      process.env.PUBLER_WORKSPACE_ID_BAUTV      ?? "696f4dc48e944500a16a52ae",
};

// Publer API v1: only posts endpoint available (no analytics endpoint)
// Fetches published post count for a given workspace on a specific date
async function fetchPublerPosts(workspaceId: string, date: string): Promise<number> {
  const apiKey = process.env.PUBLER_API_KEY;
  if (!apiKey) throw new Error("PUBLER_API_KEY not set");

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

export const syncPubler = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);

    const results: string[] = [];
    for (const brand of brands) {
      const workspaceId = PUBLER_WORKSPACE_IDS[brand.slug];
      if (!workspaceId) {
        results.push(`SKIP ${brand.slug}: no workspace ID`);
        continue;
      }
      try {
        const socialPosts = await fetchPublerPosts(workspaceId, date);
        await ctx.runMutation(api.kpi.upsertSnapshot, {
          brandId: brand._id,
          date,
          source: "publer",
          socialPosts,
        });
        results.push(`OK ${brand.slug}: posts=${socialPosts}`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push(`ERROR ${brand.slug}: ${msg}`);
      }
    }
    return results;
  },
});
