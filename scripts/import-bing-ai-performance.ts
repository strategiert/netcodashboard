import { existsSync, readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { parseBingAiPerformanceCsv } from "../src/lib/bing-ai-csv";

function printUsage() {
  console.log("Usage: npm run bing:ai-import -- <brand-slug> <csv-file>");
  console.log("Example: npm run bing:ai-import -- microvista C:/Users/karent/Downloads/bing-ai.csv");
}

function loadLocalEnv() {
  if (!existsSync(".env.local")) return;
  const lines = readFileSync(".env.local", "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadLocalEnv();
  const [brandSlug, filePath] = process.argv.slice(2);
  if (!brandSlug || !filePath || brandSlug === "--help" || brandSlug === "-h") {
    printUsage();
    return;
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL not set");

  const client = new ConvexHttpClient(convexUrl);
  const brand = await client.query(api.brands.getBySlug, { slug: brandSlug });
  if (!brand) throw new Error(`Brand not found: ${brandSlug}`);

  const csv = readFileSync(filePath, "utf-8");
  const rows = parseBingAiPerformanceCsv(csv);
  let imported = 0;

  for (const row of rows) {
    await client.mutation(api.aiVisibility.upsertBingSearchSnapshot, {
      brandId: brand._id,
      date: row.date,
      query: row.query,
      page: row.page,
      aiCitations: row.aiCitations,
      aiCitationShare: row.aiCitationShare,
      topic: row.topic,
      intent: row.intent,
      sourceProvider: row.sourceProvider,
    });
    imported++;
  }

  console.log(`Imported ${imported} Bing AI Performance rows for ${brandSlug}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
