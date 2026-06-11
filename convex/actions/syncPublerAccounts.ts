"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { getBrandWorkspaceMap, publerGet } from "./publerHelpers";

// Charts available per account type
const CHARTS_BY_TYPE: Record<string, string[]> = {
  fb_page:     ["followers", "talking", "post_reach", "reach_rate", "post_engagement", "engagement_rate", "video_views", "link_clicks", "click_through_rate"],
  ig_business: ["followers", "post_reach", "reach_rate", "post_engagement", "engagement_rate", "video_views"],
  in_profile:  ["followers", "connections", "post_reach", "reach_rate", "post_engagement", "engagement_rate", "video_views"],
  in_page:     ["followers", "post_reach", "reach_rate", "post_engagement", "engagement_rate", "video_views"],
  youtube:     ["followers", "profile_views"],
};

function extractValue(rows: any[], date: string, field: "value" | "last_value"): number | undefined {
  if (!rows?.length) return undefined;
  // Find exact date match first, then closest date ≤ given date
  const exact = rows.find(r => r.date === date);
  if (exact) return exact[field] ?? undefined;
  const sorted = [...rows].filter(r => r.date <= date).sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length) return sorted[0][field] ?? undefined;
  return undefined;
}

async function syncAccountForDate(
  accountId: string,
  accountType: string,
  accountName: string,
  workspaceId: string,
  date: string,
  brandId: any,
  ctx: any,
  postsByDate: Record<string, number>,
) {
  const charts = CHARTS_BY_TYPE[accountType];
  if (!charts) return "skip_no_charts";

  const chartParam = charts.map(id => `chart_ids[]=${id}`).join("&");
  const data = await publerGet(
    `/api/v1/analytics/${accountId}/chart_data?${chartParam}&from=${date}&to=${date}`,
    workspaceId
  );
  const cur = data.current ?? {};

  const snap: any = {
    brandId, date, accountId, accountType, accountName, workspaceId,
    posts: postsByDate[date] ?? 0,
    followers:      extractValue(cur.followers    ?? [], date, "last_value"),
    connections:    extractValue(cur.connections  ?? [], date, "last_value"),
    profileViews:   extractValue(cur.profile_views ?? [], date, "value"),
    talking:        extractValue(cur.talking       ?? [], date, "value"),
    reach:          extractValue(cur.post_reach    ?? [], date, "value"),
    reachRate:      extractValue(cur.reach_rate    ?? [], date, "value"),
    engagement:     extractValue(cur.post_engagement ?? [], date, "value"),
    engagementRate: extractValue(cur.engagement_rate ?? [], date, "value"),
    videoViews:     extractValue(cur.video_views   ?? [], date, "value"),
    linkClicks:     extractValue(cur.link_clicks   ?? [], date, "value"),
    ctr:            extractValue(cur.click_through_rate ?? [], date, "value"),
  };
  // strip undefined fields
  Object.keys(snap).forEach(k => snap[k] === undefined && delete snap[k]);

  await ctx.runMutation(api.publer.upsertAccountSnapshot, snap);
  return "ok";
}

export const syncPublerAccounts = action({
  args: {},
  handler: async (ctx) => {
    const brandsRaw = await ctx.runQuery(api.brands.list);
    // Brands mit chronischem 429 (netco) ans Ende, damit andere zuerst Rate-Budget kriegen
    const brands = [...brandsRaw].sort((a: any, b: any) => {
      const ap = a.slug === "netco" ? 1 : 0;
      const bp = b.slug === "netco" ? 1 : 0;
      return ap - bp;
    });
    const brandWorkspaces = await getBrandWorkspaceMap(ctx);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);

    const results: string[] = [];
    for (const brand of brands) {
      const wsIds = brandWorkspaces[brand._id];
      if (!wsIds?.length) { results.push(`SKIP ${brand.slug}: keine Workspaces`); continue; }

      let totalOk = 0, totalSkipped = 0, totalErrors = 0, wsErrors = 0;

      for (const workspaceId of wsIds) {
        let accounts: any[] = [];
        try {
          accounts = await publerGet("/api/v1/accounts", workspaceId);
        } catch (e: any) {
          wsErrors++;
          console.warn(`[syncPublerAccounts] skip ws=${workspaceId} (${brand.slug}): ${e.message}`);
          continue;
        }

        // Get post counts for yesterday
        const postsByDate: Record<string, number> = {};
        try {
          const postData = await publerGet(
            `/api/v1/posts?state=published&from=${date}&to=${date}`,
            workspaceId
          );
          for (const post of (postData.posts ?? [])) {
            const d = (post.published_at ?? post.created_at ?? "").slice(0, 10);
            if (d) postsByDate[d] = (postsByDate[d] ?? 0) + 1;
          }
        } catch (e: any) {
          console.warn(`[syncPublerAccounts] post count failed ws=${workspaceId}: ${e.message}`);
        }

        for (const account of accounts) {
          try {
            await new Promise(r => setTimeout(r, 800));
            const res = await syncAccountForDate(
              account.id, account.type, account.name ?? account.username ?? "",
              workspaceId, date, brand._id, ctx, postsByDate
            );
            if (res === "skip_no_charts") totalSkipped++;
            else totalOk++;
          } catch (e: any) {
            if (e.message?.includes("429") || e.message?.includes("Rate limit")) {
              await new Promise(r => setTimeout(r, 5000));
            }
            totalErrors++;
          }
        }
      }
      results.push(`${brand.slug}: ${totalOk} ok, ${totalSkipped} skipped, ${totalErrors} errors, ${wsErrors} ws-skipped (${wsIds.length} Workspaces)`);
    }
    return results;
  },
});

