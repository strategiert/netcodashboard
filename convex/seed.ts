import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingBrands = await ctx.db.query("brands").collect();
    if (existingBrands.length > 0) {
      return { message: "Database already seeded" };
    }

    // Create Brands
    const bodycamId = await ctx.db.insert("brands", {
      name: "NetCo Body-Cam",
      slug: "bodycam",
      colors: {
        primary: "#003366",
        secondary: "#ff6600",
        accent: "#1a365d",
      },
    });

    const bautvId = await ctx.db.insert("brands", {
      name: "BauTV+",
      slug: "bautv",
      colors: {
        primary: "#003366",
        secondary: "#ff6600",
        accent: "#004d99",
      },
    });

    const microvistaId = await ctx.db.insert("brands", {
      name: "Microvista",
      slug: "microvista",
      colors: {
        primary: "#0f172a",
        secondary: "#3b82f6",
        accent: "#1e293b",
      },
    });

    // ===== BODYCAM PHASES =====
    const bodycamPhases = [
      { order: 1, name: "Unbewusstes Problem", shortName: "Unbewusst", color: "#94a3b8", mindset: '"Ist halt so" - Mitarbeiter leiden still' },
      { order: 2, name: "Problem-Bewusstsein", shortName: "Bewusstsein", color: "#f59e0b", mindset: '"So kanns nicht weitergehen" - BR/Führung diskutiert' },
      { order: 3, name: "Lösungssuche", shortName: "Lösung", color: "#3b82f6", mindset: '"Was gibt es für Optionen?" - Task Force recherchiert' },
      { order: 4, name: "Anbieter-Evaluation", shortName: "Evaluation", color: "#8b5cf6", mindset: '"Wer ist der Richtige?" - Buying Center prüft' },
      { order: 5, name: "Kaufentscheidung", shortName: "Entscheidung", color: "#22c55e", mindset: '"NetCo ist es" - Implementierung starten' },
    ];

    const bodycamPhaseIds: Record<number, Id<"phases">> = {};
    for (const phase of bodycamPhases) {
      const id = await ctx.db.insert("phases", { brandId: bodycamId, ...phase });
      bodycamPhaseIds[phase.order] = id;
    }

    // ===== BAUTV PHASES =====
    const bautvPhases = [
      { order: 0, name: "Chaos & Schmerz", shortName: "Chaos", color: "#dc2626", mindset: '"Es läuft schon... irgendwie." - Risiken sichtbar machen' },
      { order: 1, name: "Problembewusstsein & Ordnung", shortName: "Problem", color: "#f59e0b", mindset: '"So kann es nicht weitergehen." - BauTV+ als Helfer' },
      { order: 2, name: "Lösungsraum öffnen", shortName: "Lösung", color: "#0284c7", mindset: '"Es gibt Systeme dafür." - Experte für Baustellenorganisation' },
      { order: 3, name: "Produktnahe Aufklärung", shortName: "Produkt", color: "#059669", mindset: '"Portal vs. Kamera?" - Sanft aufklären' },
      { order: 4, name: "Entscheidung & Conversion", shortName: "Conversion", color: "#9333ea", mindset: '"Wie läuft das mit euch?" - Abschluss ermöglichen' },
    ];

    const bautvPhaseIds: Record<number, Id<"phases">> = {};
    for (const phase of bautvPhases) {
      const id = await ctx.db.insert("phases", { brandId: bautvId, ...phase });
      bautvPhaseIds[phase.order] = id;
    }

    // ===== MICROVISTA PHASES =====
    const microvistaPhases = [
      { order: 1, name: "Not Aware → Problem Aware", shortName: "Problem Aware", color: "#ef4444", mindset: '"Es läuft schon... irgendwie." - Risiken sichtbar machen' },
      { order: 2, name: "Problem Aware → Solution Aware", shortName: "Solution Aware", color: "#f59e0b", mindset: '"Wir haben ein Problem - aber noch keinen Plan."' },
      { order: 3, name: "Solution Aware → Trust", shortName: "Trust", color: "#3b82f6", mindset: '"Wem kann ich vertrauen?" - Echte Hilfe bieten' },
      { order: 4, name: "Trust → Decision Support", shortName: "Decision", color: "#22c55e", mindset: '"Ich muss intern argumentieren."' },
      { order: 5, name: "Decision → Customer", shortName: "Customer", color: "#a855f7", mindset: '"Wie läuft das mit euch?" - Einstieg leicht machen' },
    ];

    const microvistaPhaseIds: Record<number, Id<"phases">> = {};
    for (const phase of microvistaPhases) {
      const id = await ctx.db.insert("phases", { brandId: microvistaId, ...phase });
      microvistaPhaseIds[phase.order] = id;
    }

    // ===== BODYCAM CONTENT (from Excel database) =====
    const bodycamContent = [
      // Phase 1 - Unbewusst
      { phaseOrder: 1, title: "Eskalationssituationen: 7 Muster & wie man deeskaliert", format: "PDF", description: "Blog-Artikel zu Deeskalation im Alltag", proximity: "adjacent", status: "planned", goal: "Awareness" },
      { phaseOrder: 1, title: "Display-Ads Awareness", format: "Ads", description: "Deeskalation + Mitarbeiterschutz (Story)", proximity: "neutral", status: "in-progress" },
      { phaseOrder: 1, title: "Social Proof Posts", format: "Social Media", description: "Best Practice Stories (Hamburg, Wien)", proximity: "adjacent", status: "planned" },
      // Phase 2 - Problem bewusst
      { phaseOrder: 2, title: "Bodycams & DSGVO: Checkliste für DSB", format: "Guide", description: "Praxis-Checkliste für Datenschutzbeauftragte", proximity: "nah", status: "in-progress", priority: "high" },
      { phaseOrder: 2, title: "DSGVO Praxisleitfaden Bodycam", format: "PDF", description: "Whitepaper zu rechtlichen Grundlagen", proximity: "nah", status: "in-progress", priority: "high" },
      { phaseOrder: 2, title: "Case Study Hamburg ÖPNV", format: "PDF", description: "Erfolgsgeschichte Hamburger Verkehrsbetriebe", proximity: "sehr nah", status: "in-progress" },
      // Phase 3 - Lösungssuche
      { phaseOrder: 3, title: "Betriebsrat: 20 Fragen, die ihr vorher klärt", format: "Checkliste", description: "Vorlage für interne Abstimmung", proximity: "sehr nah", status: "in-progress", priority: "high" },
      { phaseOrder: 3, title: "Muster-Betriebsvereinbarung", format: "PDF", description: "Template für Betriebsrat-Einigung", proximity: "sehr nah", status: "in-progress", priority: "high" },
      { phaseOrder: 3, title: "Webinar: Bodycam Pilot richtig aufsetzen", format: "Webinar", description: "Live-Demo mit Q&A Session", proximity: "nah", status: "planned" },
      { phaseOrder: 3, title: "Datenfluss & Betrieb: On-Prem vs Cloud vs Hybrid", format: "PDF", description: "Technische Vergleichsanalyse", proximity: "nah", status: "planned" },
      // Phase 4 - Anbieter-Evaluation
      { phaseOrder: 4, title: "Case Study: ÖPNV Pilot – Ergebnis & Lessons Learned", format: "PDF", description: "Ausführliche Pilotbeschreibung", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 4, title: "Video: Alltagseinsatz (Akzeptanz & Praxis)", format: "Video", description: "Praxisdemo für End User/Champion", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 4, title: "Tech Spec PDF + Security FAQ", format: "PDF", description: "IT-Dokumentation und Security Antworten", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 4, title: "Demo Script + Pilot Ablaufplan", format: "PDF", description: "Dokumentation für Vertrieb", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 4, title: "Case: Sicherheitsdienst – schneller Rollout", format: "PDF", description: "Fallstudie für private Sicherheit", proximity: "sehr nah", status: "planned" },
      // Phase 5 - Kaufentscheidung
      { phaseOrder: 5, title: "TCO-Rechner: Kosten vs Risiko", format: "Rechner", description: "Interaktiver Kostenrechner", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 5, title: "TCO/ROI Rechner", format: "Rechner", description: "Total Cost of Ownership Kalkulation", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 5, title: "Preismatrix + Angebotstemplate", format: "PDF", description: "Vorlagen für Angebotserstellung", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 5, title: "Quickstart + Training Videos", format: "Video", description: "Onboarding-Materialien für Endnutzer", proximity: "sehr nah", status: "planned" },
    ];

    for (const content of bodycamContent) {
      const { phaseOrder, ...contentData } = content;
      await ctx.db.insert("contentPieces", {
        brandId: bodycamId,
        phaseId: bodycamPhaseIds[phaseOrder],
        ...contentData,
      });
    }

    // ===== BAUTV CONTENT (from Excel database) =====
    const bautvContent = [
      // Phase 0 - Chaos & Schmerz
      { phaseOrder: 0, title: "Baustellen-Chaos-Check", format: "PDF + Score", description: "Schmerz sichtbar machen", proximity: "neutral", status: "planned", goal: "Schmerz sichtbar machen" },
      { phaseOrder: 0, title: "Die 10 häufigsten Streitpunkte auf Baustellen", format: "PDF", description: "Wiedererkennung schaffen", proximity: "neutral", status: "planned", goal: "Wiedererkennung" },
      { phaseOrder: 0, title: "Bauleiter-Stress-Test", format: "Online-Tool", description: "Emotionaler Einstieg", proximity: "neutral", status: "in-progress", priority: "high", goal: "Emotionaler Einstieg" },
      // Phase 1 - Problembewusstsein
      { phaseOrder: 1, title: "Nachträge vermeiden: So macht Doku Streit 'beweisbar'", format: "PDF", description: "Blog: 7 Ursachen für Nachträge und wie Doku hilft", proximity: "adjacent", status: "planned", goal: "Problem framing" },
      { phaseOrder: 1, title: "Materialdiebstahl auf Baustellen: Kosten & Prävention", format: "PDF", description: "Awareness-Artikel zu Security", proximity: "adjacent", status: "planned", goal: "Awareness" },
      { phaseOrder: 1, title: "Nachtragskiller: Doku-Checkliste für Baustellen", format: "Checkliste", description: "Lead-Magnet für Problem-Phase", proximity: "nah", status: "in-progress", priority: "high", goal: "MQL" },
      // Phase 2 - Lösungsraum öffnen
      { phaseOrder: 2, title: "LTE/5G auf Baustelle: So klappt Remote Zugriff", format: "Guide", description: "Tech-Guide für IT-Entscheider", proximity: "nah", status: "in-progress", priority: "high", goal: "Kriterien liefern" },
      { phaseOrder: 2, title: "Tagesbericht-Template: Was muss rein?", format: "PDF", description: "Praktisches Template für Bauleiter", proximity: "nah", status: "planned", goal: "Praxis-Hilfe" },
      { phaseOrder: 2, title: "DSGVO für Baustellenkameras: Schilder, Zwecke, Speicher", format: "Guide", description: "Rechtsleitfaden für DSB", proximity: "nah", status: "planned", goal: "Rechtssicherheit" },
      { phaseOrder: 2, title: "Setup-Checkliste: Strom/Netz/Montage/Remote", format: "Checkliste", description: "Technische Voraussetzungen", proximity: "nah", status: "planned", goal: "Demo Anfrage" },
      { phaseOrder: 2, title: "DSGVO Pack: Beschilderung + Mustertexte + Rollen", format: "PDF", description: "Template Pack für Compliance", proximity: "nah", status: "planned", goal: "SQL" },
      // Phase 3 - Produktnahe Aufklärung
      { phaseOrder: 3, title: "Portal vs. Kamera – der große Unterschied", format: "PDF", description: "Reframing: BauTV+ ist mehr als eine Kamera", proximity: "sehr nah", status: "in-progress", priority: "high", goal: "Reframing" },
      { phaseOrder: 3, title: "Was kostet schlechte Dokumentation wirklich?", format: "Rechner", description: "ROI-Rechner für Meetings/Nachträge/Diebstahl", proximity: "sehr nah", status: "planned", goal: "ROI" },
      { phaseOrder: 3, title: "Demo-Baustelle mit Musterdaten", format: "Demo", description: "Portal-Demo für Aha-Moment", proximity: "sehr nah", status: "in-progress", goal: "Aha-Moment" },
      { phaseOrder: 3, title: "Webinar: Reporting-Routine für Bauherren & GUs", format: "Webinar", description: "Live-Webinar mit Best Practices", proximity: "sehr nah", status: "planned", goal: "Pipeline" },
      // Phase 4 - Entscheidung & Conversion
      { phaseOrder: 4, title: "Case Study: Bauherr Reporting spart Zeit & reduziert Meetings", format: "PDF", description: "Erfolgsgeschichte mit Zahlen", proximity: "sehr nah", status: "planned", goal: "Proof" },
      { phaseOrder: 4, title: "Video: Timelapse richtig nutzen (Freigaben/PR)", format: "Video", description: "Anwendungsvideo für Marketing", proximity: "sehr nah", status: "planned", goal: "Upsell" },
      { phaseOrder: 4, title: "Sample Report: Foto-Doku + Export (Beispiel)", format: "PDF", description: "Beispiel-Tagesbericht", proximity: "sehr nah", status: "planned", goal: "Demo" },
      { phaseOrder: 4, title: "Connectivity Guide + Security FAQ (PDF)", format: "PDF", description: "IT-Dokumentation", proximity: "sehr nah", status: "planned", goal: "IT OK" },
      { phaseOrder: 4, title: "Case: Investor erhält wöchentliches Reporting ohne Baustellenbesuch", format: "PDF", description: "Fallstudie Bauherr-Perspektive", proximity: "sehr nah", status: "planned", goal: "Decision Support" },
      { phaseOrder: 4, title: "Projektpreis-Rechner", format: "Rechner", description: "Kaufreife herstellen", proximity: "sehr nah", status: "planned", goal: "Kaufreife" },
      { phaseOrder: 4, title: "Preismatrix + Leistungsbeschreibung + SLA", format: "PDF", description: "Dokumentation für Einkauf", proximity: "sehr nah", status: "planned", goal: "Abschluss" },
    ];

    for (const content of bautvContent) {
      const { phaseOrder, ...contentData } = content;
      await ctx.db.insert("contentPieces", {
        brandId: bautvId,
        phaseId: bautvPhaseIds[phaseOrder],
        ...contentData,
      });
    }

    // ===== MICROVISTA CONTENT (from Excel database - CT + general) =====
    const microvistaContent = [
      // Phase 1 - Not Aware → Problem Aware
      { phaseOrder: 1, title: "Was kann industrielle CT – und wann lohnt sie sich?", format: "PDF", description: "Blog-Artikel: Einführung in CT-Analyse", proximity: "nah", status: "planned", goal: "Awareness" },
      { phaseOrder: 1, title: "Produktionsrisiko-Report", format: "PDF + Artikel", description: "7-10 unsichtbare Risiken in Gießerei/Automotive", proximity: "nah", status: "planned" },
      { phaseOrder: 1, title: "Risiko-Selbsttest Produktionsstabilität", format: "Online-Tool", description: "10 Fragen → Score → 3 Sofortmaßnahmen", proximity: "adjacent", status: "in-progress", priority: "high" },
      // Phase 2 - Problem Aware → Solution Aware
      { phaseOrder: 2, title: "Typische Fehlerbilder (Porosität, Risse, Einschlüsse)", format: "PDF", description: "Visual-Guide zu häufigen Defekten", proximity: "nah", status: "in-progress" },
      { phaseOrder: 2, title: "Fehlerbibliothek (Fehler-Wiki)", format: "PDF", description: "Lunker, Kaltlauf, Porosität - alle Fehlerbilder", proximity: "sehr nah", status: "in-progress" },
      { phaseOrder: 2, title: "Produktionsstabilitäts-Guide", format: "PDF", description: "Leitfaden zu stabilen Linien", proximity: "adjacent", status: "in-progress", priority: "high" },
      { phaseOrder: 2, title: "Videoserie: Wie Fehler entstehen", format: "Video", description: "Lunker, Kaltlauf, Kernversatz, Luft, Risse", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 2, title: "Messmethoden vs. Realität", format: "PDF", description: "Neutraler Vergleich aller Prüfverfahren", proximity: "nah", status: "planned" },
      // Phase 3 - Solution Aware → Trust
      { phaseOrder: 3, title: "So läuft ein CT-Projekt ab (Proben, Daten, Bericht)", format: "Guide", description: "Ablauf-Guide für Erstkunden", proximity: "sehr nah", status: "in-progress", priority: "high" },
      { phaseOrder: 3, title: "Welche Infos braucht microvista für ein Angebot?", format: "Checkliste", description: "Checkliste für Anfrager", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 3, title: "CT-Projekt Ablauf-Guide", format: "Guide", description: "Lead-Magnet für Lösungssuche", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 3, title: "Angebots-Checklist (Infos & Scope)", format: "Checkliste", description: "Was wir für ein Angebot brauchen", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 3, title: "Interne Entscheidungsvorlage für CT-Testing", format: "PDF", description: "Template für interne Freigabe", proximity: "nah", status: "planned" },
      // Phase 4 - Trust → Decision Support
      { phaseOrder: 4, title: "Beispielreports (anonymisierte Snippets)", format: "PDF", description: "Report Samples zur Orientierung", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 4, title: "Video/3D Visuals: CT-Daten verständlich erklärt", format: "Video", description: "Erklärvideo für Entscheider", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 4, title: "Beispielreport-Paket (anonymisiert)", format: "PDF", description: "Lead-Magnet mit echten Reports", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 4, title: "Entscheidungsnavigator", format: "PDF", description: "Brauchen wir externe Analyse?", proximity: "nah", status: "planned" },
      { phaseOrder: 4, title: "Messmethoden-Vergleichsmatrix", format: "One-Pager", description: "Matrix für interne Präsentationen", proximity: "nah", status: "planned" },
      // Phase 5 - Decision → Customer
      { phaseOrder: 5, title: "ROI/TCO: Kosten vs Risiko (Ausschuss, Rückruf, Verzögerung)", format: "One-Pager", description: "Wirtschaftlichkeitsberechnung", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 5, title: "48h Quote / Schnellstart-Angebot", format: "PDF", description: "Express-Angebot für schnellen Start", proximity: "sehr nah", status: "in-progress" },
      { phaseOrder: 5, title: "CT-Software Demo & Probe-Report", format: "Demo", description: "Interaktive Demo + Beispielbericht", proximity: "sehr nah", status: "in-progress" },
      { phaseOrder: 5, title: "Fallstudien aus Kundensicht", format: "PDF", description: "Erfolgsgeschichten der Kunden", proximity: "nah", status: "planned" },
      { phaseOrder: 5, title: "Bauteil-Guides (E-Motor, Batterie, Strukturteile)", format: "Guide", description: "3-5 Kurz-Guides pro Bauteiltyp", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 5, title: "Wissenscontent: Was haben wir aus Projekten gelernt?", format: "PDF", description: "Newsletter/Blog für Bestandskunden", proximity: "nah", status: "planned" },
    ];

    for (const content of microvistaContent) {
      const { phaseOrder, ...contentData } = content;
      await ctx.db.insert("contentPieces", {
        brandId: microvistaId,
        phaseId: microvistaPhaseIds[phaseOrder],
        ...contentData,
      });
    }

    // ===== BODYCAM STAKEHOLDERS =====
    const bodycamStakeholders = [
      {
        name: "Klaus",
        role: "Kontrolleur / Einsatzkraft",
        type: "Praktiker",
        ageRange: "45-55",
        painPoints: ["Tägliche Übergriffe", "Fühlt sich ungeschützt", "Überlegt zu kündigen"],
        gains: ["Sicherheit", "Beweismittel bei Vorwürfen", "Deeskalation"],
        preferredChannels: ["WhatsApp-Gruppen", "Kollegen-Empfehlung", "Messen"],
        quote: "Hätten wir schon früher machen sollen",
      },
      {
        name: "Sandra",
        role: "Teamleitung / Einsatzleitung",
        type: "Organisator",
        ageRange: "35-45",
        painPoints: ["Krankmeldungen steigen", "Kündigungen häufen sich", "Muss Lösungen finden"],
        gains: ["Messbare Verbesserung", "Weniger Ausfälle", "Karrierechance"],
        preferredChannels: ["LinkedIn", "Fachzeitschriften", "Webinare"],
        quote: "Die Zahlen sprechen für sich",
      },
      {
        name: "Thomas",
        role: "Geschäftsführung",
        type: "Entscheider",
        ageRange: "50-60",
        painPoints: ["Presseanfragen", "Politischer Druck", "Haftungsrisiko"],
        gains: ["Reputation", "Risikominimierung", "Employer Branding"],
        preferredChannels: ["Persönliche Beziehungen", "Vorstand-Netzwerk", "Referenzen"],
        quote: "Beste Entscheidung des Jahres",
      },
      {
        name: "Ralf",
        role: "Betriebsrat",
        type: "Mitarbeiter-Vertreter",
        ageRange: "45-55",
        painPoints: ["Mitarbeiter fordern Schutz", "Datenschutz-Bedenken", "Betriebsvereinbarung nötig"],
        gains: ["Erfolg für Belegschaft", "Kontrolle über Nutzung", "Klare Regeln"],
        preferredChannels: ["Gewerkschaft", "Personalversammlung", "Interne Kommunikation"],
        quote: "89% der Belegschaft sind dafür",
      },
      {
        name: "Stefan",
        role: "IT-Leitung",
        type: "Techniker (skeptisch)",
        ageRange: "35-50",
        painPoints: ["Datenschutz-Risiken", "Integration in bestehende Systeme", "Support-Aufwand"],
        gains: ["Deutsche Server", "API-Anbindung", "Zuverlässiger Support"],
        preferredChannels: ["Tech-Blogs", "Persönlicher Support", "Demo-Zugang"],
        quote: "Endlich mal was, das funktioniert",
      },
      {
        name: "Frank",
        role: "Einkauf / Finanzen",
        type: "Kostenoptimierer",
        ageRange: "40-55",
        painPoints: ["Budget-Druck", "ROI-Nachweis nötig", "Verhandlungsmacht"],
        gains: ["Mietmodell statt Investition", "TCO-Transparenz", "VBG-Förderung"],
        preferredChannels: ["Angebotsvergleich", "Verhandlungsgespräche", "Rahmenverträge"],
        quote: "Keine Investition, nur Betriebskosten!",
      },
    ];

    for (const stakeholder of bodycamStakeholders) {
      await ctx.db.insert("stakeholders", { brandId: bodycamId, ...stakeholder });
    }

    // ===== BAUTV STAKEHOLDERS (from Excel database) =====
    const bautvStakeholders = [
      {
        name: "Martin",
        role: "Bauleiter/in (GU)",
        type: "Champion",
        ageRange: "35-50",
        painPoints: ["Informationslücken", "Nachtragsstreit", "Termine halten"],
        gains: ["Weniger Stress", "Bessere Steuerung", "Reporting Zeit sparen"],
        preferredChannels: ["LinkedIn", "Fachmessen", "Kollegen-Empfehlung"],
        quote: "Wie spare ich Zeit im Reporting?",
      },
      {
        name: "Michael",
        role: "Projektleiter/in",
        type: "Champion",
        ageRange: "40-55",
        painPoints: ["Claim-Risiko", "Stakeholder-Kommunikation", "KPI-Erreichung"],
        gains: ["Transparenz", "Bessere Reports", "Weniger Meetings"],
        preferredChannels: ["Fachzeitschriften", "Webinare", "LinkedIn"],
        quote: "Welche Reports bekomme ich automatisch?",
      },
      {
        name: "Peter",
        role: "Geschäftsführer Bauunternehmen",
        type: "Entscheider",
        ageRange: "45-60",
        painPoints: ["Marge sichern", "Weniger Ärger", "Kosten/ROI"],
        gains: ["Weniger Nachträge", "Klare Dokumentation", "Mietmodell"],
        preferredChannels: ["Persönliche Beziehungen", "Referenzen", "ROI-Kalkulationen"],
        quote: "Was kostet das pro Baustelle? Rechnet sich das?",
      },
      {
        name: "Alexander",
        role: "Projektentwickler/Bauherr",
        type: "Entscheider",
        ageRange: "40-55",
        painPoints: ["Informationsasymmetrie", "Claims", "Transparenz"],
        gains: ["Wöchentliche Reports", "Timelapse für PR", "Kontrolle"],
        preferredChannels: ["LinkedIn", "Events", "Persönliche Empfehlungen"],
        quote: "Wie behalte ich den Überblick ohne Baustellenbesuch?",
      },
      {
        name: "Sabine",
        role: "HSE/SiGeKo",
        type: "Stakeholder",
        ageRange: "35-50",
        painPoints: ["Sicherheitsnachweise", "Dokumentationspflichten", "Haftung"],
        gains: ["Lückenlose Doku", "Nachweis bei Unfällen", "Audit-Sicherheit"],
        preferredChannels: ["Fachverbände", "Seminare", "Kollegen"],
        quote: "Wie dokumentiere ich Sicherheitsrelevantes automatisch?",
      },
      {
        name: "Jürgen",
        role: "IT/Technik",
        type: "Technischer Evaluator",
        ageRange: "30-50",
        painPoints: ["Netz auf Baustelle", "Integration", "Datensicherheit"],
        gains: ["LTE/5G Lösungen", "Klare Connectivity-Guides", "Service"],
        preferredChannels: ["Tech-Dokumentation", "Demo-Zugang", "Support"],
        quote: "Klappt das auch mit schlechtem Netz?",
      },
      {
        name: "Timo",
        role: "Security-Verantwortliche/r",
        type: "Champion",
        ageRange: "35-50",
        painPoints: ["Materialdiebstahl", "Vandalismus", "Versicherer"],
        gains: ["Abschreckung", "Nachweise", "Geringere Prämien"],
        preferredChannels: ["Security-Netzwerke", "Versicherer", "Fachpresse"],
        quote: "Wie reduziere ich Diebstahl um 80%?",
      },
      {
        name: "Lisa",
        role: "Kommunikation/Marketing (Bauherr)",
        type: "Nutzer",
        ageRange: "25-40",
        painPoints: ["Content für Updates", "Stakeholder-Kommunikation", "PR"],
        gains: ["Timelapse-Videos", "Automatische Updates", "Freigabe-Workflows"],
        preferredChannels: ["Social Media", "Events", "Agenturen"],
        quote: "Kann ich daraus Content für unsere Stakeholder machen?",
      },
    ];

    for (const stakeholder of bautvStakeholders) {
      await ctx.db.insert("stakeholders", { brandId: bautvId, ...stakeholder });
    }

    // ===== MICROVISTA STAKEHOLDERS (from Excel database) =====
    const microvistaStakeholders = [
      {
        name: "Dr. Müller",
        role: "Leitung Qualitätsmanagement",
        type: "Champion",
        ageRange: "40-55",
        painPoints: ["Fehler vermeiden", "Freigabe absichern", "Kundenreklamationen"],
        gains: ["Sichere Entscheidungen", "Klare Reports", "Risikominimierung"],
        preferredChannels: ["Fachzeitschriften", "Messen", "Normen-Gremien"],
        quote: "Wie sichere ich unsere Freigabeentscheidung ab?",
      },
      {
        name: "Daniel",
        role: "Entwicklungsingenieur",
        type: "Nutzer",
        ageRange: "28-45",
        painPoints: ["Ursachen finden", "Design verbessern", "Zeitdruck"],
        gains: ["3D-Visualisierung", "Root Cause Analysis", "Schnelle Ergebnisse"],
        preferredChannels: ["Tech-Blogs", "LinkedIn", "Webinare"],
        quote: "Woher kommt dieser Fehler im Bauteil?",
      },
      {
        name: "Bernd",
        role: "Produktionsleiter",
        type: "Champion",
        ageRange: "40-55",
        painPoints: ["Ausschuss senken", "Prozess stabilisieren", "Liefertermine"],
        gains: ["Weniger Rückläufer", "Stabile Prozesse", "Klare Daten"],
        preferredChannels: ["Fachverbände", "Messen", "Kollegen"],
        quote: "Wie senke ich die Ausschussquote nachhaltig?",
      },
      {
        name: "Markus",
        role: "Einkauf",
        type: "Economic Buyer",
        ageRange: "35-50",
        painPoints: ["Preis/Scope vergleichen", "Lieferantenbewertung", "Budget"],
        gains: ["Transparente Preise", "48h Angebote", "Rahmenverträge"],
        preferredChannels: ["Angebotsvergleich", "Verhandlungen", "Referenzen"],
        quote: "Was kostet eine Analyse pro Bauteil?",
      },
      {
        name: "Dr. Weber",
        role: "Technische Leitung / GF",
        type: "Entscheider",
        ageRange: "45-60",
        painPoints: ["Risiko reduzieren", "Time-to-decision", "Rückrufkosten"],
        gains: ["Sichere Entscheidungen", "Schnelle Ergebnisse", "Reputation"],
        preferredChannels: ["Vorstandsnetzwerk", "Persönliche Beziehungen", "Referenzen"],
        quote: "Wie vermeide ich einen teuren Rückruf?",
      },
    ];

    for (const stakeholder of microvistaStakeholders) {
      await ctx.db.insert("stakeholders", { brandId: microvistaId, ...stakeholder });
    }

    // ===== BAUTV SEO CLUSTERS =====
    const bautvClusters = [
      {
        name: "Baustellenprobleme & Realität",
        proximity: "neutral",
        description: "Konflikte, Kommunikation, Psychologie - 100% Zielgruppe, 0% Produkt",
        topics: ["Typische Baustellenkonflikte", "Kommunikation zwischen Gewerken", "Bauleiter zwischen allen Fronten", "Warum Missverständnisse teuer sind", "Verantwortung & Schuldfragen"],
      },
      {
        name: "Baustellenorganisation",
        proximity: "adjacent",
        description: "Organisation, Methoden, Informationsfluss",
        topics: ["Projektsteuerung vs. Bauleitung", "Informationsfluss auf Baustellen", "Entscheidungsfindung im Bau", "Best Practices Bauleitung"],
      },
      {
        name: "Dokumentation & Daten",
        proximity: "nah",
        description: "Bautagesbericht, Fotos, Beweissicherung - BauTV+ wird natürlich relevant",
        topics: ["Bautagesbericht erstellen", "Fotos richtig nutzen", "Zeitraffer auf Baustellen", "Dokumentationspflichten", "Haftung & Dokumentation"],
      },
      {
        name: "Wetter & Entscheidungen",
        proximity: "nah",
        description: "Starker USP - Wetter als Differenzierung",
        topics: ["Wetter als Streitpunkt", "Temperaturgrenzen Bau", "Wetterdokumentation", "Winterbau Entscheidungen", "Rechtssicherheit Wetterdaten"],
      },
      {
        name: "Digitale Baustelle 2026",
        proximity: "adjacent",
        description: "Zukunft, Trends, Thought Leadership",
        topics: ["Digitalisierung Bau", "Baustelle der Zukunft", "Portale im Bau", "Software für Bauleiter", "Warum Hardware allein nicht reicht"],
      },
      {
        name: "BauTV+ erklärt",
        proximity: "sehr nah",
        description: "Produktnahe Inhalte für Conversion",
        topics: ["BauTV+ vs Baustellenkamera", "BauTV+ vs Oculai", "Kosten Baustellenkamera", "BauTV+ Erfahrungen", "BauTV+ Portal erklärt"],
      },
    ];

    for (const cluster of bautvClusters) {
      await ctx.db.insert("seoClusters", { brandId: bautvId, ...cluster });
    }

    // ===== BODYCAM SUMMIT CAMPAIGN TEMPLATE =====
    const summitCampaignId = await ctx.db.insert("campaigns", {
      brandId: bodycamId,
      name: "Sicherheitsgipfel Reaktionskampagne",
      objective:
        "Szenario-basierte Reaktion auf den Sicherheitsgipfel mit PR, Social, Paid und Whitepaper-Aktivierung.",
      status: "ready",
      priority: "high",
      owner: "Marketing",
      startDate: "2026-02-11",
      endDate: "2026-02-21",
      budgetTotal: 120000,
      budgetSpent: 0,
      notes:
        "Empathisch kommunizieren, nur belegte Claims nutzen und die Gipfel-Entscheidung in Echtzeit abbilden. Unterlagenbasis: docs/bodycam-sicherheitsgipfel-2026/*.md",
    });

    const summitScenarioA = await ctx.db.insert("campaignScenarios", {
      campaignId: summitCampaignId,
      key: "A",
      name: "DB beschließt konkrete Ausweitung",
      trigger: "DB kommuniziert direkte Maßnahmen nach dem Gipfel.",
      pressAngle: "Schnelle, sichere Umsetzung mit klaren Einsatzprotokollen.",
      socialAngle: "Umsetzung statt Symbolpolitik: Training, Regeln, Datenschutz.",
      adAngle: "Rollout-Unterstützung für Verkehrsunternehmen.",
      cta: "Implementierungsfahrplan anfordern",
      status: "ready",
      order: 1,
    });

    const summitScenarioB = await ctx.db.insert("campaignScenarios", {
      campaignId: summitCampaignId,
      key: "B",
      name: "Brancheneinordnung ohne Pflicht",
      trigger: "Empfehlungen, aber keine harte Verpflichtung.",
      pressAngle: "Freiwilliger Branchenstandard senkt Risiken sofort.",
      socialAngle: "Praxisnahe Standards für ÖPNV und Sicherheitsdienste.",
      adAngle: "Pilotprogramme für Betriebe jetzt starten.",
      cta: "Pilotprogramm starten",
      status: "ready",
      order: 2,
    });

    const summitScenarioC = await ctx.db.insert("campaignScenarios", {
      campaignId: summitCampaignId,
      key: "C",
      name: "Politischer Fahrplan zur Pflicht",
      trigger: "Bund/Land signalisiert verpflichtende Einführung.",
      pressAngle: "Pflichtfähige, datenschutzkonforme Skalierung.",
      socialAngle: "Recht + Training + Betrieb als gemeinsamer Standard.",
      adAngle: "Kapazitäten für bundesweiten Rollout sichern.",
      cta: "Kapazitätsgespräch buchen",
      status: "ready",
      order: 3,
    });

    const summitScenarioD = await ctx.db.insert("campaignScenarios", {
      campaignId: summitCampaignId,
      key: "D",
      name: "Keine klare Entscheidung",
      trigger: "Gipfel endet ohne konkrete Beschlüsse.",
      pressAngle: "Sicherheitsarbeit nicht vertagen: pilotieren und evaluieren.",
      socialAngle: "Jetzt vorbereiten statt nach dem nächsten Vorfall reagieren.",
      adAngle: "Pragmatischer 90-Tage-Pilot mit KPI-Set.",
      cta: "90-Tage-Blueprint erhalten",
      status: "ready",
      order: 4,
    });

    await ctx.db.insert("campaignTasks", {
      campaignId: summitCampaignId,
      scenarioId: summitScenarioA,
      channel: "PR",
      title: "Presse-Statement Szenario A final freigeben",
      owner: "PR Team",
      dueDate: "2026-02-13",
      status: "planned",
      priority: "high",
      assetType: "Pressemitteilung",
    });

    await ctx.db.insert("campaignTasks", {
      campaignId: summitCampaignId,
      scenarioId: summitScenarioB,
      channel: "PR",
      title: "Presse-Statement Szenario B final freigeben",
      owner: "PR Team",
      dueDate: "2026-02-13",
      status: "planned",
      priority: "high",
      assetType: "Pressemitteilung",
    });

    await ctx.db.insert("campaignTasks", {
      campaignId: summitCampaignId,
      scenarioId: summitScenarioC,
      channel: "PR",
      title: "Presse-Statement Szenario C final freigeben",
      owner: "PR Team",
      dueDate: "2026-02-13",
      status: "planned",
      priority: "high",
      assetType: "Pressemitteilung",
    });

    await ctx.db.insert("campaignTasks", {
      campaignId: summitCampaignId,
      scenarioId: summitScenarioD,
      channel: "PR",
      title: "Presse-Statement Szenario D final freigeben",
      owner: "PR Team",
      dueDate: "2026-02-13",
      status: "planned",
      priority: "high",
      assetType: "Pressemitteilung",
    });

    await ctx.db.insert("campaignTasks", {
      campaignId: summitCampaignId,
      channel: "Social",
      title: "8 LinkedIn Posts für 4 Szenarien vorbereiten",
      owner: "Social Team",
      dueDate: "2026-02-12",
      status: "in-progress",
      priority: "high",
      assetType: "Post-Serie",
    });
    await ctx.db.insert("campaignTasks", {
      campaignId: summitCampaignId,
      channel: "PR",
      title: "DB-Bodycam-Video als Faktencheck in Presskit einarbeiten",
      owner: "PR Team",
      dueDate: "2026-02-12",
      status: "planned",
      priority: "high",
      assetType: "Faktencheck",
      note: "Quelle: docs/Deutsche Bahn berichtet ueber den Einsatz von Body-Cams.docx",
    });

    await ctx.db.insert("campaignTasks", {
      campaignId: summitCampaignId,
      channel: "Whitepaper",
      title: "Oliver-Pohl-Transcript in Deeskalationskapitel übernehmen",
      owner: "Editorial",
      dueDate: "2026-02-13",
      status: "planned",
      priority: "high",
      assetType: "Whitepaper",
      note: "Quelle: docs/NetCo Body-Cam Fachdialog 2026_Deeskalation mit Oliver Pohl (2).mp4.txt",
    });

    await ctx.db.insert("campaignTasks", {
      campaignId: summitCampaignId,
      channel: "Whitepaper",
      title: "Whitepaper Kapitel 1-5 final texten",
      owner: "Editorial",
      dueDate: "2026-02-16",
      status: "in-progress",
      priority: "high",
      assetType: "Whitepaper",
    });

    await ctx.db.insert("campaignTasks", {
      campaignId: summitCampaignId,
      channel: "Video",
      title: "15s/30s/45s Video-Skripte finalisieren",
      owner: "Creative Team",
      dueDate: "2026-02-12",
      status: "in-progress",
      priority: "high",
      assetType: "Video-Skript",
    });

    await ctx.db.insert("campaignTasks", {
      campaignId: summitCampaignId,
      channel: "Paid",
      title: "Berlin Geo-Fencing Kampagnen für Gipfelumfeld live setzen",
      owner: "Performance Team",
      dueDate: "2026-02-12",
      status: "planned",
      priority: "high",
      assetType: "Google Ads",
    });

    const summitAssets = [
      {
        title: "Operatives Runbook",
        category: "Runbook",
        filePath:
          "docs/bodycam-sicherheitsgipfel-2026/Kampagne_Sicherheitsgipfel_Runbook_2026-02.md",
        publicUrl:
          "/campaign-assets/bodycam-sicherheitsgipfel-2026/Kampagne_Sicherheitsgipfel_Runbook_2026-02.md",
        summary:
          "72h-Ablauf, Szenario-Matrix A/B/C und Go/No-Go-Checkliste für den Gipfelbetrieb.",
        owner: "Marketing Lead",
        status: "ready",
        order: 1,
      },
      {
        title: "Content Pack",
        category: "Content",
        filePath:
          "docs/bodycam-sicherheitsgipfel-2026/Content_Pack_Sicherheitsgipfel_2026-02.md",
        publicUrl:
          "/campaign-assets/bodycam-sicherheitsgipfel-2026/Content_Pack_Sicherheitsgipfel_2026-02.md",
        summary:
          "Vorlagen für PR, Social, Video und Whitepaper-CTAs pro Szenario.",
        owner: "Content Team",
        status: "ready",
        order: 2,
      },
      {
        title: "Pressemappe",
        category: "PR",
        filePath:
          "docs/bodycam-sicherheitsgipfel-2026/Pressemappe_Sicherheitsgipfel_2026-02.md",
        publicUrl:
          "/campaign-assets/bodycam-sicherheitsgipfel-2026/Pressemappe_Sicherheitsgipfel_2026-02.md",
        summary: "PM-Templates für Szenario A/B/C inklusive Q&A.",
        owner: "PR Team",
        status: "ready",
        order: 3,
      },
      {
        title: "Whitepaper Draft",
        category: "Whitepaper",
        filePath:
          "docs/bodycam-sicherheitsgipfel-2026/Whitepaper_Sicherheit_Individuum_2026.md",
        publicUrl:
          "/campaign-assets/bodycam-sicherheitsgipfel-2026/Whitepaper_Sicherheit_Individuum_2026.md",
        summary:
          "Vollständiger Entwurf mit Lagebild, SOP, Datenschutz, KPI und 30/60/90-Rollout.",
        owner: "Editorial",
        status: "ready",
        order: 4,
      },
      {
        title: "Social + Visuals Paket",
        category: "Social",
        filePath:
          "docs/bodycam-sicherheitsgipfel-2026/Social_und_Visuals_Paket_2026-02.md",
        publicUrl:
          "/campaign-assets/bodycam-sicherheitsgipfel-2026/Social_und_Visuals_Paket_2026-02.md",
        summary:
          "Post-Copy, Creative-Briefs und Visual-Baukasten für LinkedIn, X und Reels.",
        owner: "Social Team",
        status: "ready",
        order: 5,
      },
      {
        title: "Video Storyboard + Script",
        category: "Video",
        filePath:
          "docs/bodycam-sicherheitsgipfel-2026/Video_Storyboard_und_Script_2026-02.md",
        publicUrl:
          "/campaign-assets/bodycam-sicherheitsgipfel-2026/Video_Storyboard_und_Script_2026-02.md",
        summary:
          "30s Ad + 60s Erklärvideo mit Shotlist, Sprechertext und Remotion-Sequenzen.",
        owner: "Creative Team",
        status: "ready",
        order: 6,
      },
      {
        title: "FirstBookAI Framework",
        category: "Book",
        filePath:
          "docs/bodycam-sicherheitsgipfel-2026/FirstBookAI_Book_Framework_2026-02.md",
        publicUrl:
          "/campaign-assets/bodycam-sicherheitsgipfel-2026/FirstBookAI_Book_Framework_2026-02.md",
        summary:
          "Copy-Paste Eingabe für FirstBookAI inklusive Kapitelrahmen und Positionierung.",
        owner: "Leadership",
        status: "ready",
        order: 7,
      },
      {
        title: "Dashboard Task Sync",
        category: "Ops",
        filePath:
          "docs/bodycam-sicherheitsgipfel-2026/Dashboard_Task_Sync_2026-02.md",
        publicUrl:
          "/campaign-assets/bodycam-sicherheitsgipfel-2026/Dashboard_Task_Sync_2026-02.md",
        summary:
          "Importvorlage mit Ownern, Status und Deliverables für Freitag bis T+72.",
        owner: "Marketing Ops",
        status: "ready",
        order: 8,
      },
    ];

    for (const asset of summitAssets) {
      await ctx.db.insert("campaignAssets", {
        campaignId: summitCampaignId,
        ...asset,
      });
    }

    return {
      message: "Seed completed successfully",
      brands: { bodycamId, bautvId, microvistaId },
    };
  },
});

