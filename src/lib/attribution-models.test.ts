import { describe, it, expect } from "vitest";
import {
  MODELS, type Model, type TP,
  selectTouchpoints, computeWeights, normalizeChannel,
} from "./attribution-models";

const DAY = 24 * 60 * 60 * 1000;
const CONV_TS = Date.UTC(2026, 6, 14);

const tp = (daysBefore: number, channel = "google", id?: string): TP => ({
  id: id ?? `tp-${daysBefore}-${channel}`,
  ts: CONV_TS - daysBefore * DAY,
  channel,
});

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("selectTouchpoints", () => {
  it("filtert auf Lookback und sortiert aufsteigend", () => {
    const tps = [tp(1), tp(95), tp(30), tp(0)];
    const out = selectTouchpoints(tps, CONV_TS, 90 * DAY);
    expect(out.map((t) => t.id)).toEqual(["tp-30-google", "tp-1-google", "tp-0-google"]);
  });

  it("Kanten: exakt Lookback-Grenze zählt, Zukunft (ts > conversionTs) nicht", () => {
    const border = tp(90);
    const future: TP = { id: "future", ts: CONV_TS + 1, channel: "google" };
    const out = selectTouchpoints([border, future], CONV_TS, 90 * DAY);
    expect(out.map((t) => t.id)).toEqual(["tp-90-google"]);
  });

  it("stabil bei ts-Gleichstand (Sortierung nach id)", () => {
    const a: TP = { id: "a", ts: CONV_TS - DAY, channel: "google" };
    const b: TP = { id: "b", ts: CONV_TS - DAY, channel: "bing" };
    expect(selectTouchpoints([b, a], CONV_TS, 90 * DAY).map((t) => t.id)).toEqual(["a", "b"]);
  });
});

describe("computeWeights", () => {
  const cases: Array<[Model, number[], number[]]> = [
    // [Modell, Tage-vor-Conversion je TP (aufsteigend sortiert = älteste zuerst), erwartete Gewichte]
    ["first", [30, 10, 1], [1, 0, 0]],
    ["last", [30, 10, 1], [0, 0, 1]],
    ["linear", [30, 10, 1], [1 / 3, 1 / 3, 1 / 3]],
    ["position", [30, 10, 1], [0.4, 0.2, 0.4]],
    ["position", [30, 20, 10, 1], [0.4, 0.1, 0.1, 0.4]],
  ];
  for (const [model, days, expected] of cases) {
    it(`${model} mit n=${days.length}`, () => {
      const tps = days.map((d) => tp(d));
      const w = computeWeights(model, tps, CONV_TS);
      expected.forEach((e, i) => expect(w[i]).toBeCloseTo(e, 9));
    });
  }

  it("n=1: jedes Modell gibt [1]", () => {
    for (const model of MODELS) {
      expect(computeWeights(model, [tp(5)], CONV_TS)).toEqual([1]);
    }
  });

  it("n=2 position: 0.5/0.5", () => {
    const w = computeWeights("position", [tp(5), tp(1)], CONV_TS);
    expect(w[0]).toBeCloseTo(0.5, 9);
    expect(w[1]).toBeCloseTo(0.5, 9);
  });

  it("n=0: leeres Array für jedes Modell", () => {
    for (const model of MODELS) {
      expect(computeWeights(model, [], CONV_TS)).toEqual([]);
    }
  });

  it("last_non_direct überspringt direct am Ende", () => {
    const tps = [tp(10, "google"), tp(5, "direct"), tp(1, "direct")];
    expect(computeWeights("last_non_direct", tps, CONV_TS)).toEqual([1, 0, 0]);
  });

  it("last_non_direct: alle direct → letzter", () => {
    const tps = [tp(10, "direct"), tp(1, "direct")];
    expect(computeWeights("last_non_direct", tps, CONV_TS)).toEqual([0, 1]);
  });

  it("time_decay: jüngerer Touchpoint wiegt mehr, Halbwertszeit 7 Tage", () => {
    const tps = [tp(8), tp(1)]; // Δ 7 Tage → Faktor 2
    const w = computeWeights("time_decay", tps, CONV_TS);
    expect(w[1] / w[0]).toBeCloseTo(2, 6);
  });

  it("Σweight = 1 für alle Modelle und diverse n", () => {
    for (const model of MODELS) {
      for (const n of [1, 2, 3, 5, 11]) {
        const tps = Array.from({ length: n }, (_, i) => tp(n - i, i % 3 === 0 ? "direct" : "google", `t${i}`));
        expect(sum(computeWeights(model, tps, CONV_TS))).toBeCloseTo(1, 9);
      }
    }
  });
});

describe("normalizeChannel", () => {
  it("mappt utm_source-Varianten auf adCosts-Kanäle", () => {
    expect(normalizeChannel("google")).toBe("google");
    expect(normalizeChannel("Google")).toBe("google");
    expect(normalizeChannel("facebook")).toBe("facebook");
    expect(normalizeChannel("meta")).toBe("facebook");
    expect(normalizeChannel("instagram")).toBe("facebook");
    expect(normalizeChannel("bing")).toBe("bing");
    expect(normalizeChannel("microsoft")).toBe("bing");
    expect(normalizeChannel("newsletter")).toBe(null);
    expect(normalizeChannel("direct")).toBe(null);
  });
});
