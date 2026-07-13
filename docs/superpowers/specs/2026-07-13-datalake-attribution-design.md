# NetCo Datalake + Customer-Journey-Attribution — Design

Datum: 2026-07-13
Status: Entwurf, wartet auf Klaus-Review
Vorbild: Hyros/Tracify-Funktionsumfang, aber auf eigener Infrastruktur (Datenhoheit).
Scope: BauTV+ als Pilot, Datenmodell von Anfang an mandantenfähig (`brand`-Feld) für Body-Cam und Microvista.

## 1. Ziel

Jede Conversion (Lead → MQL → SQL → Auftrag) bis auf das **einzelne Werbeelement** (Anzeige, Keyword, Creative) zurückverfolgen — über Web, Google/Microsoft/Meta-Ads, Newsletter, Telefonanrufe, CRM-Verlauf und Messekontakte hinweg. Deterministisches Matching zuerst, KI nur für die Grauzone. Danach: Dashboards und Reports auf dieser Datenbasis.

## 2. Ist-Stand (verifiziert 13.07.2026)

| Baustein | Zustand |
|---|---|
| Web-Events | First-Party-Beacon → Cloudflare Analytics Engine (`bautv_analytics`): pv/eng + ChatBob, UTM + eine ClickID, consent-pid. **Flüchtig** (AE-Retention), **nicht joinbar** |
| Server-Conversions | `/api/contact` → sGTM → Google EC / Meta CAPI / MS UET mit gclid/fbc/msclkid + event_id. **Wird nirgends bei uns gespeichert** |
| Leads | Nur E-Mail an Vertrieb + CleverReach-DOI. **Kein eigener Lead-Store** |
| Kosten | NetCo Dashboard (Convex): Google Ads täglich. **Microsoft/Meta-Kosten fehlen** |
| Ad-Level-Kennung | Auto-Tagging (gclid) aktiv, aber **keine ValueTrack-/UTM-Templates** → Klick verrät Kampagne erst nach API-Umweg, Anzeige gar nicht |
| CRM | HubSpot-Scopes liegen bei Johannes, noch keine Anbindung |
| Identity | pid (consent), E-Mail/Telefon nur im Mail-Postfach |

## 3. Architektur (5 Schichten)

```
ERFASSUNG          Website-Beacon + /api/contact + ValueTrack-URLs
                        │ (consentierte Events + alle Leads)
INGEST             Convex-HTTP-Endpoint (live) + Crons (HubSpot, Ads-Kosten,
                        │  CleverReach, click_view-Backstop) — bestehendes Cron-Muster
IDENTITY           identities-Graph: deterministische Merges (Hash/ClickID/pid)
                        │  + KI-Fuzzy-Matcher mit Review-Queue
JOURNEY            touchpoints + conversions je Identity, zeitlich sortiert
                        │
ATTRIBUTION        Modelle (first/last/last-non-direct/linear/position/time-decay)
                   → Gewichte je (Conversion × Touchpoint) → Reports im Dashboard
```

Alles in **Convex beim NetCo Dashboard** (Entscheid Klaus 13.07.): Kosten-Daten, Crons, Auth und Report-UI existieren dort schon; Journeys entstehen neben den Reports, kein zweites System.

## 4. Datenmodell (Convex-Tabellen, alle mit `brand`)

```
identities      _id, brand, emailSha256[], phoneSha256[], pids[], gaClientIds[],
                hubspotContactId?, hubspotCompanyId?, firstSeen, mergedFrom[],
                matchSource (deterministic | ai | manual), reviewStatus?
touchpoints     identityId?, brand, ts, type (ad_click | pageview | form_start |
                email_click | nl_click | call | meeting | chat | fair_contact),
                channel, campaignId?, adgroupId?, adId?, keyword?, device?,
                urlPath?, sourceRef (event_id | hubspot-activity-id | cr-mailing-id),
                raw (Originalfelder)
conversions     identityId, brand, ts, type (lead | mql | sql | deal_won | deal_lost),
                value?, currency, hubspotDealId?, eventId (Dedupe zum sGTM-Event)
adCosts         brand, channel, date, campaignId, adgroupId, adId, impressions,
                clicks, spend, currency          ← Standard-Schema, alle Plattformen
attribution     conversionId, model, touchpointId, weight   (materialisiert je Modell)
identityReview  Kandidaten-Paare aus dem KI-Matcher mit Confidence + Begründung,
                Status offen/bestätigt/abgelehnt (Dashboard-UI)
```

PII-Regel: Der Datalake speichert E-Mail/Telefon **nur als SHA-256** plus HubSpot-IDs als Referenz. Klartext lebt ausschließlich in HubSpot/Postfach. Löschung in HubSpot ⇒ Cron löscht Identity-Zweig (Löschkonzept aus dem etracker-Abgleich). Anonyme Pre-Consent-Events bleiben in Analytics Engine und werden **nie** rückwirkend verknüpft.

## 5. Die fünf Arbeitspakete

### A — Fundament (Website + Konten, ~1 Tag)
1. **Tracking-Templates setzen** (Konto-Ebene, einmalig):
   - Google Ads: Final-URL-Suffix `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&gad_group={adgroupid}&gad_device={device}`
   - Microsoft Ads: analog mit `{CampaignId}/{AdGroupId}/{AdId}/{keyword:default}`
   - Meta: UTM-Vorlage mit `{{campaign.id}}/{{adset.id}}/{{ad.id}}`
   → ab dann trägt jeder Klick das Werbeelement in der URL; gclid bleibt als Backstop.
