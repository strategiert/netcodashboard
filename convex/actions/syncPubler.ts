"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { publerGet, resolveAccountBrand } from "./publerHelpers";

// Account types that support analytics (skip personal LinkedIn profiles)
const ANALYTICS_ACCOUNT_TYPES = new Set([
  "fb_page", "ig_business", "in_profile", "in_page", "youtube", "twitter",
  "tiktok", "pinterest", "threads", "mastodon", "bluesky",
]);

const CHART_IDS = ["post_reach", "post_engagement", "followers", "video_views", "link_clicks"];

type Totals = {
  socialReach: number; socialEngagement: number; socialFollowers: number;
  socialVideoViews: number; socialLinkClicks: number; socialPosts: number;
};
const emptyTotals = (): Totals => ({
  socialReach: 0, socialEngagement: 0, socialFollowers: 0,
  socialVideoViews: 0, socialLinkClicks: 0, socialPosts: 0,
});

function lastValue(rows: any[] | undefined, field: "value" | "last_value"): number {
  if (!rows?.length) return 0;
  // Take the most recent data point (last in array)
  return (rows[rows.length - 1]?.[field] ?? 0) as number;
}

// Workspaces mit Brand-Zuordnung, chronisch rate-limitete (NetCo) ans Ende.
async function getAssignedWorkspaces(ctx: any) {
  const workspaces = (await ctx.runQuery(api.publer.listWorkspaces)).filter((ws: any) => ws.brandId);
  return workspaces.sort((a: any, b: any) => {
    const ap = a.name === "NetCo" ? 1 : 0;
    const bp = b.name === "NetCo" ? 1 : 0;
    return ap - bp;
  });
}

export const syncPubler = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    const brandBySlug = Object.fromEntries(brands.map((b) => [b.slug, b]));
    const slugById = Object.fromEntries(brands.map((b) => [b._id, b.slug]));
    const workspaces = await getAssignedWorkspaces(ctx);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);

    // Fetch a 14-day window so we catch weekly data points from LinkedIn etc.
    const from = new Date(date + "T12:00:00Z");
    from.setDate(from.getDate() - 13);
    const fromStr = from.toISOString().slice(0, 10);

    // Totals je ZIEL-Brand (Account-Overrides können vom Workspace abweichen).
    const perBrand: Record<string, Totals> = {};
    const totalsFor = (brandId: string) => (perBrand[brandId] ??= emptyTotals());

    const results: string[] = [];
    for (const ws of workspaces) {
      try {
        const accounts: any[] = await publerGet("/api/v1/accounts", ws.workspaceId);

        for (const account of accounts) {
          if (!ANALYTICS_ACCOUNT_TYPES.has(account.type)) continue;
          const target = totalsFor(resolveAccountBrand(account.id, ws.brandId!, brandBySlug));
          try {
            const chartParam = CHART_IDS.map((id) => `chart_ids[]=${id}`).join("&");
            const data = await publerGet(
              `/api/v1/analytics/${account.id}/chart_data?${chartParam}&from=${fromStr}&to=${date}`,
              ws.workspaceId
            );
            const cur = data.current ?? {};
            // Use the most recent data point in the range
            target.socialReach += lastValue(cur.post_reach, "value");
            target.socialEngagement += lastValue(cur.post_engagement, "value");
            target.socialFollowers += lastValue(cur.followers, "last_value");
            target.socialVideoViews += lastValue(cur.video_views, "value");
            target.socialLinkClicks += lastValue(cur.link_clicks, "value");
          } catch {
            // skip accounts that don't support analytics
          }
        }

        // Posts je Account attribuieren (account_id steht am Post).
        const postData = await publerGet(
          `/api/v1/posts?state=published&from=${date}&to=${date}`,
          ws.workspaceId
        );
        for (const post of postData.posts ?? []) {
          totalsFor(resolveAccountBrand(post.account_id, ws.brandId!, brandBySlug)).socialPosts++;
        }
      } catch (e: any) {
        results.push(`ERROR ws=${ws.name}: ${e.message}`);
      }
    }

    for (const [brandId, totals] of Object.entries(perBrand)) {
      const { socialPosts, ...analytics } = totals;
      await ctx.runMutation(api.kpi.upsertSnapshot, {
        brandId: brandId as any, date, source: "publer",
        socialPosts, ...analytics,
      });
      results.push(
        `OK ${slugById[brandId] ?? brandId}: reach=${totals.socialReach} eng=${totals.socialEngagement} posts=${socialPosts}`
      );
    }
    return results;
  },
});

