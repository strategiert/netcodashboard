# NetCo Marketing Workstation

Eine einheitliche interaktive Marketing-Workstation für alle drei NetCo-Marken:
- **NetCo Body-Cam** - Sicherheitslösungen für ÖPNV, Rettungsdienste, Sicherheit
- **BauTV+** - Baustellendokumentation und -transparenz
- **Microvista** - CT-Analyse für Industrieprüfung

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Backend/Datenbank**: Convex
- **State Management**: Convex Reactive Queries

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Convex einrichten

```bash
npx convex dev
```

Folgen Sie den Anweisungen:
- Wählen Sie "new project" um ein neues Projekt zu erstellen
- Benennen Sie es z.B. "netco-marketing-workstation"
- Die `.env.local` Datei wird automatisch erstellt

### 3. Datenbank seeden

Die Datenbank wird beim ersten Besuch der App automatisch mit Beispieldaten gefüllt.

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Öffnen Sie [http://localhost:3000](http://localhost:3000) im Browser.

## Projektstruktur

```
netcodashboard/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── [brand]/             # Brand-spezifische Seiten
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── funnel/          # Funnel-Übersicht
│   │   │   ├── content/         # Content-Verwaltung
│   │   │   ├── stakeholders/    # Stakeholder/Personas
│   │   │   ├── journeys/        # Customer Journeys
│   │   │   └── seo/             # SEO Cluster
│   │   ├── settings/            # Einstellungen
│   │   ├── layout.tsx           # Root Layout
│   │   └── page.tsx             # Home (Redirect)
│   ├── components/
│   │   ├── ui/                  # shadcn/ui Komponenten
│   │   ├── forms/               # Formulare
│   │   ├── providers/           # Context Provider
│   │   ├── brand-selector.tsx   # Marken-Wechsler
│   │   └── sidebar.tsx          # Navigation
│   └── lib/                     # Utilities
├── convex/
│   ├── schema.ts                # Datenbank-Schema
│   ├── brands.ts                # Brand Queries/Mutations
│   ├── phases.ts                # Phasen Queries/Mutations
│   ├── content.ts               # Content Queries/Mutations
│   ├── stakeholders.ts          # Stakeholder Queries/Mutations
│   ├── journeys.ts              # Journey Queries/Mutations
│   ├── seoClusters.ts           # SEO Cluster Queries/Mutations
│   └── seed.ts                  # Seed-Script
└── docs/                        # Ursprüngliche Dashboard-Prototypen
```

## Features

### MVP (aktuell implementiert)

- [x] Brand-Selector - Zwischen Marken wechseln
- [x] Dashboard - Übersicht mit Stats
- [x] Funnel-Ansicht - Phasen-Timeline mit Content
- [x] Content-CRUD - Erstellen, Lesen, Bearbeiten, Löschen
- [x] Filter & Suche - Nach Phase, Status, Format filtern
- [x] Stakeholder-Ansicht - Persona-Karten
- [x] SEO Cluster - Themen-Gruppierungen
- [x] Seed-Daten - Automatische Datenbefüllung

### Geplant (nach MVP)

- [ ] Customer Journey Editor
- [ ] Redaktionsplan/Kalender
- [ ] Drag & Drop Sortierung
- [ ] Erweiterte Stakeholder-Verwaltung

## Deployment

### Vercel

1. Repository auf GitHub pushen
2. Vercel-Projekt erstellen und mit GitHub verbinden
3. Convex Production-Deployment:
   ```bash
   npx convex deploy
   ```
4. `NEXT_PUBLIC_CONVEX_URL` in Vercel Environment Variables setzen

## Lizenz

Privat - NetCo GmbH
