/**
 * Attributions-Modelle für Datalake Paket D — pure Funktionen, kein Convex-Import.
 * Plan: docs/superpowers/plans/2026-07-14-datalake-paket-d-attribution.md
 */

export const MODELS = ["first", "last", "last_non_direct", "linear", "position", "time_decay"] as const;
export type Model = (typeof MODELS)[number];

export interface TP {
  id?: string;
  ts: number;
  channel: string; // utm_source oder "direct"
  campaignId?: string;
  adgroupId?: string;
  adId?: string;
}

const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000; // time_decay: Halbwertszeit 7 Tage

/**
 * Touchpoints im Lookback-Fenster [conversionTs - lookbackMs, conversionTs],
 * aufsteigend nach ts sortiert; bei Gleichstand stabil nach id.
 */
export function selectTouchpoints(tps: TP[], conversionTs: number, lookbackMs: number): TP[] {
  return tps
    .filter((t) => t.ts >= conversionTs - lookbackMs && t.ts <= conversionTs)
    .sort((a, b) => a.ts - b.ts || (a.id ?? "").localeCompare(b.id ?? ""));
}

/**
 * Gewichte je Touchpoint (Input MUSS aufsteigend sortiert sein, wie von
 * selectTouchpoints geliefert). Rückgabe hat dieselbe Länge, Σ = 1 (n > 0).
 */
export function computeWeights(model: Model, tps: TP[], conversionTs: number): number[] {
  const n = tps.length;
  if (n === 0) return [];
  if (n === 1) return [1];
  const zeros = () => new Array<number>(n).fill(0);

  switch (model) {
    case "first": {
      const w = zeros(); w[0] = 1; return w;
    }
    case "last": {
      const w = zeros(); w[n - 1] = 1; return w;
    }
    case "last_non_direct": {
      const w = zeros();
      for (let i = n - 1; i >= 0; i--) {
        if (tps[i].channel !== "direct") { w[i] = 1; return w; }
      }
      w[n - 1] = 1; // alle direct → last
      return w;
    }
    case "linear":
      return new Array<number>(n).fill(1 / n);
    case "position": {
      // 40 % erster, 40 % letzter, 20 % gleichverteilt auf die mittleren (n=2 → 0.5/0.5).
      if (n === 2) return [0.5, 0.5];
      const w = new Array<number>(n).fill(0.2 / (n - 2));
      w[0] = 0.4; w[n - 1] = 0.4;
      return w;
    }
    case "time_decay": {
      const raw = tps.map((t) => 2 ** (-(conversionTs - t.ts) / HALF_LIFE_MS));
      const total = raw.reduce((a, b) => a + b, 0);
      return raw.map((r) => r / total);
    }
  }
}

/**
 * utm_source → adCosts-Kanal ("google" | "bing" | "facebook") für den
 * Spend-Join; null = kein bezahlter Kanal mit Kostendaten.
 */
export function normalizeChannel(source: string): "google" | "bing" | "facebook" | null {
  const s = source.trim().toLowerCase();
  if (s === "google" || s === "google-ads" || s === "googleads") return "google";
  if (s === "bing" || s === "microsoft" || s === "msads") return "bing";
  if (s === "facebook" || s === "meta" || s === "instagram" || s === "fb" || s === "ig") return "facebook";
  return null;
}