export const syncPublerRange = action({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    const brands = await ctx.runQuery(api.brands.list);
    const brandBySlug = Object.fromEntries(brands.map((b) => [b.slug, b]));
    const slugById = Object.fromEntries(brands.map((b) => [b._id, b.slug]));
    const workspaces = await getAssignedWorkspaces(ctx);

    // Build date list
    const dates: string[] = [];
    const cur = new Date(startDate);
    const end = new Date(endDate);
    while (cur <= end) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    // brandId → date → Totals
    const perBrand: Record<string, Record<string, Totals>> = {};
    const totalsFor = (brandId: string, date: string) => {
      perBrand[brandId] ??= {};
      return (perBrand[brandId][date] ??= emptyTotals());
    };

    const results: string[] = [];
    for (const ws of workspaces) {
      let accounts: any[] = [];
      try {
        accounts = await publerGet("/api/v1/accounts", ws.workspaceId);
      } catch (e: any) {
        results.push(`ERROR ws=${ws.name} accounts: ${e.message}`);
        continue;
      }

      // Analytics je Account: ganzer Range in einem Call → tägliche Werte für ≤7 Tage,
      // wöchentliche Buckets für größere Ranges (Wert gilt ab Wochenstart-Datum).
      for (const account of accounts.filter((a) => ANALYTICS_ACCOUNT_TYPES.has(a.type))) {
        const targetBrandId = resolveAccountBrand(account.id, ws.brandId!, brandBySlug);
        try {
          await new Promise((r) => setTimeout(r, 1500));
          const chartParam = CHART_IDS.map((id) => `chart_ids[]=${id}`).join("&");
          const data = await publerGet(
            `/api/v1/analytics/${account.id}/chart_data?${chartParam}&from=${startDate}&to=${endDate}`,
            ws.workspaceId
          );
          const cur2 = data.current ?? {};

          const mapRows = (rows: any[], field: "value" | "last_value") => {
            const m: Record<string, number> = {};
            for (const r of rows ?? []) m[r.date] = (r[field] ?? 0) as number;
            return m;
          };
          const reach = mapRows(cur2.post_reach ?? [], "value");
          const eng = mapRows(cur2.post_engagement ?? [], "value");
          const fol = mapRows(cur2.followers ?? [], "last_value");
          const vid = mapRows(cur2.video_views ?? [], "value");
          const lnk = mapRows(cur2.link_clicks ?? [], "value");

          for (const d of dates) {
            // Find the closest row date ≤ d (weekly bucket), max 7 Tage alt
            const rowDates = Object.keys(reach).sort();
            const matchDate = rowDates.filter((rd) => rd <= d).at(-1);
            if (!matchDate) continue;
            const diffDays = (new Date(d).getTime() - new Date(matchDate).getTime()) / 86400000;
            if (diffDays > 6) continue;
            const t = totalsFor(targetBrandId, d);
            t.socialReach += reach[matchDate] ?? 0;
            t.socialEngagement += eng[matchDate] ?? 0;
            t.socialFollowers += fol[matchDate] ?? 0;
            t.socialVideoViews += vid[matchDate] ?? 0;
            t.socialLinkClicks += lnk[matchDate] ?? 0;
          }
        } catch {
          // skip accounts with no analytics
        }
      }

      // Post counts — 7-Tage-Fenster, je Post per account_id attribuiert.
      for (let i = 0; i < dates.length; i += 7) {
        const chunk = dates.slice(i, i + 7);
        try {
          await new Promise((r) => setTimeout(r, 1500));
          const data = await publerGet(
            `/api/v1/posts?state=published&from=${chunk[0]}&to=${chunk[chunk.length - 1]}`,
            ws.workspaceId
          );
          for (const post of data.posts ?? []) {
            const d = (post.published_at ?? post.created_at ?? post.scheduled_at ?? "").slice(0, 10);
            if (!d || !dates.includes(d)) continue;
            totalsFor(resolveAccountBrand(post.account_id, ws.brandId!, brandBySlug), d).socialPosts++;
          }
        } catch {
          /* skip */
        }
      }
    }

    for (const [brandId, byDate] of Object.entries(perBrand)) {
      let saved = 0;
      for (const date of dates) {
        const totals = byDate[date];
        if (!totals) continue;
        const { socialPosts, ...analytics } = totals;
        try {
          await ctx.runMutation(api.kpi.upsertSnapshot, {
            brandId: brandId as any, date, source: "publer",
            socialPosts, ...analytics,
          });
          saved++;
        } catch {
          /* skip */
        }
      }
      results.push(`${slugById[brandId] ?? brandId}: ${saved}/${dates.length} dates`);
    }
    return results;
  },
});
