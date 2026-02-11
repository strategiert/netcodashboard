import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

export const listByBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();

    const today = new Date().toISOString().slice(0, 10);

    const enriched = await Promise.all(
      campaigns.map(async (campaign) => {
        const scenarios = await ctx.db
          .query("campaignScenarios")
          .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
          .collect();

        const tasks = await ctx.db
          .query("campaignTasks")
          .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
          .collect();

        const doneTasks = tasks.filter((t) => t.status === "done").length;
        const overdueTasks = tasks.filter(
          (t) => t.dueDate && t.dueDate < today && t.status !== "done"
        ).length;

        return {
          ...campaign,
          scenarioCount: scenarios.length,
          readyScenarios: scenarios.filter((s) => s.status === "ready").length,
          liveScenarios: scenarios.filter((s) => s.status === "live").length,
          taskCount: tasks.length,
          doneTasks,
          openTasks: tasks.length - doneTasks,
          overdueTasks,
        };
      })
    );

    const sorted = enriched.sort((a, b) => {
      const aStart = a.startDate || "9999-12-31";
      const bStart = b.startDate || "9999-12-31";
      return aStart.localeCompare(bStart);
    });

    const overview = {
      totalCampaigns: sorted.length,
      activeCampaigns: sorted.filter(
        (c) => c.status === "ready" || c.status === "live"
      ).length,
      liveCampaigns: sorted.filter((c) => c.status === "live").length,
      totalOpenTasks: sorted.reduce((sum, c) => sum + c.openTasks, 0),
      totalOverdueTasks: sorted.reduce((sum, c) => sum + c.overdueTasks, 0),
    };

    return { campaigns: sorted, overview };
  },
});

export const getCampaignDetails = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    const scenarios = await ctx.db
      .query("campaignScenarios")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const tasks = await ctx.db
      .query("campaignTasks")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const sortedScenarios = scenarios.sort((a, b) => a.order - b.order);
    const sortedTasks = tasks.sort((a, b) => {
      const aDate = a.dueDate || "9999-12-31";
      const bDate = b.dueDate || "9999-12-31";
      return aDate.localeCompare(bDate);
    });

    return {
      campaign,
      scenarios: sortedScenarios,
      tasks: sortedTasks,
    };
  },
});

export const createCampaign = mutation({
  args: {
    brandId: v.id("brands"),
    name: v.string(),
    objective: v.string(),
    status: v.string(),
    priority: v.optional(v.string()),
    owner: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    budgetTotal: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("campaigns", {
      ...args,
      budgetSpent: 0,
    });
  },
});

