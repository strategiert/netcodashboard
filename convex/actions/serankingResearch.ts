"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";

// On-Demand Keyword-Research via Data API (/v1/keywords/export).
// Kostet 100 credits pro Request (bis 5.000 Keywords). Aus der UI getriggert.
export const researchKeywords = action({
  args: {
    keywords: v.array(v.string()),
    source: v.optional(v.string()), // Regions-DB, default "de"
    brandId: v.optional(v.id("brands")),
  },
  handler: async (ctx, { keywords, source, brandId }): Promise<any[]> => {
    const key = process.env.SERANKING_API_KEY;
    if (!key) throw new Error("SERANKING_API_KEY not set");
    const src = source ?? "de";
    const cleaned = keywords.map((k) => k.trim()).filter(Boolean).slice(0, 5000);
    if (cleaned.length === 0) return [];

    const res = await fetch(`https://api.seranking.com/v1/keywords/export?source=${src}`, {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: cleaned, sort: "volume", sort_order: "desc" }),
    });
    if (!res.ok) throw new Error(`SE Ranking keywords/export → ${res.status}: ${await res.text()}`);
    const data: any[] = await res.json();

    const results = data.map((r) => ({
      keyword: r.keyword as string,
      volume: r.volume,
      cpc: r.cpc,
      competition: r.competition,
      difficulty: r.difficulty,
      intents: Array.isArray(r.intents) ? r.intents : undefined,
      isDataFound: r.is_data_found ?? false,
    }));

    await ctx.runMutation(api.seranking.saveResearch, { brandId, source: src, results });
    return results;
  },
});
