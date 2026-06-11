// BauTV Dashboard-Pull: Ads (Google Ads) + Social (Publer) + Search (GSC) — automatisch.
// Schreibt eine kombinierte JSON. Jede Quelle gekapselt: fällt eine aus, laufen die anderen.
// Aufruf: node scripts/bautv-dashboard-pull.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { JWT } from "google-auth-library";

const root = path.resolve(import.meta.dirname, "..");
for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const OUT = "C:/Users/karent/Documents/Software/Schulungen/agenten-workshop/referenz-bautv/bautv-data.json";
const today = new Date().toISOString().slice(0, 10);
const START = "2024-01-01"; // großer Zeitrahmen für Trend/Vorjahr
const result = { generatedAt: today, rangeStart: START, errors: {} };

// ---------- SEARCH (GSC) ----------
async function pullGSC() {
  const creds = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);
  const site = process.env.GSC_PROPERTY_BAUTV;
  if (!site) throw new Error("GSC_PROPERTY_BAUTV fehlt");
  const jwt = new JWT({ email: creds.client_email, key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const { token } = await jwt.getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: START, endDate: today, dimensions: ["date"], rowLimit: 25000 }) });
  if (!res.ok) throw new Error(`GSC ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.rows || []).map(r => ({
    date: r.keys[0], clicks: r.clicks || 0, impressions: r.impressions || 0,
    ctr: r.ctr || 0, position: r.position || 0,
  })).sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- ADS (Google Ads) ----------
async function adsToken() {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GADS_OAUTH_CLIENT_ID,
      client_secret: process.env.GADS_OAUTH_CLIENT_SECRET, refresh_token: process.env.GADS_REFRESH_TOKEN,
      grant_type: "refresh_token" }) });
  const j = await r.json();
  if (!j.access_token) throw new Error("Ads token: " + JSON.stringify(j));
  return j.access_token;
}
async function pullAds() {
  const tok = await adsToken();
  const cid = process.env.GADS_CUSTOMER_ID_NETCO.replace(/-/g, "");
  const mid = process.env.GADS_MANAGER_CUSTOMER_ID.replace(/-/g, "");
  const query = `SELECT campaign.name, campaign.advertising_channel_type, segments.date,
    metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions
    FROM campaign WHERE segments.date BETWEEN '${START}' AND '${today}'`;
  const all = []; let pt;
  for (let i = 0; i < 200; i++) {
    const res = await fetch(`https://googleads.googleapis.com/v22/customers/${cid}/googleAds:search`, {
      method: "POST", headers: { Authorization: `Bearer ${tok}`, "developer-token": process.env.GADS_DEVELOPER_TOKEN,
        "login-customer-id": mid, "Content-Type": "application/json" },
      body: JSON.stringify(pt ? { query, pageToken: pt } : { query }) });
    if (!res.ok) throw new Error(`Ads ${res.status}: ${await res.text()}`);
    const d = await res.json(); all.push(...(d.results || []));
    if (!d.nextPageToken) break; pt = d.nextPageToken;
  }
  // alle Kampagnennamen sammeln (zur Verifikation des BauTV-Filters)
  const names = [...new Set(all.map(r => r.campaign?.name).filter(Boolean))];
  // BauTV = Baukamera/Baustellenkamera-Produkt → Kampagnen-Prefix "BK-".
  // (BC = Body-Cam, NDT/MV = Microvista/ScanExpress, NC = NetCo allgemein.)
  const isBauTV = n => { const l = (n || "").toLowerCase();
    return /^bk[-\s]/.test(l) || l.includes("baukamera") || l.includes("baustellenkamera"); };
  const daily = {}; const camp = {};
  for (const r of all) {
    if (!isBauTV(r.campaign?.name)) continue;
    const d = r.segments?.date; if (!d) continue;
    const me = r.metrics || {};
    const cost = (+me.costMicros || 0) / 1e6, clk = +me.clicks || 0, imp = +me.impressions || 0, cv = +me.conversions || 0;
    daily[d] ??= { date: d, cost: 0, clicks: 0, impressions: 0, conversions: 0 };
    daily[d].cost += cost; daily[d].clicks += clk; daily[d].impressions += imp; daily[d].conversions += cv;
    const cn = r.campaign?.name || "?";
    camp[cn] ??= { name: cn, cost: 0, clicks: 0, impressions: 0, conversions: 0 };
    camp[cn].cost += cost; camp[cn].clicks += clk; camp[cn].impressions += imp; camp[cn].conversions += cv;
  }
  const rnd = x => ({ ...x, cost: Math.round(x.cost * 100) / 100, conversions: Math.round(x.conversions * 10) / 10 });
  return { allCampaignNames: names, bautvCampaignNames: names.filter(isBauTV),
    campaignTotals: Object.values(camp).map(rnd).sort((a, b) => b.cost - a.cost),
    daily: Object.values(daily).map(rnd).sort((a, b) => a.date.localeCompare(b.date)) };
}

