# NetCo Datalake + Customer-Journey-Attribution — Design

Datum: 2026-07-13 · **v2** (nach adversarialem Codex-Review, 10 Findings eingearbeitet)
Status: Entwurf, wartet auf Klaus-Review
Positionierung V1: **consentbasierte, deterministische Multi-Touch-Attribution auf eigener Infrastruktur** — nicht „Hyros-Klon". Call-Tracking/DNI, LTV und Conversion-Rückspielung sind eigene, spätere Pakete (siehe §5 F).
Scope: BauTV+ als Pilot, Datenmodell mandantenfähig über referenzielle `brandId` (bestehende `brands`-Tabelle) für Body-Cam und Microvista.

## 1. Ziel

Jede Conversion (Lead → MQL → SQL → Auftrag) bis auf das **einzelne Werbeelement** (Anzeige, Keyword, Creative) zurückverfolgen — über Web, Google/Microsoft/Meta-Ads, Newsletter, Anrufe (via CRM-Logging), CRM-Verlauf und Messekontakte. Deterministisches Matching zuerst; KI schlägt nur vor, ein Mensch bestätigt. Danach: Dashboards und Reports auf dieser Datenbasis.

## 2. Ist-Stand (verifiziert 13.07.2026)

| Baustein | Zustand |
|---|---|
| Web-Events | First-Party-Beacon → Cloudflare Analytics Engine: pv/eng + ChatBob, UTM + eine ClickID, consent-pid. **Flüchtig, nicht joinbar** |
| Server-Conversions | `/api/contact` → sGTM → Google EC / Meta CAPI / MS UET mit gclid/fbc/msclkid + event_id. **Wird nirgends bei uns gespeichert** |
| Leads | Nur E-Mail an Vertrieb + CleverReach-DOI. **Kein eigener Lead-Store** |
| Kosten | NetCo Dashboard (Convex): Google Ads täglich. **Microsoft/Meta fehlen** |
| Ad-Level-Kennung | Auto-Tagging (gclid) aktiv, **keine ValueTrack-/UTM-Templates** |
| CRM | HubSpot-Scopes bei Johannes, noch keine Anbindung |
| Dashboard-Auth | Frontend-Gate; **Server-Queries noch nicht durchgängig gehärtet** — wird mit diesem Projekt Pflicht |

## 3. Architektur (5 Schichten)

```
ERFASSUNG    Website-Beacon + /api/contact + ValueTrack-URLs
                 │  consentierte Events + alle Leads
INGEST       Convex-HTTP-Endpoint (HMAC je Mandant, Timestamp+Nonce) + Crons
                 │  (HubSpot, Ads-Kosten, CleverReach, click_view) — mit Cursor/Checkpoint
IDENTITY     identityKeys + identityEdges (Evidenz, Zeitraum, Konflikt-Status,
                 │  Split/Undo) — Auto-Merge nur bei konfliktfreien Schlüsseln;
                 │  KI erzeugt ausschließlich Review-Vorschläge
JOURNEY      touchpoints + conversions + sourceRecords (Quell-Dedupe) je Identity
                 │
ATTRIBUTION  Modelle als pure functions → denormalisierte attributionFacts mit
             generation-Versionierung → Reports im Dashboard
```

Speicherort: **Convex beim NetCo Dashboard** (Entscheid Klaus 13.07.) — Kosten, Crons, Auth, Report-UI existieren dort. Convex-Leitplanken (16 MiB/Transaktion, 32k Dokument-Scans, begrenzte parallele Scheduled Jobs) werden durch partitionierte Cursor-Jobs, Checkpoints und getrennte Raw-/Aggregat-Tabellen eingehalten; vor Paket B entsteht ein kurzes Lastmodell (erwartete Events/Tag je Marke × Retention × Attribution-Multiplikation).

## 4. Datenmodell (Convex, alle Tabellen mit `brandId`)

