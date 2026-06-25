// Microvista Juni-2026-Report: GA4-Traffic (MTD vs Vorjahr vs Vormonat-gleiches-Fenster) + Google Ads (MV-/NDT-/ScanExpress).
// Run: node scripts/microvista-june-report.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { JWT } from "google-auth-library";

const root = path.resolve(import.meta.dirname, "..");
for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const PROPERTY_ID = "397812718"; // Microvista
const creds = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);
const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ["https://www.googleapis.com/auth/analytics.readonly"] });

// Letzter vollständiger Tag = gestern
const yest = new Date(); yest.setUTCDate(yest.getUTCDate() - 1);
const dayNum = yest.getUTCDate(); // z.B. 24
const fmt = (d) => d.toISOString().slice(0, 10);
const JUNE_START = "2026-06-01", JUNE_END = fmt(yest);
const MAY_START = "2026-05-01", MAY_END = `2026-05-${String(dayNum).padStart(2, "0")}`;
const JUN25_START = "2025-06-01", JUN25_END = `2025-06-${String(dayNum).padStart(2, "0")}`;

async function ga4(ranges, dims, metrics) {
  const { token } = await jwt.getAccessToken();
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ dateRanges: ranges, dimensions: dims, metrics }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GA4 ${res.status}: ${text}`);
  return JSON.parse(text);
}

// --- GA4: Kanal x 3 Zeitraeume ---
const channelRep = await ga4(
  [{ startDate: JUNE_START, endDate: JUNE_END }, { startDate: MAY_START, endDate: MAY_END }, { startDate: JUN25_START, endDate: JUN25_END }],
  [{ name: "sessionDefaultChannelGroup" }],
  [{ name: "sessions" }, { name: "totalUsers" }, { name: "keyEvents" }],
);
// rangeIndex unterscheidet die 3 Zeitraeume
const ch = {};
for (const r of channelRep.rows ?? []) {
  const name = r.dimensionValues[0].value;
  const ri = Number(r.dimensionValues[1]?.value ?? r.metricValues[0]?.oneValue ?? 0);
  // dateRange index liegt als letzter dimensionValue NICHT vor; GA4 liefert "dateRange" nur wenn man dim hinzufuegt
  ch[name] ??= [{}, {}, {}];
}

// GA4 multi-range: der Range-Index kommt als implizite dimension "dateRange" NUR wenn angefragt. Stattdessen 3 Einzel-Calls (robuster).
async function channels(start, end) {
  const rep = await ga4([{ startDate: start, endDate: end }], [{ name: "sessionDefaultChannelGroup" }], [{ name: "sessions" }, { name: "totalUsers" }, { name: "keyEvents" }]);
  const map = {};
  for (const r of rep.rows ?? []) map[r.dimensionValues[0].value] = { sessions: +r.metricValues[0].value, users: +r.metricValues[1].value, conv: +r.metricValues[2].value };
  return map;
}
const june = await channels(JUNE_START, JUNE_END);
const may = await channels(MAY_START, MAY_END);
const jun25 = await channels(JUN25_START, JUN25_END);

const sum = (m, k) => Object.values(m).reduce((a, r) => a + r[k], 0);
const pct = (n, p) => (p === 0 ? (n === 0 ? 0 : null) : ((n - p) / p) * 100);
const allCh = [...new Set([...Object.keys(june), ...Object.keys(may), ...Object.keys(jun25)])];
const z = { sessions: 0, users: 0, conv: 0 };
const chRows = allCh.map((c) => ({ channel: c, j: june[c] ?? z, m: may[c] ?? z, y: jun25[c] ?? z })).sort((a, b) => b.j.sessions - a.j.sessions);

// --- Google Ads: Microvista-Kampagnen (MV-/NDT-/ScanExpress) Juni MTD ---
async function gadsToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GADS_OAUTH_CLIENT_ID, client_secret: process.env.GADS_OAUTH_CLIENT_SECRET, refresh_token: process.env.GADS_REFRESH_TOKEN, grant_type: "refresh_token" }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("GAds-Token: " + JSON.stringify(j));
  return j.access_token;
}
async function gads(token, query) {
  const cid = process.env.GADS_CUSTOMER_ID_NETCO.replace(/-/g, "");
  const mid = process.env.GADS_MANAGER_CUSTOMER_ID.replace(/-/g, "");
  const res = await fetch(`https://googleads.googleapis.com/v22/customers/${cid}/googleAds:search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "developer-token": process.env.GADS_DEVELOPER_TOKEN, "login-customer-id": mid, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GAds ${res.status}: ${await res.text()}`);
  return (await res.json()).results ?? [];
}
const eur = (m) => Number(m ?? 0) / 1e6;
let adsRows = [], adsErr = null;
try {
  const t = await gadsToken();
  const rows = await gads(t, `
    SELECT campaign.name, campaign.status, metrics.cost_micros, metrics.clicks, metrics.impressions,
           metrics.conversions, metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${JUNE_START}' AND '${JUNE_END}'`);
  const map = {};
  for (const r of rows) {
    const n = r.campaign.name;
    if (!/^(MV-|NDT-|ScanExpress)/i.test(n)) continue;
    map[n] ??= { name: n, status: r.campaign.status, cost: 0, clicks: 0, imp: 0, conv: 0, val: 0 };
    map[n].cost += eur(r.metrics?.costMicros); map[n].clicks += +(r.metrics?.clicks ?? 0);
    map[n].imp += +(r.metrics?.impressions ?? 0); map[n].conv += +(r.metrics?.conversions ?? 0);
    map[n].val += +(r.metrics?.conversionsValue ?? 0);
  }
  adsRows = Object.values(map).sort((a, b) => b.cost - a.cost);
} catch (e) { adsErr = e.message; }

