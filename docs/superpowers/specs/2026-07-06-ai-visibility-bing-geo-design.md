# NetCo Dashboard - AI Visibility, Bing und GEO Design Spec
**Datum:** 2026-07-06
**Status:** Draft zur Review

---

## Ziel

Das NetCo Marketing Dashboard wird um eine eigene AI-Visibility- und GEO-Schicht erweitert. Google SEO bleibt wichtig, wird aber nicht mehr als alleinige Hauptprioritaet betrachtet. Das System soll sichtbar machen, ob und wie NetCo Body-Cam, Microvista und BauTV+ in KI-Antwortsystemen, Bing-nahen Suchumgebungen und klassischen Suchdaten vorkommen.

Der erste Pilot laeuft fuer Microvista, weil dort bereits GSC-, GA4-, Lead- und Wochenreport-Daten vorhanden sind und die B2B-Nische gute GEO-Signale liefern sollte.

---

## Leitprinzip

GEO wird nicht als separates Tool-Silo gebaut. Stattdessen entsteht ein Datenlayer neben dem bestehenden SE-Ranking-, GSC-, GA4- und Ads-Setup:

- SE Ranking AI Search liefert AI-Visibility-Messungen fuer ChatGPT, Gemini, Perplexity, AI Overviews und AI Mode.
- Bing Webmaster Tools liefert Bing-Suchdaten und, soweit per Export/API verfuegbar, AI-/Copilot-Performance-Signale.
- Google Search Console liefert weiterhin Suchnachfrage, Laender, Landingpages, Longtail- und Frage-Queries.
- Das Dashboard korreliert diese Daten mit Website-Traffic, Leads, Content-Clustern und Wettbewerbern.

---

## Datenquellen

| Quelle | Zweck | Zugriff | MVP-Status |
|--------|-------|---------|------------|
| SE Ranking AI Search API | AI Mentions, Share of Voice, Link Presence, Prompts, Wettbewerber, Antwort-Snapshots | `SERANKING_API_KEY` vorhanden | Primaere MVP-Quelle |
| Bing Webmaster Tools | Bing Search Performance, ggf. AI-/Copilot-Reports, Indexierungs- und URL-Signale | Key noch nicht in `.env.local` | Schema + Importpfad vorsehen |
| Google Search Console | GEO-Fruehsignale: Fragen, Longtail, Laender, Landingpages, Brand/Non-Brand | vorhandene GSC-Env-Variablen | Erweiterung bestehender GSC-Skripte |
| DataForSEO oder Ahrefs | Zweitvalidierung fuer AI Responses/Citations | spaeter | Phase 2 |

---

## Prompt-Set

Prompts ersetzen keine Keywords, sondern bilden reale Entscheidungsfragen ab. Jeder Prompt wird einer Brand, Sprache, Region, Persona, Funnelphase und Prioritaet zugeordnet.

Beispiele fuer Microvista:

- "industrielle CT Dienstleister Deutschland"
- "zerstoerungsfreie Pruefung mittels Computertomographie Anbieter"
- "beste Loesung fuer Bauteilanalyse per CT"
- "welche Firmen bieten industrielle Computertomographie als Dienstleistung an"
- "Alternative zu klassischer 3D Messtechnik fuer innere Bauteilfehler"

Beispiele fuer Body-Cam:

- "Bodycam Anbieter fuer OePNV Deutschland"
- "Bodycam Loesung fuer Rettungsdienst und Sicherheitsdienst"
- "welche Bodycam Systeme sind DSGVO-konform"

Beispiele fuer BauTV+:

- "Baustellendokumentation Kamera Anbieter"
- "Zeitraffer Baustelle fuer Bauherren und Projektkommunikation"
- "Alternative zu klassischer Baustellenkamera mit Livezugriff"

---

## Convex Schema

### `aiPrompts`
Stammdaten der zu messenden Prompts.

```
brandId
prompt
language              // de, en, nl, it
region                // DE, NL, IT, global
persona               // Einkauf, Technik, Geschaeftsfuehrung, Marketing, etc.
funnelStage           // awareness, consideration, decision
priority              // 1-5
cluster               // Content-/SEO-Cluster
active
createdAt
```

Indizes: `by_brand`, `by_brand_active`, `by_cluster`

### `aiVisibilitySnapshots`
Aggregierte Messung pro Prompt, Engine und Datum.

```
brandId
promptId
date
engine                // chatgpt, perplexity, gemini, ai-overview, ai-mode, bing-ai
region
brandMentioned
brandPosition
mentionRate
linkPresent
citationShare
sentiment             // positive, neutral, negative, unknown
competitorsMentioned
sourceProvider        // seranking, bing, manual, dataforseo, ahrefs
rawUrl
```

Indizes: `by_brand_date`, `by_prompt_date`, `by_engine_date`

