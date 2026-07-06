"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

const BASE = "https://api.seranking.com/v1";

type Engine = "chatgpt" | "perplexity" | "gemini" | "ai-overview" | "ai-mode";

type BrandConfig = {
  slug: string;
  target: string;
  brand: string;
  source: string;
  region: string;
  engines: Engine[];
};

const BRAND_CONFIGS: BrandConfig[] = [
  {
    slug: "microvista",
    target: "microvista.de",
    brand: "Microvista",
    source: "de",
    region: "DE",
    engines: ["chatgpt", "perplexity", "gemini", "ai-overview", "ai-mode"],
  },
];

type Metric = {
  current?: number;
};

type OverviewResponse = {
  summary?: {
    brand_presence?: Metric;
    link_presence?: Metric;
    average_position?: Metric;
  };
};

type PromptHit = {
  prompt: string;
  volume?: number;
  type?: string;
  answer?: {
    text?: string;
    links?: string[];
  };
};

type PromptsResponse = {
  date?: string;
  prompts?: PromptHit[];
};

function authHeaders() {
  const key = process.env.SERANKING_API_KEY;
  if (!key) throw new Error("SERANKING_API_KEY not set");
  return { Authorization: `Token ${key}`, "Content-Type": "application/json" };
}

async function seGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`SE Ranking ${path} -> ${res.status}: ${await res.text()}`);
  return await res.json() as T;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function normalizePresence(value: number | undefined) {
  if (value == null || !Number.isFinite(value) || value <= 0) return 0;
  return value > 1 ? Math.min(value / 100, 1) : Math.min(value, 1);
}

function cleanLink(link: string) {
  const markdownMatch = link.match(/\((https?:\/\/[^)]+)\)/);
  return markdownMatch?.[1] ?? link.replace(/^\[|\]$/g, "");
}

function domainFromUrl(link: string) {
  try {
    return new URL(cleanLink(link)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function summarizeAnswer(text: string | undefined) {
  if (!text) return undefined;
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 280 ? `${compact.slice(0, 277)}...` : compact;
}

export const syncAIVisibility = action({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const results: string[] = [];

    for (const config of BRAND_CONFIGS) {
      const brand = await ctx.runQuery(api.brands.getBySlug, { slug: config.slug });
      if (!brand) {
        results.push(`SKIP ${config.slug}: Brand not found`);
        continue;
      }

      if (config.slug === "microvista") {
        await ctx.runMutation(api.aiVisibility.seedMicrovistaPrompts, {});
      }

      const prompts = await ctx.runQuery(api.aiVisibility.listPrompts, {
        brandId: brand._id,
        activeOnly: true,
      });
      const overviewPrompt = prompts.find((prompt) => prompt.priority === 5) ?? prompts[0];
      if (!overviewPrompt) {
        results.push(`SKIP ${config.slug}: no AI prompts`);
        continue;
      }

      for (const engine of config.engines) {
        try {
          const overviewParams = new URLSearchParams({
            target: config.target,
            source: config.source,
            engine,
            scope: "base_domain",
            brand: config.brand,
          });
          const overview = await seGet<OverviewResponse>(
            `/ai-search/overview/by-engine/time-series?${overviewParams.toString()}`
          );
          const date = new Date().toISOString().slice(0, 10);
          const brandPresence = normalizePresence(overview.summary?.brand_presence?.current);
          const linkPresence = normalizePresence(overview.summary?.link_presence?.current);
          const averagePosition = overview.summary?.average_position?.current;

          await ctx.runMutation(api.aiVisibility.upsertVisibilitySnapshot, {
            brandId: brand._id,
            promptId: overviewPrompt._id,
            date,
            engine,
            region: config.region,
            brandMentioned: brandPresence > 0,
            brandPosition: averagePosition ? Math.round(averagePosition) : undefined,
            mentionRate: brandPresence,
            linkPresent: linkPresence > 0,
            citationShare: linkPresence,
            sentiment: "unknown",
            competitorsMentioned: [],
            sourceProvider: "seranking",
            rawUrl: `${BASE}/ai-search/overview/by-engine/time-series`,
          });

          const targetParams = new URLSearchParams({
            target: config.target,
            scope: "base_domain",
            source: config.source,
            engine,
            limit: "10",
          });
          const brandParams = new URLSearchParams({
            brand: config.brand,
            source: config.source,
            engine,
            limit: "10",
          });

          const promptResponses = await Promise.all([
            seGet<PromptsResponse>(`/ai-search/prompts-by-target?${targetParams.toString()}`),
            seGet<PromptsResponse>(`/ai-search/prompts-by-brand?${brandParams.toString()}`),
          ]);

          let savedPrompts = 0;
          for (const response of promptResponses) {
            const snapshotDate = response.date ?? date;
            for (const hit of response.prompts ?? []) {
              const promptId = await ctx.runMutation(api.aiVisibility.upsertPrompt, {
                brandId: brand._id,
                prompt: hit.prompt,
                language: config.source,
                region: config.region,
                persona: "AI Search",
                funnelStage: "consideration",
                priority: 3,
                cluster: "SE Ranking AI Search",
                active: true,
              });
              const links = hit.answer?.links?.map(cleanLink) ?? [];
              const domains = Array.from(new Set(links.map(domainFromUrl).filter(Boolean)));
              const linkPresent = domains.some((domain) => domain.endsWith(config.target));
              const type = hit.type?.toLowerCase() ?? "";

              await ctx.runMutation(api.aiVisibility.upsertVisibilitySnapshot, {
                brandId: brand._id,
                promptId,
                date: snapshotDate,
                engine,
                region: config.region,
                brandMentioned: true,
                brandPosition: undefined,
                mentionRate: 1,
                linkPresent: linkPresent || type.includes("link"),
                citationShare: linkPresent ? 1 : 0,
                sentiment: "unknown",
                competitorsMentioned: [],
                sourceProvider: "seranking",
                rawUrl: `${BASE}/ai-search/prompts-by-target`,
              });

              await ctx.runMutation(api.aiVisibility.upsertResponseSnapshot, {
                brandId: brand._id,
                promptId,
                date: snapshotDate,
                engine,
                answerSummary: summarizeAnswer(hit.answer?.text),
                mentionedBrands: [config.brand],
                citedUrls: links,
                citedDomains: domains,
                missingAngles: [],
                rawResponse: hit.answer?.text,
                sourceProvider: "seranking",
              });
              savedPrompts++;
            }
          }

          results.push(`OK ${config.slug}/${engine}: overview + ${savedPrompts} prompt hits`);
        } catch (error) {
          results.push(`ERROR ${config.slug}/${engine}: ${errorMessage(error)}`);
        }
      }
    }

    return results;
  },
});