const out = { property: PROPERTY_ID, windows: { june: [JUNE_START, JUNE_END], may: [MAY_START, MAY_END], jun2025: [JUN25_START, JUN25_END] },
  ga4: { june, may, jun25, channels: chRows }, ads: adsRows, adsErr };
const outDir = path.join(root, "reports"); mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, `microvista-june-2026.json`), JSON.stringify(out, null, 2), "utf8");

// --- Markdown ---
const arrow = (p) => (p === null ? "—" : p >= 0 ? "▲" : "▼");
const fp = (p) => (p === null ? "n/a" : `${p >= 0 ? "+" : ""}${p.toFixed(0)}%`);
let md = `# Microvista — Juni 2026 (Stand ${JUNE_END})\n\n`;
md += `Zeitfenster MTD: **${JUNE_START} … ${JUNE_END}** (${dayNum} Tage). Vergleich: Mai (1.–${dayNum}.) und Juni 2025 (1.–${dayNum}.).\n\n`;
md += `## GA4 Traffic — Gesamt\n`;
md += `| Metrik | Juni '26 | vs Mai (MTD) | vs Juni '25 (YoY) |\n|---|--:|--:|--:|\n`;
for (const [lab, k] of [["Sitzungen", "sessions"], ["Nutzer", "users"], ["Conversions", "conv"]]) {
  const j = sum(june, k), m = sum(may, k), y = sum(jun25, k);
  md += `| ${lab} | **${j}** | ${arrow(pct(j, m))} ${fp(pct(j, m))} (${m}) | ${arrow(pct(j, y))} ${fp(pct(j, y))} (${y}) |\n`;
}
md += `\n## GA4 Traffic — nach Kanal (Juni MTD)\n| Kanal | Sitz. | Nutzer | Conv. | vs Mai | vs '25 |\n|---|--:|--:|--:|--:|--:|\n`;
for (const r of chRows) {
  md += `| ${r.channel} | ${r.j.sessions} | ${r.j.users} | ${r.j.conv} | ${arrow(pct(r.j.sessions, r.m.sessions))} ${fp(pct(r.j.sessions, r.m.sessions))} | ${arrow(pct(r.j.sessions, r.y.sessions))} ${fp(pct(r.j.sessions, r.y.sessions))} |\n`;
}
md += `\n## Google Ads — Microvista-Kampagnen (Juni MTD)\n`;
if (adsErr) md += `\n⚠️ Ads-Pull fehlgeschlagen: \`${adsErr}\`\n`;
else if (adsRows.length === 0) md += `\nKeine aktiven MV-/NDT-/ScanExpress-Kampagnen mit Spend im Zeitraum.\n`;
else {
  const T = adsRows.reduce((a, r) => ({ cost: a.cost + r.cost, clicks: a.clicks + r.clicks, imp: a.imp + r.imp, conv: a.conv + r.conv }), { cost: 0, clicks: 0, imp: 0, conv: 0 });
  md += `\nSumme: **${T.cost.toFixed(0)} €** · ${T.clicks} Klicks · ${T.imp} Impr · ${T.conv.toFixed(1)} Conv · CPC ${(T.cost / (T.clicks || 1)).toFixed(2)} €\n\n`;
  md += `| Kampagne | Status | Kosten | Klicks | Impr | Conv | CPC |\n|---|---|--:|--:|--:|--:|--:|\n`;
  for (const r of adsRows) md += `| ${r.name} | ${r.status} | ${r.cost.toFixed(0)} € | ${r.clicks} | ${r.imp} | ${r.conv.toFixed(1)} | ${(r.cost / (r.clicks || 1)).toFixed(2)} € |\n`;
}
writeFileSync(path.join(outDir, `microvista-june-2026.md`), md, "utf8");
console.log(md);
console.error(`\n✓ reports/microvista-june-2026.json + .md`);