// ---------- SOCIAL (Publer) ----------
async function publerGet(p, ws) {
  const res = await fetch(`https://app.publer.com${p}`, {
    headers: { Authorization: `Bearer-API ${process.env.PUBLER_API_KEY}`, "Publer-Workspace-Id": ws } });
  if (!res.ok) throw new Error(`Publer ${res.status}: ${await res.text()}`);
  return res.json();
}
async function pullPubler() {
  const ws = process.env.PUBLER_ACCOUNT_ID_BAUTV;
  if (!ws) throw new Error("PUBLER_ACCOUNT_ID_BAUTV fehlt");
  // Kurzer Range -> Publer liefert WOECHENTLICHE Buckets (date=Wochenstart). Langer Range groebt zu wenigen Punkten.
  const from = "2026-01-01";
  const accounts = await publerGet("/api/v1/accounts", ws);
  const ANALYTICS = new Set(["fb_page", "ig_business", "in_profile", "in_page", "youtube", "twitter",
    "tiktok", "pinterest", "threads", "mastodon", "bluesky"]);
  const charts = ["post_reach", "post_engagement", "followers", "link_clicks", "video_views"];
  const series = {}; // date -> {reach, engagement, linkClicks, videoViews}
  const accountList = [];
  for (const a of accounts) {
    accountList.push({ id: a.id, name: a.name, type: a.type, followers: a.followers ?? a.followers_count ?? null });
    if (!ANALYTICS.has(a.type)) continue;
    try {
      const cp = charts.map(id => `chart_ids[]=${id}`).join("&");
      const data = await publerGet(`/api/v1/analytics/${a.id}/chart_data?${cp}&from=${from}&to=${today}`, ws);
      const cur = data.current ?? {};
      const add = (rows, key) => { for (const row of rows || []) {
        const d = (row.date || row.label || "").slice(0, 10); if (!d) continue;
        series[d] ??= { date: d, reach: 0, engagement: 0, linkClicks: 0, videoViews: 0 };
        series[d][key] += Number(row.value ?? row.last_value ?? 0); } };
      add(cur.post_reach, "reach"); add(cur.post_engagement, "engagement");
      add(cur.link_clicks, "linkClicks"); add(cur.video_views, "videoViews");
    } catch (e) { /* Konto ohne Analytics */ }
  }
  // Post-Anzahl je Tag (letzte 120 Tage, sonst zu viele Calls)
  return { accounts: accountList, daily: Object.values(series).sort((a, b) => a.date.localeCompare(b.date)) };
}

for (const [key, fn] of [["search", pullGSC], ["ads", pullAds], ["social", pullPubler]]) {
  try { result[key] = await fn(); console.error(`✓ ${key} ok`); }
  catch (e) { result.errors[key] = String(e.message || e); console.error(`✗ ${key}: ${e.message}`); }
}

writeFileSync(OUT, JSON.stringify(result, null, 2), "utf8");
console.error(`\n✓ geschrieben: ${OUT}`);
// kurze Übersicht
console.error(JSON.stringify({
  search: result.search ? `${result.search.length} Tage` : result.errors.search,
  adsCampaigns: result.ads?.bautvCampaignNames ?? result.errors.ads,
  adsDays: result.ads?.daily?.length,
  socialAccounts: result.social?.accounts?.map(a => `${a.name}(${a.type})`) ?? result.errors.social,
  socialDays: result.social?.daily?.length,
}, null, 2));