export const seedBuyingCenterAndJourneys = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Find bodycam brand
    const brands = await ctx.db.query("brands").collect();
    const bodycam = brands.find(b => b.slug === "bodycam");
    if (!bodycam) return { message: "Brand bodycam not found" };

    // 2. Check if already seeded (look for journeys)
    const existingJourneys = await ctx.db
      .query("journeys")
      .withIndex("by_brand", q => q.eq("brandId", bodycam._id))
      .collect();
    if (existingJourneys.length > 0) {
      return { message: "Buying Center & Journeys already seeded" };
    }

    // 3. Patch existing stakeholders with buyingCenterRole + segment
    const stakeholders = await ctx.db
      .query("stakeholders")
      .withIndex("by_brand", q => q.eq("brandId", bodycam._id))
      .collect();

    const roleMap: Record<string, { buyingCenterRole: string; segment: string }> = {
      "Kontrolleur / Einsatzkraft": { buyingCenterRole: "Anwender", segment: "Alle" },
      "Teamleitung / Einsatzleitung": { buyingCenterRole: "Champion", segment: "Alle" },
      "Geschäftsführung": { buyingCenterRole: "Entscheider", segment: "Alle" },
      "Betriebsrat": { buyingCenterRole: "Beeinflusser", segment: "Alle" },
      "IT-Leitung": { buyingCenterRole: "Gatekeeper", segment: "Alle" },
      "Einkauf / Finanzen": { buyingCenterRole: "Gatekeeper", segment: "Alle" },
    };

    for (const s of stakeholders) {
      const mapping = roleMap[s.role];
      if (mapping) {
        await ctx.db.patch(s._id, mapping);
      }
    }

    // 4. Create new branchenspezifische Stakeholder
    const newStakeholders = [
      {
        name: "Ulrich",
        role: "Datenschutzbeauftragter",
        type: "Beeinflusser",
        ageRange: "40-55",
        painPoints: ["DSGVO-Konformität sicherstellen", "Kameraaufnahmen rechtssicher handhaben", "Mitarbeiterdaten schützen"],
        gains: ["Rechtssicherheit", "Klare Prozesse", "Auditfähige Dokumentation"],
        preferredChannels: ["Datenschutz-Fachmedien", "Konferenzen", "Rechtsanwälte"],
        quote: "Zeigen Sie mir die DSGVO-Konformität",
        buyingCenterRole: "Beeinflusser",
        segment: "ÖPNV",
      },
      {
        name: "Karin",
        role: "Personalrätin",
        type: "Beeinflusser",
        ageRange: "40-55",
        painPoints: ["Überwachungsbedenken der Belegschaft", "Betriebsvereinbarung aushandeln", "Mitarbeiterakzeptanz sichern"],
        gains: ["Schutz der Mitarbeiter", "Klare Nutzungsregeln", "Mitbestimmung"],
        preferredChannels: ["Gewerkschaft", "Personalversammlung", "Betriebsratsnetzwerk"],
        quote: "Die Belegschaft muss das mittragen",
        buyingCenterRole: "Beeinflusser",
        segment: "ÖPNV",
      },
      {
        name: "Jörg",
        role: "Sicherheitsbeauftragter Kommune",
        type: "Champion",
        ageRange: "35-50",
        painPoints: ["Steigende Übergriffe auf Außendienstmitarbeiter", "Fehlende Beweismittel", "Mitarbeiterfluktuation"],
        gains: ["Messbarer Rückgang von Übergriffen", "Beweissicherung", "Mitarbeiterbindung"],
        preferredChannels: ["Kommunale Netzwerke", "Fachtagungen", "Kollegen"],
        quote: "Seit der Einführung trauen sich meine Leute wieder raus",
        buyingCenterRole: "Champion",
        segment: "Kommune",
      },
      {
        name: "Petra",
        role: "Beschaffungsleiterin Ordnungsamt",
        type: "Gatekeeper",
        ageRange: "40-55",
        painPoints: ["Vergaberecht einhalten", "Budget rechtfertigen", "Anbietervergleich"],
        gains: ["Saubere Ausschreibung", "Wirtschaftlichkeitsnachweis", "Referenzen"],
        preferredChannels: ["Vergabeplattformen", "Fachzeitschriften", "Verhandlungen"],
        quote: "Ich brauche eine saubere Leistungsbeschreibung",
        buyingCenterRole: "Gatekeeper",
        segment: "Kommune",
      },
      {
        name: "Dr. Hoffmann",
        role: "Klinikleitung",
        type: "Entscheider",
        ageRange: "45-60",
        painPoints: ["Übergriffe auf Pflegepersonal", "Medienpräsenz", "Fachkräftemangel verschärft durch Gewalt"],
        gains: ["Sichereres Arbeitsumfeld", "Arbeitgeberattraktivität", "Haftungsschutz"],
        preferredChannels: ["Klinikmanagement-Kongresse", "Fachverbände", "Persönliche Empfehlungen"],
        quote: "Wir verlieren gute Leute wegen der Gewalt",
        buyingCenterRole: "Entscheider",
        segment: "Gesundheitswesen",
      },
      {
        name: "Markus",
        role: "Werkschutzleiter",
        type: "Champion",
        ageRange: "35-50",
        painPoints: ["Falschbeschuldigungen gegen Sicherheitspersonal", "Haftungsrisiken", "Personalmangel"],
        gains: ["Beweissicherung", "Deeskalation", "Professionelles Image"],
        preferredChannels: ["Security-Fachpresse", "Messen", "Branchennetzwerk"],
        quote: "Die Kamera schützt meine Leute und unsere Kunden",
        buyingCenterRole: "Champion",
        segment: "Sicherheitsdienste",
      },
    ];

    for (const s of newStakeholders) {
      await ctx.db.insert("stakeholders", { brandId: bodycam._id, ...s });
    }

    // 5. Reload stakeholders to get IDs for journeys
    const allStakeholders = await ctx.db
      .query("stakeholders")
      .withIndex("by_brand", q => q.eq("brandId", bodycam._id))
      .collect();

    const findStakeholder = (name: string) => allStakeholders.find(s => s.name === name);

    // 6. Get phases
    const phases = await ctx.db
      .query("phases")
      .withIndex("by_brand", q => q.eq("brandId", bodycam._id))
      .collect();
    const phaseByOrder = (order: number) => phases.find(p => p.order === order)!;

    // 7. Get content pieces for linking
    const content = await ctx.db
      .query("contentPieces")
      .withIndex("by_brand", q => q.eq("brandId", bodycam._id))
      .collect();
    const findContent = (titleFragment: string) => content.find(c => c.title.includes(titleFragment));

    // 8. Create Journeys + Steps
    // Journey 1: ÖPNV-Entscheider nach Vorfall
    const thomas = findStakeholder("Thomas");
    const journey1Id = await ctx.db.insert("journeys", {
      brandId: bodycam._id,
      name: "ÖPNV-Entscheider nach Vorfall",
      role: "GF Verkehrsunternehmen",
      situation: "Gewaltzwischenfall in der Presse, politischer Druck",
      icon: "🏢",
      color: "#ef4444",
      stakeholderId: thomas?._id,
    });

    // Journey 1 Steps
    const dsgvoLeitfaden = findContent("DSGVO Praxisleitfaden");
    await ctx.db.insert("journeySteps", {
      journeyId: journey1Id,
      phaseId: phaseByOrder(2)._id,
      order: 1,
      trigger: "Presseberichte über Übergriff, Anfragen von Medien und Politik",
      searchQuery: "bodycam ÖPNV gewalt",
      contentIds: dsgvoLeitfaden ? [dsgvoLeitfaden._id] : [],
      insight: "Entscheider reagieren auf externen Druck, nicht auf interne Vorschläge",
    });

    const betriebsvereinbarung = findContent("Muster-Betriebsvereinbarung");
    const datenfluss = findContent("Datenfluss");
    await ctx.db.insert("journeySteps", {
      journeyId: journey1Id,
      phaseId: phaseByOrder(3)._id,
      order: 2,
      trigger: "Interne Task Force gegründet, recherchiert Optionen",
      searchQuery: "bodycam einführung betriebsvereinbarung",
      contentIds: [betriebsvereinbarung, datenfluss].filter(Boolean).map(c => c!._id),
      insight: "Betriebsvereinbarung ist der häufigste Blocker — muss früh adressiert werden",
    });

    const caseStudy = findContent("Case Study: ÖPNV");
    await ctx.db.insert("journeySteps", {
      journeyId: journey1Id,
      phaseId: phaseByOrder(4)._id,
      order: 3,
      trigger: "Buying Center vergleicht Anbieter, fordert Referenzen",
      searchQuery: "bodycam anbieter vergleich DSGVO",
      contentIds: caseStudy ? [caseStudy._id] : [],
      insight: "Referenzen aus der gleichen Branche sind entscheidend",
    });

    const tcoRechner = findContent("TCO-Rechner");
    await ctx.db.insert("journeySteps", {
      journeyId: journey1Id,
      phaseId: phaseByOrder(5)._id,
      order: 4,
      trigger: "Finale Entscheidung, Budget-Freigabe nötig",
      contentIds: tcoRechner ? [tcoRechner._id] : [],
      insight: "Mietmodell senkt die Einstiegshürde erheblich",
    });

    // Journey 2: IT-Gatekeeper
    const stefan = findStakeholder("Stefan");
    const journey2Id = await ctx.db.insert("journeys", {
      brandId: bodycam._id,
      name: "IT-Gatekeeper technische Prüfung",
      role: "IT-Leitung",
      situation: "Muss technische Machbarkeit und Datenschutz prüfen",
      icon: "🔒",
      color: "#3b82f6",
      stakeholderId: stefan?._id,
    });

    await ctx.db.insert("journeySteps", {
      journeyId: journey2Id,
      phaseId: phaseByOrder(3)._id,
      order: 1,
      trigger: "Auftrag von GF: technische Machbarkeit prüfen",
      searchQuery: "bodycam on-premise cloud datenschutz",
      contentIds: datenfluss ? [datenfluss._id] : [],
      insight: "IT will On-Prem-Option sehen, Cloud ist oft Blocker",
    });

    const techSpec = findContent("Tech Spec PDF");
    await ctx.db.insert("journeySteps", {
      journeyId: journey2Id,
      phaseId: phaseByOrder(4)._id,
      order: 2,
      trigger: "Technische Detailprüfung, Security-Audit",
      searchQuery: "bodycam IT sicherheit API integration",
      contentIds: techSpec ? [techSpec._id] : [],
      insight: "Deutsche Server und BSI-Konformität sind K.O.-Kriterien",
    });

    const demoScript = findContent("Demo Script");
    await ctx.db.insert("journeySteps", {
      journeyId: journey2Id,
      phaseId: phaseByOrder(5)._id,
      order: 3,
      trigger: "IT gibt grünes Licht, Pilot-Setup planen",
      contentIds: demoScript ? [demoScript._id] : [],
      insight: "IT muss im Pilotprojekt dabei sein, nicht erst beim Rollout",
    });

    // Journey 3: Betriebsrat
    const ralf = findStakeholder("Ralf");
    const journey3Id = await ctx.db.insert("journeys", {
      brandId: bodycam._id,
      name: "Betriebsrat Zustimmungsprozess",
      role: "Betriebsrat",
      situation: "Muss Betriebsvereinbarung mit Arbeitgeber aushandeln",
      icon: "🤝",
      color: "#f59e0b",
      stakeholderId: ralf?._id,
    });

    const dsgvoCheckliste = findContent("Bodycams & DSGVO: Checkliste");
    await ctx.db.insert("journeySteps", {
      journeyId: journey3Id,
      phaseId: phaseByOrder(2)._id,
      order: 1,
      trigger: "Mitarbeiter fordern Schutzmaßnahmen, GF schlägt Bodycams vor",
      contentIds: dsgvoCheckliste ? [dsgvoCheckliste._id] : [],
      insight: "BR braucht neutrale Fakten, keine Verkaufsargumente",
    });

    const zwanzigFragen = findContent("20 Fragen");
    await ctx.db.insert("journeySteps", {
      journeyId: journey3Id,
      phaseId: phaseByOrder(3)._id,
      order: 2,
      trigger: "BR-Sitzung: Bodycam-Thema wird formell behandelt",
      searchQuery: "betriebsrat bodycam mitbestimmung",
      contentIds: [zwanzigFragen, betriebsvereinbarung].filter(Boolean).map(c => c!._id),
      insight: "BR will Kontrolle über Nutzungsregeln — Muster-BV gibt Sicherheit",
    });

    const alltagsVideo = findContent("Video: Alltagseinsatz");
    await ctx.db.insert("journeySteps", {
      journeyId: journey3Id,
      phaseId: phaseByOrder(4)._id,
      order: 3,
      trigger: "BR will Praxisbeweis: funktioniert das wirklich?",
      contentIds: alltagsVideo ? [alltagsVideo._id] : [],
      insight: "89%-Akzeptanzzahl der Belegschaft überzeugt skeptische BRs",
    });

    // 9. Add new Phase 3+4 Content Pieces with targetRoles
    const phase3 = phaseByOrder(3);
    const phase4 = phaseByOrder(4);

    const newContent = [
      // Phase 3
      { phaseId: phase3._id, title: "Branchenvergleich: Bodycam-Einführung in 7 Branchen", format: "PDF", description: "Infografik: Welche Branchen setzen Bodycams ein und wie weit sind sie?", proximity: "nah", status: "planned", priority: "high", targetRoles: ["Entscheider"] },
      { phaseId: phase3._id, title: "Prozess-Comic: So läuft eine Bodycam-Einführung ab", format: "PDF", description: "8-Panel-Storyboard als Vorlage für Videoproduktion — erklärt den Prozess für Skeptiker", proximity: "nah", status: "planned", targetRoles: ["Anwender", "Champion"] },
      { phaseId: phase3._id, title: "Ausschreibungstext-Vorlage Bodycam (öffentl. Hand)", format: "PDF", description: "Muster-Leistungsbeschreibung für öffentliche Vergabeverfahren", proximity: "sehr nah", status: "planned", priority: "high", targetRoles: ["Gatekeeper"] },
      { phaseId: phase3._id, title: "Dienstanweisung Bodycam-Einsatz (Muster)", format: "PDF", description: "Template für HR/Rechtsabteilung zur internen Regelung", proximity: "sehr nah", status: "planned", targetRoles: ["Beeinflusser", "Entscheider"] },
      { phaseId: phase3._id, title: "Implementierungs-Guide: 90-Tage-Rollout", format: "Guide", description: "Schritt-für-Schritt-Anleitung für Projektverantwortliche", proximity: "sehr nah", status: "planned", priority: "high", targetRoles: ["Champion"] },
      { phaseId: phase3._id, title: "Schulungskonzept Train-the-Trainer", format: "PDF", description: "Vorlage für interne Multiplikatoren-Schulung", proximity: "nah", status: "planned", targetRoles: ["Anwender"] },
      { phaseId: phase3._id, title: "Checkliste Pilotprojekt ÖPNV", format: "Checkliste", description: "Branchenspezifische Checkliste: Was vor dem Pilot geklärt sein muss", proximity: "sehr nah", status: "planned", targetRoles: ["Champion"] },
      { phaseId: phase3._id, title: "Infografik: DSGVO-Compliance auf einen Blick", format: "Poster", description: "Visuelle Zusammenfassung aller rechtlichen Anforderungen für DSB", proximity: "nah", status: "planned", targetRoles: ["Beeinflusser"] },
      // Phase 4
      { phaseId: phase4._id, title: "Anbieter-Vergleichsmatrix: NetCo vs. Markt", format: "One-Pager", description: "Objektiver Feature-Vergleich für interne Entscheidungspräsentation", proximity: "sehr nah", status: "planned", priority: "high", targetRoles: ["Entscheider", "Gatekeeper"] },
      { phaseId: phase4._id, title: "ROI-Rechner mit VBG-Förderung", format: "Rechner", description: "Interaktiver Rechner inkl. VBG-Prämienförderung und Mietmodell", proximity: "sehr nah", status: "planned", priority: "high", targetRoles: ["Entscheider"] },
      { phaseId: phase4._id, title: "Comic-Storyboard: Gerichtsverfahren mit und ohne Bodycam", format: "PDF", description: "Dramatische Visualisierung des Risikos ohne Beweissicherung", proximity: "nah", status: "planned", targetRoles: ["Entscheider", "Beeinflusser"] },
      { phaseId: phase4._id, title: "Case Study: Ordnungsamt Köln — 12 Monate Ergebnis", format: "PDF", description: "Branchenspezifische Fallstudie mit messbaren Ergebnissen", proximity: "sehr nah", status: "planned", priority: "high", targetRoles: ["Entscheider"] },
      { phaseId: phase4._id, title: "IT-Sicherheitskonzept Vorlage (BSI-konform)", format: "PDF", description: "BSI-konforme Vorlage zum Ausfüllen für IT-Abteilungen", proximity: "sehr nah", status: "planned", targetRoles: ["Gatekeeper"] },
      { phaseId: phase4._id, title: "Referenzliste 25 Kunden (ÖPNV + Kommune)", format: "PDF", description: "Vertrauensaufbau: BVG, DB, KVB, Ordnungsamt Duisburg, Köln etc.", proximity: "sehr nah", status: "planned", targetRoles: ["Entscheider"] },
      { phaseId: phase4._id, title: "Workshop-Agenda: Pilot intern verkaufen", format: "Workshop", description: "Agenda + Argumentation für interne Champions", proximity: "sehr nah", status: "planned", targetRoles: ["Champion"] },
      { phaseId: phase4._id, title: "Video-Storyboard: Deeskalation im Alltag", format: "PDF", description: "Storyboard für Videoproduktion — zeigt Deeskalationswirkung im Einsatz", proximity: "sehr nah", status: "planned", targetRoles: ["Anwender", "Champion"] },
    ];

    for (const c of newContent) {
      await ctx.db.insert("contentPieces", { brandId: bodycam._id, ...c });
    }

    return { message: "Buying Center, Journeys & Phase 3+4 Content seeded successfully" };
  },
});

