// Microvista Wochenvergleich: diese Woche (Mo..gestern) vs letzte Woche (voll) vs letzte Woche gleiche Tage.
// GA4 (Kanäle + Fragebogen-Funnel) + Google Ads (MV-/NDT-/ScanExpress) + GSC (mit Lag, verschobene Fenster).
// Run: node scripts/microvista-weekly-vergleich.mjs
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

// ---- Zeitfenster ----
const fmt = (d) => d.toISOString().slice(0, 10);
const today = new Date(); today.setUTCHours(0, 0, 0, 0);
const yest = new Date(today); yest.setUTCDate(yest.getUTCDate() - 1);
// Montag dieser Woche (UTC, Mo=1)
const dow = today.getUTCDay() === 0 ? 7 : today.getUTCDay();
const thisMon = new Date(today); thisMon.setUTCDate(thisMon.getUTCDate() - (dow - 1));
const lastMon = new Date(thisMon); lastMon.setUTCDate(lastMon.getUTCDate() - 7);
const lastSun = new Date(thisMon); lastSun.setUTCDate(lastSun.getUTCDate() - 1);
// gleiche Tage der Vorwoche (Mo .. gestern-7)
const lastSame = new Date(yest); lastSame.setUTCDate(lastSame.getUTCDate() - 7);

const W_CUR = { start: fmt(thisMon), end: fmt(yest) };                 // diese Woche bis gestern
const W_PREV = { start: fmt(lastMon), end: fmt(lastSun) };             // letzte Woche voll
const W_PREV_SAME = { start: fmt(lastMon), end: fmt(lastSame) };       // letzte Woche, gleiche Tage

// ---- GA4 ----
const jwtGa = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ["https://www.googleapis.com/auth/analytics.readonly"] });
async function ga4(body) {
  const { token } = await jwtGa.getAccessToken();
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GA4 ${res.status}: ${text}`);
  return JSON.parse(text);
}
async function channels(w) {
  const rep = await ga4({ dateRanges: [{ startDate: w.start, endDate: w.end }], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "keyEvents" }] });
  const map = {};
  for (const r of rep.rows ?? []) map[r.dimensionValues[0].value] = { sessions: +r.metricValues[0].value, users: +r.metricValues[1].value, conv: +r.metricValues[2].value };
  return map;
}
async function fragebogen(w) {
  const rep = await ga4({
    dateRanges: [{ startDate: w.start, endDate: w.end }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { matchType: "BEGINS_WITH", value: "fragebogen_" } } },
  });
  const map = {};
  for (const r of rep.rows ?? []) map[r.dimensionValues[0].value] = +r.metricValues[0].value;
  return map;
}
async function leadTypen(w) {
  try {
    const rep = await ga4({
      dateRanges: [{ startDate: w.start, endDate: w.end }],
      dimensions: [{ name: "customEvent:fb_lead_typ" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "fragebogen_lead" } } },
    });
    const map = {};
    for (const r of rep.rows ?? []) map[r.dimensionValues[0].value] = +r.metricValues[0].value;
    return map;
  } catch (e) { return { err: e.message.slice(0, 200) }; }
}

const [chCur, chPrev, chPrevSame] = [await channels(W_CUR), await channels(W_PREV), await channels(W_PREV_SAME)];
const [fbCur, fbPrev, fbPrevSame] = [await fragebogen(W_CUR), await fragebogen(W_PREV), await fragebogen(W_PREV_SAME)];
const [ltCur, ltPrev] = [await leadTypen(W_CUR), await leadTypen(W_PREV)];

// ---- Google Ads ----
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
async function adsWindow(token, w) {
  const rows = await gads(token, `
    SELECT campaign.name, campaign.status, metrics.cost_micros, metrics.clicks, metrics.impressions,
           metrics.conversions, metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${w.start}' AND '${w.end}'`);
  const map = {};
  for (const r of rows) {
    const n = r.campaign.name;
    if (!/^(MV-|NDT-|ScanExpress)/i.test(n)) continue;
    map[n] ??= { name: n, status: r.campaign.status, cost: 0, clicks: 0, imp: 0, conv: 0, val: 0 };
    map[n].cost += eur(r.metrics?.costMicros); map[n].clicks += +(r.metrics?.clicks ?? 0);
    map[n].imp += +(r.metrics?.impressions ?? 0); map[n].conv += +(r.metrics?.conversions ?? 0);
    map[n].val += +(r.metrics?.conversionsValue ?? 0);
  }
  return Object.values(map).sort((a, b) => b.cost - a.cost);
}
let adsCur = [], adsPrev = [], adsPrevSame = [], adsErr = null;
try {
  const t = await gadsToken();
  [adsCur, adsPrev, adsPrevSame] = [await adsWindow(t, W_CUR), await adsWindow(t, W_PREV), await adsWindow(t, W_PREV_SAME)];
} catch (e) { adsErr = e.message; }

