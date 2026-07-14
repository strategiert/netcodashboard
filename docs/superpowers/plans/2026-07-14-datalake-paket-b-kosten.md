# Datalake Paket B — Kosten-Connectoren (Google/MS/Meta + click_view)

**Version 2 (14.07., nach adversarialem Codex-Review — MS-Endpunkte, Schema-Key, NL-Brand, click_view-Offsets u. a. korrigiert).**

**For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development oder superpowers:executing-plans, Task für Task. Checkboxen (`- [ ]`) zum Abhaken.

**Goal:** Tägliche Ad-Level-Kosten (Kampagne/Adgroup/Ad/Tag) aus Google Ads, Microsoft Ads und Meta landen restatement-fest in Convex (`adCosts`); Google `click_view` sichert gclid→Ad-Zuordnung als Backstop (nur 90 Tage rückwirkend — Backfill sofort).

**Architecture:** Neue Convex-internalActions (`"use node"`) je Plattform schreiben per Upsert in `adCosts`. Technischer Dedupe-Key: `channel + sourceAccount + date + campaignId + adgroupId + adId` — OHNE brandId (Brand ist korrigierbare Klassifikation, nicht Identität). Tägliches Re-Fetch-Fenster 35 Tage fängt Plattform-Korrekturen; ein Stale-Sweep nach vollständigem Lauf entfernt Zeilen, die die Plattform nicht mehr liefert (Deletion-Restatement). Brand-Zuordnung über Kampagnennamen via bestehendem `detectBrand` (adsMapping.ts). Bestehendes `syncAds.ts` (KPI-Tagesaggregat) bleibt UNANGETASTET.

**Tech Stack:** Convex internalActions/internalMutations, Vitest, `fflate` (MS-Report-ZIP), REST: Google Ads API v22 (GAQL, `googleAds:search`), Bing Ads Reporting v13 (REST/JSON), Meta Graph v21.0.

**Repo:** NUR DASH = `C:\Users\karent\Documents\Software\netco\_shared\dashboard`.

## Global Constraints

* `convex/actions/syncAds.ts` NICHT verändern (bedient KPI-Snapshots; Regressionsgefahr). Neue Dateien daneben.
* `detectBrand`/`TRACKED_ADS_BRANDS` aus `convex/adsMapping.ts` wiederverwenden, nicht duplizieren. ACHTUNG: NL-Kampagnen mappen auf eigene Brands `bautv-nl`/`bodycam-nl` — NL-Spend darf NICHT in den DE-Brands landen.
* Alle neuen Actions/Mutations als `internal*` (Design-Vorgabe §Sicherheit) — Crons referenzieren `internal.…`. Kein öffentlicher Trigger; Debug nur über admin-gesicherte Query.
* Secrets: alle Werte stehen in `C:\Users\karent\.env` (MS_ADS_*, META_ADS_READ_TOKEN_NETCO); via `npx convex env set` in dev UND prod setzen. NIE ins Repo.
* Google nutzt vorhandene Convex-Envs `GADS_OAUTH_CLIENT_ID/SECRET`, `GADS_REFRESH_TOKEN`, `GADS_CUSTOMER_ID_NETCO`, `GADS_DEVELOPER_TOKEN`, `GADS_MANAGER_CUSTOMER_ID` (in Convex prod vorhanden — `syncAds` läuft damit).
* Convex-Action-Limit 10 Min: MS-Report-Poll mit Timeout-Abbruch (max ~8 Min).
* **Fehler müssen sichtbar fehlschlagen:** Actions werfen bei Fehlern/Truncation eine Exception (Cron-Log zeigt rot), statt still `{ error: … }` zurückzugeben. Bereits geschriebene Upserts bleiben stehen, aber der Stale-Sweep läuft dann NICHT.
* API-Feldnamen im Plan sind gegen Doku Stand 07/2026 geschrieben; bei 400ern: exakte Request-Shape gegen MS Learn / Meta-Doku prüfen, nicht raten.
* Live-Verifikation je Connector gegen echte Konten: Google/Meta liefern sofort Daten; MS NL-Konto (141454913) hat aktive Kampagnen.
* Nach jedem Task committen (Muster: `feat(datalake): …`).