export const updateCampaign = mutation({
  args: {
    id: v.id("campaigns"),
    name: v.optional(v.string()),
    objective: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    owner: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    budgetTotal: v.optional(v.number()),
    budgetSpent: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const createScenario = mutation({
  args: {
    campaignId: v.id("campaigns"),
    key: v.string(),
    name: v.string(),
    trigger: v.string(),
    pressAngle: v.string(),
    socialAngle: v.string(),
    adAngle: v.string(),
    cta: v.string(),
    status: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("campaignScenarios", args);
  },
});

export const updateScenario = mutation({
  args: {
    id: v.id("campaignScenarios"),
    key: v.optional(v.string()),
    name: v.optional(v.string()),
    trigger: v.optional(v.string()),
    pressAngle: v.optional(v.string()),
    socialAngle: v.optional(v.string()),
    adAngle: v.optional(v.string()),
    cta: v.optional(v.string()),
    status: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const createTask = mutation({
  args: {
    campaignId: v.id("campaigns"),
    scenarioId: v.optional(v.id("campaignScenarios")),
    channel: v.string(),
    title: v.string(),
    owner: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    status: v.string(),
    priority: v.optional(v.string()),
    assetType: v.optional(v.string()),
    note: v.optional(v.string()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("campaignTasks", args);
  },
});

export const updateTask = mutation({
  args: {
    id: v.id("campaignTasks"),
    scenarioId: v.optional(v.id("campaignScenarios")),
    channel: v.optional(v.string()),
    title: v.optional(v.string()),
    owner: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assetType: v.optional(v.string()),
    note: v.optional(v.string()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const updateTaskStatus = mutation({
  args: {
    id: v.id("campaignTasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const createBodycamSummitTemplate = mutation({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const brand = await ctx.db.get(args.brandId);
    if (!brand) {
      throw new Error("Brand not found");
    }

    const existing = await ctx.db
      .query("campaigns")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();

    const existingTemplate = existing.find(
      (c) => c.name === "Sicherheitsgipfel Reaktionskampagne"
    );

    if (existingTemplate) {
      return existingTemplate._id;
    }

    const campaignId = await ctx.db.insert("campaigns", {
      brandId: args.brandId,
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
        "Empathisch kommunizieren, nur belegte Claims nutzen, DB-Entscheidung am Freitag 13.02.2026 in Echtzeit abbilden. Quellenbasis: docs/Bodycam_Evidence_Brief_2026-02.md, DB-Transcript, Oliver-Pohl-Transcript.",
    });

    const scenarios = [
      {
        key: "A",
        name: "DB beschliesst konkrete Ausweitung",
        trigger: "DB kommuniziert direkte Massnahmen nach Gipfel.",
        pressAngle: "Schnelle, sichere Umsetzung mit klaren Einsatzprotokollen.",
        socialAngle: "Umsetzung statt Symbolpolitik: Training, Regeln, Datenschutz.",
        adAngle: "Rollout-Unterstuetzung fuer Verkehrsunternehmen.",
        cta: "Implementierungsfahrplan anfordern",
        status: "ready",
        order: 1,
      },
      {
        key: "B",
        name: "Brancheneinordnung ohne Pflicht",
        trigger: "Empfehlungen, aber keine harte Verpflichtung.",
        pressAngle: "Freiwilliger Branchenstandard senkt Risiken sofort.",
        socialAngle: "Praxisnahe Standards fuer OePNV und Sicherheitsdienste.",
        adAngle: "Pilotprogramme fuer Betriebe jetzt starten.",
        cta: "Pilotprogramm starten",
        status: "ready",
        order: 2,
      },
      {
        key: "C",
        name: "Politischer Fahrplan zur Pflicht",
        trigger: "Bund/Land signalisiert verpflichtende Einfuehrung.",
        pressAngle: "Pflichtfaehige, datenschutzkonforme Skalierung.",
        socialAngle: "Recht + Training + Betrieb als gemeinsamer Standard.",
        adAngle: "Kapazitaeten fuer bundesweiten Rollout sichern.",
        cta: "Kapazitaetsgespraech buchen",
        status: "ready",
        order: 3,
      },
      {
        key: "D",
        name: "Keine klare Entscheidung",
        trigger: "Gipfel endet ohne konkrete Beschluesse.",
        pressAngle: "Sicherheitsarbeit nicht vertagen: pilotieren und evaluieren.",
        socialAngle: "Jetzt vorbereiten statt nach dem naechsten Vorfall reagieren.",
        adAngle: "Pragmatischer 90-Tage-Pilot mit KPI-Set.",
        cta: "90-Tage-Blueprint erhalten",
        status: "ready",
        order: 4,
      },
    ];

    const scenarioIds = {} as Record<string, Id<"campaignScenarios">>;

    for (const scenario of scenarios) {
      const scenarioId = await ctx.db.insert("campaignScenarios", {
        campaignId,
        ...scenario,
      });
      scenarioIds[scenario.key] = scenarioId;
    }

    const tasks = [
      {
        scenarioId: scenarioIds.A,
        channel: "PR",
        title: "Presse-Statement Szenario A final freigeben",
        owner: "PR Team",
        dueDate: "2026-02-13",
        status: "planned",
        priority: "high",
        assetType: "Pressemitteilung",
      },
      {
        scenarioId: scenarioIds.B,
        channel: "PR",
        title: "Presse-Statement Szenario B final freigeben",
        owner: "PR Team",
        dueDate: "2026-02-13",
        status: "planned",
        priority: "high",
        assetType: "Pressemitteilung",
      },
      {
        scenarioId: scenarioIds.C,
        channel: "PR",
        title: "Presse-Statement Szenario C final freigeben",
        owner: "PR Team",
        dueDate: "2026-02-13",
        status: "planned",
        priority: "high",
        assetType: "Pressemitteilung",
      },
      {
        scenarioId: scenarioIds.D,
        channel: "PR",
        title: "Presse-Statement Szenario D final freigeben",
        owner: "PR Team",
        dueDate: "2026-02-13",
        status: "planned",
        priority: "high",
        assetType: "Pressemitteilung",
      },
      {
        channel: "Social",
        title: "8 LinkedIn Posts fuer 4 Szenarien vorbereiten",
        owner: "Social Team",
        dueDate: "2026-02-12",
        status: "in-progress",
        priority: "high",
        assetType: "Post-Serie",
      },
      {
        channel: "Blog",
        title: "Blog-Template mit austauschbaren Szenario-Abschnitten bauen",
        owner: "Content Team",
        dueDate: "2026-02-12",
        status: "in-progress",
        priority: "high",
        assetType: "Blog",
      },
      {
        channel: "PR",
        title: "DB-Bodycam-Video als Faktencheck in Presskit einarbeiten",
        owner: "PR Team",
        dueDate: "2026-02-12",
        status: "planned",
        priority: "high",
        assetType: "Faktencheck",
        note: "Quelle: docs/Deutsche Bahn berichtet ueber den Einsatz von Body-Cams.docx",
      },
      {
        channel: "Whitepaper",
        title: "Oliver-Pohl-Transcript in Deeskalationskapitel uebernehmen",
        owner: "Editorial",
        dueDate: "2026-02-13",
        status: "planned",
        priority: "high",
        assetType: "Whitepaper",
        note: "Quelle: docs/NetCo Body-Cam Fachdialog 2026_Deeskalation mit Oliver Pohl (2).mp4.txt",
      },
      {
        channel: "Paid",
        title: "Berlin Geo-Fencing Kampagnen fuer Gipfelumfeld live setzen",
        owner: "Performance Team",
        dueDate: "2026-02-12",
        status: "planned",
        priority: "high",
        assetType: "Google Ads",
      },
      {
        channel: "Paid",
        title: "Deutschlandweite Search + LinkedIn Kampagne fuer Folgewoche",
        owner: "Performance Team",
        dueDate: "2026-02-14",
        status: "planned",
        priority: "high",
        assetType: "Media Plan",
      },
      {
        channel: "Video",
        title: "15s/30s/45s Video-Skripte mit Deeskalationsfokus finalisieren",
        owner: "Creative Team",
        dueDate: "2026-02-12",
        status: "in-progress",
        priority: "high",
        assetType: "Video-Skript",
      },
      {
        channel: "Whitepaper",
        title: "Whitepaper Kapitel 1-5 final texten (Risiko, Recht, Protokoll)",
        owner: "Editorial",
        dueDate: "2026-02-16",
        status: "in-progress",
        priority: "high",
        assetType: "Whitepaper",
      },
      {
        channel: "Whitepaper",
        title: "Branchenmodule OePNV, Security, kommunaler Dienst fertigstellen",
        owner: "Editorial",
        dueDate: "2026-02-18",
        status: "planned",
        priority: "normal",
        assetType: "Whitepaper",
      },
      {
        channel: "Ops",
        title: "Freigabe-War-Room fuer Freitag mit Legal/PR/Vertrieb aufsetzen",
        owner: "Marketing Lead",
        dueDate: "2026-02-12",
        status: "planned",
        priority: "high",
        assetType: "Runbook",
      },
    ];

    for (const task of tasks) {
      await ctx.db.insert("campaignTasks", {
        campaignId,
        ...task,
      });
    }

    return campaignId;
  },
});
