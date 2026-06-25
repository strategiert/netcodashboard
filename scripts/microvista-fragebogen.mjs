// Insights fuer https://www.microvista.de/fragebogen/ — GSC (Queries/Klicks/Position) + GA4 (Pageviews/Quellen/Engagement).
// Run: node scripts/microvista-fragebogen.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { JWT, GoogleAuth } from "google-auth-library";

const root = path.resolve(import.meta.dirname, "..");
for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const PAGE = "https://www.microvista.de/fragebogen/";
const PAGE_PATH = "/fragebogen/";
const PROPERTY_ID = "397812718";
const creds = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);

// Zeitraeume: letzte 90 Tage (aktuell) und davor 90 (Trend)
const day = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const TO = day(-3), FROM = day(-92);          // GSC hat ~3 Tage Lag
const PREV_TO = day(-93), PREV_FROM = day(-182);

// ---------- GSC ----------
async function gscToken() {
  const auth = new GoogleAuth({ credentials: creds, scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const c = await auth.getClient();
  return (await c.getAccessToken()).token;
}
async function gsc(token, body) {
  const prop = process.env.GSC_PROPERTY_MICROVISTA;
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(prop)}/searchAnalytics/query`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GSC ${res.status}: ${await res.text()}`);
  return (await res.json()).rows ?? [];
}
const pageFilter = { dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: PAGE }] }] };

