// Microvista Traffic-Report — automatischer GA4-Pull (kein manueller Export).
// Holt "gestern" vs. "vorgestern" nach Kanalgruppe und schreibt JSON + Markdown.
// Nutzt denselben Service-Account wie die übrigen Dashboard-Scripts (GSC_SERVICE_ACCOUNT_JSON).
//
// Aufruf:  node scripts/microvista-traffic-report.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { JWT } from "google-auth-library";

// --- .env.local laden (gleiches Muster wie ga4-microvista-devices.mjs) ---
const root = path.resolve(import.meta.dirname, "..");
for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}
const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
if (!raw) { console.error("GSC_SERVICE_ACCOUNT_JSON fehlt"); process.exit(1); }
const creds = JSON.parse(raw);

const PROPERTY_ID = "397812718"; // Microvista GmbH (GA4)
const jwt = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
});

const fmt = (d) => d.toISOString().slice(0, 10);
const dayOffset = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return fmt(d); };
const reportDay = dayOffset(-1);   // gestern (letzter vollständiger Tag)
const compareDay = dayOffset(-2);  // vorgestern

async function runReport(date) {
  const { token } = await jwt.getAccessToken();
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: date, endDate: date }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "keyEvents" }],
      }),
    },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`);
  const json = JSON.parse(text);
  const map = {};
  for (const r of json.rows ?? []) {
    map[r.dimensionValues[0].value] = {
      sessions: Number(r.metricValues[0].value),
      users: Number(r.metricValues[1].value),
      conversions: Number(r.metricValues[2].value),
    };
  }
  return map;
}

const pct = (now, then) => (then === 0 ? (now === 0 ? 0 : null) : ((now - then) / then) * 100);
const sumKey = (m, k) => Object.values(m).reduce((a, r) => a + r[k], 0);

const today = await runReport(reportDay);
const prev = await runReport(compareDay);

const channels = [...new Set([...Object.keys(today), ...Object.keys(prev)])];
const rows = channels.map((c) => {
  const n = today[c] ?? { sessions: 0, users: 0, conversions: 0 };
  const p = prev[c] ?? { sessions: 0, users: 0, conversions: 0 };
  return {
    channel: c,
    sessions: n.sessions, sessions_prev: p.sessions, sessions_pct: pct(n.sessions, p.sessions),
    users: n.users, users_prev: p.users,
    conversions: n.conversions, conversions_prev: p.conversions, conversions_pct: pct(n.conversions, p.conversions),
  };
}).sort((a, b) => b.sessions - a.sessions);

const totals = {
  sessions: sumKey(today, "sessions"), sessions_prev: sumKey(prev, "sessions"),
  users: sumKey(today, "users"), users_prev: sumKey(prev, "users"),
  conversions: sumKey(today, "conversions"), conversions_prev: sumKey(prev, "conversions"),
};
totals.sessions_pct = pct(totals.sessions, totals.sessions_prev);
totals.users_pct = pct(totals.users, totals.users_prev);
totals.conversions_pct = pct(totals.conversions, totals.conversions_prev);

const out = { property: PROPERTY_ID, reportDay, compareDay, totals, channels: rows };

const outDir = path.join(root, "reports");
mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, `microvista-traffic-${reportDay}.json`);
writeFileSync(jsonPath, JSON.stringify(out, null, 2), "utf8");

// Kompakte Markdown-Tabelle (deterministisch; Narrativ macht der Agent)
const arrow = (p) => (p === null ? "—" : p >= 0 ? "▲" : "▼");
const fp = (p) => (p === null ? "n/a" : `${p >= 0 ? "+" : ""}${p.toFixed(1)} %`);
let md = `# Microvista Traffic — ${reportDay} (Vergleich: ${compareDay})\n\n`;
md += `## Überblick\n`;
md += `- Sitzungen: **${totals.sessions}** (${arrow(totals.sessions_pct)} ${fp(totals.sessions_pct)})\n`;
md += `- Nutzer: **${totals.users}** (${arrow(totals.users_pct)} ${fp(totals.users_pct)})\n`;
md += `- Conversions: **${totals.conversions}** (${arrow(totals.conversions_pct)} ${fp(totals.conversions_pct)})\n\n`;
md += `## Kanäle\n| Kanal | Sitzungen | Δ | Nutzer | Conv. | Δ Conv. |\n|---|---|---|---|---|---|\n`;
for (const r of rows) {
  md += `| ${r.channel} | ${r.sessions} | ${arrow(r.sessions_pct)} ${fp(r.sessions_pct)} | ${r.users} | ${r.conversions} | ${arrow(r.conversions_pct)} ${fp(r.conversions_pct)} |\n`;
}
const mdPath = path.join(outDir, `microvista-traffic-${reportDay}.md`);
writeFileSync(mdPath, md, "utf8");

console.log(JSON.stringify(out, null, 2));
console.error(`\n✓ geschrieben: ${jsonPath}\n✓ geschrieben: ${mdPath}`);