```
persons          _id, brandId, hubspotContactId?, firstSeen, canonical (bool)
identityKeys     personId, keyType (emailHmac | phoneHmac | pid | gaClientId |
                 hubspotContactId), keyValue, validFrom, validTo?, evidence
                 (sourceRef), conflictStatus (unique | shared | disputed)
identityEdges    personA, personB, relation (same_person | same_company),
                 source (deterministic | ai_suggested | manual), confidence?,
                 begruendung?, status (active | undone), createdAt, undoneAt?
                 → Merge = Edge, nie destruktives Zusammenkopieren; Split = undo
companies        _id, brandId, hubspotCompanyId?, name-Hash
devices          implizit über pid/gaClientId als eigene Key-Typen — Cross-Device
                 NUR über harte Anker (gleiche E-Mail/Telefon), nie heuristisch
sourceRecords    brandId, source (web | hubspot | cleverreach | ads | fair),
                 sourceAccount, objectType, externalId, eventType, sourceVersion
                 → UNIQUE-Schlüssel; jeder Ingest prüft hier zuerst (Dedupe
                 Lead-Formular vs. späterer HubSpot-Import). Unsere event_id
                 wird als Custom-Property nach HubSpot propagiert.
touchpoints      personId?, brandId, ts, type (ad_click | pageview | form_start |
                 email_click | nl_click | call | meeting | chat | fair_contact),
                 channel, campaignId?, adgroupId?, adId?, keyword?, device?,
                 urlPath?, sourceRecordId, fields (Allowlist statt raw-Dump)
conversions      personId, brandId, ts, type (lead | mql | sql | deal_won |
                 deal_lost), value?, currency, hubspotDealId?, sourceRecordId
consentLedger    personId, purpose (analytics | ads), consentId, legalBasis
                 (consent | contract | legitimate_interest), grantedAt,
                 revokedAt?, retentionUntil
adCosts          brandId, channel, date, campaignId, adgroupId, adId,
                 impressions, clicks, spend, currency
attributionFacts brandId, generation, model, modelVersion, lookbackDays,
                 conversionDate, conversionType, channel, campaignId, adgroupId,
                 adId, weightedValue, weightedCount
                 → denormalisiert, reportfertig ohne Joins; Neuberechnung
                 schreibt generation+1 und swappt atomar; Invalidation-Queue
                 bei Merge/Split, Deal-Korrektur, spätem Touchpoint, Widerruf.
                 Integritätsprüfung: Σ weight je Conversion = 1.
identityReview   Kandidaten-Paare (KI oder Konflikt), confidence, begruendung,
                 status (offen | bestaetigt | abgelehnt), decidedBy, decidedAt
```

**PII-Regeln (verschärft):**
- Interne Matching-Keys sind **HMAC-SHA-256 mit eigenem, rotierbarem Secret** (nicht die Plattform-SHA-Hashes — die bleiben getrennt im Versandpfad). Hashes gelten als pseudonymisierte personenbezogene Daten, nicht als anonym — Auskunft/Berichtigung/Löschung laufen über die HubSpot-Referenz.
- **Kein `raw`-Feld.** Touchpoints speichern nur Allowlist-Felder.
- Löschung/Widerruf über den `consentLedger`: Widerruf trennt die betroffenen Kanten, löscht consentbasierte Events samt abgeleiteter Facts (Invalidation → Neuberechnung), setzt Tombstones. CRM-Daten mit eigener Rechtsgrundlage (Vertrag) bleiben davon getrennt bestehen.
- Anonyme Pre-Consent-Events bleiben in Analytics Engine und werden nie rückwirkend verknüpft.

**Governance-Gate (vor Produktiv-Ingest von Paket C):** DSFA + Verarbeitungsverzeichnis-Eintrag + Rechtsgrundlagen-/Zweckmatrix mit dem DSB (Ralph Angerstein). Bis dahin: KI-Merges werden NIE automatisch übernommen — jeder Vorschlag läuft durch die Review-Queue, vollständige KI-Eingaben und Entscheidungen werden revisionsfest geloggt.

## 5. Arbeitspakete

### A — Fundament (~1–2 Tage) — **A1 sofort**
1. **Tracking-Templates** (Konto-Ebene): Google Final-URL-Suffix `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&gad_group={adgroupid}&gad_device={device}`; Microsoft analog (`{CampaignId}/{AdGroupId}/{AdId}/{keyword:default}`); Meta-UTM-Vorlage (`{{campaign.id}}/{{adset.id}}/{{ad.id}}`). gclid bleibt Backstop.
2. **Beacon erweitert** (`functions/api/ev.ts`): ad-level UTM/gad-Felder; **Dual-Write consentierter Events** an Convex-HTTP-Endpoint — Auth per **mandantenspezifischem HMAC + Timestamp + Nonce** (kein globales Shared Secret), Secret rotierbar.
3. **Lead-Store**: `/api/contact` schreibt jede Anfrage als sourceRecord + conversion(lead) + touchpoint nach Convex (HMAC-Keys, ClickIDs, UTM, event_id, value); dieselbe event_id geht später als Custom-Property nach HubSpot (Dedupe-Anker).
4. **Server-Auth-Härtung**: `requireBrandAccess` für alle neuen Funktionen, sensible Logik als `internal*`; bestehende Report-Queries ziehen nach (die bekannte offene Flanke).

