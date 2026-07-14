/**
 * Pure Helpers für die Datalake-Paket-B-Kosten-Connectoren
 * (Plan: docs/superpowers/plans/2026-07-14-datalake-paket-b-kosten.md).
 * Bewusst ohne Convex-Imports — direkt unit-testbar.
 */

export interface DateWindow {
  start: string;
  end: string;
  dates: string[];
}

function toIsoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Fenster von `days` Tagen, Ende = gestern (UTC) − offsetDays.
 * offsetDays erlaubt gestückelte Backfills ohne Überlappung.
 */
export function dateWindow(days: number, nowMs: number, offsetDays = 0): DateWindow {
  const todayUtc = Date.UTC(
    new Date(nowMs).getUTCFullYear(),
    new Date(nowMs).getUTCMonth(),
    new Date(nowMs).getUTCDate(),
  );
  const endMs = todayUtc - (1 + offsetDays) * DAY_MS;
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) dates.push(toIsoDay(endMs - i * DAY_MS));
  return { start: dates[0], end: dates[dates.length - 1], dates };
}

export interface MsRow {
  TimePeriod: string;
  CampaignId: string;
  CampaignName: string;
  AdGroupId: string;
  AdId: string;
  Impressions: number;
  Clicks: number;
  Spend: number;
  CurrencyCode: string;
}

const MS_COLUMNS = [
  "TimePeriod", "CampaignId", "CampaignName", "AdGroupId", "AdId",
  "Impressions", "Clicks", "Spend", "CurrencyCode",
] as const;

/** Eine CSV-Zeile nach RFC 4180 in Felder zerlegen (quoted Kommas, ""-Escapes). */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { out.push(field); field = ""; }
    else field += ch;
  }
  out.push(field);
  return out;
}

function toNumber(s: string): number {
  // MS liefert Zahlen teils mit ,-Tausendertrennung ("1,234").
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * MS-Ads-Report-CSV → Datenzeilen. Sucht die Header-Zeile (Report-Vorspann davor),
 * überspringt Fußzeilen (@Rows/©) und leere Zeilen. Leerer Report → [].
 */
export function parseMsAdsCsv(csv: string): MsRow[] {
  const lines = csv.replace(/^﻿/, "").split(/\r?\n/);
  const headerIdx = lines.findIndex((l) => {
    const cells = splitCsvLine(l);
    return cells.includes("TimePeriod") && cells.includes("CampaignId");
  });
  if (headerIdx < 0) return [];
  const header = splitCsvLine(lines[headerIdx]);
  const col = Object.fromEntries(MS_COLUMNS.map((c) => [c, header.indexOf(c)]));

  const rows: MsRow[] = [];
  for (const line of lines.slice(headerIdx + 1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Fußzeilen: "@Rows: n", "©… Microsoft …" — auch quoted.
    const stripped = trimmed.replace(/^"/, "");
    if (stripped.startsWith("@") || stripped.startsWith("©")) continue;
    const cells = splitCsvLine(line);
    if (cells.length < header.length) continue;
    rows.push({
      TimePeriod: cells[col.TimePeriod] ?? "",
      CampaignId: cells[col.CampaignId] ?? "",
      CampaignName: cells[col.CampaignName] ?? "",
      AdGroupId: cells[col.AdGroupId] ?? "",
      AdId: cells[col.AdId] ?? "",
      Impressions: toNumber(cells[col.Impressions] ?? "0"),
      Clicks: toNumber(cells[col.Clicks] ?? "0"),
      Spend: toNumber(cells[col.Spend] ?? "0"),
      CurrencyCode: cells[col.CurrencyCode] ?? "",
    });
  }
  return rows;
}

/** Google-micros → EUR, bewusst OHNE Rundung (Summen müssen Plattformtotalen entsprechen). */
export function microsToEur(micros: number): number {
  return micros / 1_000_000;
}

export interface RetryOpts {
  maxAttempts?: number;
  baseDelayMs?: number;
  fetchImpl?: typeof fetch;
}

/** Meta packt Rate-Limits in 400er-Bodies: code 17 (user request limit) / 80004 (ads insights throttle). */
function isMetaRateLimitBody(body: string): boolean {
  try {
    const code = JSON.parse(body)?.error?.code;
    return code === 17 || code === 80004;
  } catch {
    return false;
  }
}

/**
 * fetch mit Retry für 429/5xx und Meta-Rate-Limit-Bodies. Respektiert Retry-After,
 * sonst exponentielles Backoff mit Jitter. Nach maxAttempts: throw (Cron soll rot werden).
 * Nicht-retrybare Fehler (gewöhnliche 4xx) werden als Response durchgereicht —
 * der Aufrufer entscheidet, wie er sie behandelt.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts: RetryOpts = {},
): Promise<Response> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 2000;
  const doFetch = opts.fetchImpl ?? fetch;

  let lastStatus = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await doFetch(url, init);
    lastStatus = res.status;

    let retryable = res.status === 429 || res.status >= 500;
    if (!retryable && res.status === 400) {
      const body = await res.clone().text();
      retryable = isMetaRateLimitBody(body);
    }
    if (!retryable || attempt === maxAttempts) {
      if (retryable) break; // letzter Versuch war retrybar-fehlerhaft → throw unten
      return res;
    }

    const retryAfter = Number(res.headers.get("Retry-After"));
    const delay = Number.isFinite(retryAfter) && retryAfter >= 0
      ? retryAfter * 1000
      : baseDelayMs * 2 ** (attempt - 1) * (1 + Math.random() * 0.25);
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error(`fetchWithRetry: ${url} nach ${maxAttempts} Versuchen fehlgeschlagen (zuletzt HTTP ${lastStatus})`);
}
