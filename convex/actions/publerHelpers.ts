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

export async function publerGet(path: string, workspaceId: string): Promise<any> {
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
