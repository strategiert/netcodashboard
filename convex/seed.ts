import { mutation } from "./_generated/server";

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

    const bodycamPhaseIds: Record<number, string> = {};
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

    const bautvPhaseIds: Record<number, string> = {};
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

    const microvistaPhaseIds: Record<number, string> = {};
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
        phaseId: bodycamPhaseIds[phaseOrder] as any,
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
        phaseId: bautvPhaseIds[phaseOrder] as any,
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
        phaseId: microvistaPhaseIds[phaseOrder] as any,
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

    return {
      message: "Seed completed successfully",
      brands: { bodycamId, bautvId, microvistaId },
    };
  },
});
