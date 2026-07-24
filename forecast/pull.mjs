// Zieht Rohserien aus Convex (read-only Queries) für die Chronos-2-Forecast-Pipeline.
// Pfade sind relativ zum Skript-Verzeichnis aufgelöst (nicht zum CWD) — läuft also
// unabhängig davon, ob von forecast/ oder vom Repo-Root aus aufgerufen wird.
// Aufruf (siehe forecast-night.ps1, CWD=Repo-Root): node --env-file=.env.local forecast\pull.mjs
import { ConvexHttpClient } from "convex/browser";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONVEX_URL = process.env.FORECAST_CONVEX_URL || "https://grandiose-cricket-4.convex.cloud";
const LOOKBACK_DAYS = 400;
const MIN_POINTS = 60;
const OUT_DIR = join(__dirname, "data");
const OUT_FILE = join(OUT_DIR, "input.json");

function isoDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);
  console.log(`Pull von ${CONVEX_URL} …`);

  const brands = await client.query("brands:list", {});
  console.log(`  ${brands.length} Marken gefunden.`);

  const to = isoDaysAgo(0);
  const from = isoDaysAgo(LOOKBACK_DAYS);

  const out = { pulledAt: new Date().toISOString(), brands: [] };
  let totalSeries = 0, droppedSeries = 0;

  for (const brand of brands) {
    const series = {};

    // sessions aus dailyTraffic
    const traffic = await client.query("dailyTraffic:getRange", { brandId: brand._id, from, to });
    const sessionsSeries = traffic
      .filter((t) => typeof t.sessions === "number")
      .map((t) => ({ date: t.date, value: t.sessions }));

    // adSpend/adConversions aus kpiSnapshots (source==='ads') — kpi:getAllByDateRange
    // filtert nicht nach Source, daher hier im Script filtern.
    const kpi = await client.query("kpi:getAllByDateRange", { brandId: brand._id, from, to });
    const adsRows = kpi.filter((k) => k.source === "ads");
    const adSpendSeries = adsRows
      .filter((r) => typeof r.adSpend === "number")
      .map((r) => ({ date: r.date, value: r.adSpend }));
    const adConversionsSeries = adsRows
      .filter((r) => typeof r.adConversions === "number")
      .map((r) => ({ date: r.date, value: r.adConversions }));

    const candidates = {
      sessions: sessionsSeries,
      adSpend: adSpendSeries,
      adConversions: adConversionsSeries,
    };

    for (const [metric, s] of Object.entries(candidates)) {
      totalSeries++;
      if (s.length < MIN_POINTS) {
        droppedSeries++;
        console.log(`  [${brand.slug}] ${metric}: ${s.length} Punkte < ${MIN_POINTS} — weggelassen.`);
        continue;
      }
      series[metric] = s;
    }

    out.brands.push({ slug: brand.slug, series });
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
  console.log(`Geschrieben: ${OUT_FILE} (${totalSeries - droppedSeries}/${totalSeries} Serien behalten).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
