# Datalake Paket D — Attribution-Engine + Reports

**Version 1 (14.07.).** Design: `docs/superpowers/specs/2026-07-13-datalake-attribution-design.md` §5 D (Punkte 12+13). Voraussetzungen liegen: Paket A (touchpoints/conversions/persons, LIVE) + Paket B (adCosts/clickViews, LIVE seit 14.07.).

**For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans, Task für Task. Checkboxen (`- [ ]`) zum Abhaken.

**Goal:** Je Conversion werden Touchpoints im Lookback (Default 90 Tage) gesammelt und über 6 Regelmodelle (first/last/last-non-direct/linear/position/time-decay) zu `attributionFacts` gewichtet. Admin-Dashboard-Section „Attribution": Ad-Level Spend × Leads/Umsatz → CPL/ROAS mit Modell-Umschalter, Journey-Timeline je Person, QA-Alerts.

**Architecture:** Nightly Full-Recompute mit Generation-Swap (Volumen ist klein: Conversions einstellig/Tag, Modelle ×6 — keine Invalidation-Queue nötig, Design-Punkt „Invalidation" wird durch kompletten Neuaufbau je Lauf erfüllt; Kommentar im Code). Engine ist internalAction; Queries admin-only (`requireAdmin`-Muster). Facts enthalten KEINE PII — nur IDs, Kanal-/Kampagnen-Dimensionen, Gewichte, Werte. gclid→Ad-Zuordnung nutzt `clickViews` als Backstop, wenn kein UTM-Touchpoint mit Ad-Level existiert.

**Repo:** NUR DASH = `C:\Users\karent\Documents\Software\netco\_shared\dashboard`.

## Global Constraints

* Bestehenden Ingest (`convex/datalake.ts`) und Paket-B-Dateien NICHT verändern; neue Dateien daneben (`convex/attribution.ts`, `convex/actions/computeAttribution.ts`).
* Alle neuen Queries mit exakt dem `requireAdmin`-Muster aus `convex/users.ts`; Engine/Mutations `internal*`.
* Facts-Leser sehen ausschließlich die aktive Generation (Meta-Pointer) — halbfertige Recomputes dürfen nie sichtbar sein.
* Gewichts-Invariante: Σweight je (conversion, model) = 1.0 (±1e-9). Wird sie verletzt → Engine wirft, kein Swap.
* Fehler werfen statt still returnen (Cron sichtbar rot); Swap nur nach vollständigem, fehlerfreiem Lauf.
* UI im Bestands-Stil (shadcn/Tailwind, Section-Pattern aus `src/lib/sections.ts` + `src/app/[brand]/<section>/page.tsx`), Texte Deutsch, echte Umlaute.
* Nach jedem Task committen (`feat(datalake): …`).

**Lastmodell:** ≤~500 Conversions × 6 Modelle × ∅≤10 Touchpoints → ≤30k Facts pro Generation, Full-Recompute deutlich unter Convex-Limits (Batches à 500). Aggregation liest eine Generation über Index.

---

### Task 1: Schema `attributionFacts` + `attributionMeta`

**Files:** Modify: `convex/schema.ts` (unter den Paket-B-Block)

* [ ] **Step 1: Schema ergänzen**

```ts
  // ── Datalake Paket D: Attribution (Plan: docs/superpowers/plans/2026-07-14-datalake-paket-d-attribution.md) ──
  attributionFacts: defineTable({
    brandId: v.id("brands"),
    generation: v.number(),
    model: v.string(),             // "first" | "last" | "last_non_direct" | "linear" | "position" | "time_decay"
    conversionId: v.id("conversions"),
    conversionType: v.string(),    // denormalisiert für Aggregation ohne Join
    conversionTs: v.number(),
    value: v.number(),             // 0 wenn Conversion ohne value
    currency: v.string(),
    weight: v.number(),            // Anteil dieses Touchpoints an der Conversion
    touchpointId: v.optional(v.id("touchpoints")), // fehlt beim "direct"-Fact (keine Touchpoints im Lookback)
    // Dimensionen des Touchpoints, denormalisiert:
    channel: v.string(),           // utm_source | "direct"
    campaignId: v.optional(v.string()),
    adgroupId: v.optional(v.string()),
    adId: v.optional(v.string()),
  })
    .index("by_brand_gen_model_ts", ["brandId", "generation", "model", "conversionTs"])
    .index("by_conversion", ["conversionId", "generation"]),

  attributionMeta: defineTable({
    brandId: v.id("brands"),
    activeGeneration: v.number(),
    computedAt: v.number(),
    lookbackDays: v.number(),
    conversions: v.number(),
    facts: v.number(),
  }).index("by_brand", ["brandId"]),
```

* [ ] **Step 2:** `npx convex dev --once` → ready. Commit.

### Task 2: Modell-Helpers (pure, TDD)

**Files:** Create: `src/lib/attribution-models.ts`, `src/lib/attribution-models.test.ts`

**Interfaces (pure, kein Convex-Import):**
* `type TP = { id?: string; ts: number; channel: string; campaignId?: string; adgroupId?: string; adId?: string }`
* `selectTouchpoints(tps: TP[], conversionTs: number, lookbackMs: number): TP[]` — Filter `conversionTs - lookback <= ts <= conversionTs`, aufsteigend sortiert, deterministisch (bei ts-Gleichstand stabile Reihenfolge nach id).
* `computeWeights(model: Model, tps: TP[]): number[]` — Länge = tps.length, Σ=1:
  * `first`: 1.0 auf ersten.
  * `last`: 1.0 auf letzten.
  * `last_non_direct`: 1.0 auf letzten mit channel ≠ "direct"; sind alle direct → letzter.
  * `linear`: 1/n je Touchpoint.
  * `position`: 40 % erster, 40 % letzter, 20 % gleichverteilt auf die mittleren; n=1 → 1.0; n=2 → 0.5/0.5.
  * `time_decay`: weight ∝ 2^(−Δt/7d) (Halbwertszeit 7 Tage, Δt = conversionTs − ts), normalisiert. Braucht conversionTs → Signatur `computeWeights(model, tps, conversionTs)`.
* `MODELS = ["first","last","last_non_direct","linear","position","time_decay"] as const`
* [ ] **Step 1: Failing Tests** — je Modell Basisfälle, n=0/1/2, alle-direct-Fall, Σ=1-Invariante (Property-artig über mehrere n), time_decay-Monotonie (jüngerer Touchpoint ≥ Gewicht des älteren), Lookback-Filter inkl. Kanten.
* [ ] **Step 2:** Fail verifizieren, implementieren, 100 % pass. Commit.

### Task 3: Engine (`computeAttribution`)

**Files:** Create: `convex/actions/computeAttribution.ts` (internalAction, KEIN "use node" nötig — nur Convex-Calls), `convex/attribution.ts` (internalMutations/-Queries für die Engine)

**Ablauf je Brand (Args `{ brandSlug?: string, lookbackDays?: number }`, Default alle Brands mit Conversions, 90 Tage):**
1. `internal.attribution.loadInputs` (internalQuery, je Brand): alle conversions der Brand; je Conversion Touchpoints über `by_person` (personId) PLUS `by_pid` (brandId+pid, falls pid vorhanden) — dedupe über touchpoint._id. Volumen klein; bei Wachstum später paginieren (Kommentar).
2. **gclid-Backstop:** Hat die Conversion `clickIds.gclid` und KEIN ausgewählter Touchpoint Ad-Level-Daten (adId leer), dann `clickViews`-Lookup (`by_gclid`, gclid — Datum egal, `.first()` nach Filter brandId): synthetischer Touchpoint `{ ts: conversionTs, channel: "google", campaignId, adgroupId, adId }` (kein touchpointId-Bezug; Kommentar „Backstop").
3. Je Modell: `selectTouchpoints` + `computeWeights`; 0 Touchpoints → ein Fact `{ channel: "direct", weight: 1, touchpointId: undefined }`.
4. Invariante prüfen (Σweight je conversion+model = 1 ± 1e-9), sonst throw.
5. Facts als Batches à 500 an `internal.attribution.insertFacts` (Generation = alte aktive + 1).
6. `internal.attribution.swapGeneration`: attributionMeta upsert (activeGeneration, Zähler), danach `internal.attribution.deleteGeneration` für die alte Generation in Batches (Index `by_brand_gen_model_ts`-Präfix).
* [ ] **Step 1:** Engine bauen (Return: je Brand `{ generation, conversions, facts, deletedOld }`).
* [ ] **Step 2: Smoke dev** — laufen lassen; erwartet: 2 Test-Leads × 6 Modelle ≥ 12 Facts, Σweight-Check grün.
* [ ] **Step 3:** Commit.

### Task 4: Aggregations-/Report-Queries (admin)

**Files:** Modify: `convex/attribution.ts` (+public admin-Queries)

* [ ] **Step 1: `attributionSummary`** — Args `{ brandSlug, model, days }` (days 30/90/180). Liest aktive Generation, Facts im Zeitraum über `by_brand_gen_model_ts`, aggregiert je (channel, campaignId, adgroupId, adId): `leads` (Σweight über type lead), `revenue` (Σweight×value über deal_won), plus `spend`/`clicks` aus `adCosts` (`by_brand_date`-Range über denselben Zeitraum, gematcht über channel+campaignId+adgroupId+adId; channel-Mapping: utm_source google→google, facebook/meta→facebook, bing/microsoft→bing — Helper `normalizeChannel` in attribution-models.ts, getestet). Rows zusätzlich je Kampagne + je Kanal aggregiert zurückgeben (`byAd`, `byCampaign`, `byChannel`), campaignName aus adCosts. CPL = spend/leads, ROAS = revenue/spend (null bei 0-Spend).
* [ ] **Step 2: `journeyList`** — Args `{ brandSlug, limit }`: letzte Conversions absteigend mit Person-Touchpoint-Timeline (ts, type, channel, campaign, urlPath) — KEINE PII (es existiert keine im Store, nur HMACs — die geben wir trotzdem nicht aus).
* [ ] **Step 3: `qaAlerts`** — Args `{ brandSlug }`: (a) keine webEvent-Touchpoints in den letzten 24 h → „Beacon still?", (b) adCosts-Zeilen der letzten 7 Tage, deren (channel,campaignId) in KEINEM Touchpoint/Fact auftaucht → „Kosten ohne getrackte Klicks", (c) attributionMeta.computedAt älter 26 h → „Facts stale", (d) Σweight-Stichprobe (10 Conversions) ≠ 1 → „Gewichts-Invariante verletzt".
* [ ] **Step 4:** Commit.

### Task 5: UI — Section „Attribution"

**Files:** Modify: `src/lib/sections.ts` (+`attribution`, adminOnly, Icon "GitBranch"); Create: `src/app/[brand]/attribution/page.tsx` (+ Client-Komponenten unter `src/components/attribution/`)

* [ ] **Step 1:** Section registrieren (SectionKey-Union + SECTIONS-Eintrag).
* [ ] **Step 2: Page** — drei Bereiche:
  1. **Kopf:** Modell-Umschalter (6 Buttons/Select), Zeitraum (30/90/180), QA-Alert-Banner (aus `qaAlerts`, gelb, nur wenn Alerts).
  2. **Performance-Tabelle:** Tabs Kanal/Kampagne/Anzeige; Spalten Spend, Klicks, Leads (1 Nachkommastelle — Gewichte!), Umsatz, CPL, ROAS; Sortierung nach Spend; Kampagnenname vor ID.
  3. **Journeys:** Liste letzter Conversions, aufklappbare Timeline (Zeitpunkt, Typ, Kanal, Kampagne, Pfad).
* [ ] **Step 3:** `npm run build` grün; visuell im Dev-Server prüfen (Brand bautv). Commit.

### Task 6: Cron + Prod + Verifikation

**Files:** Modify: `convex/crons.ts`

* [ ] **Step 1:** `crons.daily("compute attribution", { hourUTC: 7, minuteUTC: 20 }, internal.actions.computeAttribution.computeAttribution, {});` (nach Kosten-Syncs 06:52–07:08).
* [ ] **Step 2:** `npx convex deploy -y`; Engine einmal manuell `--prod` laufen lassen.
* [ ] **Step 3: Prod-Smoke** — attributionSummary liefert für bautv Zeilen mit Spend>0 (Google sicher); die 2 Test-Leads vom 14.07. erscheinen in journeyList; qaAlerts liefert plausible Werte; Σweight-Invariante im Engine-Log grün.
* [ ] **Step 4:** Push (Vercel-Deploy abwarten + Live-URL prüfen), Mission Control (7-Block-Doku), Commit.

## Bewusst NICHT in diesem Plan

Identity-Merges (Paket C, Governance-Gate), datengetriebenes Modell/Holdouts (F), Conversion-Rückspielung (F), Deal-Umsätze aus HubSpot (kommt mit B-Punkt 5 — bis dahin zeigt Umsatz nur deal_won-Conversions, aktuell 0), Kosten-Kanäle jenseits google/bing/facebook, Member-Sichtbarkeit der Section (admin-only bis Zahlen belastbar), Invalidation-Queue (Full-Recompute ersetzt sie bei aktuellem Volumen — Design-Punkt bewusst vereinfacht).

## Self-Review

* Σweight-Invariante hart erzwungen vor Swap; Leser sehen nur aktive Generation. ✓
* gclid-Backstop nutzt Paket-B-clickViews genau wie im Design vorgesehen. ✓
* Keine PII in Facts/Reports; alles admin-only. ✓
* Bestehender Ingest unangetastet; Engine additiv. ✓
* Offene Risiken: utm_source-Schreibweisen (normalizeChannel bewusst getestet); position-Modell-Konvention 40/20/40 dokumentiert; time_decay-Halbwertszeit 7 d als Konstante (später konfigurierbar).