**Lastmodell (Design-Gate §4):** 3 Kanäle × ≤80 aktive Ads × 35 Tage Fenster ≈ ≤8.400 Upserts/Tag, je 1 Query+1 Write → ~17k Ops/Tag; Stale-Sweep ein Index-Range-Scan je Kanal. Weit unter Convex-Limits. clickViews: ≤500 Klicks/Tag. Unkritisch.

---

### Task 1: Schema `adCosts` + `clickViews` + `oauthTokens` + Envs

**Files:** Modify: `convex/schema.ts` (ans Ende, vor `});`, unter den Datalake-Block von Paket A)

* [ ] **Step 1: Schema ergänzen**

```ts
  adCosts: defineTable({
    brandId: v.id("brands"),        // Klassifikation (detectBrand), NICHT Teil der Identität
    channel: v.string(),            // "google" | "bing" | "facebook"
    sourceAccount: v.string(),      // Plattform-Konto: Google-CID | MS-Account-ID | "act_…"
    date: v.string(),               // "YYYY-MM-DD" im Konto-Tag der jeweiligen Plattform
    campaignId: v.string(),
    campaignName: v.optional(v.string()),
    adgroupId: v.string(),          // "" wenn Ebene nicht existiert (z. B. PMax)
    adId: v.string(),               // "" wenn Ebene nicht existiert
    impressions: v.number(),
    clicks: v.number(),             // Meta: inline_link_clicks (Vergleichbarkeit, s. Task 4)
    spend: v.number(),              // EUR, UNGERUNDET (Rundung nur in der UI; Summen müssen Plattformtotalen entsprechen)
    currency: v.string(),
    syncedAt: v.number(),
  })
    // by_unique deckt per Präfix auch Range-Scans (channel, sourceAccount, date) für den Stale-Sweep ab.
    .index("by_unique", ["channel", "sourceAccount", "date", "campaignId", "adgroupId", "adId"])
    .index("by_brand_date", ["brandId", "date"]),

  clickViews: defineTable({
    brandId: v.id("brands"),
    sourceAccount: v.string(),
    gclid: v.string(),
    date: v.string(),
    campaignId: v.string(),
    adgroupId: v.string(),
    adId: v.string(),
    clickType: v.optional(v.string()),
    keyword: v.optional(v.string()),
    syncedAt: v.number(),
  })
    .index("by_gclid", ["gclid", "date"])
    .index("by_brand_date", ["brandId", "date"]),

  // MS rotiert Refresh-Tokens; der jeweils neueste MUSS persistiert werden, sonst stirbt der Cron irgendwann.
  oauthTokens: defineTable({
    provider: v.string(),           // "msads"
    refreshToken: v.string(),
    updatedAt: v.number(),
  }).index("by_provider", ["provider"]),
```

* [ ] **Step 2: Envs setzen** (Werte aus `C:\Users\karent\.env`):

```
npx convex env set MS_ADS_DEVELOPER_TOKEN <wert>
npx convex env set MS_ADS_CLIENT_ID <wert>
npx convex env set MS_ADS_CLIENT_SECRET <wert>
npx convex env set MS_ADS_REFRESH_TOKEN <wert>   # Seed; danach führt oauthTokens
npx convex env set MS_ADS_CUSTOMER_ID 251201552
npx convex env set MS_ADS_ACCOUNT_ID 141454913
npx convex env set META_ADS_READ_TOKEN_NETCO <wert>
npx convex env set META_AD_ACCOUNT_ID act_871686870212627
```

* [ ] **Step 3:** `npx convex dev --once` → functions ready. Commit.

### Task 2: Upsert-Mutation + Stale-Sweep + pure Helpers (TDD)

**Files:** Create: `convex/adCosts.ts`, `src/lib/adcosts-helpers.ts`, `src/lib/adcosts-helpers.test.ts`

