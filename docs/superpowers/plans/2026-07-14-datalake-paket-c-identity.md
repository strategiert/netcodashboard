# Datalake Paket C — Identity (deterministischer Merger + KI-Review-Queue)

**Version 2 (14.07., nach adversarialem Review durch Opus/deep-reasoner — Codex-Quota bis 20.07. erschöpft).** Wichtigste v2-Korrekturen: Cluster-Touchpoint-Sammlung über pid-Union statt personId-Map (Web-Touchpoints tragen KEINE personId!), separates LLM-Flag (KI-Aufrufe sind Verarbeitung und bleiben bis DSFA aus), Evidenz-Allowlist ohne urlPath/keyword, Paar-Normalisierung, On-Demand-Recompute nach Approve. Design: `docs/superpowers/specs/2026-07-13-datalake-attribution-design.md` §5 C (Punkte 10+11) + §Governance-Gate.

**HARTES GATE: Dieses Paket wird GEPLANT und gebaut, aber NICHT produktiv geschaltet, bevor DSFA + Verarbeitungsverzeichnis + Rechtsgrundlagen-Matrix mit dem DSB (Ralph Angerstein) abgeschlossen sind.** Klaus gibt das Governance-Paket heute an Legal. Alle Merge-Funktionen bleiben bis zur Freigabe hinter einem Feature-Flag (`IDENTITY_MERGE_ENABLED`, Convex-Env, Default aus). KI-Merges werden NIE automatisch übernommen — jeder Vorschlag läuft durch die Review-Queue; vollständige KI-Eingaben und Entscheidungen werden revisionsfest geloggt (Design §Governance).

**For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans, Task für Task. Checkboxen (`- [ ]`).

**Goal:** Personen, die über mehrere Schlüssel auftreten (E-Mail-HMAC, Telefon-HMAC, pid, künftig hubspotContactId), werden zusammengeführt — deterministisch nur bei konfliktfreien Schlüsseln, sonst als KI-Vorschlag mit menschlicher Prüfung. Ergebnis: Journeys und Attribution sehen EINE Person statt Fragmente (der reale Fall vom 14.07. — zwei Test-Leads derselben Person, einer nur Mail, einer nur Telefon — wird zusammenführbar).

**Architecture:** Merge-Modell „Kanten statt Löschen": Personen werden nicht gelöscht, sondern über eine `personEdges`-Tabelle verbunden; der Cluster-Repräsentant ist die deterministisch kleinste Person-`_id` (reiner Gruppierungsschlüssel, KEIN „ältester Kontakt" — Convex-IDs sind nicht chronologisch). Reversibel (Unmerge = Kante retracten), revisionsfest, kein Umschreiben historischer Fremdschlüssel.

**KRITISCH (Review-F1): Web-Touchpoints tragen heute KEINE personId** — der Ingest (`datalake.ts`) schreibt sie nur mit `pid`; die personId-Zuordnung läuft ausschließlich über den `by_pid`-Index. Eine personId→canonical-Map allein sammelt daher NICHTS zusätzlich ein. Cluster-Gathering muss deshalb die **Union aller Schlüssel des Clusters** bilden: alle `pid`-identityKeys der Cluster-Mitglieder laden und `by_pid` je pid abfragen, PLUS `by_person` je Mitglieds-personId (für künftige HubSpot-Touchpoints, die personId tragen werden). Das ist der Kern von Task 5.

**Repo:** NUR DASH.

## Global Constraints

* **ZWEI Feature-Flags** (Convex-Env, beide Default "false"):
  * `IDENTITY_MERGE_ENABLED` — gated JEDEN Kanten-Write (deterministisch UND approve).
  * `IDENTITY_MATCHER_LLM_ENABLED` — gated JEDEN Claude-Aufruf. Begründung (Review-F2): Auch pseudonyme Daten an Anthropic zu senden ist Verarbeitung durch einen Auftragsverarbeiter und gehört HINTER die DSFA — „nur Mergen ist gated" wäre die falsche Trennlinie. Ungated läuft ausschließlich DB-interne Arbeit: Kandidaten-Enumeration, shared-Markierung, Review-Einträge OHNE aiLog.
  * Beide Flags + die Frage „darf der DEV-Matcher vor DSFA laufen?" stehen als explizite DSB-Fragen im Governance-Paket.
