import { describe, it, expect, vi, afterEach } from "vitest";
import { dateWindow, parseMsAdsCsv, microsToEur, fetchWithRetry, redactUrl } from "./adcosts-helpers";

// 2026-07-14T02:00:00Z als fixes "jetzt" für deterministische Fenster.
const NOW = Date.UTC(2026, 6, 14, 2, 0, 0);

describe("dateWindow", () => {
  it("liefert ein Fenster von N Tagen, Ende gestern (UTC)", () => {
    const w = dateWindow(35, NOW);
    expect(w.end).toBe("2026-07-13");
    expect(w.start).toBe("2026-06-09");
    expect(w.dates).toHaveLength(35);
    expect(w.dates[0]).toBe("2026-06-09");
    expect(w.dates[34]).toBe("2026-07-13");
  });

  it("respektiert offsetDays für gestückelten Backfill", () => {
    const w = dateWindow(30, NOW, 30);
    expect(w.end).toBe("2026-06-13"); // gestern − 30
    expect(w.start).toBe("2026-05-15");
    expect(w.dates).toHaveLength(30);
  });

  it("UTC-Kante: kurz nach Mitternacht UTC zählt der neue Tag", () => {
    const justAfterMidnight = Date.UTC(2026, 6, 14, 0, 0, 1);
    expect(dateWindow(1, justAfterMidnight).end).toBe("2026-07-13");
    const justBeforeMidnight = Date.UTC(2026, 6, 13, 23, 59, 59);
    expect(dateWindow(1, justBeforeMidnight).end).toBe("2026-07-12");
  });

  it("wirft bei ungültigen days/offset", () => {
    expect(() => dateWindow(0, NOW)).toThrow();
    expect(() => dateWindow(-3, NOW)).toThrow();
    expect(() => dateWindow(1.5, NOW)).toThrow();
    expect(() => dateWindow(5, NOW, -1)).toThrow();
  });
});

describe("parseMsAdsCsv", () => {
  const CSV = [
    '"Report Name: Ad Performance Report"',
    '"Report Time: 7/13/2026"',
    "",
    '"TimePeriod","CampaignId","CampaignName","AdGroupId","AdId","Impressions","Clicks","Spend","CurrencyCode"',
    '"2026-07-12","111","BK-Search-NL, Conmax","222","333","1,234","56","78.90","EUR"',
    '"2026-07-13","111","BK-Search-NL, Conmax","222","333","10","1","0.55","EUR"',
    '"@Rows: 2"',
    '"©2026 Microsoft Corporation. All rights reserved."',
  ].join("\r\n");

  it("parst Datenzeilen, überspringt Vorspann und Fußzeilen", () => {
    const rows = parseMsAdsCsv("﻿" + CSV);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      TimePeriod: "2026-07-12",
      CampaignId: "111",
      CampaignName: "BK-Search-NL, Conmax",
      AdGroupId: "222",
      AdId: "333",
      Impressions: 1234,
      Clicks: 56,
      Spend: 78.9,
      CurrencyCode: "EUR",
    });
  });

  it("quoted Felder mit Komma und escaped Quotes bleiben intakt", () => {
    const csv = [
      '"TimePeriod","CampaignId","CampaignName","AdGroupId","AdId","Impressions","Clicks","Spend","CurrencyCode"',
      '"2026-07-13","1","Kampagne ""Herbst"", NL","2","3","5","1","1.00","EUR"',
    ].join("\n");
    const rows = parseMsAdsCsv(csv);
    expect(rows[0].CampaignName).toBe('Kampagne "Herbst", NL');
  });

  it("leerer Report (nur Header/Footer) → []", () => {
    const csv = [
      '"TimePeriod","CampaignId","CampaignName","AdGroupId","AdId","Impressions","Clicks","Spend","CurrencyCode"',
      '"@Rows: 0"',
    ].join("\n");
    expect(parseMsAdsCsv(csv)).toEqual([]);
  });

  it("leerer String → []", () => {
    expect(parseMsAdsCsv("")).toEqual([]);
    expect(parseMsAdsCsv("﻿\n")).toEqual([]);
  });

  it("nicht-leerer Report ohne Header-Zeile → throw (nie wie Leerreport behandeln)", () => {
    expect(() => parseMsAdsCsv('"irgendwas"\n"anderes"')).toThrow(/Header/);
  });

  it("Header mit fehlenden Pflichtspalten → throw", () => {
    const csv = '"TimePeriod","CampaignId","Impressions"\n"2026-07-13","1","5"';
    expect(() => parseMsAdsCsv(csv)).toThrow(/Pflichtspalten/);
  });
});

describe("redactUrl", () => {
  it("kappt den Query-String", () => {
    expect(redactUrl("https://g.com/x?access_token=geheim")).toBe("https://g.com/x?…");
    expect(redactUrl("https://g.com/x")).toBe("https://g.com/x");
  });
});

describe("microsToEur", () => {
  it("teilt durch 1e6 ohne zu runden", () => {
    expect(microsToEur(1_000_000)).toBe(1);
    expect(microsToEur(1_234_567)).toBe(1.234567);
    expect(microsToEur(0)).toBe(0);
  });
});

describe("fetchWithRetry", () => {
  afterEach(() => vi.restoreAllMocks());

  const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers });

  it("gibt Response bei 200 direkt zurück", async () => {
    const f = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    const res = await fetchWithRetry("https://x", {}, { fetchImpl: f, baseDelayMs: 1 });
    expect(res.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("retryt bei 429/5xx und wirft nach maxAttempts", async () => {
    const f = vi.fn().mockResolvedValue(jsonResponse(500, {}));
    await expect(
      fetchWithRetry("https://x", {}, { fetchImpl: f, baseDelayMs: 1, maxAttempts: 3 })
    ).rejects.toThrow(/500/);
    expect(f).toHaveBeenCalledTimes(3);
  });

  it("erholt sich, wenn ein Retry durchgeht", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, {}, { "Retry-After": "0" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const res = await fetchWithRetry("https://x", {}, { fetchImpl: f, baseDelayMs: 1 });
    expect(res.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("Meta-Rate-Limit-Body (400 + code 17/80004) wird retryt", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(400, { error: { code: 17 } }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const res = await fetchWithRetry("https://x", {}, { fetchImpl: f, baseDelayMs: 1 });
    expect(res.status).toBe(200);
  });

  it("gewöhnlicher 400 wird NICHT retryt", async () => {
    const f = vi.fn().mockResolvedValue(jsonResponse(400, { error: { code: 100 } }));
    const res = await fetchWithRetry("https://x", {}, { fetchImpl: f, baseDelayMs: 1 });
    expect(res.status).toBe(400);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("Netzwerkfehler wird retryt und erholt sich", async () => {
    const f = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const res = await fetchWithRetry("https://x", {}, { fetchImpl: f, baseDelayMs: 1 });
    expect(res.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("Fehlermeldung enthält keinen Query-String (Token-Redaction)", async () => {
    const f = vi.fn().mockRejectedValue(new Error("kaputt"));
    await expect(
      fetchWithRetry("https://x/y?access_token=geheim123", {}, { fetchImpl: f, baseDelayMs: 1, maxAttempts: 2 })
    ).rejects.toThrow(/https:\/\/x\/y\?…/);
    await expect(
      fetchWithRetry("https://x/y?access_token=geheim123", {}, { fetchImpl: f, baseDelayMs: 1, maxAttempts: 2 })
    ).rejects.not.toThrow(/geheim123/);
  });
});