**Interfaces:**
* `internal.adCosts.upsertBatch({ rows: AdCostRow[] })` — internalMutation; je Row: Lookup über `by_unique` (voller Key inkl. sourceAccount), bei Treffer `ctx.db.patch` (Metriken + brandId + syncedAt — brandId wird bei Rename-Korrekturen mitgezogen), sonst `insert`. Return `{ inserted, updated }`.
* `AdCostRow` = `{ brandSlug, channel, sourceAccount, date, campaignId, campaignName?, adgroupId, adId, impressions, clicks, spend, currency }` — Mutation löst brandSlug→brandId über `brands.by_slug` (Map einmal pro Batch bauen, nicht pro Row).
* `internal.adCosts.sweepStale({ channel, sourceAccount, dates, runStartedAt })` — internalMutation; löscht alle Rows mit `syncedAt < runStartedAt` in den gegebenen Tagen (Index-Präfix-Scan über `by_unique`). NUR nach vollständigem, fehlerfreiem Fetch aufrufen (Deletion-/Zero-Restatement). Return `{ deleted }`.
* Helpers (pure, testbar) in `adcosts-helpers.ts`:
  * `dateWindow(days: number, nowMs: number, offsetDays = 0): { start; end; dates }` (UTC, end = gestern − offsetDays) — Offset für gestückelten Backfill.
  * `parseMsAdsCsv(csv: string): MsRow[]` — Mini-RFC4180: BOM strippen, CRLF, quoted fields mit Kommas und escaped Quotes (`""`), Header-Zeile suchen (Spalten TimePeriod/CampaignId/CampaignName/AdGroupId/AdId/Impressions/Clicks/Spend/CurrencyCode), Fußzeilen (`@`/©) überspringen, leerer Report → `[]`.
  * `microsToEur(micros: number): number` — micros/1e6, NICHT runden.
  * `fetchWithRetry(url, init, opts)` — Retry bei 429/5xx (und Meta-Body-Codes 17/80004): `Retry-After`-Header respektieren, sonst exponentiell mit Jitter, max 3 Versuche, danach throw.
* [ ] **Step 1: Failing tests** — dateWindow (Fensterlänge, UTC-Kante, Offset), parseMsAdsCsv (Beispiel-CSV mit Header-Vorspann, quoted Kampagnenname mit Komma, Fußzeile, leerer Report), microsToEur (keine Rundung).
* [ ] **Step 2:** Fail verifizieren, implementieren, 100 % pass.
* [ ] **Step 3:** `upsertBatch` + `sweepStale` in `convex/adCosts.ts`. Zusätzlich `debugAdCosts`-Query (admin, exakt das `requireAdmin`-Muster aus `convex/users.ts` — NICHT dynamisch importieren) mit brandSlug+limit → letzte Zeilen nach `by_brand_date`.
* [ ] **Step 4:** Commit.

### Task 3: Google Ads auf Ad-Tiefe (`syncGadsCosts`)

**Files:** Create: `convex/actions/syncGadsCosts.ts` (`"use node"`, internalAction)

* [ ] **Step 1: Action bauen** — Token-Refresh wie in `syncAds.ts` (`getAdsToken`-Muster kopieren). `googleads.googleapis.com/v22/customers/{cid}/googleAds:search` (WIE syncAds — `{ results, nextPageToken }`; searchStream hat eine andere Response-Shape [Array von Batches], bewusst nicht verwenden) mit pageToken-Paging:

```sql
SELECT segments.date, campaign.id, campaign.name, ad_group.id,
       ad_group_ad.ad.id, metrics.cost_micros, metrics.clicks, metrics.impressions
FROM ad_group_ad
WHERE segments.date BETWEEN '<start>' AND '<end>'
```

  KEIN campaign.status-Filter — sonst veralten Rows entfernter Kampagnen im Fenster für immer.
* [ ] **Step 2: PMax-Fallback** — Performance-Max-Kampagnen haben keine `ad_group_ad`-Zeilen. Zweite Query auf Kampagnenebene, gleiches Fenster:

