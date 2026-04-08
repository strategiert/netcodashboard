"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

export const fetchPublerWorkspaces = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.PUBLER_API_KEY;
    if (!apiKey) throw new Error("PUBLER_API_KEY not set");

    // Fetch all workspaces the API key has access to
    const res = await fetch("https://app.publer.com/api/v1/workspaces", {
      headers: { Authorization: `Bearer-API ${apiKey}` },
    });
    if (!res.ok) throw new Error(`Publer workspaces ${res.status}: ${await res.text()}`);
    const workspaces: any[] = await res.json();

    const results: string[] = [];
    for (const ws of workspaces) {
      // Count accounts per workspace
      let accountCount = 0;
      try {
        const accRes = await fetch("https://app.publer.com/api/v1/accounts", {
          headers: {
            Authorization: `Bearer-API ${apiKey}`,
            "Publer-Workspace-Id": ws.id ?? ws._id,
          },
        });
        if (accRes.ok) {
          const accounts: any[] = await accRes.json();
          accountCount = accounts.length;
        }
      } catch { /* skip */ }

      await ctx.runMutation(api.publer.upsertWorkspace, {
        workspaceId: ws.id ?? ws._id,
        name: ws.name ?? ws.title ?? "Unbenannt",
        accountCount,
      });
      results.push(`${ws.name ?? ws.id}: ${accountCount} Konten`);

      await new Promise(r => setTimeout(r, 500));
    }
    return results;
  },
});
