// Finaler atomarer Build: Fragebogen-Funnel-Tracking in GTM-NHC493T, ab sauberer Live-Basis v44.
// ASCII-Listener (Umlaute als \u). Wenig Calls + 429-Retry + 65s-Vorwartezeit (GTM-Quota 30/min).
import { readFileSync } from "node:fs"; import path from "node:path"; import { JWT } from "google-auth-library";
const root = "C:/Users/karent/Documents/Software/netco/_shared/dashboard";
for (const l of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]; }
const creds = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);
const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ["https://www.googleapis.com/auth/tagmanager.edit.containers", "https://www.googleapis.com/auth/tagmanager.edit.containerversions", "https://www.googleapis.com/auth/tagmanager.publish"] });
const { token } = await jwt.getAccessToken();
const C = "accounts/4702829806/containers/12950407";
const MID = "{{Konstant - G4 - G-DYXS8KNCLB}}";
const LISTENER = readFileSync("C:/Users/karent/AppData/Local/Temp/claude/C--Users-karent/f15b56b7-f0b5-475c-a761-dd28dcbf8c0d/scratchpad/listener.html", "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (method, url, body) => {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${url}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const t = await r.text();
    if (r.status === 429) { console.log("  429 -> warte 65s"); await sleep(65000); continue; }
    if (!r.ok) throw new Error(`${method} ${url} -> ${r.status}: ${t}`);
    return t ? JSON.parse(t) : {};
  } throw new Error("429 wiederholt erschöpft");
};

console.log("Vorwartezeit 65s (Quota)..."); await sleep(65000);
await api("POST", `${C}/versions/44:set_latest`); console.log("Basis = v44 (sauber)");
const ws = await api("POST", `${C}/workspaces`, { name: "Fragebogen-Tracking" }); const WS = ws.path; console.log("WS", ws.workspaceId);

const vars = {};
for (const [name, key] of [["dlv - fb_step", "fb_step"], ["dlv - fb_frage", "fb_frage"], ["dlv - fb_antwort", "fb_antwort"], ["dlv - fb_score", "fb_score"], ["dlv - fb_ampel", "fb_ampel"], ["dlv - fb_ergebnis", "fb_ergebnis"], ["dlv - fb_lead_typ", "fb_lead_typ"], ["dlv - fb_letzter_schritt", "fb_letzter_schritt"]]) {
  await api("POST", `${WS}/variables`, { name, type: "v", parameter: [{ type: "integer", key: "dataLayerVersion", value: "2" }, { type: "boolean", key: "setDefaultValue", value: "false" }, { type: "template", key: "name", value: key }] }); vars[key] = name;
}
console.log("vars 8");
const T = {};
for (const [name, ev] of [["CE - fragebogen_start", "fragebogen_start"], ["CE - fragebogen_schritt", "fragebogen_schritt"], ["CE - fragebogen_ergebnis", "fragebogen_ergebnis"], ["CE - fragebogen_lead", "fragebogen_lead"], ["CE - fragebogen_abbruch", "fragebogen_abbruch"]]) {
  const tr = await api("POST", `${WS}/triggers`, { name, type: "customEvent", customEventFilter: [{ type: "equals", parameter: [{ type: "template", key: "arg0", value: "{{_event}}" }, { type: "template", key: "arg1", value: ev }] }] }); T[ev] = tr.triggerId;
}
// DOM Ready ohne Filter (feuert überall); Listener self-guarded sich via #mvQuizIntro-Check. Vermeidet {{Page Path}}-Built-in-Abhängigkeit.
const pv = await api("POST", `${WS}/triggers`, { name: "DOM Ready - alle Seiten (Fragebogen-Listener)", type: "domReady" });
console.log("triggers 6", T, "dom", pv.triggerId);
await api("POST", `${WS}/tags`, { name: "HTML - Fragebogen Funnel Listener", type: "html", parameter: [{ type: "template", key: "html", value: LISTENER }, { type: "boolean", key: "supportDocumentWrite", value: "false" }], firingTriggerId: [pv.triggerId], tagFiringOption: "oncePerLoad" });
console.log("listener tag ok");
const row = (p, v) => ({ type: "map", map: [{ type: "template", key: "parameter", value: p }, { type: "template", key: "parameterValue", value: v }] });
const V = (k) => `{{${vars[k]}}}`;
const ga4 = (name, ev, trig, rows) => api("POST", `${WS}/tags`, { name, type: "gaawe", parameter: [{ type: "boolean", key: "sendEcommerceData", value: "false" }, { type: "boolean", key: "enhancedUserId", value: "false" }, ...(rows.length ? [{ type: "list", key: "eventSettingsTable", list: rows }] : []), { type: "template", key: "eventName", value: ev }, { type: "template", key: "measurementIdOverride", value: MID }], firingTriggerId: [trig], tagFiringOption: "oncePerEvent" });
for (const [name, ev, trig, rows] of [
  ["GA4 - fragebogen_start", "fragebogen_start", T["fragebogen_start"], []],
  ["GA4 - fragebogen_schritt", "fragebogen_schritt", T["fragebogen_schritt"], [row("fb_step", V("fb_step")), row("fb_frage", V("fb_frage")), row("fb_antwort", V("fb_antwort")), row("fb_score", V("fb_score"))]],
  ["GA4 - fragebogen_ergebnis", "fragebogen_ergebnis", T["fragebogen_ergebnis"], [row("fb_ampel", V("fb_ampel")), row("fb_ergebnis", V("fb_ergebnis"))]],
  ["GA4 - fragebogen_lead", "fragebogen_lead", T["fragebogen_lead"], [row("fb_lead_typ", V("fb_lead_typ"))]],
  ["GA4 - fragebogen_abbruch", "fragebogen_abbruch", T["fragebogen_abbruch"], [row("fb_letzter_schritt", V("fb_letzter_schritt"))]],
]) { await ga4(name, ev, trig, rows); }
console.log("ga4 tags 5");

const cv = await api("POST", `${WS}:create_version`, { name: "Fragebogen-Funnel-Tracking", notes: "fragebogen_start/schritt/ergebnis/lead/abbruch + Listener + GA4-Tags" });
console.log("compilerError:", cv.compilerError, "versionId:", cv.containerVersion?.containerVersionId);
if (cv.compilerError) { console.log("NICHT veröffentlicht. WS", ws.workspaceId); process.exit(1); }
const pub = await api("POST", `${cv.containerVersion.path}:publish`);
console.log("PUBLISHED live version:", pub.containerVersion?.containerVersionId);