* Auto-Merge NUR bei `conflictStatus: "unique"`-Schlüsseln, die exakt gleich sind (emailHmac ODER hubspotContactId). Telefon-HMAC allein merged NIE automatisch (geteilte Büro-Nummern!) — nur als KI-Vorschlag.
* Geteilte Schlüssel (mehrere Personen, gleicher keyValue) → `conflictStatus: "shared"` setzen, kein Merge, im Review sichtbar.
* Firmen-Rollup (`same_company`) ist eine EIGENE Kantenart und fließt NIE in Personen-Journeys — Account-Sicht wird separat ausgewiesen (Design §C).
* KI-Matcher (Claude via App-Runtime): ausschließlich Vorschläge in `identityReview` mit Confidence + Begründung + vollständigem Prompt/Antwort-Log. Kein Schreibzugriff auf Kanten.
* Alle Queries admin-only (requireAdmin-Muster); Mutations internal; Review-Aktionen (approve/reject) admin-gated mit Entscheider-Protokoll.
* Bestehende Tabellen/Pakete unangetastet; Attribution liest künftig über die Kanonisierungs-Map (einzige Integrationsstelle, additiv).
* Nach jedem Task committen.

**Lastmodell:** Personen aktuell einstellig, mittelfristig hunderte. Kanonisierungs-Map wird pro Engine-Lauf einmal geladen — trivial.

---

### Task 1: Schema `personEdges` + `identityReview` + Flag

**Files:** Modify: `convex/schema.ts`

```ts
  personEdges: defineTable({
    brandId: v.id("brands"),
    fromPersonId: v.id("persons"),
    toPersonId: v.id("persons"),
    kind: v.string(),            // "same_person" | "same_company"
    status: v.string(),          // "active" | "retracted"
    source: v.string(),          // "deterministic" | "review_approved"
    reason: v.string(),          // z. B. "emailHmac exakt gleich" | Review-ID
    createdAt: v.number(),
    createdBy: v.string(),       // "system" | Admin-User-Id
    retractedAt: v.optional(v.number()),
    retractedBy: v.optional(v.string()),
  })
    .index("by_brand", ["brandId", "status"])
    .index("by_from", ["fromPersonId"])
    .index("by_to", ["toPersonId"]),

  identityReview: defineTable({
    brandId: v.id("brands"),
    personAId: v.id("persons"),
    personBId: v.id("persons"),
    kind: v.string(),            // "same_person" | "same_company"
    confidence: v.number(),      // 0..1, vom Matcher
    rationale: v.string(),       // menschenlesbare Begründung
    evidence: v.string(),        // JSON: Schlüssel-/Feldvergleich, der zum Vorschlag führte
    aiLog: v.optional(v.string()), // vollständige KI-Eingabe+Antwort (revisionsfest, Governance!)
    status: v.string(),          // "open" | "approved" | "rejected"
    decidedBy: v.optional(v.string()),
    decidedAt: v.optional(v.number()),
    decisionNote: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_brand_status", ["brandId", "status"])
    .index("by_pair", ["personAId", "personBId"]),
```

* [ ] Step 1: Schema + `npx convex dev --once`. Step 2: Env `IDENTITY_MERGE_ENABLED=false` (dev+prod). Commit.

### Task 2: Kanonisierung als pure Helpers (TDD)

**Files:** Create: `src/lib/identity-helpers.ts` + Tests

* `canonicalMap(edges: {brandId, from, to, kind, status}[]): Map<string,string>` — Union-Find NUR über AKTIVE same_person-Kanten, **partitioniert je brandId** (Review-F12: Defense-in-depth gegen brand-übergreifende Kanten — throw bei Kante mit gemischten Brands); Repräsentant = lexikographisch kleinste Person-Id (deterministisch, reiner Gruppierungsschlüssel); same_company/retracted ignoriert.
* `normalizePair(a, b): [small, large]` — lexikographische Ordnung; MUSS bei jedem Insert UND Lookup in personEdges/identityReview verwendet werden (Review-F4: sonst akkumulieren (b,a)-Duplikate an (a,b) vorbei).
* `findDeterministicMerges(keys: {personId, keyType, keyValue, conflictStatus}[]): {merges: {a,b,reason}[], sharedCandidates: …}` — Merges NUR bei exakt gleichem unique emailHmac/hubspotContactId; phoneHmac/pid nie deterministisch. Hinweis (Review-F9): Der Web-Ingest dedupliziert emailHmac bereits bei der Personen-Anlage — deterministische Email-Merges werden erst mit dem HubSpot-Sync real; der Near-Term-Nutzen liegt in shared-Erkennung + Queue.
* `clusterKeys(members: personId[], keys): {pids: string[], personIds: string[]}` — Schlüssel-Union fürs Touchpoint-Gathering (F1-Fix).
* [ ] Failing Tests (Union-Find-Ketten, Brand-Partition-Throw, Determinismus, Pair-Normalisierung, shared-Erkennung, phone merged nie, clusterKeys-Union) → implementieren → grün. Commit.