// ---- GSC (Lag ~3 Tage → verschobene Wochenfenster: letzte volle Woche vs Vorwoche) ----
const gscTo = new Date(today); gscTo.setUTCDate(gscTo.getUTCDate() - 3);
async function gscToken() {
  const jwtGsc = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  return (await jwtGsc.getAccessToken()).token;
}
async function gsc(token, body) {
  const prop = process.env.GSC_PROPERTY_MICROVISTA;
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(prop)}/searchAnalytics/query`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GSC ${res.status}: ${await res.text()}`);
  return (await res.json()).rows ?? [];
}
const G_CUR = { start: W_PREV.start, end: fmt(gscTo) };                 // letzte Woche Mo .. Datenstand
const gPrevMon = new Date(lastMon); gPrevMon.setUTCDate(gPrevMon.getUTCDate() - 7);
const gPrevSun = new Date(lastMon); gPrevSun.setUTCDate(gPrevSun.getUTCDate() - 1);
const G_PREV = { start: fmt(gPrevMon), end: fmt(gPrevSun) };            // Woche davor voll
let gscData = { err: null };
try {
  const t = await gscToken();
  const tot = async (w) => {
    const rows = await gsc(t, { startDate: w.start, endDate: w.end });
    return rows[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  };
  const queries = await gsc(t, { startDate: G_CUR.start, endDate: G_CUR.end, dimensions: ["query"], rowLimit: 10 });
  gscData = { cur: await tot(G_CUR), prev: await tot(G_PREV), topQueries: queries, windows: { cur: G_CUR, prev: G_PREV } };
} catch (e) { gscData = { err: e.message }; }

// ---- Output ----
const sum = (m, k) => Object.values(m).reduce((a, r) => a + (r[k] ?? 0), 0);
const pct = (n, p) => (p === 0 ? null : ((n - p) / p) * 100);
const fp = (p) => (p === null ? "n/a" : `${p >= 0 ? "+" : ""}${p.toFixed(0)}%`);
const arrow = (p) => (p === null ? "—" : p >= 0 ? "▲" : "▼");
const adsTot = (rows) => rows.reduce((a, r) => ({ cost: a.cost + r.cost, clicks: a.clicks + r.clicks, imp: a.imp + r.imp, conv: a.conv + r.conv }), { cost: 0, clicks: 0, imp: 0, conv: 0 });

const out = { windows: { cur: W_CUR, prev: W_PREV, prevSame: W_PREV_SAME }, ga4: { chCur, chPrev, chPrevSame }, fragebogen: { cur: fbCur, prev: fbPrev, prevSame: fbPrevSame, leadTypCur: ltCur, leadTypPrev: ltPrev }, ads: { cur: adsCur, prev: adsPrev, prevSame: adsPrevSame, err: adsErr }, gsc: gscData };
const outDir = path.join(root, "reports"); mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, `microvista-weekly-${W_CUR.end}.json`), JSON.stringify(out, null, 2), "utf8");

let md = `# Microvista Wochenvergleich (Stand ${W_CUR.end})\n\n`;
md += `Diese Woche: **${W_CUR.start} … ${W_CUR.end}** · Letzte Woche voll: ${W_PREV.start} … ${W_PREV.end} · Vergleich gleiche Tage: ${W_PREV_SAME.start} … ${W_PREV_SAME.end}\n\n`;
md += `## GA4 Traffic gesamt\n| Metrik | Diese Woche | Letzte Wo (gleiche Tage) | Δ | Letzte Wo (voll) |\n|---|--:|--:|--:|--:|\n`;
for (const [lab, k] of [["Sitzungen", "sessions"], ["Nutzer", "users"], ["Key Events", "conv"]]) {
  const c = sum(chCur, k), s = sum(chPrevSame, k), p = sum(chPrev, k);
  md += `| ${lab} | **${c}** | ${s} | ${arrow(pct(c, s))} ${fp(pct(c, s))} | ${p} |\n`;
}
const allCh = [...new Set([...Object.keys(chCur), ...Object.keys(chPrev)])].sort((a, b) => (chCur[b]?.sessions ?? 0) - (chCur[a]?.sessions ?? 0));
md += `\n## GA4 nach Kanal (Sitzungen)\n| Kanal | Diese Wo | Letzte Wo gleiche Tage | Letzte Wo voll |\n|---|--:|--:|--:|\n`;
for (const c of allCh) md += `| ${c} | ${chCur[c]?.sessions ?? 0} | ${chPrevSame[c]?.sessions ?? 0} | ${chPrev[c]?.sessions ?? 0} |\n`;