export const syncPublerAccountsRange = action({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    const brands = await ctx.runQuery(api.brands.list);
    const brandWorkspaces = await getBrandWorkspaceMap(ctx);

    const dates: string[] = [];
    const cur = new Date(startDate);
    const end = new Date(endDate);
    while (cur <= end) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    const results: string[] = [];
    for (const brand of brands) {
      const wsIds = brandWorkspaces[brand._id];
      if (!wsIds?.length) { results.push(`SKIP ${brand.slug}`); continue; }
      const workspaceId = wsIds[0];

      const accounts: any[] = await publerGet("/api/v1/accounts", workspaceId);

      // Get post counts for full range in 7-day chunks
      const postsByDate: Record<string, number> = {};
      for (let i = 0; i < dates.length; i += 7) {
        const chunk = dates.slice(i, i + 7);
        try {
          await new Promise(r => setTimeout(r, 1000));
          const postData = await publerGet(
            `/api/v1/posts?state=published&from=${chunk[0]}&to=${chunk[chunk.length-1]}`,
            workspaceId
          );
          for (const post of (postData.posts ?? [])) {
            const d = (post.published_at ?? post.created_at ?? "").slice(0, 10);
            if (d) postsByDate[d] = (postsByDate[d] ?? 0) + 1;
          }
        } catch { /* skip */ }
      }

      // Per account: fetch full range in one API call (returns weekly if >7d, daily if ≤7d)
      // We process each date individually but fetch in 7-day windows for daily granularity
      let totalOk = 0, totalErrors = 0;

      for (const account of accounts) {
        const charts = CHARTS_BY_TYPE[account.type];
        if (!charts) continue;
        const chartParam = charts.map((id: string) => `chart_ids[]=${id}`).join("&");

        // Fetch in 7-day windows for daily granularity
        for (let i = 0; i < dates.length; i += 7) {
          const chunk = dates.slice(i, i + 7);
          const from = chunk[0], to = chunk[chunk.length - 1];
          try {
            await new Promise(r => setTimeout(r, 1200));
            const data = await publerGet(
              `/api/v1/analytics/${account.id}/chart_data?${chartParam}&from=${from}&to=${to}`,
              workspaceId
            );
            const cur2 = data.current ?? {};

            for (const date of chunk) {
              const snap: any = {
                brandId: brand._id, date,
                accountId: account.id,
                accountType: account.type,
                accountName: account.name ?? account.username ?? "",
                workspaceId,
                posts: postsByDate[date] ?? 0,
                followers:      extractValue(cur2.followers    ?? [], date, "last_value"),
                connections:    extractValue(cur2.connections  ?? [], date, "last_value"),
                profileViews:   extractValue(cur2.profile_views ?? [], date, "value"),
                talking:        extractValue(cur2.talking       ?? [], date, "value"),
                reach:          extractValue(cur2.post_reach    ?? [], date, "value"),
                reachRate:      extractValue(cur2.reach_rate    ?? [], date, "value"),
                engagement:     extractValue(cur2.post_engagement ?? [], date, "value"),
                engagementRate: extractValue(cur2.engagement_rate ?? [], date, "value"),
                videoViews:     extractValue(cur2.video_views   ?? [], date, "value"),
                linkClicks:     extractValue(cur2.link_clicks   ?? [], date, "value"),
                ctr:            extractValue(cur2.click_through_rate ?? [], date, "value"),
              };
              Object.keys(snap).forEach(k => snap[k] === undefined && delete snap[k]);
              await ctx.runMutation(api.publer.upsertAccountSnapshot, snap);
              totalOk++;
            }
          } catch (e: any) {
            if (e.message?.includes("Rate limit")) {
              await new Promise(r => setTimeout(r, 8000));
            }
            totalErrors += chunk.length;
          }
        }
      }
      results.push(`${brand.slug}: ${totalOk} rows, ${totalErrors} errors`);
    }
    return results;
  },
});
