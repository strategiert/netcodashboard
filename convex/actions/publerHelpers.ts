"use node";
import { api } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

/**
 * Build a map of brandId → workspaceId[] from the publerWorkspaces table.
 * Only returns workspaces that are assigned to a brand.
 */
export async function getBrandWorkspaceMap(ctx: ActionCtx): Promise<Record<string, string[]>> {
  const workspaces = await ctx.runQuery(api.publer.listWorkspaces);
  const map: Record<string, string[]> = {};
  for (const ws of workspaces) {
    if (!ws.brandId) continue;
    if (!map[ws.brandId]) map[ws.brandId] = [];
    map[ws.brandId].push(ws.workspaceId);
  }
  return map;
}

export async function publerGet(
  path: string,
  workspaceId: string,
  retries = 4,
): Promise<any> {
  const apiKey = process.env.PUBLER_API_KEY;
  if (!apiKey) throw new Error("PUBLER_API_KEY not set");

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(`https://app.publer.com${path}`, {
      headers: {
        Authorization: `Bearer-API ${apiKey}`,
        "Publer-Workspace-Id": workspaceId,
      },
    });
    if (res.ok) return res.json();

    const body = await res.text();
    const isRateLimit = res.status === 429;
    const isServerError = res.status >= 500 && res.status < 600;
    const canRetry = (isRateLimit || isServerError) && attempt < retries - 1;

    if (!canRetry) {
      throw new Error(`Publer ${res.status}: ${body}`);
    }

    // Honor Retry-After header (seconds) when Publer sets it; else exponential backoff
    const retryAfterHeader = res.headers.get("retry-after");
    const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 0;
    const backoffMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? Math.min(retryAfterSeconds * 1000, 30_000)
      : Math.min(2 ** attempt * 2000, 16_000);
    await new Promise((r) => setTimeout(r, backoffMs));
  }
  throw new Error(`Publer max retries exceeded for ${path}`);
}