```sql
SELECT segments.date, campaign.id, campaign.name, metrics.cost_micros,
       metrics.clicks, metrics.impressions
FROM campaign
WHERE segments.date BETWEEN '<start>' AND '<end>'
  AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
```

  → Rows mit `adgroupId = ""`, `adId = ""`.
* [ ] **Step 3: Mapping + Sweep** — Fenster `dateWindow(35, Date.now())`. brandSlug via `detectBrand(campaign.name)` (Rows ohne Treffer verwerfen und zählen — im Log ausweisen), channel `"google"`, sourceAccount = GADS_CUSTOMER_ID_NETCO, spend = `microsToEur`, currency "EUR" (Konto-Währung). Batches à 500 an `upsertBatch`. Nach fehlerfreiem Komplettlauf: `sweepStale`.
* [ ] **Step 4: Smoke** — `npx convex run` → inserted/updated > 0; `debugAdCosts` zeigt Zeilen mit adId ≠ ""; **Tagessumme eines Tages (Summe spend über alle Rows) gegen Google-Ads-UI vergleichen (±1 %)**.
* [ ] **Step 5:** Commit.

### Task 4: Meta (`syncMetaCosts`)

**Files:** Create: `convex/actions/syncMetaCosts.ts` (`"use node"`, internalAction)

* [ ] **Step 1: Action bauen** —
  1. Vorab GET `graph.facebook.com/v21.0/{META_AD_ACCOUNT_ID}?fields=currency,timezone_name` → currency mitspeichern (keine hartkodierte Annahme), timezone nur loggen (Meta liefert Konto-Zeitzonen-Tage).
  2. GET `…/{META_AD_ACCOUNT_ID}/insights` mit
     `level=ad&fields=campaign_id,campaign_name,adset_id,ad_id,spend,impressions,clicks,inline_link_clicks&time_increment=1&time_range={"since":"<start>","until":"<end>"}&limit=500`
     Paging über `paging.next` (max 50 Seiten). **Wird die Kappung erreicht → Run gilt als truncated: Upserts behalten, KEIN sweepStale, am Ende Exception werfen.** Requests über `fetchWithRetry` (deckt Rate-Limit-Codes 17/80004, 429, 5xx).
  3. Mapping: date = `date_start`, adgroupId = `adset_id`, channel `"facebook"`, sourceAccount = META_AD_ACCOUNT_ID, brandSlug via `detectBrand(campaign_name)`, **clicks = `inline_link_clicks ?? 0`** (Link-Klicks, vergleichbar mit Google-Klicks; Meta-`clicks` zählt alle Interaktionen — Kommentar in Code).
* [ ] **Step 2: Sweep + Smoke** — nach vollständigem Lauf `sweepStale`. Smoke: Zeilen vorhanden (Konto hat aktive BC-Kampagnen, am 07.07. floss Spend); Tagessumme gegen Ads Manager (±1 %). `debugAdCosts` prüfen.
* [ ] **Step 3:** Commit.

### Task 5: Microsoft Ads (`syncMsCosts`)

**Files:** Create: `convex/actions/syncMsCosts.ts` (`"use node"`, internalAction); Modify: `package.json` (+`fflate`), `convex/adCosts.ts` (+`getMsRefreshToken`/`saveMsRefreshToken` auf `oauthTokens`, internal)