export const seedBodycamSeoClusters = mutation({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.db.query("brands").collect();
    const bodycam = brands.find(b => b.slug === "bodycam");
    if (!bodycam) return { message: "Brand bodycam not found" };

    // Check if already seeded
    const existing = await ctx.db
      .query("seoClusters")
      .withIndex("by_brand", q => q.eq("brandId", bodycam._id))
      .collect();
    if (existing.length > 0) {
      return { message: "Bodycam SEO Clusters already seeded" };
    }

    // GSC-Datenanalyse Jan 2025 – März 2026
    // Cluster basierend auf echten Suchanfragen + Impressionen + Klicks
    const clusters = [
      {
        name: "Bodycam Rechtsgrundlagen (Bundesländer)",
        proximity: "nah",
        description: "Stärkstes organisches Cluster — 8 Bundesland-spezifische Rechtsgrundlagen-Artikel dominieren die Impressionen. Top-Performer: Niedersachsen (1.081 Klicks, 24K Imp), Bayern (533 Klicks, 33K Imp), BW (427 Klicks, 29K Imp).",
        topics: [
          "bodycam polizei rechtsgrundlage (1.990 Imp, Pos 1)",
          "bodycam polizei niedersachsen (1.475 Imp, Pos 1)",
          "bodycam polizei bayern (1.362 Imp, Pos 1)",
          "bodycam polizei bw / baden-württemberg (1.057+ Imp, Pos 2-4)",
          "bodycam polizei nrw (1.712 Imp, Pos 2)",
          "bodycam polizei hamburg (845 Imp, Pos 1)",
          "bodycam polizei berlin (357 Imp, Pos 5)",
          "bodycam polizei hessen (121 Imp, Pos 7)",
          "bodycam saarland / rheinland-pfalz (833-842 Imp)",
          "15c polg nrw / polg bw (1.389-3.131 Imp)",
        ],
      },
      {
        name: "Bodycam kaufen & Preise",
        proximity: "sehr nah",
        description: "Hochkommerzielle Kaufintention — 'bodycam kaufen' ist das zweitstärkste Keyword (25K Imp, 178 Klicks). Preisseite auf Pos 12 mit 56K Impressionen. Riesiges Conversion-Potential.",
        topics: [
          "bodycam kaufen (25.891 Imp, 178 Klicks, Pos 5)",
          "body cam kaufen (2.456 Imp, Pos 4)",
          "bodycams kaufen (1.481 Imp, Pos 4)",
          "bodycam preis / preise (1.285 Imp, Pos 5)",
          "was kostet eine bodycam (556 Imp)",
          "netco bodycam preis (228 Imp, 65 Klicks, Pos 1)",
          "bodycam kosten (228 Imp)",
          "bodycam hersteller (1.350 Imp, Pos 6)",
          "bodycam mieten (3.239 Imp auf Miet-Artikel)",
          "bodycam testsieger / vergleich (337-65 Imp)",
        ],
      },
      {
        name: "Bodycam Polizei (allgemein)",
        proximity: "adjacent",
        description: "Breites Informationscluster rund um Polizei-Bodycams — nicht direkt kaufrelevant, aber enormes Volumen. Zieht B2G-Entscheider an. Hauptseite /polizei/ hat 40K Impressionen.",
        topics: [
          "bodycam polizei (5.732 Imp, Pos 8)",
          "polizei bodycam (3.519 Imp, Pos 10)",
          "bodycam polizei deutschland (1.514 Imp, Pos 4)",
          "polizei bodycam pflicht (1.861 Imp, Pos 8)",
          "haben deutsche polizisten bodycams (1.381 Imp)",
          "bodycam polizei pro contra (587 Imp)",
          "bodycam polizei vor und nachteile (584 Imp)",
          "bodycam bundespolizei (885 Imp)",
          "bodycam polizei kosten (32 Imp)",
          "welche bodycam benutzt die polizei (50 Imp)",
        ],
      },
      {
        name: "DSGVO & Datenschutz",
        proximity: "nah",
        description: "Kritisches Vertrauens-Cluster — DSGVO-Seite hat 32K Imp. Datenschutz ist der häufigste Einwand im Buying Center (Beeinflusser). Inhalte müssen überzeugen.",
        topics: [
          "bodycam datenschutz (1.069 Imp, Pos 7)",
          "bodycam erlaubt (1.393 Imp, Pos 9)",
          "bodycam dsgvo (32.105 Imp auf DSGVO-Seite)",
          "bodycam als privatperson (2.910 Imp)",
          "polizei bodycam datenschutz (891 Imp)",
          "bodycam privat erlaubt (113 Imp)",
          "cloud act bodycams (64 Imp)",
          "eugh urteil bodycam (368 Imp, Pos 5)",
          "bodycam als beweismittel (1.187 Imp)",
          "bodycam in wohnungen (32 Imp)",
        ],
      },
      {
        name: "Bodycam Technik & Features",
        proximity: "sehr nah",
        description: "Produktnahes Cluster — Technik-Seite 44K Imp, Zubehör 38K Imp. Pre-Recording, Livestreaming und Halterungen sind Differenzierungs-Features.",
        topics: [
          "bodycam mit live übertragung (1.193 Imp, 47 Klicks, Pos 1)",
          "bodycam livestream / streaming (1.176-1.151 Imp, Pos 1-3)",
          "pre recording bodycam (812 Imp, Pos 15)",
          "bodycam halterung (1.685 Imp, 24 Klicks, Pos 1)",
          "bodycam halterung polizei (1.052 Imp, Pos 3)",
          "bodycam software (393 Imp, Pos 1)",
          "bodycam mit handy verbinden (162 Imp)",
          "bodycam frontdisplay (1.480 Imp auf Blog)",
          "body cam pro (32 Imp, 5 Klicks)",
          "bodycam wasserdicht (404 Imp)",
        ],
      },
      {
        name: "Branchen: ÖPNV & Bahn",
        proximity: "sehr nah",
        description: "Kernbranche — DB, BVG, KVB und andere ÖPNV-Referenzen ziehen Branchenentscheider. Hohe Sichtbarkeit über Referenz- und Case-Study-Seiten.",
        topics: [
          "bodycam deutsche bahn (1.399 Imp)",
          "bvg sicherheitsdienst (1.554 Imp)",
          "bodycam bahn (919 Imp)",
          "db sicherheit (319 Imp)",
          "sicherheit deutsche bahn (29 Imp)",
          "kvb kölner verkehrsbetriebe (190 Imp)",
          "bodycam bahnsecurity / bahnsicherheit (71-70 Imp)",
          "case study stölting trainservice (50 Imp)",
          "nordwestbahn bodycam (476 Imp auf Blog)",
          "sicherheit im öpnv (39 Imp)",
        ],
      },
      {
        name: "Branchen: Ordnungsamt & Kommune",
        proximity: "sehr nah",
        description: "Zweitstärkste Branche — NRW-Ordnungsämter dominieren. Duisburg allein hat 5.264 Imp. Referenzen aus Köln, Hamm, Bonn, Siegburg generieren organischen Traffic.",
        topics: [
          "ordnungsamt duisburg (5.264 Imp)",
          "bodycam ordnungsamt (1.101 Imp, Pos 1)",
          "nrw ordnungsamt bodycam (5.242 Imp auf Blog)",
          "ordnungsamt siegburg (1.166 Imp)",
          "stadtordnungsdienst bonn (883 Imp)",
          "body cam köln / stadt köln (877-2.493 Imp)",
          "bodycam ordnungsamt hamm (3.226 Imp auf Blog)",
          "kommunaler ordnungsdienst (178-101 Imp)",
          "ordnungsamt bodycam nrw (2.558 Imp auf Blog)",
          "bodycam städtischer ordnungsdienst (51 Imp)",
        ],
      },
      {
        name: "Branchen: Sicherheitsdienste & Security",
        proximity: "nah",
        description: "Wachsendes Segment — private Sicherheit sucht nach Bodycam-Lösungen. Sicherheitsdienst-Seite hat 1.199 Imp. Potenzial für B2B-Content.",
        topics: [
          "bodycam sicherheitsdienst (1.133 Imp, Pos 4)",
          "body cam security (807 Imp, Pos 6)",
          "bodycam security (977 Imp, Pos 22)",
          "sicherheitskräfte bodycam (4.717 Imp auf Blog)",
          "body cams in privaten sicherheitsunternehmen (4.323 Imp)",
          "body cams als sicherheitspersonal (3.526 Imp)",
          "sicherheitsdienst bvg (130 Imp)",
          "body cams auf großveranstaltungen (689 Imp)",
          "body cams in einkaufszentren (41 Imp)",
          "deeskalation sicherheitsdienst (79 Imp)",
        ],
      },
      {
        name: "Branchen: Gesundheitswesen",
        proximity: "nah",
        description: "Aufstrebendes Segment — Krankenhaus-Seite hat 915 Imp, Notaufnahmen-Artikel 1.248 Imp. Übergriffe auf Pflegepersonal sind medial präsent.",
        topics: [
          "bodycam krankenhaus (277 Imp, Pos 8)",
          "krankenhaus sicherheit (3.281 Imp auf Blog)",
          "notaufnahmen sicherheit bodycam (1.248 Imp)",
          "bodycam gesundheitswesen (212 Imp, Pos 3)",
          "bodycam rettungsdienst (890 Imp, Pos 28)",
          "videoüberwachung im krankenhaus (91 Imp)",
          "wenn helfende zum opfer werden (432 Imp)",
        ],
      },
      {
        name: "Deeskalation & Wirksamkeit",
        proximity: "adjacent",
        description: "USP-Cluster — Deeskalation ist NetCos Kernargument (75% Deeskalationsrate). Deeskalationsschulungen-Artikel hat 9% CTR. Wenig Suchvolumen, aber hohe Conversion.",
        topics: [
          "deeskalationsschulungen bodycam (788 Imp, 71 Klicks, 9% CTR)",
          "deeskalation bodycam (2.343 Imp auf Blog)",
          "bodycam frontdisplay deeskalation (1.480 Imp)",
          "deeskalation sicherheitsdienst (79 Imp)",
          "deeskalierend wirken (45 Imp)",
          "konflikt deeskalation (45 Imp)",
          "deeskalierende kommunikation polizei (118 Imp)",
        ],
      },
      {
        name: "Events & Konferenz",
        proximity: "sehr nah",
        description: "Eigene Events als Lead-Magnete — Konferenz-Seite 32K Imp, Fachdialog 288 Imp mit 23% CTR (!). Höchste CTR aller Seiten.",
        topics: [
          "body cam konferenz (31.733 Imp, 224 Klicks)",
          "fachdialog bodycam (288 Imp, 66 Klicks, 23% CTR)",
          "body cam konferenz frankfurt (26 Imp)",
          "bundeskongress kommunale ordnung (110 Imp)",
          "konferenz sicherheit (535 Imp)",
          "zweite/dritte body cam konferenz (1.740-791 Imp)",
        ],
      },
      {
        name: "NetCo Brand & Navigation",
        proximity: "sehr nah",
        description: "Branded Search — 'netco bodycam' hat 19% CTR (434 Klicks). Markenbekanntheit wächst. Wichtig für Retargeting und Brand Protection.",
        topics: [
          "netco bodycam (2.301 Imp, 434 Klicks, 19% CTR)",
          "netco (6.636 Imp, 39 Klicks, Pos 3)",
          "netco professional services (920 Imp, Pos 1)",
          "netco bodycam preis (228 Imp, 65 Klicks, 29% CTR)",
          "netco gmbh (63 Imp)",
          "netco blankenburg (774 Imp)",
          "sascha kittelmann (787 Imp, 48 Klicks)",
        ],
      },
    ];

    for (const cluster of clusters) {
      await ctx.db.insert("seoClusters", { brandId: bodycam._id, ...cluster });
    }

    return { message: `${clusters.length} Bodycam SEO Clusters seeded successfully` };
  },
});
