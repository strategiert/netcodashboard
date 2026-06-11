"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { getBrandWorkspaceMap, publerGet } from "./publerHelpers";

// Get account name map for workspace. Returns empty map on failure (workspace skipped upstream).
async function getAccountNames(workspaceId: string): Promise<Record<string, string>> {
  try {
    const accounts: any[] = await publerGet("/api/v1/accounts", workspaceId);
    return Object.fromEntries(accounts.map(a => [a.id, a.name ?? a.username ?? a.id]));
  } catch (e: any) {
    console.warn(`[syncPublerPosts] account names failed ws=${workspaceId}: ${e.message}`);
    return {};
  }
}

async function fetchPostInsights(workspaceId: string, from: string, to: string, page = 1): Promise<any[]> {
  const data = await publerGet(
    `/api/v1/analytics/post_insights?from=${from}&to=${to}&limit=50&page=${page}`,
    workspaceId
  );
  return data.posts ?? [];
}

function extractMetric(analytics: any, key: string): number | undefined {
  const val = analytics?.[key]?.value;
  return (val === null || val === undefined) ? undefined : Number(val);
}

function getThumbnail(post: any): string | undefined {
  const media = post.media?.[0];
  if (!media) return undefined;
  return media.thumbnails?.[0]?.small ?? media.path ?? undefined;
}

export const syncPublerPosts = action({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    const brandsRaw = await ctx.runQuery(api.brands.list);
    // netco ans Ende — chronisch rate-limited, soll Budget der anderen nicht klauen
    const brands = [...brandsRaw].sort((a: any, b: any) => {
      const ap = a.slug === "netco" ? 1 : 0;
      const bp = b.slug === "netco" ? 1 : 0;
      return ap - bp;
    });
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const from = start.toISOString().slice(0, 10);
    const to = end.toISOString().slice(0, 10);

    const brandWorkspaces = await getBrandWorkspaceMap(ctx);

    const results: string[] = [];
    for (const brand of brands) {
      const wsIds = brandWorkspaces[brand._id];
      if (!wsIds?.length) { results.push(`SKIP ${brand.slug}: keine Workspaces`); continue; }

      let brandTotal = 0;
      let wsErrors = 0;
      for (const workspaceId of wsIds) {
        const accountNames = await getAccountNames(workspaceId);
        if (Object.keys(accountNames).length === 0) {
          wsErrors++;
          continue;
        }
        await new Promise(r => setTimeout(r, 500));

        let saved = 0, page = 1;
        let total = Infinity;
        while (saved < total) {
          try {
            const data = await publerGet(
              `/api/v1/analytics/post_insights?from=${from}&to=${to}&limit=50&page=${page}`,
              workspaceId
            );
            const posts: any[] = data.posts ?? [];
            total = data.total ?? posts.length;
            if (!posts.length) break;

            for (const post of posts) {
              const a = post.analytics ?? {};
              const publishedAt = (post.scheduled_at ?? post.updated_at ?? "").slice(0, 10);
              if (!publishedAt) continue;

              await ctx.runMutation(api.publer.upsertPost, {
                brandId: brand._id,
                workspaceId,
                publerPostId: post.id,
                accountId: post.account_id,
                accountType: post.account_type,
                accountName: accountNames[post.account_id] ?? post.account_type,
                publishedAt,
                postLink: post.post_link ?? undefined,
                postType: post.type ?? post.details?.type ?? undefined,
                text: post.text ? post.text.slice(0, 500) : undefined,
                thumbnail: getThumbnail(post),
                reach:          extractMetric(a, "reach"),
                reachRate:      extractMetric(a, "reach_rate"),
                videoViews:     extractMetric(a, "video_views"),
                likes:          extractMetric(a, "likes"),
                comments:       extractMetric(a, "comments"),
                shares:         extractMetric(a, "shares"),
                postClicks:     extractMetric(a, "post_clicks"),
                engagementRate: extractMetric(a, "engagement_rate"),
                linkClicks:     extractMetric(a, "link_clicks"),
                ctr:            extractMetric(a, "click_through_rate"),
              });
              saved++;
            }

            if (posts.length < 10) break;
            page++;
            await new Promise(r => setTimeout(r, 800));
          } catch (e: any) {
            if (e.message?.includes("429") || e.message?.includes("Rate limit")) {
              await new Promise(r => setTimeout(r, 8000));
            }
            console.warn(`[syncPublerPosts] page ${page} failed ws=${workspaceId}: ${e.message}`);
            break;
          }
        }
        brandTotal += saved;
        await new Promise(r => setTimeout(r, 1000));
      }
      results.push(`${brand.slug}: ${brandTotal} posts, ${wsErrors} ws-skipped (${wsIds.length} Workspaces)`);
    }
    return results;
  },
});
