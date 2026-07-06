// Backfill Google Ads data from 2024-Q1 through 2025-Q4 into prod Convex.
// Run: node --env-file=.env.local scripts/backfill-gads-historic.mjs
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = "https://grandiose-cricket-4.convex.cloud";

const QUARTERS = [];
for (const y of [2024, 2025]) {
  QUARTERS.push({ label: `Q1 ${y}`, start: `${y}-01-01`, end: `${y}-03-31` });
  QUARTERS.push({ label: `Q2 ${y}`, start: `${y}-04-01`, end: `${y}-06-30` });
  QUARTERS.push({ label: `Q3 ${y}`, start: `${y}-07-01`, end: `${y}-09-30` });
  QUARTERS.push({ label: `Q4 ${y}`, start: `${y}-10-01`, end: `${y}-12-31` });
}
QUARTERS.push({ label: `Q1 2026`, start: `2026-01-01`, end: `2026-03-31` });
const today = new Date().toISOString().slice(0, 10);
QUARTERS.push({ label: `Q2 2026`, start: `2026-04-01`, end: today });

const BRAND_KEYWORDS = {
  bodycam:    ["bodycam", "body-cam", "body cam", "netco-bc", "bc-"],
  microvista: ["microvista", "micro vista", "ndt-", "mv-", "scanexpress", "scan express"],
  bautv:      ["bautv", "bau-tv", "baustellenkamera", "btv-", "bk-"],
  netco:      ["nc-", "netco-"],  // generic NetCo: jobs, local awareness
};
const PERFORMANCE_SNAPSHOT_BRANDS = ["bodycam", "microvista", "bautv", "netco"];

function detectBrand(name) {
  const lower = (name ?? "").toLowerCase();
  // Match most-specific first: bc-/bk-/mv-/ndt- before generic nc-
  for (const brand of ["bodycam", "microvista", "bautv"]) {
    if (BRAND_KEYWORDS[brand].some(k => lower.includes(k))) return brand;
  }
  if (BRAND_KEYWORDS.netco.some(k => lower.includes(k))) return "netco";
  return null;
}

async function getAdsToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GADS_OAUTH_CLIENT_ID,
      client_secret: process.env.GADS_OAUTH_CLIENT_SECRET,
      refresh_token: process.env.GADS_REFRESH_TOKEN,
      grant_type:    "refresh_token",
    }),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error("Token: " + JSON.stringify(d));
  return d.access_token;
}

async function gadsSearchAll(token, query) {
  const cid = process.env.GADS_CUSTOMER_ID_NETCO.replace(/-/g, "");
  const mid = process.env.GADS_MANAGER_CUSTOMER_ID.replace(/-/g, "");
  const all = [];
  let pageToken = undefined;
  for (let page = 0; page < 50; page++) {
    const body = pageToken ? { query, pageToken } : { query };
    const res = await fetch(`https://googleads.googleapis.com/v22/customers/${cid}/googleAds:search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "developer-token": process.env.GADS_DEVELOPER_TOKEN,
        "login-customer-id": mid,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Ads ${res.status}: ${await res.text()}`);
    const d = await res.json();
    all.push(...(d.results ?? []));
    if (!d.nextPageToken) break;
    pageToken = d.nextPageToken;
  }
  return all;
}

const CHANNEL_TYPE = {
  SEARCH:"Search", DISPLAY:"Display", VIDEO:"Video", SHOPPING:"Shopping",
  PERFORMANCE_MAX:"Performance Max", DEMAND_GEN:"Demand Gen",
  MULTI_CHANNEL:"Multi-channel", LOCAL:"Local", SMART:"Smart",
  HOTEL:"Hotel", TRAVEL:"Travel", DISCOVERY:"Discovery",
};

