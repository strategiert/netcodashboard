"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";

const PUBLER_WORKSPACE_IDS: Record<string, string> = {
  bodycam:    process.env.PUBLER_WORKSPACE_ID_BODYCAM    ?? "696f3a3bb78f919a25b9305f",
  microvista: process.env.PUBLER_WORKSPACE_ID_MICROVISTA ?? "696f505084f533b382144900",
  bautv:      process.env.PUBLER_WORKSPACE_ID_BAUTV      ?? "696f4dc48e944500a16a52ae",
};

// Account types that support analytics (skip personal LinkedIn profiles)
const ANALYTICS_ACCOUNT_TYPES = new Set([
  "fb_page", "ig_business", "in_page", "youtube", "twitter",
  "tiktok", "pinterest", "threads", "mastodon", "bluesky",
]);

const CHART_IDS = ["post_reach", "post_engagement", "followers", "video_views", "link_clicks"];

async function publerGet(path: string, workspaceId: string): Promise<any> {
  const apiKey = process.env.PUBLER_API_KEY;
  if (!apiKey) throw new Error("PUBLER_API_KEY not set");
  const res = await fetch(`https://app.publer.com${path}`, {
    headers: {
      Authorization: `Bearer-API ${apiKey}`,
      "Publer-Workspace-Id": workspaceId,
    },
  });
  if (!res.ok) throw new Error(`Publer ${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchPublerPostCount(workspaceId: string, date: string): Promise<number> {
  const data = await publerGet(
    `/api/v1/posts?state=published&from=${date}&to=${date}`,
    workspaceId
  );
  return (data.total ?? data.posts?.length ?? 0) as number;
}

async function fetchAnalyticsForDate(workspaceId: string, date: string) {
  // Get all accounts in workspace
  const accounts: any[] = await publerGet("/api/v1/accounts", workspaceId);

  const totals = {
    socialReach: 0,
    socialEngagement: 0,
    socialFollowers: 0,
    socialVideoViews: 0,
    socialLinkClicks: 0,
  };

  for (const account of accounts) {
    if (!ANALYTICS_ACCOUNT_TYPES.has(account.type)) continue;
    try {
      const chartParam = CHART_IDS.map(id => `chart_ids[]=${id}`).join("&");
      const data = await publerGet(
        `/api/v1/analytics/${account.id}/chart_data?${chartParam}&from=${date}&to=${date}`,
        workspaceId
      );
      const cur = data.current ?? {};

      const reach = (cur.post_reach?.[0]?.value ?? 0) as number;
      const engagement = (cur.post_engagement?.[0]?.value ?? 0) as number;
      const followers = (cur.followers?.[0]?.last_value ?? 0) as number;
      const videoViews = (cur.video_views?.[0]?.value ?? 0) as number;
      const linkClicks = (cur.link_clicks?.[0]?.value ?? 0) as number;

      totals.socialReach += reach;
      totals.socialEngagement += engagement;
      totals.socialFollowers += followers; // sum across channels
      totals.socialVideoViews += videoViews;
      totals.socialLinkClicks += linkClicks;
    } catch {
      // skip accounts that don't support analytics
    }
  }
  return totals;
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
      if (!workspaceId) { results.push(`SKIP ${brand.slug}: no workspace ID`); continue; }
      try {
        const [socialPosts, analytics] = await Promise.all([
          fetchPublerPostCount(workspaceId, date),
          fetchAnalyticsForDate(workspaceId, date),
        ]);
        await ctx.runMutation(api.kpi.upsertSnapshot, {
          brandId: brand._id, date, source: "publer",
          socialPosts, ...analytics,
        });
        results.push(`OK ${brand.slug}: reach=${analytics.socialReach} eng=${analytics.socialEngagement} posts=${socialPosts}`);
      } catch (e: any) {
        results.push(`ERROR ${brand.slug}: ${e.message}`);
      }
    }
    return results;
  },
});

export const syncPublerRange = action({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    const brands = await ctx.runQuery(api.brands.list);

    // Build date list
    const dates: string[] = [];
    const cur = new Date(startDate);
    const end = new Date(endDate);
    while (cur <= end) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    const results: string[] = [];
    for (const brand of brands) {
      const workspaceId = PUBLER_WORKSPACE_IDS[brand.slug];
      if (!workspaceId) { results.push(`SKIP ${brand.slug}`); continue; }

      // Step 1: get accounts once
      let accounts: any[] = [];
      try {
        accounts = await publerGet("/api/v1/accounts", workspaceId);
      } catch (e: any) {
        results.push(`ERROR ${brand.slug} accounts: ${e.message}`); continue;
      }
      const analyticsAccounts = accounts.filter(a => ANALYTICS_ACCOUNT_TYPES.has(a.type));

      // Step 2: per account, fetch entire range in one call → we get daily data for ≤7 days,
      // weekly for larger ranges. For backfill we accept weekly granularity per week-start date.
      // Map: date → aggregated totals
      const byDate: Record<string, {
        socialReach: number; socialEngagement: number; socialFollowers: number;
        socialVideoViews: number; socialLinkClicks: number;
      }> = {};
      for (const d of dates) byDate[d] = { socialReach:0, socialEngagement:0, socialFollowers:0, socialVideoViews:0, socialLinkClicks:0 };

      for (const account of analyticsAccounts) {
        try {
          await new Promise(r => setTimeout(r, 1500));
          const chartParam = CHART_IDS.map(id => `chart_ids[]=${id}`).join("&");
          const data = await publerGet(
            `/api/v1/analytics/${account.id}/chart_data?${chartParam}&from=${startDate}&to=${endDate}`,
            workspaceId
          );
          const cur2 = data.current ?? {};

          // For each chart, map returned rows to dates
          const mapRows = (rows: any[], field: "value" | "last_value") => {
            const m: Record<string, number> = {};
            for (const r of (rows ?? [])) m[r.date] = (r[field] ?? 0) as number;
            return m;
          };
          const reach = mapRows(cur2.post_reach ?? [], "value");
          const eng = mapRows(cur2.post_engagement ?? [], "value");
          const fol = mapRows(cur2.followers ?? [], "last_value");
          const vid = mapRows(cur2.video_views ?? [], "value");
          const lnk = mapRows(cur2.link_clicks ?? [], "value");

          // Apply to matching dates (weekly data → applies to week-start date)
          for (const [d, totals] of Object.entries(byDate)) {
            // Find the closest row date ≤ d
            const rowDates = Object.keys(reach).sort();
            const matchDate = rowDates.filter(rd => rd <= d).at(-1);
            if (!matchDate) continue;
            // Only apply to dates within 7 days of matchDate (avoid double-counting)
            const diffDays = (new Date(d).getTime() - new Date(matchDate).getTime()) / 86400000;
            if (diffDays > 6) continue;
            totals.socialReach += reach[matchDate] ?? 0;
            totals.socialEngagement += eng[matchDate] ?? 0;
            totals.socialFollowers += fol[matchDate] ?? 0;
            totals.socialVideoViews += vid[matchDate] ?? 0;
            totals.socialLinkClicks += lnk[matchDate] ?? 0;
          }
        } catch {
          // skip accounts with no analytics
        }
      }

      // Step 3: post counts — batch in 7-day windows to avoid rate limits
      const postByDate: Record<string, number> = {};
      for (let i = 0; i < dates.length; i += 7) {
        const chunk = dates.slice(i, i + 7);
        const from = chunk[0], to = chunk[chunk.length - 1];
        try {
          await new Promise(r => setTimeout(r, 1500));
          const data = await publerGet(
            `/api/v1/posts?state=published&from=${from}&to=${to}`,
            workspaceId
          );
          const posts: any[] = data.posts ?? [];
          for (const post of posts) {
            const d = (post.published_at ?? post.created_at ?? "").slice(0, 10);
            if (d) postByDate[d] = (postByDate[d] ?? 0) + 1;
          }
        } catch { /* skip */ }
      }

      // Step 4: upsert all dates
      let saved = 0;
      for (const date of dates) {
        const analytics = byDate[date];
        const socialPosts = postByDate[date] ?? 0;
        try {
          await ctx.runMutation(api.kpi.upsertSnapshot, {
            brandId: brand._id, date, source: "publer",
            socialPosts, ...analytics,
          });
          saved++;
        } catch { /* skip */ }
      }
      results.push(`${brand.slug}: ${saved}/${dates.length} dates`);
    }
    return results;
  },
});