### B — Quellen-Connectoren (~3 Tage, HubSpot abhängig von Johannes)
5. HubSpot-Sync (Kontakte/Firmen/Deals/Aktivitäten inkl. Anrufe) → sourceRecords/persons/touchpoints/conversions; Lifecycle-Übergänge als eigene Records, nicht als Kontakt-Duplikat.
6. Microsoft- + Meta-Kosten-Connector ins adCosts-Schema; Google Ads auf adId-Tiefe erweitern.
7. CleverReach-Events (Mailings, Klicks) → touchpoints via emailHmac.
8. Google `click_view`-Backstop (gclid→creative, nur 90 Tage rückwirkend — früh aktivieren).
9. Messe-/CSV-Import (admin-only) → sourceRecords + identityReview-Kandidaten.

### C — Identity (~2 Tage) — erst nach Governance-Gate produktiv
10. Deterministischer Merger: Edge nur bei **konfliktfreiem** Schlüssel (emailHmac/hubspotContactId eindeutig); geteilte Büro-Nummern/Sammel-Mails ⇒ `conflictStatus=shared`, kein Auto-Merge. Firmen-Rollup als `same_company`-Edge — **Account-Attribution wird separat ausgewiesen, nie als Personen-Journey verkauft**.
11. KI-Vorschlags-Matcher (Claude, App-Runtime): Namens-/Firmenvarianten, Messe-Listen, Anrufnummern-Formate → ausschließlich identityReview-Einträge mit Confidence + Begründung. Kein Auto-Merge.

### D — Attribution + Reports (~2–3 Tage)
12. Engine: Touchpoints im Lookback (Default 90 Tage) je Conversion, 6 Modelle (first/last/last-non-direct/linear/position/time-decay) → attributionFacts mit generation-Swap + Invalidation-Queue.
13. Dashboard-Sections (admin-only): *Attribution* (Ad-Level: Spend × Leads/Umsatz × ROAS, Modell-Umschalter), *Journeys* (Timeline je Person/Firma), *Review* (Merge-Queue), QA-Alerts (Event-Einbruch, Kosten ohne Kampagne, Σweight≠1, Facts-Staleness).

### E — Governance (parallel zu B, vor C-Produktivbetrieb)
14. DSFA + Verarbeitungsverzeichnis + Rechtsgrundlagen-Matrix mit DSB; Betroffenenprozess (Auskunft/Löschung) dokumentiert; Lastmodell für Convex.

### F — bewusst später
Call-Tracking/DNI (dynamische Rufnummern) + Telefonanlagen-Integration; Conversion-Outbox (qualifizierte Offline-Conversions zurück an Google/Meta/MS); LTV/wiederkehrender Umsatz; datengetriebenes Attributionsmodell (braucht Exposures + Nicht-Konvertierer + idealerweise Holdouts); Body-Cam/Microvista-Anbindung; LinkedIn/Taboola.

## 6. Ehrliche Einordnung gegenüber Hyros/Tracify

V1 liefert: lückenlose consentbasierte Web-Journey mit Ad-Level-Auflösung, CRM-Durchgriff bis Umsatz, sechs Regelmodelle, nachvollziehbare (nie automatische) KI-Merge-Vorschläge. V1 liefert NICHT: consentfreies Tracking-Matching, heuristisches Cross-Device, Call-DNI, verhaltensbasierte „AI-Attribution". Das meiste davon ist bei den Anbietern Produkt-Claim ohne unabhängigen Beleg; was davon real nützt (Call-Tracking, Conversion-Rückspielung), steht als Paket F im Plan.

## 7. Risiken / offene Punkte

- **Consent-Reichweite** begrenzt Journey-Abdeckung — Ablehner-Quote im Dashboard ehrlich ausweisen.
- **Anruf-Attribution** hängt bis Paket F am HubSpot-Logging des Vertriebs (Prozessfrage).
- **HubSpot-Engagement-Scopes** evtl. nachfordern (fehlten in Johannes' Liste).
- **Umsatz/Marge** braucht gepflegte Deal-Beträge (Prozessfrage Vertrieb).
- **DSB-Kapazität** fürs Governance-Gate — früh anfragen, sonst blockiert C.

## 8. Reihenfolge

A1 (Templates) **sofort** → A2–A4 + Schema → B parallel zu E (Governance) → C nach Gate → D. Erste sichtbare Reports (Ad-Level-Kosten × Web-Leads deterministisch) sind schon nach A+B möglich — ohne KI, ohne Merge-Risiken.
