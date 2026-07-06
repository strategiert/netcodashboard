import test from "node:test";
import assert from "node:assert/strict";

import { aggregateSourceCoverage } from "./source-coverage";

test("aggregateSourceCoverage combines ads, search, social, and unattributed sessions", () => {
  const rows = aggregateSourceCoverage({
    granularity: "daily",
    multiYear: false,
    snapshots: [
      { date: "2026-07-01", source: "ads", adClicks: 120, adImpressions: 3000, adSpend: 240 },
      { date: "2026-07-01", source: "gsc", clicks: 14, impressions: 1400 },
      { date: "2026-07-01", source: "publer", socialLinkClicks: 3, socialReach: 400 },
    ],
    bingRows: [
      { date: "2026-07-01", clicks: 4, impressions: 200 },
    ],
    dailyTraffic: [
      { date: "2026-07-01", chSeo: 18, chDirect: 30, chReferral: 7, chOther: 5 },
    ],
  });

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    name: "07-01",
    adsInteractions: 120,
    googleSearchClicks: 14,
    bingSearchClicks: 4,
    organicSearchSessions: 18,
    socialInteractions: 3,
    directSessions: 30,
    referralSessions: 7,
    otherSessions: 5,
    adsImpressions: 3000,
    googleSearchImpressions: 1400,
    bingSearchImpressions: 200,
    socialReach: 400,
    adsCost: 240,
  });
});

test("aggregateSourceCoverage rolls all sources up by ISO week", () => {
  const rows = aggregateSourceCoverage({
    granularity: "weekly",
    multiYear: true,
    snapshots: [
      { date: "2026-06-29", source: "ads", adClicks: 5, adImpressions: 50, adSpend: 10 },
      { date: "2026-07-01", source: "ads", adClicks: 6, adImpressions: 60, adSpend: 12 },
      { date: "2026-07-01", source: "gsc", clicks: 3, impressions: 30 },
    ],
    bingRows: [{ date: "2026-07-02", clicks: 2, impressions: 20 }],
    dailyTraffic: [
      { date: "2026-06-30", chDirect: 4, chReferral: 1, chOther: 2, chSeo: 8 },
      { date: "2026-07-03", chDirect: 5, chReferral: 3, chOther: 1, chSeo: 7 },
    ],
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "2026 KW27");
  assert.equal(rows[0].adsInteractions, 11);
  assert.equal(rows[0].googleSearchClicks, 3);
  assert.equal(rows[0].bingSearchClicks, 2);
  assert.equal(rows[0].organicSearchSessions, 15);
  assert.equal(rows[0].directSessions, 9);
  assert.equal(rows[0].referralSessions, 4);
  assert.equal(rows[0].otherSessions, 3);
  assert.equal(rows[0].adsCost, 22);
});