### Task 3: Deterministischer Merger (internal, flag-gated)

**Files:** Create: `convex/identity.ts`

* Split nach Gating (Review-F8 — die harmlose DB-Analyse darf laufen, nur Writes mit Wirkung sind gated):
  * **Ungated** (läuft immer): shared-Erkennung → `conflictStatus: "shared"` patchen + identityReview-Eintrag (kind same_person, confidence 0.5, rationale „geteilter Schlüssel — menschliche Prüfung nötig", OHNE aiLog). Reine DB-Arbeit, kein externer Abfluss.
  * **Gated auf `IDENTITY_MERGE_ENABLED`**: personEdges-Insert für deterministische Merges (source "deterministic", createdBy "system", Paar normalisiert).
* Idempotent: bestehende aktive Kante bzw. offenes/entschiedenes Review fürs NORMALISIERTE Paar → skip.
* [ ] Bauen + dev-Smoke: Flag aus → shared-Reviews entstehen, keine Kante; Flag an in DEV → Kanten. Test-Leads: kein gemeinsamer Schlüssel → 0 deterministische Merges (Negativtest). Commit.

### Task 4: KI-Vorschlags-Matcher (App-Runtime, flag-unabhängig sichtbar, aber nur Queue)

**Files:** Create: `convex/actions/identityMatcher.ts` ("use node")

* **Kandidaten-Suche (ungated, reine DB-Arbeit, Blocking vor jedem LLM):** Personen-Paare derselben Brand mit (a) gleichem phoneHmac (shared), (b) Conversions binnen **±10 Minuten** MIT Zusatzsignal — komplementäre Schlüsseltypen (einer email-only, einer phone-only) ODER gleiche Kampagne/Landingpage (Review-F11: ±1 h ohne Zusatzsignal wäre O(n²)-LLM-Flut) —, (c) künftig HubSpot-Namensvarianten. Hartes Limit: max. 20 neue Kandidaten je Lauf, Überhang geloggt. Nur normalisierte Paare ohne Kante/Review. Kandidaten landen SOFORT als identityReview (confidence 0, rationale „Kandidat — KI-Bewertung ausstehend").
* **LLM-Bewertung (gated auf `IDENTITY_MATCHER_LLM_ENABLED`):** je offener Kandidat EIN Claude-Aufruf (App-Runtime-Key, Modell claude-haiku-4-5). **Evidenz-Allowlist (Review-F3), abschließend:** Zeitdifferenz der Conversions, Schlüsseltyp-Muster (email-only/phone-only/…), Conversion-Typ+Wert, Kampagnen-/Adgroup-IDs (numerisch), Geräteklasse. **Explizit VERBOTEN: urlPath, keyword, HMAC-Werte oder -Präfixe** (urlPath/keyword können Klartext-PII tragen; HMAC-Präfixe nützen dem Matching nichts). Ausgabe strukturiert {same_person, confidence, rationale}; Update des Review-Eintrags mit vollständigem `aiLog`.
* NIE Kanten-Writes aus diesem Pfad.
* Cron: wöchentlich (Montag 07:30) + manuell; bei LLM-Flag aus endet der Lauf nach der Kandidaten-Enumeration.
* [ ] Bauen + Smoke. **Abnahmetest (Review-F10, deterministisch):** die zwei realen Test-Leads vom 14.07. (13 s Abstand, einer email-only, einer phone-only) landen über Kriterium (b) als Kandidat in der Queue — das ist bestanden, unabhängig von der späteren LLM-Confidence (Richtwert ≥0,7, weich bewertet). Commit.

### Task 5: Review-UI (Admin) + Kanonisierung in Attribution/Journeys

**Files:** Modify: `src/app/[brand]/attribution/page.tsx` (neuer Tab „Identitäten"), `convex/identity.ts` (+admin-Queries/Mutations), `convex/attribution.ts` + `convex/actions/computeAttribution.ts` (Kanonisierungs-Map)

* Review-Tab: offene Vorschläge mit Confidence, Begründung, Evidenz-Vergleich, aiLog aufklappbar; Bestätigen/Ablehnen (approve schreibt normalisierte Kante source "review_approved" + createdBy Admin — NUR bei `IDENTITY_MERGE_ENABLED`, sonst Gate-Hinweis); Entscheidungs-Historie.
* **Cluster-Gathering (F1-Fix, betrifft DREI Leser — Review-F7, kein Ein-Punkt-Eingriff):** neuer interner Loader `clusterFor(personId)` → Mitglieder via canonicalMap → `clusterKeys` (alle pids + personIds des Clusters) → Touchpoints als Union über `by_pid` je pid UND `by_person` je Mitglied; Conversions als Union über `by_person` je Mitglied. Konsumenten: (1) `touchpointsFor` (Signatur ändert sich auf {brandId, personIds[], pids[]}), (2) `journeyList`, (3) Engine-Loader in `computeAttribution`. attributionFacts-Schema unverändert.
* **Approve-Recompute (Review-F6):** approve/reject triggert `ctx.scheduler.runAfter(0, computeAttribution, {brandSlug})` — sonst zeigen die vorberechneten Facts den Merge erst nach dem Nacht-Cron, während journeyList ihn live zeigt.
* [ ] Bauen, `npm run build`, dev-Smoke (Flag an in dev: approve → Journey zeigt beide Conversions einer Person; nach dem getriggerten Engine-Lauf rechnet auch die Attribution zusammen). Commit.

### Task 6: Cron + Prod-Deploy (Flag AUS) + Doku

* [ ] Crons: `runDeterministicMerge` täglich 07:15 (vor Attribution 07:20!), Matcher wöchentlich. Prod-Deploy mit `IDENTITY_MERGE_ENABLED=false` — Queue füllt sich, nichts merged. Mission Control + Memory: „C gebaut, wartet auf DSB-Freigabe; Aktivierung = ein Env-Flip + Review-Abarbeitung".

## Bewusst NICHT in diesem Plan

Auto-Merge über Telefon/Namen (nie automatisch), Cross-Brand-Identitäten (jede Brand bleibt getrennter Mandant), HubSpot-Schlüssel (kommen mit B-Punkt 5 dazu — Schema ist vorbereitet), rückwirkende Verknüpfung anonymer AE-Daten (architektonisch ausgeschlossen, bleibt so), Löschprozess-Automatik (gehört ins Governance-Paket, manueller Prozess dokumentiert dort).

## Offene DSB-Fragen (→ Governance-Paket, VOR Aktivierung zu klären)

1. Dürfen pseudonyme Evidenzdaten (Zeitstempel, Schlüsseltyp-Muster, Kampagnen-IDs) zur Merge-Bewertung an Anthropic (Auftragsverarbeiter, US) gesendet werden — und gilt das auch für DEV-Tests vor DSFA-Abschluss? (bestimmt, wann `IDENTITY_MATCHER_LLM_ENABLED` überhaupt in dev an darf)
2. Aufbewahrung der `aiLog`-Einträge (revisionsfest vs. Löschkonzept — Zielkonflikt dokumentieren).
3. Ist die ungated Queue-Befüllung (reine DB-Kandidatenliste ohne KI) vor DSFA vertretbar? (Plan-Annahme: ja, da kein neuer Verarbeitungszweck — bitte bestätigen.)

## Self-Review (v2)

* F1-Blocker behoben: Touchpoint-Sammlung über pid+personId-Union des Clusters, drei Konsumenten benannt. ✓
* Governance: KI-Aufrufe eigenständig gated (F2), Evidenz-Allowlist ohne urlPath/keyword (F3), ungated bleibt nur DB-interne Analyse (F8); aiLog + Entscheider-Protokoll unverändert. ✓
* Robustheit: Paar-Normalisierung (F4), deterministischer Repräsentant ehrlich als technischer Schlüssel (F5), Approve-Recompute (F6), Brand-Partition (F12), Kandidaten-Limit + enge Kriterien (F11). ✓
* Abnahmetest deterministisch über die Kandidaten-Enumeration statt LLM-Confidence (F10). ✓
* Ehrliche Erwartung: deterministische Email-Merges werden erst mit HubSpot real (F9) — der Sofort-Nutzen ist shared-Erkennung + der reale 2-Leads-Fall in der Queue.
* Review-Historie: v1→v2 auf Basis des Opus/deep-reasoner-Reviews (Codex-Quota erschöpft, Reset 20.07. — optionaler Codex-Zweitreview danach).
