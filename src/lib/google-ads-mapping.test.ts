import test from "node:test";
import assert from "node:assert/strict";

import { shouldIncludeInPerformanceSnapshot } from "../../convex/adsMapping";

test("performance snapshots include all Google Ads campaign channel types", () => {
  assert.equal(shouldIncludeInPerformanceSnapshot("SEARCH"), true);
  assert.equal(shouldIncludeInPerformanceSnapshot("PERFORMANCE_MAX"), true);
  assert.equal(shouldIncludeInPerformanceSnapshot("DISPLAY"), true);
  assert.equal(shouldIncludeInPerformanceSnapshot("VIDEO"), true);
});
