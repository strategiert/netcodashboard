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

    // ===== BODYCAM CONTENT =====
    const bodycamContent = [
      // Phase 1
      { phaseOrder: 1, title: "Branchenstatistiken Übergriffe", format: "PDF", description: "Aktuelle Daten zu Übergriffszahlen im ÖPNV/Sicherheit", proximity: "adjacent", status: "planned" },
      { phaseOrder: 1, title: "Display-Ads Awareness", format: "Ads", description: "Display-Kampagnen ohne Kaufdruck", proximity: "neutral", status: "in-progress" },
      { phaseOrder: 1, title: "Social Proof Posts", format: "Social Media", description: "Best Practice Stories (Hamburg, Wien)", proximity: "adjacent", status: "planned" },
      // Phase 2
      { phaseOrder: 2, title: "DSGVO-Leitfaden Whitepaper", format: "PDF", description: "Rechtssicherheit und Datenschutz bei Body-Cams", proximity: "nah", status: "in-progress", priority: "high" },
      { phaseOrder: 2, title: "ROI-Kalkulator", format: "Online-Tool", description: "Interaktives Tool zur Kostenberechnung", proximity: "nah", status: "planned" },
      { phaseOrder: 2, title: "Case Study Hamburg ÖPNV", format: "PDF", description: "Erfolgsgeschichte Hamburger Verkehrsbetriebe", proximity: "sehr nah", status: "in-progress" },
      // Phase 3
      { phaseOrder: 3, title: "Webinar: Body-Cam Einführung", format: "Video", description: "Live-Demo mit Q&A Session", proximity: "nah", status: "planned" },
      { phaseOrder: 3, title: "Muster-Betriebsvereinbarung", format: "PDF", description: "Vorlage für Betriebsrat-Einigung", proximity: "sehr nah", status: "in-progress", priority: "high" },
      { phaseOrder: 3, title: "Vergleichstabelle Bodycam-Lösungen", format: "PDF", description: "Bodycam vs. Alternativen", proximity: "nah", status: "planned" },
      // Phase 4
      { phaseOrder: 4, title: "Vor-Ort Demo Package", format: "Demo", description: "Persönliche Produktvorführung vor Ort", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 4, title: "Referenzbesuch-Programm", format: "Event", description: "Besuch bei bestehenden Kunden arrangieren", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 4, title: "TCO-Rechner Enterprise", format: "Online-Tool", description: "Total Cost of Ownership Kalkulation", proximity: "sehr nah", status: "planned" },
      // Phase 5
      { phaseOrder: 5, title: "Implementierungs-Roadmap", format: "PDF", description: "Detaillierte Rollout-Planung", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 5, title: "Schulungspaket Mitarbeiter", format: "Video + PDF", description: "Training-Materialien für Endnutzer", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 5, title: "PR-Paket Pressemitteilung", format: "PDF", description: "Vorlagen für positive Kommunikation", proximity: "nah", status: "planned" },
    ];

    for (const content of bodycamContent) {
      const { phaseOrder, ...contentData } = content;
      await ctx.db.insert("contentPieces", {
        brandId: bodycamId,
        phaseId: bodycamPhaseIds[phaseOrder] as any,
        ...contentData,
      });
    }

    // ===== BAUTV CONTENT (Leadmagnets) =====
    const bautvContent = [
      // Phase 0
      { phaseOrder: 0, title: "Baustellen-Chaos-Check", format: "PDF + Score", description: "Schmerz sichtbar machen", proximity: "neutral", status: "planned", goal: "Schmerz sichtbar machen" },
      { phaseOrder: 0, title: "Die 10 häufigsten Streitpunkte auf Baustellen", format: "PDF", description: "Wiedererkennung schaffen", proximity: "neutral", status: "planned", goal: "Wiedererkennung" },
      { phaseOrder: 0, title: "Bauleiter-Stress-Test", format: "Online-Check", description: "Emotionaler Einstieg", proximity: "neutral", status: "in-progress", priority: "high", goal: "Emotionaler Einstieg" },
      // Phase 1
      { phaseOrder: 1, title: "Welche Informationen Bauleiter wirklich brauchen", format: "PDF", description: "Klarheit schaffen", proximity: "adjacent", status: "planned", goal: "Klarheit" },
      { phaseOrder: 1, title: "Die perfekte Baustellen-Informationsbasis", format: "PDF", description: "Struktur vermitteln", proximity: "adjacent", status: "planned", goal: "Struktur" },
      // Phase 2
      { phaseOrder: 2, title: "Digitale Baustellenorganisation – der Überblick", format: "PDF", description: "Systemdenken fördern", proximity: "nah", status: "in-progress", priority: "high", goal: "Systemdenken" },
      { phaseOrder: 2, title: "Dokumentationsmethoden im Vergleich", format: "Vergleichs-PDF", description: "Neutraler Vergleich", proximity: "nah", status: "planned", goal: "Neutralität" },
      { phaseOrder: 2, title: "Warum Fotos allein nicht reichen", format: "PDF", description: "Perspektivwechsel anregen", proximity: "nah", status: "planned", goal: "Perspektivwechsel" },
      // Phase 3
      { phaseOrder: 3, title: "Portal vs. Kamera – der große Unterschied", format: "PDF", description: "Reframing durchführen", proximity: "sehr nah", status: "in-progress", priority: "high", goal: "Reframing" },
      { phaseOrder: 3, title: "Was kostet schlechte Dokumentation wirklich?", format: "ROI-Rechner", description: "ROI aufzeigen", proximity: "sehr nah", status: "planned", goal: "ROI" },
      { phaseOrder: 3, title: "Demo-Baustelle mit Musterdaten", format: "Portal-Demo", description: "Aha-Moment erzeugen", proximity: "sehr nah", status: "in-progress", goal: "Aha-Moment" },
      // Phase 4
      { phaseOrder: 4, title: "Projektpreis-Rechner", format: "Rechner", description: "Kaufreife herstellen", proximity: "sehr nah", status: "planned", goal: "Kaufreife" },
      { phaseOrder: 4, title: "Welche BauTV+ Lösung passt zu meinem Projekt?", format: "Entscheidungs-Guide", description: "Abschluss ermöglichen", proximity: "sehr nah", status: "planned", goal: "Abschluss" },
    ];

    for (const content of bautvContent) {
      const { phaseOrder, ...contentData } = content;
      await ctx.db.insert("contentPieces", {
        brandId: bautvId,
        phaseId: bautvPhaseIds[phaseOrder] as any,
        ...contentData,
      });
    }

    // ===== MICROVISTA CONTENT =====
    const microvistaContent = [
      // Phase 1
      { phaseOrder: 1, title: "Produktionsrisiko-Report", format: "PDF + Artikel", description: "7-10 unsichtbare Risiken in Gießerei/Automotive", proximity: "nah", status: "planned" },
      { phaseOrder: 1, title: "Frühwarnsignale im Serienanlauf", format: "Checkliste", description: "12 Frühwarnsignale für instabile Linien", proximity: "adjacent", status: "planned" },
      { phaseOrder: 1, title: "Risiko-Selbsttest Produktionsstabilität", format: "Online-Tool + PDF", description: "10 Fragen → Score → 3 Sofortmaßnahmen", proximity: "adjacent", status: "in-progress", priority: "high" },
      { phaseOrder: 1, title: "Fehlerbibliothek (Fehler-Wiki)", format: "Wiki + PDF", description: "Lunker, Kaltlauf, Porosität - alle Fehlerbilder", proximity: "sehr nah", status: "in-progress" },
      // Phase 2
      { phaseOrder: 2, title: "Produktionsstabilitäts-Guide", format: "PDF (20-30 S.)", description: "Leitfaden zu stabilen Linien", proximity: "adjacent", status: "in-progress", priority: "high" },
      { phaseOrder: 2, title: "Fehlerursachen-Navigator", format: "Decision-Tree", description: "Symptom → Ursache → Analyseoption", proximity: "nah", status: "planned" },
      { phaseOrder: 2, title: "Videoserie Wie Fehler entstehen", format: "5 Videos", description: "Lunker, Kaltlauf, Kernversatz, Luft, Risse", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 2, title: "Messmethoden vs. Realität", format: "Artikel + LinkedIn", description: "Neutraler Vergleich aller Prüfverfahren", proximity: "nah", status: "planned" },
      // Phase 3
      { phaseOrder: 3, title: "SOP 25-Punkte-Plan", format: "PDF + Poster", description: "Checkliste für sauberen Serienanlauf", proximity: "adjacent", status: "in-progress", priority: "high" },
      { phaseOrder: 3, title: "Whitepaper Fehlerkultur", format: "PDF + Artikel", description: "Fehler melden ohne Schuldzuweisung", proximity: "neutral", status: "planned" },
      { phaseOrder: 3, title: "Process-Map Poster", format: "Poster", description: "Produktionsprozess mit Risikozonen", proximity: "adjacent", status: "planned" },
      // Phase 4
      { phaseOrder: 4, title: "Entscheidungsnavigator", format: "PDF/Tool", description: "Brauchen wir externe Analyse?", proximity: "nah", status: "planned" },
      { phaseOrder: 4, title: "Rückläufer systematisch verhindern", format: "Guide (15-20 S.)", description: "Schritt-für-Schritt zur Reduktion", proximity: "adjacent", status: "planned" },
      { phaseOrder: 4, title: "Messmethoden-Vergleichsmatrix", format: "One-Pager", description: "Matrix für interne Präsentationen", proximity: "nah", status: "planned" },
      // Phase 5
      { phaseOrder: 5, title: "CT-Software Demo & Probe-Report", format: "Demo + Report", description: "Interaktive Demo + Beispielbericht", proximity: "sehr nah", status: "in-progress" },
      { phaseOrder: 5, title: "Fallstudien aus Kundensicht", format: "PDF + Artikel", description: "Erfolgsgeschichten der Kunden", proximity: "nah", status: "planned" },
      { phaseOrder: 5, title: "Bauteil-Guides", format: "3-5 Kurz-Guides", description: "E-Motor, Batterie, Strukturteile", proximity: "sehr nah", status: "planned" },
      { phaseOrder: 5, title: "Workshop Serienanlauf absichern", format: "Online-Workshop", description: "45-60 Min mit Q&A", proximity: "nah", status: "planned" },
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