let gscData = { err: null };
try {
  const t = await gscToken();
  const base = { startDate: FROM, endDate: TO, rowLimit: 1000, ...pageFilter };
  const [tot, queries, byDate, devices, countries] = await Promise.all([
    gsc(t, { ...base }),
    gsc(t, { ...base, dimensions: ["query"] }),
    gsc(t, { ...base, dimensions: ["date"] }),
    gsc(t, { ...base, dimensions: ["device"] }),
    gsc(t, { ...base, dimensions: ["country"] }),
  ]);
  const prevTot = await gsc(t, { startDate: PREV_FROM, endDate: PREV_TO, ...pageFilter });
  const norm = (r) => ({ clicks: r.clicks || 0, impressions: r.impressions || 0, ctr: (r.ctr || 0) * 100, position: r.position || 0 });
  gscData = {
    range: [FROM, TO], prevRange: [PREV_FROM, PREV_TO],
    total: tot[0] ? norm(tot[0]) : { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    prevTotal: prevTot[0] ? norm(prevTot[0]) : { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    queries: queries.map((r) => ({ q: r.keys[0], ...norm(r) })).sort((a, b) => b.impressions - a.impressions),
    devices: devices.map((r) => ({ d: r.keys[0], ...norm(r) })),
    countries: countries.map((r) => ({ c: r.keys[0], ...norm(r) })).sort((a, b) => b.clicks - a.clicks).slice(0, 6),
    byDate: byDate.map((r) => ({ date: r.keys[0], clicks: r.clicks || 0, impressions: r.impressions || 0 })),
  };
} catch (e) { gscData.err = e.message; }

// ---------- GA4 ----------
const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ["https://www.googleapis.com/auth/analytics.readonly"] });
async function ga4(body) {
  const { token } = await jwt.getAccessToken();
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GA4 ${res.status}: ${await res.text()}`);
  return JSON.parse(await res.text());
}
const ga4Filter = { filter: { fieldName: "pagePath", stringFilter: { matchType: "EXACT", value: PAGE_PATH } } };
const G_FROM = day(-90), G_TO = day(-1);
let ga4Data = { err: null };
try {
  const overview = await ga4({
    dateRanges: [{ startDate: G_FROM, endDate: G_TO }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }, { name: "sessions" }, { name: "userEngagementDuration" }, { name: "keyEvents" }],
    dimensionFilter: ga4Filter,
  });
  const sources = await ga4({
    dateRanges: [{ startDate: G_FROM, endDate: G_TO }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
    dimensionFilter: ga4Filter, orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
  });
  const refs = await ga4({
    dateRanges: [{ startDate: G_FROM, endDate: G_TO }],
    dimensions: [{ name: "sessionSource" }],
    metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
    dimensionFilter: ga4Filter, orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 10,
  });
  const ov = overview.rows?.[0];
  ga4Data = {
    range: [G_FROM, G_TO],
    views: ov ? +ov.metricValues[0].value : 0,
    users: ov ? +ov.metricValues[1].value : 0,
    sessions: ov ? +ov.metricValues[2].value : 0,
    engSec: ov ? +ov.metricValues[3].value : 0,
    keyEvents: ov ? +ov.metricValues[4].value : 0,
    channels: (sources.rows ?? []).map((r) => ({ ch: r.dimensionValues[0].value, views: +r.metricValues[0].value, users: +r.metricValues[1].value })),
    sources: (refs.rows ?? []).map((r) => ({ src: r.dimensionValues[0].value, views: +r.metricValues[0].value, users: +r.metricValues[1].value })),
  };
} catch (e) { ga4Data.err = e.message; }

const out = { page: PAGE, gsc: gscData, ga4: ga4Data };
const outDir = path.join(root, "reports"); mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "microvista-fragebogen.json"), JSON.stringify(out, null, 2), "utf8");

// ---------- Markdown ----------
const pc = (n, p) => (p === 0 ? (n === 0 ? "0%" : "n/a") : `${n - p >= 0 ? "+" : ""}${(((n - p) / p) * 100).toFixed(0)}%`);
let md = `# Insights — ${PAGE}\n\n`;
if (gscData.err) md += `⚠️ GSC: ${gscData.err}\n\n`;
else {
  const T = gscData.total, P = gscData.prevTotal;
  md += `## Google Search (GSC, ${gscData.range[0]} … ${gscData.range[1]})\n`;
  md += `| Metrik | Aktuell (90T) | Vorperiode | Δ |\n|---|--:|--:|--:|\n`;
  md += `| Klicks | ${T.clicks} | ${P.clicks} | ${pc(T.clicks, P.clicks)} |\n`;
  md += `| Impressionen | ${T.impressions} | ${P.impressions} | ${pc(T.impressions, P.impressions)} |\n`;
  md += `| CTR | ${T.ctr.toFixed(1)}% | ${P.ctr.toFixed(1)}% | — |\n`;
  md += `| Ø Position | ${T.position.toFixed(1)} | ${P.position.toFixed(1)} | — |\n\n`;
  md += `### Top-Suchanfragen (nach Impressionen)\n| Query | Klicks | Impr | CTR | Pos |\n|---|--:|--:|--:|--:|\n`;
  for (const q of gscData.queries.slice(0, 20)) md += `| ${q.q} | ${q.clicks} | ${q.impressions} | ${q.ctr.toFixed(1)}% | ${q.position.toFixed(1)} |\n`;
  md += `\n### Geräte\n| Device | Klicks | Impr | CTR |\n|---|--:|--:|--:|\n`;
  for (const d of gscData.devices) md += `| ${d.d} | ${d.clicks} | ${d.impressions} | ${d.ctr.toFixed(1)}% |\n`;
  md += `\n### Länder (Top)\n| Land | Klicks | Impr |\n|---|--:|--:|\n`;
  for (const c of gscData.countries) md += `| ${c.c} | ${c.clicks} | ${c.impressions} |\n`;
}
md += `\n`;
if (ga4Data.err) md += `⚠️ GA4: ${ga4Data.err}\n`;
else {
  md += `## GA4 Verhalten (${ga4Data.range[0]} … ${ga4Data.range[1]})\n`;
  md += `- Seitenaufrufe: **${ga4Data.views}** · Nutzer: **${ga4Data.users}** · Sitzungen: ${ga4Data.sessions}\n`;
  md += `- Ø Engagement-Zeit/Nutzer: **${ga4Data.users ? (ga4Data.engSec / ga4Data.users).toFixed(0) : 0} s** · keyEvents: ${ga4Data.keyEvents}\n\n`;
  md += `### Kanäle (Einstieg in Session)\n| Kanal | Aufrufe | Nutzer |\n|---|--:|--:|\n`;
  for (const c of ga4Data.channels) md += `| ${c.ch} | ${c.views} | ${c.users} |\n`;
  md += `\n### Quellen (Top)\n| Quelle | Aufrufe | Nutzer |\n|---|--:|--:|\n`;
  for (const s of ga4Data.sources) md += `| ${s.src} | ${s.views} | ${s.users} |\n`;
}
writeFileSync(path.join(outDir, "microvista-fragebogen.md"), md, "utf8");
console.log(md);
console.error("\n✓ reports/microvista-fragebogen.{json,md}");