2. **Beacon erweitert** (`functions/api/ev.ts`): utm_content/utm_term + gad_*-Felder in die Blobs; parallel **Dual-Write consentierter Events** an einen neuen Convex-HTTP-Endpoint (`/datalake/ingest`, Shared-Secret). Anonyme Events bleiben AE-only.
3. **Lead-Store**: `/api/contact` schreibt jede Anfrage zusätzlich nach Convex (Hashes, ClickIDs, UTMs, event_id, interesse, value) — derselbe Payload, der ans sGTM geht.

### B — Quellen-Connectoren (Convex-Crons, ~2–3 Tage, HubSpot abhängig von Johannes)
4. **HubSpot-Sync**: Kontakte/Firmen/Deals/Aktivitäten (inkl. geloggter Anrufe und Meetings) → identities + touchpoints + conversions. Lifecycle-Übergänge = MQL/SQL-Conversions, `deal_won` mit Betrag.
5. **Microsoft- und Meta-Kosten-Connector** ins `adCosts`-Schema (Google Ads liegt vor, wird auf adId-Tiefe erweitert).
6. **CleverReach-Events**: Mailings + Empfänger-Klicks → touchpoints (`nl_click`), Match über emailSha256.
7. **click_view-Backstop** (Google Ads API): gclid → campaign/adgroup/creative für Klicks ohne ValueTrack (nur 90 Tage rückwirkend abrufbar — früh einschalten).
8. **Messe-/Manuell-Import**: CSV-Upload + Formular im Dashboard (`fair_contact`-Touchpoints, admin-only).

### C — Identity + KI (~2 Tage)
9. **Deterministischer Merger** (Convex-Function, läuft bei jedem Ingest): gleicher emailSha256 ∨ phoneSha256 ∨ pid ∨ hubspotContactId ⇒ merge. Firmen-Rollup über hubspotCompanyId (B2B: Account-Journey, mehrere Personen einer Firma).
10. **KI-Fuzzy-Matcher** (Cron, Claude über App-Runtime-Key): bewertet Kandidaten-Paare, die deterministisch nicht zusammenfinden — Anrufnummern-Formate, Namens-/Firmenvarianten, Messe-Listen gegen CRM. Output: Confidence + Ein-Satz-Begründung. ≥0,9 auto-merge (als `ai` markiert, umkehrbar), darunter → `identityReview`-Queue im Dashboard, Mensch bestätigt. KI sieht nur die Match-Felder, nie ganze Datensätze.

### D — Attribution + Reports (~2–3 Tage)
11. **Engine**: je Conversion Touchpoints im Lookback-Fenster (Default 90 Tage, konfigurierbar) einsammeln, sechs Modelle als pure functions, Ergebnisse materialisieren. Regeln aus dem etracker-Abgleich: Direct-Definition, interne Referrer raus, Kampagnenwechsel bricht Session nicht.
12. **Dashboard-Sections** (admin-only zuerst): *Attribution* (Ad-Level-Tabelle: Spend × attributierte Leads/Umsatz × ROAS, Modell-Umschalter, Modell-Vergleich), *Journeys* (Timeline je Identity/Firma, Suche über HubSpot-Referenz), *Review* (KI-Merge-Queue). QA-Alerts: Events-Einbruch, Kosten ohne Kampagne, Conversions ohne Touchpoint.

### E — später (bewusst NICHT jetzt)
Datengetriebenes Modell (braucht Monate an Daten), Body-Cam/Microvista-Anbindung (Schema steht bereit), Telefonanlagen-Integration (bis dahin: Anrufe via HubSpot-Logging + Website-Call-Clicks), LinkedIn/Taboola-Kosten.

## 6. Was der KI-Einsatz konkret ist — und was nicht

Hyros verkauft „AI attribution"; der belastbare Kern ist deterministisches Identity-Matching plus gutes Tracking. Genau so bauen wir: **ClickIDs, Hashes und pids lösen ~90 % der Fälle exakt.** KI übernimmt nur, was Regeln nicht können: unscharfe Namen, Firmenzuordnung, Messe-Listen, Anruf-Zuordnung. Jeder KI-Merge ist markiert, begründet und umkehrbar — keine Blackbox-Attribution.

## 7. Risiken / offene Punkte

- **Consent-Reichweite**: Journeys entstehen nur für Besucher mit Einwilligung; die Ablehner-Quote begrenzt die Abdeckung (ehrlich ausweisen, nicht schätzen).
- **Anruf-Quelle**: solange die Telefonanlage nichts liefert, hängt Anruf-Attribution am Vertriebs-Logging in HubSpot (Disziplin-Frage).
- **HubSpot-Aktivitäts-Scopes**: in Johannes' Liste fehlten granulare Engagement-Scopes — ggf. nachfordern, sobald der Sync konkrete 403s liefert.
- **Convex-Volumen**: consentierte Events + Touchpoints für B2B-Traffic sind unkritisch; sollte eine Marke B2C-Volumen bringen, Events aggregieren statt roh speichern (Schema lässt beides zu).
- **Umsatz/Marge**: braucht gepflegte Deal-Beträge in HubSpot — Prozessfrage an den Vertrieb.

## 8. Reihenfolge-Empfehlung

A1 (Tracking-Templates) **sofort** — jeder Tag ohne ValueTrack ist ein Tag ohne Ad-Level-Daten, und click_view reicht nur 90 Tage zurück. Dann A2/A3 + Schema, dann B parallel zum HubSpot-Fortschritt, C sobald zwei Quellen liefern, D zum Schluss.
