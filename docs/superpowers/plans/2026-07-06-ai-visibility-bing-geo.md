# AI Visibility, Bing und GEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Microvista-first AI Visibility MVP with SE Ranking AI Search data, Bing classic/AI import storage, deterministic scoring, and a usable dashboard page.

**Architecture:** Add a focused Convex data layer for prompts, AI snapshots, response snapshots, and Bing snapshots. Keep SE Ranking AI ingestion separate from existing rank tracking, use weekly cron frequency, and keep Bing API-ready classic fields separate from AI Performance CSV-only fields. Put deterministic score math and CSV parsing in small TypeScript helpers with node:test coverage.

**Tech Stack:** Next.js App Router, React 19, Convex, TypeScript, `node:test` through `tsx --test`, shadcn/ui, Recharts, lucide-react.

---

## File Structure

- Create: `src/lib/ai-visibility.ts` - pure scoring, aggregation, normalization helpers.
- Create: `src/lib/ai-visibility.test.ts` - node:test coverage for score math and snapshot aggregation.
- Create: `src/lib/bing-ai-csv.ts` - parse Bing AI Performance CSV exports without external dependencies.
- Create: `src/lib/bing-ai-csv.test.ts` - node:test coverage for quoted CSV, German/English headers, and numeric coercion.
- Create: `scripts/import-bing-ai-performance.ts` - import Bing AI Performance CSV rows into Convex for a brand.
- Modify: `package.json` - add `bing:ai-import`.
- Modify: `convex/schema.ts` - add `aiPrompts`, `aiVisibilitySnapshots`, `aiResponseSnapshots`, `bingSearchSnapshots`.
- Create: `convex/aiVisibility.ts` - mutations and queries for prompts, AI snapshots, Bing snapshots, and dashboard rollups.
- Create: `convex/actions/syncAIVisibility.ts` - weekly SE Ranking AI Search sync for Microvista and future brands.
- Modify: `convex/crons.ts` - add weekly AI Visibility cron after existing SE Ranking cron block.
- Modify: `src/lib/sections.ts` - add admin-only `aiVisibility` section.
- Modify: `src/components/sidebar.tsx` - map the new section icon.
- Create: `src/app/[brand]/ai-visibility/page.tsx` - dashboard UI.
- Modify: `docs/superpowers/specs/2026-07-06-ai-visibility-bing-geo-design.md` - keep Claudes clarifications in the committed spec.

---

### Task 1: Score Helper

**Files:**
- Create: `src/lib/ai-visibility.test.ts`
- Create: `src/lib/ai-visibility.ts`

- [ ] **Step 1: Write failing score tests**

```ts
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
  assert.equal(summary.score, 40);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/lib/ai-visibility.test.ts`
Expected: FAIL because `src/lib/ai-visibility.ts` does not exist.

- [ ] **Step 3: Implement score helper**

```ts
export type AiVisibilityScoreInput = {
  mentionRate?: number;
  citationShare?: number;
  linkPresenceRate?: number;
  averagePositionScore?: number;
};

export type AiVisibilitySnapshotLike = {
  brandMentioned?: boolean;
  linkPresent?: boolean;
  citationShare?: number;
  brandPosition?: number;
};

function clampRate(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function positionToScore(position: number | undefined): number {
  if (!position || position < 1) return 0;
  if (position === 1) return 1;
  if (position <= 3) return 0.75;
  if (position <= 5) return 0.5;
  return 0.25;
}

export function calculateAiVisibilityScore(input: AiVisibilityScoreInput): number {
  const score =
    clampRate(input.mentionRate) * 45 +
    clampRate(input.citationShare) * 30 +
    clampRate(input.linkPresenceRate) * 15 +
    clampRate(input.averagePositionScore) * 10;
  return Math.round(score * 10) / 10;
}

export function summarizeAiVisibility(rows: AiVisibilitySnapshotLike[]) {
  const total = rows.length || 1;
  const mentioned = rows.filter((row) => row.brandMentioned).length;
  const linked = rows.filter((row) => row.linkPresent).length;
  const citationShare = rows.reduce((sum, row) => sum + clampRate(row.citationShare), 0) / total;
  const averagePositionScore =
    rows.reduce((sum, row) => sum + positionToScore(row.brandPosition), 0) / total;
  const mentionRate = mentioned / total;
  const linkPresenceRate = linked / total;

  return {
    score: calculateAiVisibilityScore({
      mentionRate,
      citationShare,
      linkPresenceRate,
      averagePositionScore,
    }),
    mentionRate,
    citationShare,
    linkPresenceRate,
    averagePositionScore,
    snapshotCount: rows.length,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/lib/ai-visibility.test.ts`
Expected: PASS.

---

### Task 2: Bing AI CSV Parser

**Files:**
- Create: `src/lib/bing-ai-csv.test.ts`
- Create: `src/lib/bing-ai-csv.ts`

- [ ] **Step 1: Write failing parser tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { parseBingAiPerformanceCsv } from "./bing-ai-csv";

test("parseBingAiPerformanceCsv reads English AI Performance exports", () => {
  const rows = parseBingAiPerformanceCsv(
    'Date,Page,Grounding query,Topic,Intent,Citations\n2026-07-01,https://microvista.de/ct,"industrial ct, testing",CT,commercial,7\n'
  );

  assert.deepEqual(rows, [{
    date: "2026-07-01",
    page: "https://microvista.de/ct",
    query: "industrial ct, testing",
    topic: "CT",
    intent: "commercial",
    aiCitations: 7,
    sourceProvider: "bing-export",
  }]);
});