md += `\n## Fragebogen-Funnel (Event-Counts)\n| Event | Diese Wo | Letzte Wo gleiche Tage | Letzte Wo voll |\n|---|--:|--:|--:|\n`;
const fbEvents = [...new Set([...Object.keys(fbCur), ...Object.keys(fbPrev), ...Object.keys(fbPrevSame)])].sort();
for (const e of fbEvents) md += `| ${e} | ${fbCur[e] ?? 0} | ${fbPrevSame[e] ?? 0} | ${fbPrev[e] ?? 0} |\n`;
if (fbEvents.length === 0) md += `| _keine fragebogen_-Events im Zeitraum_ | | | |\n`;
md += `\nLead-Typen diese Wo: ${JSON.stringify(ltCur)} · letzte Wo voll: ${JSON.stringify(ltPrev)}\n`;

md += `\n## Google Ads — MV/NDT/ScanExpress\n`;
if (adsErr) md += `⚠️ Ads-Pull fehlgeschlagen: \`${adsErr}\`\n`;
else {
  const tc = adsTot(adsCur), ts = adsTot(adsPrevSame), tp = adsTot(adsPrev);
  md += `| | Kosten | Klicks | Impr | Conv | CPC |\n|---|--:|--:|--:|--:|--:|\n`;
  const line = (lab, T) => `| ${lab} | ${T.cost.toFixed(0)} € | ${T.clicks} | ${T.imp} | ${T.conv.toFixed(1)} | ${(T.cost / (T.clicks || 1)).toFixed(2)} € |\n`;
  md += line(`Diese Wo (${W_CUR.start}…${W_CUR.end})`, tc) + line("Letzte Wo gleiche Tage", ts) + line("Letzte Wo voll", tp);
  md += `\n### Kampagnen diese Woche\n| Kampagne | Status | Kosten | Klicks | Impr | Conv |\n|---|---|--:|--:|--:|--:|\n`;
  for (const r of adsCur) md += `| ${r.name} | ${r.status} | ${r.cost.toFixed(0)} € | ${r.clicks} | ${r.imp} | ${r.conv.toFixed(1)} |\n`;
  md += `\n### Kampagnen letzte Woche (voll)\n| Kampagne | Status | Kosten | Klicks | Impr | Conv |\n|---|---|--:|--:|--:|--:|\n`;
  for (const r of adsPrev) md += `| ${r.name} | ${r.status} | ${r.cost.toFixed(0)} € | ${r.clicks} | ${r.imp} | ${r.conv.toFixed(1)} |\n`;
}

md += `\n## GSC organisch (Lag ~3 Tage — Fenster verschoben)\n`;
if (gscData.err) md += `⚠️ GSC-Pull fehlgeschlagen: \`${gscData.err}\`\n`;
else {
  md += `| Fenster | Klicks | Impr | CTR | Ø Pos |\n|---|--:|--:|--:|--:|\n`;
  md += `| ${gscData.windows.cur.start}…${gscData.windows.cur.end} | ${gscData.cur.clicks} | ${gscData.cur.impressions} | ${(gscData.cur.ctr * 100).toFixed(1)}% | ${gscData.cur.position.toFixed(1)} |\n`;
  md += `| ${gscData.windows.prev.start}…${gscData.windows.prev.end} | ${gscData.prev.clicks} | ${gscData.prev.impressions} | ${(gscData.prev.ctr * 100).toFixed(1)}% | ${gscData.prev.position.toFixed(1)} |\n`;
  md += `\nTop-Queries (aktuelles Fenster):\n`;
  for (const q of gscData.topQueries ?? []) md += `- „${q.keys[0]}" — ${q.clicks} Klicks / ${q.impressions} Impr / Pos ${q.position.toFixed(1)}\n`;
}

writeFileSync(path.join(outDir, `microvista-weekly-${W_CUR.end}.md`), md, "utf8");
console.log(md);
console.error(`\n✓ reports/microvista-weekly-${W_CUR.end}.json + .md`);