function eachDate(startDate, endDate) {
  const dates = [];
  const d = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  while (d <= end) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

async function processQuarter(client, token, byslug, q) {
  console.log(`\n━━━ ${q.label} (${q.start} → ${q.end}) ━━━`);

  const daily = await gadsSearchAll(token, `
    SELECT campaign.name, campaign.advertising_channel_type, segments.date,
           metrics.cost_micros, metrics.clicks, metrics.impressions,
           metrics.conversions, metrics.average_cpc
    FROM campaign
    WHERE segments.date BETWEEN '${q.start}' AND '${q.end}'
  `);

  const agg = await gadsSearchAll(token, `
    SELECT campaign.name, campaign.advertising_channel_type, campaign.status,
           metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${q.start}' AND '${q.end}'
  `);

  console.log(`  API: ${daily.length} campaign-day rows, ${agg.length} aggregated rows`);

  if (daily.length === 0 && agg.length === 0) {
    console.log(`  → no data for this quarter`);
    return { quarter: q.label, brands: {}, unknown: new Set() };
  }

  const perBrandDay = {};
  const unknown = new Set();
  for (const row of daily) {
    const slug = detectBrand(row.campaign?.name);
    if (!slug) { unknown.add(row.campaign?.name); continue; }
    if (!PERFORMANCE_SNAPSHOT_BRANDS.includes(slug)) continue;
    const date = row.segments?.date;
    const key = `${slug}:${date}`;
    if (!perBrandDay[key]) perBrandDay[key] = { adSpend:0, adClicks:0, adImpressions:0, adConversions:0, cpcSum:0, n:0 };
    const m = row.metrics;
    perBrandDay[key].adSpend       += Number(m.costMicros ?? 0) / 1_000_000;
    perBrandDay[key].adClicks      += Number(m.clicks ?? 0);
    perBrandDay[key].adImpressions += Number(m.impressions ?? 0);
    perBrandDay[key].adConversions += Number(m.conversions ?? 0);
    perBrandDay[key].cpcSum        += Number(m.averageCpc ?? 0) / 1_000_000;
    perBrandDay[key].n++;
  }

  const perCampaign = {};
  for (const row of agg) {
    const name = row.campaign?.name;
    const slug = detectBrand(name);
    if (!slug) continue;
    const key = `${slug}:${name}`;
    if (!perCampaign[key]) {
      perCampaign[key] = {
        brandId: byslug[slug]._id,
        period: q.label,
        campaign: name,
        campaignType: CHANNEL_TYPE[row.campaign?.advertisingChannelType] || row.campaign?.advertisingChannelType || "—",
        status: row.campaign?.status || "UNKNOWN",
        clicks:0, cost:0, impressions:0, conversions:0,
      };
    }
    const c = perCampaign[key];
    const m = row.metrics;
    c.cost        += Number(m.costMicros ?? 0) / 1_000_000;
    c.clicks      += Number(m.clicks ?? 0);
    c.impressions += Number(m.impressions ?? 0);
    c.conversions += Number(m.conversions ?? 0);
  }

  // Write in parallel chunks (but not too many to avoid rate limits)
  const snapEntries = [];
  for (const slug of PERFORMANCE_SNAPSHOT_BRANDS) {
    const brand = byslug[slug];
    if (!brand) continue;
    for (const date of eachDate(q.start, q.end)) {
      const a = perBrandDay[`${slug}:${date}`] ?? { adSpend:0, adClicks:0, adImpressions:0, adConversions:0, cpcSum:0, n:0 };
      snapEntries.push([`${slug}:${date}`, a]);
    }
  }
  for (let i = 0; i < snapEntries.length; i += 20) {
    const chunk = snapEntries.slice(i, i + 20);
    await Promise.all(chunk.map(([key, a]) => {
      const [slug, date] = key.split(":");
      const brand = byslug[slug];
      return client.mutation("kpi:upsertSnapshot", {
        brandId: brand._id, date, source: "ads",
        adSpend: a.adSpend, adClicks: a.adClicks,
        adImpressions: a.adImpressions, adConversions: a.adConversions,
        adCpc: a.n > 0 ? a.cpcSum / a.n : 0,
      });
    }));
  }

  const campEntries = Object.values(perCampaign);
  for (let i = 0; i < campEntries.length; i += 20) {
    const chunk = campEntries.slice(i, i + 20);
    await Promise.all(chunk.map(row => client.mutation("gads:upsertCampaignStat", row)));
  }

  const totals = {};
  for (const row of campEntries) {
    const slug = Object.entries(byslug).find(([,b])=>b._id===row.brandId)?.[0];
    if (!totals[slug]) totals[slug] = { cost:0, clicks:0, imp:0, conv:0, n:0 };
    totals[slug].cost += row.cost;
    totals[slug].clicks += row.clicks;
    totals[slug].imp += row.impressions;
    totals[slug].conv += row.conversions;
    totals[slug].n++;
  }
  console.log(`  → Wrote ${snapEntries.length} snapshots + ${campEntries.length} campaign rows`);
  for (const [slug, t] of Object.entries(totals)) {
    console.log(`    ${slug.padEnd(10)}: ${t.n} Kamp. | ${t.cost.toFixed(0).padStart(6)}€ | ${String(t.clicks).padStart(6)} Kl | ${String(t.imp).padStart(9)} Impr | ${t.conv.toFixed(1).padStart(5)} Conv`);
  }
  return { quarter: q.label, brands: totals, unknown };
}

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);
  const brands = await client.query("brands:list", {});
  const byslug = Object.fromEntries(brands.map(b => [b.slug, b]));
  console.log(`Brands: ${Object.keys(byslug).join(", ")}`);

  console.log(`🔑 Getting OAuth token…`);
  const token = await getAdsToken();

  const results = [];
  const allUnknown = new Set();
  for (const q of QUARTERS) {
    try {
      const r = await processQuarter(client, token, byslug, q);
      results.push(r);
      for (const n of r.unknown) allUnknown.add(n);
    } catch (e) {
      console.error(`✗ ${q.label} failed:`, e.message);
      results.push({ quarter: q.label, error: e.message });
    }
  }

  // Yearly summary
  console.log(`\n\n═══════ JAHRESBILANZ ═══════`);
  for (const y of [2024, 2025]) {
    console.log(`\n📅 ${y}:`);
    const yearly = {};
    for (const r of results) {
      if (!r.quarter?.includes(String(y))) continue;
      for (const [slug, t] of Object.entries(r.brands || {})) {
        if (!yearly[slug]) yearly[slug] = { cost:0, clicks:0, imp:0, conv:0 };
        yearly[slug].cost += t.cost;
        yearly[slug].clicks += t.clicks;
        yearly[slug].imp += t.imp;
        yearly[slug].conv += t.conv;
      }
    }
    for (const [slug, t] of Object.entries(yearly)) {
      console.log(`  ${slug.padEnd(10)}: ${t.cost.toFixed(0).padStart(7)}€ | ${String(t.clicks).padStart(7)} Kl | ${String(t.imp).padStart(10)} Impr | ${t.conv.toFixed(1).padStart(6)} Conv`);
    }
  }

  if (allUnknown.size) {
    console.log(`\n⚠️ ${allUnknown.size} Kampagnen ohne Brand-Match:`);
    for (const n of allUnknown) console.log(`     · ${n}`);
  }
  console.log(`\n✅ Done.`);
}

main().catch(e => { console.error(e); process.exit(1); });
