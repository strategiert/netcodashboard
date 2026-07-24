// Sendet forecast/data/output.json (siehe run.py) in Chunks an POST /forecast/ingest
// (Convex HTTP Action, convex/forecast.ts). HMAC-Transportsicherung analog
// convex/datalakeHmac.ts: Basisstring `${ts}.${nonce}.${body}`, HMAC-SHA-256, hex,
// Header x-datalake-ts/x-datalake-nonce/x-datalake-sig.
// Pfade sind relativ zum Skript-Verzeichnis aufgelöst (nicht zum CWD).
// Aufruf (siehe forecast-night.ps1, CWD=Repo-Root): node --env-file=.env.local forecast\push.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomUUID, createHmac } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = process.env.FORECAST_SITE_URL || "https://grandiose-cricket-4.convex.site";
const CHUNK_SIZE = 400;
const OUT_FILE = join(__dirname, "data", "output.json");
const ENV_LOCAL = join(__dirname, "..", ".env.local");

// FORECAST_INGEST_SECRET kommt normalerweise über `node --env-file=.env.local`
// aus der Prozess-Env. Fallback: selbst aus ../.env.local parsen (falls das Skript
// ohne --env-file aufgerufen wird, z. B. manuell aus forecast/ heraus).
function loadSecret() {
  if (process.env.FORECAST_INGEST_SECRET) return process.env.FORECAST_INGEST_SECRET;
  if (!existsSync(ENV_LOCAL)) return undefined;
  const text = readFileSync(ENV_LOCAL, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const m = line.match(/^FORECAST_INGEST_SECRET=(.*)$/);
    if (m) return m[1].trim();
  }
  return undefined;
}

function signIngest(secret, ts, nonce, body) {
  return createHmac("sha256", secret).update(`${ts}.${nonce}.${body}`).digest("hex");
}

async function postChunk(secret, payload) {
  const body = JSON.stringify(payload);
  const ts = String(Date.now());
  const nonce = randomUUID();
  const sig = signIngest(secret, ts, nonce, body);
  const res = await fetch(`${SITE_URL}/forecast/ingest`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-datalake-ts": ts,
      "x-datalake-nonce": nonce,
      "x-datalake-sig": sig,
    },
    body,
  });
  const text = await res.text();
  return { status: res.status, ok: res.ok, text };
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const secret = loadSecret();
  if (!secret) {
    console.error("FEHLER: FORECAST_INGEST_SECRET nicht gefunden (weder Prozess-Env noch ../.env.local).");
    process.exit(1);
  }
  if (!existsSync(OUT_FILE)) {
    console.error(`FEHLER: ${OUT_FILE} nicht gefunden. Erst run.py laufen lassen.`);
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(OUT_FILE, "utf8"));
  const generation = data.generation;
  const rows = data.rows ?? [];
  const anomalies = data.anomalies ?? [];
  if (typeof generation !== "number" || !Number.isFinite(generation)) {
    console.error(`FEHLER: ungültige generation in ${OUT_FILE}: ${generation}`);
    process.exit(1);
  }

  console.log(`Push nach ${SITE_URL}/forecast/ingest — generation=${generation}, ${rows.length} rows, ${anomalies.length} anomalies.`);

  // rows und anomalies unabhängig voneinander in Chunks à max CHUNK_SIZE Zeilen
  // aufteilen, pro HTTP-Request aber gemeinsam schicken (Chunk i von rows +
  // Chunk i von anomalies), damit die Zahl der Requests klein bleibt.
  // done=true NUR im letzten Request — bei einem HTTP-Fehler unterwegs bricht
  // das Skript vorher mit Exit 1 ab (alte Generation bleibt aktiv, gewollt).
  const rowChunks = chunkArray(rows, CHUNK_SIZE);
  const anomalyChunks = chunkArray(anomalies, CHUNK_SIZE);
  const totalChunks = Math.max(rowChunks.length, anomalyChunks.length, 1);

  for (let i = 0; i < totalChunks; i++) {
    const isLast = i === totalChunks - 1;
    const payload = {
      generation,
      rows: rowChunks[i] ?? [],
      anomalies: anomalyChunks[i] ?? [],
      done: isLast,
    };
    console.log(`→ Chunk ${i + 1}/${totalChunks}: ${payload.rows.length} rows, ${payload.anomalies.length} anomalies, done=${isLast} …`);
    const result = await postChunk(secret, payload);
    if (!result.ok) {
      console.error(`FEHLER: HTTP ${result.status} — ${result.text}`);
      console.error("Abbruch ohne done=true — alte Generation bleibt aktiv (gewollt).");
      process.exit(1);
    }
    console.log(`  OK (${result.status}): ${result.text}`);
  }

  console.log(`Fertig: ${totalChunks} Chunk(s) gesendet, generation=${generation}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
