import test from "node:test";
import assert from "node:assert/strict";

import { shouldIncludeInPerformanceSnapshot } from "../../convex/adsMapping";

test("performance snapshots include search campaigns", () => {
  assert.equal(shouldIncludeInPerformanceSnapshot("SEARCH"), true);
});

test("performance snapshots exclude performance max and display campaigns", () => {
  assert.equal(shouldIncludeInPerformanceSnapshot("PERFORMANCE_MAX"), false);
  assert.equal(shouldIncludeInPerformanceSnapshot("DISPLAY"), false);
});
