# Datalake Paket C — Identity (deterministischer Merger + KI-Review-Queue)

**Version 1 (14.07.).** Design: `docs/superpowers/specs/2026-07-13-datalake-attribution-design.md` §5 C (Punkte 10+11) + §Governance-Gate.

**HARTES GATE: Dieses Paket wird GEPLANT und gebaut, aber NICHT produktiv geschaltet, bevor DSFA + Verarbeitungsverzeichnis + Rechtsgrundlagen-Matrix mit dem DSB (Ralph Angerstein) abgeschlossen sind.** Klaus gibt das Governance-Paket heute an Legal. Alle Merge-Funktionen bleiben bis zur Freigabe hinter einem Feature-Flag (`IDENTITY_MERGE_ENABLED`, Convex-Env, Default aus). KI-Merges werden NIE automatisch übernommen — jeder Vorschlag läuft durch die Review-Queue; vollständige KI-Eingaben und Entscheidungen werden revisionsfest geloggt (Design §Governance).

**For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans, Task für Task. Checkboxen (`- [ ]`).

**Goal:** Personen, die über mehrere Schlüssel auftreten (E-Mail-HMAC, Telefon-HMAC, pid, künftig hubspotContactId), werden zusammengeführt — deterministisch nur bei konfliktfreien Schlüsseln, sonst als KI-Vorschlag mit menschlicher Prüfung. Ergebnis: Journeys und Attribution sehen EINE Person statt Fragmente (der reale Fall vom 14.07. — zwei Test-Leads derselben Person, einer nur Mail, einer nur Telefon — wird zusammenführbar).

**Architecture:** Merge-Modell „Kanten statt Löschen": Personen werden nicht gelöscht, sondern über eine `personEdges`-Tabelle verbunden; eine kanonische Person (älteste firstSeen) repräsentiert den Cluster. Alle Leser (Attribution, Journeys) lösen personId → canonicalId über eine Map auf. Vorteile: reversibel (Unmerge = Kante deaktivieren), revisionsfest, kein Umschreiben historischer Fremdschlüssel (touchpoints/conversions behalten ihre personId).

**Repo:** NUR DASH.

## Global Constraints

* Feature-Flag `IDENTITY_MERGE_ENABLED` (Convex-Env, "false"): Merger-Cron und Review-Aktionen prüfen es; UI zeigt Gate-Hinweis solange aus.
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

* `canonicalMap(edges: {from, to, kind, status}[]): Map<string,string>` — Union-Find über AKTIVE same_person-Kanten; Repräsentant = kleinste/älteste Person-Id (deterministisch); same_company wird ignoriert.
* `findDeterministicMerges(keys: {personId, keyType, keyValue, conflictStatus}[]): {a, b, reason}[]` — Paare mit exakt gleichem unique-Schlüssel (nur emailHmac/hubspotContactId); Schlüssel, die bei >1 Person auftreten und NICHT mergebar sind (phoneHmac/pid), als `sharedCandidates` zurückgeben (→ conflictStatus-Update + Review-Kandidat).
* [ ] Failing Tests (Union-Find-Ketten, Determinismus, shared-Erkennung, phone merged nie deterministisch) → implementieren → grün. Commit.

### Task 3: Deterministischer Merger (internal, flag-gated)

**Files:** Create: `convex/identity.ts`

* `internal.identity.runDeterministicMerge({brandSlug?})` (internalMutation oder Action mit Mutations): lädt identityKeys je Brand, `findDeterministicMerges` → für neue Paare personEdges einfügen (source "deterministic", createdBy "system"); sharedCandidates → conflictStatus "shared" patchen + identityReview-Eintrag (kind same_person, confidence 0.5, rationale "geteilter Schlüssel — menschliche Prüfung nötig", ohne aiLog).
* Flag-Check am Anfang: `IDENTITY_MERGE_ENABLED !== "true"` → Rückgabe `{gated: true}` ohne Schreibvorgang.
* Idempotent: bestehende aktive Kante für Paar → skip.
* [ ] Bauen + dev-Smoke mit Flag aus (gated) und Flag an in DEV (die zwei Test-Leads: kein gemeinsamer Schlüssel → erwartet 0 Merges, 0 shared — Negativtest). Commit.

### Task 4: KI-Vorschlags-Matcher (App-Runtime, flag-unabhängig sichtbar, aber nur Queue)

