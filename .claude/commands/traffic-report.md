---
description: Microvista Traffic-Report — zieht GA4-Zahlen automatisch und schreibt Management-Report
---

Erzeuge den täglichen Microvista-Traffic-Report. KEINE manuelle Dateneingabe.

## Schritt 1 — Zahlen automatisch holen
Führe aus:
```
node scripts/microvista-traffic-report.mjs
```
Das Script holt die GA4-Zahlen (Property Microvista) für gestern + vorgestern und schreibt
`reports/microvista-traffic-<gestern>.json` und `.md`. Wenn das Script einen Fehler wirft
(z. B. Token abgelaufen), gib den Fehler wörtlich aus und stoppe — nichts erfinden.

## Schritt 2 — JSON lesen
Lies die erzeugte Datei `reports/microvista-traffic-<gestern>.json`.

## Schritt 3 — Management-Report schreiben
Erstelle aus den JSON-Zahlen einen Report mit GENAU dieser Struktur:

# Microvista Traffic — <reportDay> (Vergleich <compareDay>)
## Überblick
- Sitzungen / Nutzer / Conversions: Wert + Veränderung (▲/▼ %) — exakt aus totals
## Top 3 Bewegungen
- Die drei auffälligsten Kanal-Veränderungen, je mit absoluten Zahlen und %
## Auffälligkeiten (prüfen)
- Datenqualitäts-Hinweise: hoher "Unassigned"-Anteil = Attributionslücke; Conversions = 0 = Key-Events evtl. nicht erfasst. Als "prüfen" markieren, KEINE Ursache erfinden.
## 1 Handlungsempfehlung
- konkret, umsetzbar

REGELN:
- Nur Zahlen aus der JSON. Nichts schätzen/erfinden.
- Sachlich, echte Umlaute, max. 1 Bildschirmseite.
- Speichere als `reports/microvista-traffic-<gestern>-report.md`.