### `aiResponseSnapshots`
Antwort- und Quellen-Snapshot fuer Analyse und Review.

```
brandId
promptId
date
engine
answerSummary
mentionedBrands
citedUrls
citedDomains
missingAngles
rawResponse
sourceProvider
```

Indizes: `by_brand_date`, `by_prompt_date`

### `bingSearchSnapshots`
Bing-spezifische Suchdaten. Startet als Import-/API-Ziel fuer klassische Bing-Webmaster-Daten und kann AI-/Copilot-Felder aufnehmen, sobald verfuegbar.

```
brandId
date
query
page
country
device
clicks
impressions
ctr
position
aiImpressions
aiClicks
aiCitations
aiCitationShare
topic
intent
sourceProvider        // bing-api, bing-export
```

Indizes: `by_brand_date`, `by_query`, `by_page`

---

## Dashboard-Seite

### `/[brand]/ai-visibility`

Die Seite wird als Arbeitsansicht gebaut, nicht als Marketing-Landingpage.

Oben:
- AI Visibility Score
- Mention Rate
- Citation Share
- Link Presence
- Top Wettbewerber
- Bing Search/AI Trend

Darunter:
- Engine-Vergleich: ChatGPT, Perplexity, Gemini, AI Overviews/AI Mode, Bing AI
- Prompt-Tabelle mit Status, Position, Delta, Quellen und Handlungsempfehlung
- Citation-Analyse: Welche Domains werden zitiert, wenn NetCo/Microvista/BauTV nicht vorkommen?
- Wettbewerber-Matrix: Wer gewinnt welche Prompts?
- Antwort-Snapshots fuer Review

---

## GSC-GEO Erweiterung

Bestehende GSC-Daten werden um Analyse-Views erweitert:

- Frage-Queries: wer, was, welche, wie, warum, beste, Anbieter, Vergleich, Alternative
- Longtail: Query-Laenge und konkrete Problemformulierungen
- Laender: DE, NL, IT und weitere relevante Maerkte
- Brand vs. Non-Brand
- Landingpage-Cluster
- Query -> Content-Piece/SEO-Cluster Mapping

Ziel: GSC zeigt, welche Themen in klassischer Suche wachsen; AI Visibility zeigt, ob Antwortsysteme uns dazu bereits nennen.

---

## Woechentlicher GEO-Report

Der bestehende Wochenreport erhaelt einen neuen Abschnitt:

- Gewonnene/verlorene AI-Prompts
- Wichtigste Wettbewerber in AI-Antworten
- Meistzitierte externe Quellen
- Bing- und GSC-Fruehsignale
- Drei konkrete Content-/PR-/Technical-Actions fuer die Woche

---

## Phasen

### Phase 1 - MVP Microvista

- Schema fuer `aiPrompts`, `aiVisibilitySnapshots`, `aiResponseSnapshots`, `bingSearchSnapshots`
- Seed/Import fuer 30-50 Microvista-Prompts
- SE Ranking AI Search Sync Action
- `/microvista/ai-visibility` Seite
- Wochenreport-Abschnitt fuer AI Visibility

### Phase 2 - Bing und GSC-GEO

- Bing Webmaster API oder Export-Import anbinden
- Bing Search/AI-Daten in `bingSearchSnapshots` speichern
- GSC-GEO-Auswertung fuer Fragen, Longtail, Laender und Landingpages
- Vergleich Bing/GSC/AI Visibility im Dashboard

### Phase 3 - Alle Brands und zweite Validierungsquelle

- Prompt-Sets fuer Body-Cam und BauTV+
- DataForSEO oder Ahrefs als Zweitquelle testen
- Citation-Opportunity-Backlog fuer PR, Partnerseiten, Branchenverzeichnisse und Content

---

## Offene Voraussetzung

In `.env.local` ist `SERANKING_API_KEY` vorhanden. Fuer Bing fehlt aktuell noch ein eigener Webmaster-Key, z. B. `BING_WEBMASTER_API_KEY`. Bis dieser Key verfuegbar ist, wird Bing im Datenmodell vorgesehen und kann ueber CSV/Export importiert werden.

---

## Akzeptanzkriterien

- Microvista hat eine nutzbare AI-Visibility-Seite mit echten SE-Ranking-AI-Daten oder einem klar markierten Import-Fallback.
- Mindestens 30 aktive Prompts sind gespeichert und nach Persona/Funnelphase/Region filterbar.
- Das Dashboard zeigt pro Prompt, ob Microvista genannt, verlinkt oder zitiert wird.
- Wettbewerber und zitierte Domains sind sichtbar.
- Bing-Daten koennen mindestens per Import gespeichert werden; API-Sync wird aktiviert, sobald der Key vorhanden ist.
- Der Wochenreport enthaelt einen kompakten GEO-Abschnitt mit konkreten naechsten Aktionen.
