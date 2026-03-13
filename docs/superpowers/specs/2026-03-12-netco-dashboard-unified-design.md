# NetCo Dashboard — Unified Design Spec
**Datum:** 2026-03-12
**Status:** Approved

---

## Ziel

Das bestehende `strategiert/netcodashboard` (Next.js 14 + Convex + shadcn/ui) wird zur einzigen Arbeitsplattform für NetCo — sowohl für das Marketing-Team (Content, Kampagnen, Strategie) als auch für das Management (KPIs, Analysen, Berichte).

Das KPI-Dashboard aus `_archive/Dashboard` wird integriert. Kein zweites Tool mehr.

---

## Architektur

**Stack:** Next.js 14 (App Router) + Convex (`sensible-bobcat-155`) + shadcn/ui + Tailwind
**Deployment:** Vercel → `netcodashboard.vercel.app` (später NetCo-Subdomain)
**Repo:** `strategiert/netcodashboard`

### Datenquellen

| Quelle | Methode | Zeitplan |
|--------|---------|----------|
| Google Search Console | Convex Scheduled Action + Service Account | täglich 06:00 |
| Publer (Social) | Convex Scheduled Action + API Key | täglich 06:10 |
| Google Ads | Convex Scheduled Action + OAuth Refresh Token | täglich 06:20 |
| Leads/Anfragen | Manuelle Eingabe im Dashboard | on-demand |

**Google Ads Besonderheit:** Aktuell 1 Account (`453-017-2190`) mit allen 3 Marken. Kampagnen-Zuordnung via Name-Matching (`bodycam`, `microvista`, `bautv`). Nach Account-Migration: separate Customer IDs je Brand.

---

## Convex Schema — neue Tabellen

### `kpiSnapshots`
Tägliche Snapshots je Brand und Quelle.
```
brandId, date (YYYY-MM-DD), source (gsc|publer|ads|manual),
// GSC
clicks, impressions, ctr, avgPosition,
// Publer
socialReach, socialEngagement, socialFollowers, socialPosts,
// Ads
adSpend, adClicks, adImpressions, adConversions, adCpc,
// Manual
leadsCount, leadsNote
```
Index: `by_brand_date`, `by_brand_source_date`

### `kpiTargets`
Monatliche Zielwerte je Brand.
```
brandId, year, month,
targetClicks, targetLeads, targetReach, targetAdSpend, targetConversions
```

---

## Navigation — Erweiterung

```
Sidebar (pro Brand):
  Dashboard      ← KPI-Leiste oben + Marketing-Stats (geändert)
  KPIs           ← neu: historische Charts + Lead-Eingabe + Ziele
  Funnel
  Content
  Buying Center
  Journeys
  SEO Cluster
  Kampagnen

Top-Level (brandübergreifend):
  /kpis          ← neu: Executive Overview alle 3 Marken
```

---

## Seiten

### `/[brand]` — Brand Dashboard (geändert)
- **KPI-Leiste oben:** 5 Karten (GSC Klicks, Impressionen, CTR, Social Reach, Anfragen)
- Zeitraum-Toggle: Heute / MTD / 30 Tage
- Delta vs. Vortag (↑↓ %)
- **Darunter:** bisheriger Marketing-Überblick (Content Stats, Prio-Items)

### `/[brand]/kpis` — neu
- Historische Charts (30/90 Tage) für alle KPIs
- Ziel vs. Ist mit Fortschrittsbalken (aus `kpiTargets`)
- Lead-Eingabe-Widget (manuell, speichert in `kpiSnapshots` mit `source: manual`)
- Ads-Übersicht: Spend, Klicks, Conversions, CPC

### `/kpis` — neu (Executive Overview)
- Rollup alle 3 Marken
- Top-KPIs nebeneinander (Klicks, Leads, Reach, Ad-Spend)
- Delta-Ampel bei Ausreißern
- Tages-/Wochen-/Monatsansicht

---

## Scripts

### `scripts/ads-auth.ts`
Einmaliges OAuth-Script zum Generieren des Google Ads Refresh Tokens.
- Startet lokalen Server auf Port 8080
- Öffnet Google OAuth URL im Browser
- Fängt Callback ab, tauscht Code gegen Refresh Token
- Gibt Token zur `.env.local`-Eintragung aus

### Convex Actions (täglich)
- `convex/actions/syncGSC.ts`
- `convex/actions/syncPubler.ts`
- `convex/actions/syncAds.ts`
- `convex/crons.ts` — registriert alle 3 als Scheduled Actions

---

## Phasen

**Phase 1 (diese Session):**
- Convex Schema erweitern (`kpiSnapshots`, `kpiTargets`)
- GSC + Publer Sync Actions
- Brand Dashboard KPI-Leiste
- `/[brand]/kpis` Seite mit Lead-Eingabe
- `/kpis` Executive Overview

**Phase 2 (nach Refresh Token):**
- Google Ads Sync Action
- Ads-Daten in KPI-Seiten einbauen

**Phase 3 (nach Account-Migration):**
- Separate Customer IDs je Brand
- Kampagnen-Mapping entfernen

---

## Migration aus `_archive/Dashboard`

Folgende Logik aus `_archive/Dashboard/src/App.tsx` übernehmen:
- Delta-Berechnung (↑↓ %)
- Progress/Ziel-Balken
- Brand-Rollup-Berechnung
- Export/Share-Link (optional, später)
