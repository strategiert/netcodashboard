// GA4-Admin: keyEvent fragebogen_lead + Custom Dimensions (event-scoped) fuer fb_* Params.
// Run: node scripts/microvista-fragebogen-ga4-setup.mjs
import { readFileSync } from "node:fs"; import path from "node:path"; import { JWT } from "google-auth-library";
const root = "C:/Users/karent/Documents/Software/netco/_shared/dashboard";
for (const l of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]; }
const creds = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);
const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ["https://www.googleapis.com/auth/analytics.edit"] });
const { token } = await jwt.getAccessToken();
const PID = "properties/397812718";
const api = async (method, url, body) => {
  const r = await fetch(`https://analyticsadmin.googleapis.com/v1beta/${url}`, {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); return { ok: r.ok, status: r.status, body: t };
};

// --- keyEvent fragebogen_lead ---
const existing = await api("GET", `${PID}/keyEvents`);
const have = (JSON.parse(existing.body).keyEvents || []).some(k => k.eventName === "fragebogen_lead");
if (have) console.log("keyEvent fragebogen_lead: existiert bereits");
else {
  const r = await api("POST", `${PID}/keyEvents`, { eventName: "fragebogen_lead", countingMethod: "ONCE_PER_SESSION" });
  console.log("keyEvent fragebogen_lead:", r.ok ? "angelegt" : `FEHLER ${r.status}: ${r.body}`);
}

// --- Custom Dimensions (event-scoped) ---
const existedCD = JSON.parse((await api("GET", `${PID}/customDimensions`)).body).customDimensions || [];
const haveCD = new Set(existedCD.map(d => d.parameterName));
const dims = [
  ["fb_step", "Fragebogen Schritt"], ["fb_frage", "Fragebogen Frage"], ["fb_antwort", "Fragebogen Antwort"],
  ["fb_score", "Fragebogen Score"], ["fb_ampel", "Fragebogen Ampel"], ["fb_ergebnis", "Fragebogen Ergebnis"],
  ["fb_lead_typ", "Fragebogen Lead Typ"], ["fb_letzter_schritt", "Fragebogen letzter Schritt"],
];
for (const [param, disp] of dims) {
  if (haveCD.has(param)) { console.log(`CD ${param}: existiert`); continue; }
  const r = await api("POST", `${PID}/customDimensions`, { parameterName: param, displayName: disp, scope: "EVENT" });
  console.log(`CD ${param}:`, r.ok ? "angelegt" : `FEHLER ${r.status}: ${r.body.slice(0, 200)}`);
}
console.log("\nGA4-Setup fertig.");
