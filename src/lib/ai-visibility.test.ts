import test from "node:test";
import assert from "node:assert/strict";
import { calculateAiVisibilityScore, summarizeAiVisibility } from "./ai-visibility";

test("calculateAiVisibilityScore weights mention, citation, link, and position into 0-100", () => {
  const score = calculateAiVisibilityScore({
    mentionRate: 0.8,
    citationShare: 0.25,
    linkPresenceRate: 0.5,
    averagePositionScore: 0.75,
  });

  assert.equal(score, 58.5);
});

test("calculateAiVisibilityScore clamps missing and out-of-range inputs", () => {
  const score = calculateAiVisibilityScore({
    mentionRate: 2,
    citationShare: -1,
    linkPresenceRate: Number.NaN,
    averagePositionScore: 0.25,
  });

  assert.equal(score, 47.5);
});

test("summarizeAiVisibility aggregates snapshots for KPI cards", () => {
  const summary = summarizeAiVisibility([
    { brandMentioned: true, linkPresent: true, citationShare: 0.4, brandPosition: 1 },
    { brandMentioned: true, linkPresent: false, citationShare: 0.1, brandPosition: 4 },
    { brandMentioned: false, linkPresent: false, citationShare: 0, brandPosition: undefined },
  ]);

  assert.equal(summary.mentionRate, 2 / 3);
  assert.equal(summary.linkPresenceRate, 1 / 3);
  assert.equal(summary.citationShare, 0.5 / 3);
  assert.equal(summary.averagePositionScore, 0.5);
  assert.equal(summary.score, 45);
});