* [ ] **Step 1:** `npm install fflate`
* [ ] **Step 2: Action bauen** — vier Phasen:
  1. **Token:** Refresh-Token aus `oauthTokens` (provider "msads") lesen, Fallback env `MS_ADS_REFRESH_TOKEN`. POST `https://login.microsoftonline.com/common/oauth2/v2.0/token` (grant_type refresh_token, scope `https://ads.microsoft.com/msads.manage offline_access`). **Liefert die Response einen neuen `refresh_token` → sofort in `oauthTokens` persistieren** (MS rotiert; ohne Persistenz stirbt der Cron irgendwann).
  2. **Report Submit:** POST `https://reporting.api.bingads.microsoft.com/Reporting/v13/GenerateReport/Submit` (NICHT „GenerateReportUrl/…" — existiert nicht), Headers `Authorization: Bearer`, `DeveloperToken`, `CustomerId` (=MS_ADS_CUSTOMER_ID), `CustomerAccountId` (=MS_ADS_ACCOUNT_ID), Body:

```json
{ "ReportRequest": {
    "Type": "AdPerformanceReportRequest",
    "Format": "Csv", "Aggregation": "Daily",
    "ExcludeColumnHeaders": false, "ExcludeReportFooter": true, "ExcludeReportHeader": true,
    "ReturnOnlyCompleteData": false,
    "Columns": ["TimePeriod","CampaignId","CampaignName","AdGroupId","AdId","Impressions","Clicks","Spend","CurrencyCode"],
    "Scope": { "AccountIds": [141454913] },
    "Time": { "CustomDateRangeStart": {"Day":d,"Month":m,"Year":y},
              "CustomDateRangeEnd":   {"Day":d,"Month":m,"Year":y},
              "ReportTimeZone": "BrusselsCopenhagenMadridParis" } } }
```

     (`ReturnOnlyCompleteData: false` bewusst: das 35-Tage-Fenster refetcht ohnehin täglich; `true` würde frische Tage oft komplett verweigern. Kommentar in Code.)
  3. **Poll:** POST `…/Reporting/v13/GenerateReport/Poll` mit `{ "ReportRequestId": … }` alle 5 s (max 8 Min). Response ist verschachtelt: `ReportRequestStatus.Status` ("Success"/"Pending"/"Error") und `ReportRequestStatus.ReportDownloadUrl`. Bei "Error" oder Timeout: Exception.
  4. **Download+Parse:** `ReportDownloadUrl` fetchen → ZIP mit `fflate.unzipSync` (ersten .csv-Eintrag nehmen) → `parseMsAdsCsv` → Mapping: channel `"bing"`, sourceAccount = "141454913", **brandSlug via `detectBrand(CampaignName)`; Rows ohne Treffer → Fallback `"bautv-nl"`** (NL-Konto! adsMapping trennt NL-Brands — DE-„bautv" wäre falsch). Leerer Report (keine Datenzeilen) = gültiges Ergebnis, kein Fehler. → upsertBatch → `sweepStale`.
* [ ] **Step 3: Smoke** — run → Report kommt (10–60 s), Zeilen in `debugAdCosts` mit channel bing und Brand bautv-nl; Spend-Stichprobe gegen MS-Ads-UI.
* [ ] **Step 4:** Commit.

### Task 6: Google `click_view`-Backstop

**Files:** Create: `convex/actions/syncClickViews.ts` (`"use node"`, internalAction); Modify: `convex/adCosts.ts` (+`upsertClickViews`-Mutation, Dedupe über `by_gclid` = gclid+date)

* [ ] **Step 1: Action** — Args `{ days?: number, startDate?: string, endDate?: string }` (explizite Daten schlagen days; nötig für gestückelten Backfill — `days` allein hat KEINEN Offset). click_view erlaubt nur EIN Datum pro Query → Loop über Tage, je Tag:

```sql
SELECT click_view.gclid, segments.date, campaign.id, ad_group.id,
       click_view.ad_group_ad, click_view.keyword_info.text, segments.click_type
FROM click_view WHERE segments.date = '<tag>'
```

  `ad_group_ad`-Ressourcenname (`customers/…/adGroupAds/{agId}~{adId}`) splitten; Rows ohne gclid überspringen (kommt vor, z. B. App-Kampagnen); clickType + keyword speichern; brandSlug via Kampagnen-Map (einmalig `SELECT campaign.id, campaign.name FROM campaign`, detectBrand); sourceAccount = CID.
* [ ] **Step 2: Backfill 90 Tage SOFORT** — die 90-Tage-Uhr läuft; deshalb darf Task 6 nicht warten. Gestückelt mit expliziten Bereichen (NICHT 3× `days:30` — das lädt dreimal dieselben 30 Tage):

```
npx convex run … '{"startDate":"<heute-90>","endDate":"<heute-61>"}'
npx convex run … '{"startDate":"<heute-60>","endDate":"<heute-31>"}'
npx convex run … '{"startDate":"<heute-30>","endDate":"<gestern>"}'
```

* [ ] **Step 3: Smoke** — clickViews gefüllt; Stichprobe: ein gclid aus leads/webEvents (Paket A) findet Treffer. Commit.

### Task 7: Crons + Prod + Verifikation

**Files:** Modify: `convex/crons.ts`

* [ ] **Step 1: Crons** (gestaffelt hinter die bestehenden; Minute 50 meiden — dort läuft stündlich `cleanup datalake nonces`):

```ts
crons.daily("sync ad costs google", { hourUTC: 6, minuteUTC: 52 }, internal.actions.syncGadsCosts.syncGadsCosts, {});
crons.daily("sync ad costs meta",   { hourUTC: 6, minuteUTC: 55 }, internal.actions.syncMetaCosts.syncMetaCosts, {});
crons.daily("sync ad costs ms",     { hourUTC: 6, minuteUTC: 58 }, internal.actions.syncMsCosts.syncMsCosts, {});
crons.daily("sync click views",     { hourUTC: 7, minuteUTC: 8 },  internal.actions.syncClickViews.syncClickViews, { days: 3 });
```

  (Staffelung ist Lastglättung, keine Serialisierungs-Garantie — die Actions sind unabhängig und dürfen überlappen.)
* [ ] **Step 2: Prod** — alle Envs aus Task 1 Step 2 mit `--prod` setzen; `npx convex deploy -y` (prod = `grandiose-cricket-4`).
* [ ] **Step 3: Prod-Smoke** — alle vier Actions einmal manuell mit `--prod` runnen; `debugAdCosts` je channel ≥1 Zeile; **je Kanal Tagessumme gegen Plattform-UI (±1 %)**; Brand-Stichprobe: MS-Zeilen tragen bautv-nl, nicht bautv.
* [ ] **Step 4:** Commits pushen, Mission Control (Task „Datalake Paket B" auf Done mit 7-Block-Doku), `reference_msads_api_zugang.md` bleibt Quelle für Token-Rotation.

## Bewusst NICHT in diesem Plan

HubSpot-Sync (wartet auf Johannes), CleverReach (eigener Plan), Messe-CSV-Import, LinkedIn/Taboola (Design → Paket F), Attribution/Reports (Paket D — braucht diese Daten, kommt danach). Außerdem bewusst vertagt: FX-/Multi-Currency (alle Konten EUR; currency wird mitgespeichert, Konvertierung erst wenn nötig), Checkpoint/Cursor-Ingest (35-Tage-Refetch macht Läufe idempotent), clickViews-Retention/Purge (gehört zu Governance vor Paket C), Klick-Harmonisierung über inline_link_clicks hinaus.

## Self-Review (v2)

* Restatement: 35-Tage-Fenster + Upsert + Stale-Sweep deckt Korrekturen UND Löschungen/Nullungen. ✓
* Identität: technischer Key ohne brandId, mit sourceAccount — Renames und Mehrkonten-Zukunft sicher. ✓
* MS: Endpunkte gegen MS Learn verifiziert (GenerateReport/Submit + /Poll, ReportRequestStatus verschachtelt); Refresh-Token-Rotation persistiert. ✓
* click_view-Frist: Backfill mit expliziten Datumsbereichen als dringlicher Step. ✓
* Fehler sichtbar: throw statt Fehler-Return; truncated ≠ Erfolg; Sweep nur nach Komplettlauf. ✓
* Bestehende Syncs unangetastet (syncAds.ts, bestehende Cron-Zeilen). ✓
* Offene Risiken: exakte MS-Poll-Response-Feldnamen (bei 400/Parse-Fehler gegen MS-Learn-Beispiel prüfen, nicht raten); PMax-Anteil im Google-Konto unbekannt (Fallback-Query fängt ihn ab).