test("parseBingAiPerformanceCsv reads German column names and decimal commas", () => {
  const rows = parseBingAiPerformanceCsv(
    "Datum,URL,Grounding Query,Thema,Intent,Citation Share,Citations\n2026-07-02,https://microvista.de/,ct analyse,CT,info,\"12,5%\",2\n"
  );

  assert.equal(rows[0].aiCitationShare, 0.125);
  assert.equal(rows[0].aiCitations, 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/lib/bing-ai-csv.test.ts`
Expected: FAIL because `src/lib/bing-ai-csv.ts` does not exist.

- [ ] **Step 3: Implement parser**

Implement a quote-aware RFC-4180 parser, header normalization, percent parsing, and typed row output in `src/lib/bing-ai-csv.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/lib/bing-ai-csv.test.ts`
Expected: PASS.

---

### Task 3: Convex Data Layer

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/aiVisibility.ts`
- Create: `scripts/import-bing-ai-performance.ts`
- Modify: `package.json`

- [ ] **Step 1: Add schema tables**

Add `aiPrompts`, `aiVisibilitySnapshots`, `aiResponseSnapshots`, and `bingSearchSnapshots` after `serankingResearch` in `convex/schema.ts`. Keep Claudes `users.pending` and existing `dailyTraffic` tables unchanged.

- [ ] **Step 2: Add Convex API module**

Create mutations:
- `upsertPrompt`
- `seedMicrovistaPrompts`
- `upsertVisibilitySnapshot`
- `upsertResponseSnapshot`
- `upsertBingSearchSnapshot`

Create queries:
- `listPrompts`
- `listRecentSnapshots`
- `dashboardSummary`
- `listPromptRows`
- `listCitations`
- `listBingRows`

- [ ] **Step 3: Generate Convex types**

Run: `npx convex codegen`
Expected: generated API includes `aiVisibility`.

- [ ] **Step 4: Add Bing AI CSV import command**

Create `scripts/import-bing-ai-performance.ts` and add `bing:ai-import` to `package.json`.

Run: `npm run bing:ai-import -- --help`
Expected: prints usage without requiring Convex credentials.

---

### Task 4: SE Ranking AI Search Sync

**Files:**
- Create: `convex/actions/syncAIVisibility.ts`
- Modify: `convex/crons.ts`

- [ ] **Step 1: Add weekly sync action**

Use SE Ranking Data API endpoints:
- `GET /v1/ai-search/overview/by-engine/time-series`
- `GET /v1/ai-search/prompts-by-target`
- `GET /v1/ai-search/prompts-by-brand`

For MVP, sync `microvista.de` / brand `Microvista` / source `de` across `chatgpt`, `perplexity`, `gemini`, `ai-overview`, and `ai-mode`.

- [ ] **Step 2: Add conservative request limits**

Use overview for each engine and `limit=10` for prompt endpoints to control credits. Persist response snippets and cited links as response snapshots.

- [ ] **Step 3: Add weekly cron**

Add `crons.weekly("sync AI Visibility", { dayOfWeek: "monday", hourUTC: 7, minuteUTC: 0 }, api.actions.syncAIVisibility.syncAIVisibility, {});`

- [ ] **Step 4: Generate Convex types**

Run: `npx convex codegen`
Expected: cron references compile.

---

### Task 5: Dashboard UI and Navigation

**Files:**
- Modify: `src/lib/sections.ts`
- Modify: `src/components/sidebar.tsx`
- Create: `src/app/[brand]/ai-visibility/page.tsx`

- [ ] **Step 1: Add section key**

Add `aiVisibility` as admin-only with href `/ai-visibility`, label `AI Visibility`, and icon `Sparkles`.

- [ ] **Step 2: Add dashboard page**

Build a work-focused page with KPI cards, engine comparison, prompt table, citation domains, and Bing rows. Use existing `Card`, `Badge`, `Table`, `Button`, and `ResponsiveContainer` patterns from `/rankings`.

- [ ] **Step 3: Keep member permissions stable**

Do not add `aiVisibility` to `MEMBER_SECTIONS`; admins see it automatically and existing users keep their current rights.

---

### Task 6: Verification and Commit

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run focused unit tests**

Run:
`npx tsx --test src/lib/ai-visibility.test.ts src/lib/bing-ai-csv.test.ts`
Expected: PASS.

- [ ] **Step 2: Run Convex codegen**

Run: `npx convex codegen`
Expected: generated API updates without schema errors.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: build succeeds or reports unrelated pre-existing lint-only baseline issues separately.

- [ ] **Step 4: Commit focused work**

Run:
`git add docs/superpowers/specs/2026-07-06-ai-visibility-bing-geo-design.md docs/superpowers/plans/2026-07-06-ai-visibility-bing-geo.md src/lib/ai-visibility.ts src/lib/ai-visibility.test.ts src/lib/bing-ai-csv.ts src/lib/bing-ai-csv.test.ts convex/schema.ts convex/aiVisibility.ts convex/actions/syncAIVisibility.ts convex/crons.ts src/lib/sections.ts src/components/sidebar.tsx src/app/[brand]/ai-visibility/page.tsx convex/_generated`

Then:
`git commit -m "feat: add ai visibility geo dashboard"`