**Files:** Create: `convex/actions/identityMatcher.ts` ("use node")

* Kandidaten-Suche OHNE KI vorab (Blocking): Personen-Paare derselben Brand mit (a) gleichem phoneHmac, (b) ähnlicher Zeitnähe von Conversions (±1 h) ohne gemeinsamen Schlüssel, (c) künftig HubSpot-Namensvarianten. Nur Paare ohne bestehende Kante/offenes Review.
* Je Kandidat EIN Claude-Aufruf (App-Runtime-Key, NICHT Subscription — Design sieht App-Runtime vor; Modell claude-haiku-4-5, Kosten trivial bei einstelligen Kandidaten): Eingabe = pseudonymisierte Evidenz (HMAC-Präfixe, Zeitstempel, Kampagnenkontext — KEINE Klartext-PII, die existiert im Store ohnehin nicht). Ausgabe strukturiert {same_person: bool, confidence, rationale}.
* Ergebnis IMMER nur als identityReview-Eintrag mit vollständigem `aiLog`. Kein Kanten-Write.
* Cron: wöchentlich (Montag 07:30), zusätzlich manuell triggerbar. Läuft auch bei Flag aus (Queue füllen ist erlaubt — nur MERGEN ist gated); im UI klar beschriftet.
* [ ] Bauen + Smoke: die zwei Test-Leads (Conversions 13 s auseinander, kein gemeinsamer Schlüssel) MÜSSEN als Kandidat mit hoher Confidence in der Queue landen — das ist der Abnahmetest. Commit.

### Task 5: Review-UI (Admin) + Kanonisierung in Attribution/Journeys

**Files:** Modify: `src/app/[brand]/attribution/page.tsx` (neuer Tab „Identitäten"), `convex/identity.ts` (+admin-Queries/Mutations), `convex/attribution.ts` + `convex/actions/computeAttribution.ts` (Kanonisierungs-Map)

* Review-Tab: offene Vorschläge mit Confidence, Begründung, Evidenz-Vergleich, aiLog aufklappbar; Buttons Bestätigen/Ablehnen (approve schreibt Kante source "review_approved" + createdBy Admin — NUR bei Flag an, sonst Hinweis „Governance-Gate: Freigabe ausstehend"); Entscheidungs-Historie einsehbar.
* Engine: `touchpointsFor`/Journey-Loader lösen personId über canonicalMap auf (Touchpoints + Conversions aller Cluster-Mitglieder zusammen); attributionFacts unverändert im Schema.
* [ ] Bauen, `npm run build`, dev-Smoke (mit Flag an in dev: approve der Test-Lead-Kante → Journey zeigt beide Conversions einer Person, Attribution rechnet zusammen). Commit.

### Task 6: Cron + Prod-Deploy (Flag AUS) + Doku

* [ ] Crons: `runDeterministicMerge` täglich 07:15 (vor Attribution 07:20!), Matcher wöchentlich. Prod-Deploy mit `IDENTITY_MERGE_ENABLED=false` — Queue füllt sich, nichts merged. Mission Control + Memory: „C gebaut, wartet auf DSB-Freigabe; Aktivierung = ein Env-Flip + Review-Abarbeitung".

## Bewusst NICHT in diesem Plan

Auto-Merge über Telefon/Namen (nie automatisch), Cross-Brand-Identitäten (jede Brand bleibt getrennter Mandant), HubSpot-Schlüssel (kommen mit B-Punkt 5 dazu — Schema ist vorbereitet), rückwirkende Verknüpfung anonymer AE-Daten (architektonisch ausgeschlossen, bleibt so), Löschprozess-Automatik (gehört ins Governance-Paket, manueller Prozess dokumentiert dort).

## Self-Review

* Governance: Flag-Gate + Queue-only-KI + revisionsfestes aiLog + Entscheider-Protokoll = Design §Governance vollständig abgebildet. ✓
* Reversibilität: Kanten statt Umschreiben; Unmerge dokumentiert. ✓
* Der reale 2-Leads-Fall ist als Abnahmetest für den Matcher definiert. ✓
* Offene Risiken: Union-Find-Determinismus bei künftigen Löschungen (retracted-Kanten); Matcher-Kandidatensuche muss bei Wachstum gebremst werden (Limit je Lauf); App-Runtime-Key-Governance (kein Subscription-Key — CLAUDE.md-Regel: App-Runtime ist der erlaubte Fall).
