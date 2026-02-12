# Video Storyboard + Script
Stand: 12.02.2026

Ziel:
- 30s Performance-Ad (Paid/Social)
- 60s Erklärversion (LinkedIn/Website)

Hinweis (Remotion Best Practices):
- Szenen mit klarer Sequenzstruktur planen.
- Transition-Dauer in Gesamtlänge einkalkulieren.
- Größen responsiv relativ zu `width`/`height` definieren.

---

## A) 30 Sekunden Ad Script
### Ziel
Schnelle Einordnung + klare Handlungsoption.

### Shotlist (30s)
**Szene 1 (0-5s):** Bahnhofsumfeld, ruhige aber gespannte Lage.  
Voice: "Wenn eine Situation kippt, zählt jede Sekunde."

**Szene 2 (5-12s):** Einsatzkraft aktiviert Bodycam sichtbar und sachlich.  
Voice: "Bodycams helfen bei Deeskalation und sichern Vorfälle nachvollziehbar."

**Szene 3 (12-20s):** Teamkoordination mit Leitstelle, kontrollierte Lage.  
Voice: "Wirkung entsteht, wenn Technik, Training und klare Regeln zusammenarbeiten."

**Szene 4 (20-27s):** 30/60/90-Textgrafik animiert.  
Voice: "Vom Beschluss zur Umsetzung in 30, 60 und 90 Tagen."

**Szene 5 (27-30s):** Endcard mit CTA.  
Voice: "Leitfaden anfordern. Whitepaper vormerken."

### On-Screen Text
- "Sicherheit braucht System"
- "Deeskalation + Evidenz"
- "30/60/90 Rollout"
- "Jetzt informieren"

---

## B) 60 Sekunden Erklärvideo
### Ziel
Erklären, warum ein strukturiertes Bodycam-Modell nötig ist.

### Struktur
**0-10s Problem:** steigende Belastung für Einsatzteams.  
**10-25s Wirkung:** Bodycam als Teil eines Deeskalationssystems.  
**25-45s Umsetzung:** SOP, Schulung, Nachbereitung, KPI.  
**45-60s Call-to-Action:** Whitepaper und Erstgespräch.

### Sprechertext (lang)
"Mitarbeitende im Bahn- und ÖPNV-Umfeld arbeiten täglich in potenziell konfliktgeladenen Situationen.  
Ein wirksames Sicherheitskonzept braucht mehr als Ausrüstung: Es braucht klare Aktivierungsregeln, deeskalative Kommunikation, rechtssichere Dokumentation und strukturierte Nachbereitung.  
Genau dafür steht ein 30/60/90-Tage-Rollout.  
Unser Whitepaper zeigt den Weg von der politischen Debatte zur belastbaren operativen Umsetzung."

---

## C) Produktionsbriefing
### Bildsprache
- realistisch, professionell, respektvoll
- keine Schockbilder
- Fokus auf Kompetenz und Teamarbeit

### Tonalität
- sachlich
- handlungsorientiert
- nicht alarmistisch

### Audio
- reduzierte, spannungsarme Musik
- klare Sprachverständlichkeit
- Endcard mit kurzer Signatur

---

## D) Remotion-kompatible Sequenzlogik (Pseudo)
```tsx
<Series>
  <Series.Sequence durationInFrames={150}>{/* Szene 1 */}</Series.Sequence>
  <Series.Sequence durationInFrames={210}>{/* Szene 2 */}</Series.Sequence>
  <Series.Sequence durationInFrames={240}>{/* Szene 3 */}</Series.Sequence>
  <Series.Sequence durationInFrames={180}>{/* Szene 4 */}</Series.Sequence>
  <Series.Sequence durationInFrames={120}>{/* Szene 5 Endcard */}</Series.Sequence>
</Series>
```

Bei TransitionSeries:
- pro Transition z.B. 12-18 Frames einplanen
- Gesamtdauer um Überlappung korrigieren

