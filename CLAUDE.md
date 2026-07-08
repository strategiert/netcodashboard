## Code-Karte

**Zweck:** Marketing-Workstation für die drei NetCo-Marken (Body-Cam, BauTV+, Microvista) — Content-Planung, Funnel, SEO, KPIs, Social an einem Ort.

**Stack & Deploy:** Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS 4 + shadcn/ui (Radix), Convex als Backend/DB (inkl. `@convex-dev/auth` für Login), Deploy auf Vercel (Projekt `netcodashboard`).

**Entry Points:**
- `src/app/layout.tsx` — Root-Layout, hängt `ConvexClientProvider`, `AuthGate`, `AppShell` ein.
- `src/app/page.tsx` — Home; leitet je nach Nutzerrechten auf `/[brand]/<erste-erlaubte-section>` weiter.
- `src/app/[brand]/layout.tsx` / `page.tsx` — Marken-spezifische Dashboard-Seiten (Funnel, Content, SEO, Social, KPIs, …).
- `convex/auth.ts` — Login-Flow (E-Mail-OTP, passwortlos) via Convex Auth.
- `convex/http.ts` — HTTP-Router, bindet nur die Auth-Routen ein.
- `convex/schema.ts` — zentrales Datenbankschema.

**Ordner-Karte:**
- `src/app/[brand]/*` — pro Marke: `funnel`, `content`, `seo`, `stakeholders`, `journeys`, `campaigns`, `social`, `rankings`, `kpis`, `daily`, `report`, `ai-visibility`.
- `src/app/admin` — Admin-Bereich (Nutzerverwaltung).
- `src/app/api` — Next.js API-Routen (aktuell nur `team-board`).
- `src/components/ui` — shadcn/ui-Basiskomponenten.
- `src/components/auth`, `src/components/providers` — Auth-Gate bzw. Convex-Provider.
- `src/lib` — Utilities, Section-/Rechte-Logik, Datenmapping (Bing, Google Ads, Source-Coverage).
- `convex/actions/*` — externe Syncs (GSC, Google Ads, Bing, SE Ranking, Publer/Social, Traffic).
- `convex/data/*` — importierte JSON-Rohdaten (Seed/Backfill).
- `docs/` — ursprüngliche Dashboard-Prototypen (Referenz, kein aktiver Code).

**Wo liegt was:**
- Routen/Pages: `src/app/[brand]/<section>/page.tsx`
- DB/Schema: `convex/schema.ts`
- Auth (Login/Rollen/Rechte): `convex/auth.ts`, `convex/users.ts`, `src/lib/sections.ts`, `src/hooks/use-current-user.ts`
- Styles/Design: `src/app/globals.css`, `components.json` (shadcn-Konfig)
- Config/Env: `.env.local` (nicht committen), `NEXT_PUBLIC_CONVEX_URL` laut `.env.local.example`
- Externe API-Clients: `convex/actions/` (GSC, Google Ads, Bing AI, SE Ranking, Publer)

**Befehle:**
- Dev: `npm run dev` (Turbopack), parallel `npx convex dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Tests: keine npm-Test-Skript definiert; Test-Dateien liegen als `*.test.ts` neben dem Code (z. B. `convex/authEmail.test.ts`, `src/lib/*.test.ts`) — vermutlich per Convex/Vitest-Runner direkt ausgeführt.
- Deploy: Vercel (Git-Push löst Deploy aus); Convex-Produktion separat mit `npx convex deploy`

**Fallen:**
- README.md ist veraltet (nennt Next.js 14, tatsächlich Next.js 16) — Configs vertrauen, nicht dem README.
- Kein `middleware.ts`: Auth-/Rechte-Prüfung läuft client-seitig über `AuthGate` + `src/lib/sections.ts`, nicht auf Edge-Ebene.
- `convex/data/*.json` enthält große Rohimporte — nicht komplett einlesen.
