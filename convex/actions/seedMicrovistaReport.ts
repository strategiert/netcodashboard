"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

// KW 1-11, 2026. KW1 starts 2025-12-30 (Mon)
const KW_STARTS: Record<string, string> = {
  "KW 1":  "2025-12-30",
  "KW 2":  "2026-01-06",
  "KW 3":  "2026-01-13",
  "KW 4":  "2026-01-20",
  "KW 5":  "2026-01-27",
  "KW 6":  "2026-02-03",
  "KW 7":  "2026-02-10",
  "KW 8":  "2026-02-17",
  "KW 9":  "2026-02-24",
  "KW 10": "2026-03-03",
  "KW 11": "2026-03-10",
};

const WEEKLY_DATA = [
  { kw: "KW 1",  visitors: 254,  sessions: 265,  pageviews: 450,  leads: 0, adSpend: 325.39, topKeyword: "erstmusterpruefbericht", bounceRate: 79.2, avgVisit: "01:27", de: 208, en: 36, fr: 8,  it: 3, chAds: 132, chSeo: 55,  chDirect: 55,  chSocial: 2, chReferral: 10, chOther: 10 },
  { kw: "KW 2",  visitors: 566,  sessions: 588,  pageviews: 1256, leads: 2, adSpend: 569.43, topKeyword: "erstmusterpruefbericht", bounceRate: 78.8, avgVisit: "01:18", de: 464, en: 79, fr: 17, it: 6, chAds: 293, chSeo: 122, chDirect: 123, chSocial: 5, chReferral: 22, chOther: 22 },
  { kw: "KW 3",  visitors: 690,  sessions: 722,  pageviews: 1255, leads: 3, adSpend: 569.43, topKeyword: "erstmusterpruefbericht", bounceRate: 73.8, avgVisit: "01:42", de: 566, en: 97, fr: 21, it: 7, chAds: 360, chSeo: 150, chDirect: 151, chSocial: 6, chReferral: 27, chOther: 27 },
  { kw: "KW 4",  visitors: 735,  sessions: 770,  pageviews: 1978, leads: 6, adSpend: 569.43, topKeyword: "erstmusterpruefbericht", bounceRate: 73.3, avgVisit: "01:18", de: 603, en: 103, fr: 22, it: 7, chAds: 384, chSeo: 160, chDirect: 161, chSocial: 7, chReferral: 29, chOther: 29 },
  { kw: "KW 5",  visitors: 450,  sessions: 472,  pageviews: 778,  leads: 4, adSpend: 569.43, topKeyword: "erstmusterpruefbericht", bounceRate: 73.9, avgVisit: "01:23", de: 369, en: 63, fr: 14, it: 4, chAds: 235, chSeo: 98,  chDirect: 99,  chSocial: 4, chReferral: 18, chOther: 18 },
  { kw: "KW 6",  visitors: 574,  sessions: 603,  pageviews: 927,  leads: 7, adSpend: 569.43, topKeyword: "erstmusterpruefbericht", bounceRate: 75.2, avgVisit: "01:49", de: 471, en: 80, fr: 17, it: 6, chAds: 301, chSeo: 125, chDirect: 126, chSocial: 5, chReferral: 23, chOther: 23 },
  { kw: "KW 7",  visitors: 794,  sessions: 834,  pageviews: 1350, leads: 8, adSpend: 569.43, topKeyword: "erstmusterpruefbericht", bounceRate: 69.6, avgVisit: "01:30", de: 651, en: 111, fr: 24, it: 8, chAds: 416, chSeo: 174, chDirect: 174, chSocial: 7, chReferral: 32, chOther: 32 },
  { kw: "KW 8",  visitors: 681,  sessions: 705,  pageviews: 1094, leads: 2, adSpend: 569.43, topKeyword: "erstmusterpruefbericht", bounceRate: 75.3, avgVisit: "01:33", de: 558, en: 95, fr: 20, it: 7, chAds: 352, chSeo: 147, chDirect: 147, chSocial: 6, chReferral: 27, chOther: 27 },
  { kw: "KW 9",  visitors: 940,  sessions: 965,  pageviews: 1532, leads: 3, adSpend: 569.43, topKeyword: "erstmusterpruefbericht", bounceRate: 75.9, avgVisit: "01:19", de: 771, en: 132, fr: 28, it: 9, chAds: 481, chSeo: 201, chDirect: 202, chSocial: 8, chReferral: 37, chOther: 37 },
  { kw: "KW 10", visitors: 728,  sessions: 758,  pageviews: 1190, leads: 5, adSpend: 569.43, topKeyword: "erstmusterpruefbericht", bounceRate: 76.7, avgVisit: "01:18", de: 597, en: 102, fr: 22, it: 7, chAds: 378, chSeo: 158, chDirect: 158, chSocial: 7, chReferral: 29, chOther: 29 },
  { kw: "KW 11", visitors: 292,  sessions: 306,  pageviews: 532,  leads: 2, adSpend: 162.70, topKeyword: "erstmusterpruefbericht", bounceRate: 71.1, avgVisit: "01:29", de: 239, en: 41, fr: 9,  it: 3, chAds: 153, chSeo: 64,  chDirect: 64,  chSocial: 3, chReferral: 12, chOther: 12 },
];

const CRM_LEADS = [
  { kw: 50, date: "2025-12-08", company: "DBK David + Baader GmbH", channel: "E-Mail/Persoenlich", type: "Lead", desc: "CT 2x Rohrheizkoerper Schweissnaht", offer: true, order: true, newCust: true, status: "Erteilt" },
  { kw: 51, date: "2025-12-16", company: "NKT Group GmbH", channel: "E-Mail/Persoenlich", type: "Lead", desc: "CT 1 Isolator", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 51, date: "2025-12-19", company: "Knapptron GmbH", channel: "E-Mail/Persoenlich", type: "Lead", desc: "CT Magdeburger Halbkugeln", offer: true, order: true, newCust: true, status: "Erledigt" },
  { kw: 51, date: "2025-12-19", company: "GWE Gruppe", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT Hagutherm Verbinder", offer: true, order: true, newCust: false, status: "Erledigt" },
  { kw: 2,  date: "2026-01-07", company: "Nemak Europe", channel: "E-Mail/Persoenlich", type: "Lead", desc: "CT Aluminiumproben", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 2,  date: "2026-01-09", company: "Empatica", channel: "Meeting/Kontaktformular", type: "Lead", desc: "CT Gesundheitstracker-Bauteile", offer: true, order: true, newCust: true, status: "Erteilt", note: "Website-Lead" },
  { kw: 3,  date: "2026-01-13", company: "Trelleborg Bulgarien", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT 6 Plastikbauteile Vermessung", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 3,  date: "2026-01-13", company: "Thier GmbH", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "CT 1 Einsatz", offer: true, order: false, newCust: false, status: "Abgesprungen", note: "Problem selber geloest" },
  { kw: 3,  date: "2026-01-16", company: "Diehl Aviation", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT CCA SDCU9582", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 4,  date: "2026-01-19", company: "Ramico", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "CT 1 Plastikbauteil + STL", offer: true, order: false, newCust: false, status: "offen", note: "Website-Lead" },
  { kw: 4,  date: "2026-01-20", company: "Brose Wuerzburg", channel: "Anruf/Persoenlich", type: "Stammkunde", desc: "CT Serienpruefung Motor BLM2", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 4,  date: "2026-01-20", company: "Froetek Kunststofftechnik", channel: "Anruf/Persoenlich", type: "Stammkunde", desc: "CT 6 Kunststoffrohre", offer: true, order: true, newCust: false, status: "Erledigt" },
  { kw: 4,  date: "2026-01-21", company: "Siltronic", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT Versuchsreihe EPI-Bauteile", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 4,  date: "2026-01-22", company: "Magna Stanztechnik GmbH", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT 2 Querlenkerbuchsen", offer: true, order: true, newCust: false, status: "Erledigt" },
  { kw: 4,  date: "2026-01-22", company: "MLU Halle-Wittenberg", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT 20 Schweineschaedel", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 5,  date: "2026-01-26", company: "Trelleborg Bulgaria EOOD", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT 24 Kunststoffteile Vermessung", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 5,  date: "2026-01-27", company: "Webasto Roof & Components SE", channel: "Anruf/Persoenlich", type: "Lead", desc: "Batteriebauteile Inhouse", offer: true, order: true, newCust: true, status: "Erteilt" },
  { kw: 5,  date: "2026-01-27", company: "Raikhlin Aircraft Engine Dev.", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "CT 1 Verdichter + CAD", offer: true, order: false, newCust: false, status: "Verloren", note: "Zu teuer" },
  { kw: 5,  date: "2026-01-28", company: "Brose Wuerzburg", channel: "Anruf/Persoenlich", type: "Stammkunde", desc: "CT 4 Fluegelraeder + 6 Zargen", offer: true, order: false, newCust: false, status: "Verloren", note: "Zu teuer" },
  { kw: 6,  date: "2026-02-02", company: "STS Spezial Transformatoren", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT 2x Transformatoren", offer: true, order: true, newCust: false, status: "Erledigt" },
  { kw: 6,  date: "2026-02-02", company: "ABB Frankfurt", channel: "Anruf/Persoenlich", type: "Stammkunde", desc: "CT Kalibrierkuevette", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 6,  date: "2026-02-03", company: "hyJOIN GmbH", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "CT Hybridbauteil", offer: false, order: false, newCust: false, status: "Abgesprungen", note: "Hauseigene Methode" },
  { kw: 6,  date: "2026-02-03", company: "Polytec Group", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "CT 5 Kunststoffbauteile", offer: true, order: true, newCust: true, status: "Erteilt", note: "Website-Lead" },
  { kw: 6,  date: "2026-02-04", company: "Fertig Motors GmbH", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT 4x Linearmotoren", offer: true, order: true, newCust: false, status: "Erledigt" },
  { kw: 6,  date: "2026-02-05", company: "Schunk Sintermetalltechnik", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT MIM Nozzle Retainer", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 6,  date: "2026-02-06", company: "TU Muenchen", channel: "Anruf/Webseite", type: "Lead", desc: "CT 10x 3D-Druck Aluwuerfel", offer: true, order: false, newCust: false, status: "offen", note: "Website-Lead" },
  { kw: 7,  date: "2026-02-10", company: "Horr Praezisions Metalltechnik", channel: "E-Mail/Webseite", type: "Lead", desc: "CT 1 Ventilkoerper + EMPB", offer: true, order: false, newCust: false, status: "offen", note: "Website-Lead" },
  { kw: 7,  date: "2026-02-10", company: "Lab. Werkstoff- u. Fuegetechnik", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "CT Bolzenschweissprobe", offer: true, order: false, newCust: false, status: "offen", note: "Website-Lead" },
  { kw: 7,  date: "2026-02-10", company: "MiraMotion", channel: "E-Mail/Persoenlich", type: "Lead", desc: "CT Connector Bauteile", offer: false, order: false, newCust: false, status: "offen" },
  { kw: 7,  date: "2026-02-11", company: "VW Wolfsburg", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT verschiedene Bauteile", offer: false, order: false, newCust: false, status: "offen" },
  { kw: 7,  date: "2026-02-11", company: "Heitec Heisskanaltechnik", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT 1 Kuehlkern", offer: true, order: true, newCust: false, status: "Erledigt" },
  { kw: 7,  date: "2026-02-12", company: "LUMA vision GmbH", channel: "E-Mail/Persoenlich", type: "Lead", desc: "CT 1 Konnektor", offer: true, order: true, newCust: true, status: "Erteilt" },
  { kw: 7,  date: "2026-02-12", company: "Dipl. Ing. Mueller GmbH & Co.", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "CT Zinkdruckgussteil", offer: true, order: false, newCust: false, status: "offen", note: "Website-Lead" },
  { kw: 7,  date: "2026-02-13", company: "Porex Technologies", channel: "E-Mail/Persoenlich", type: "Lead", desc: "CT 1 Kunststoffzylinder", offer: false, order: false, newCust: false, status: "Abgesprungen", note: "Aufloesung reicht nicht" },
  { kw: 8,  date: "2026-02-19", company: "Knipping Kunststofftechnik", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "CT 2x Kunststoffbauteile", offer: true, order: false, newCust: false, status: "offen", note: "Website-Lead" },
  { kw: 8,  date: "2026-02-20", company: "Qtec Kunststofftechnik", channel: "E-Mail/Persoenlich", type: "Lead", desc: "CT 1x Kunststoffteil", offer: true, order: true, newCust: true, status: "Erteilt" },
  { kw: 9,  date: "2026-02-25", company: "SEW-EURODRIVE GmbH & Co KG", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "CT 2x Wickelkoepfe", offer: true, order: false, newCust: false, status: "offen", note: "Website-Lead" },
  { kw: 9,  date: "2026-02-27", company: "Pinter Guss GmbH", channel: "E-Mail/Webseite", type: "Lead", desc: "CT Alugussteile", offer: true, order: true, newCust: true, status: "Erteilt", note: "Website-Lead" },
  { kw: 9,  date: "2026-02-27", company: "Sachverstaendigenbuero Herrgesell", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT 1 Ventil", offer: true, order: true, newCust: false, status: "Erteilt" },
  { kw: 10, date: "2026-03-02", company: "New Tech GmbH", channel: "E-Mail/Kontaktformular", type: "Lead", desc: null, offer: false, order: false, newCust: false, status: "Nicht qualifiziert", note: "Website-Lead" },
  { kw: 10, date: "2026-03-03", company: "BMW Group", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "Miete ScanExpress Gen5 Gehaeuse", offer: false, order: false, newCust: false, status: "Kein Bedarf", note: "Website-Lead" },
  { kw: 10, date: "2026-03-04", company: "Pinter Guss GmbH", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT 1x Schaltgehaeuse", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 10, date: "2026-03-04", company: "Engineering Forensics ltd", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "CT Rohrverbindungsstuecke", offer: false, order: false, newCust: false, status: "offen", note: "Website-Lead" },
  { kw: 10, date: "2026-03-04", company: "Flexa GmbH", channel: "E-Mail/Kontaktformular", type: "Lead", desc: "CT Silikonschlaeuche ScanExpress", offer: false, order: false, newCust: false, status: "offen", note: "Website-Lead" },
  { kw: 11, date: "2026-03-10", company: "AGVS Aluminium Werke GmbH", channel: "E-Mail/Persoenlich", type: "Lead", desc: "CT 2x Gussteile", offer: true, order: false, newCust: false, status: "offen" },
  { kw: 11, date: "2026-03-10", company: "KUNSTSTOFF-FROEHLICH GMBH", channel: "E-Mail/Persoenlich", type: "Stammkunde", desc: "CT 4x Kunststoffbauteile", offer: true, order: false, newCust: false, status: "offen" },
];

const ADS_CAMPAIGNS = [
  { name: "NDT-PerfomanceMax-Leads-D", type: "PMax",   budget: 50, spend: 2103.47, impr: 167718, clicks: 5915, ctr: 0.03,  conv: 16.01 },
  { name: "NDT-SN-D",                  type: "Search", budget: 35, spend: 1714.18, impr: 4833,   clicks: 609,  ctr: 12.60, conv: 1 },
  { name: "NDT-SN-EU-Conmax",          type: "Search", budget: 20, spend: 1252.70, impr: 4909,   clicks: 253,  ctr: 5.15,  conv: 2 },
  { name: "MV-ScanExpress-FR",         type: "Search", budget: 10, spend: 276.65,  impr: 922,    clicks: 55,   ctr: 5.97,  conv: 0 },
  { name: "MV-ScanExpress-D",          type: "Search", budget: 10, spend: 263.70,  impr: 374,    clicks: 51,   ctr: 13.64, conv: 0 },
  { name: "NDT-SN-End-of-Line",        type: "Search", budget: 10, spend: 2.04,    impr: 79,     clicks: 1,    ctr: 1.27,  conv: 0 },
  { name: "MV-ScanExpress-EN",         type: "Search", budget: 10, spend: 0,       impr: 7,      clicks: 0,    ctr: 0,     conv: 0 },
];

export const seedMicrovistaReport = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    const mv = brands.find(b => b.slug === "microvista");
    if (!mv) throw new Error("Microvista brand not found");

    // Weekly reports
    for (const w of WEEKLY_DATA) {
      await ctx.runMutation(api.reports.upsertWeeklyReport, {
        brandId: mv._id,
        kw: w.kw,
        weekStart: KW_STARTS[w.kw],
        year: 2026,
        visitors: w.visitors,
        sessions: w.sessions,
        pageviews: w.pageviews,
        leads: w.leads,
        adSpend: w.adSpend,
        topKeyword: w.topKeyword,
        bounceRate: w.bounceRate,
        avgVisitDuration: w.avgVisit,
        visitorsDE: w.de,
        visitorsEN: w.en,
        visitorsFR: w.fr,
        visitorsIT: w.it,
        chAds: w.chAds,
        chSeo: w.chSeo,
        chDirect: w.chDirect,
        chSocial: w.chSocial,
        chReferral: w.chReferral,
        chOther: w.chOther,
      });
    }

    // CRM Leads
    for (const l of CRM_LEADS) {
      await ctx.runMutation(api.reports.upsertCrmLead, {
        brandId: mv._id,
        kw: l.kw,
        date: l.date,
        company: l.company,
        contactChannel: l.channel,
        leadType: l.type,
        description: l.desc ?? undefined,
        offerMade: l.offer,
        orderReceived: l.order,
        newCustomer: l.newCust,
        status: l.status,
        note: (l as any).note,
      });
    }

    // Ads Campaigns
    for (const c of ADS_CAMPAIGNS) {
      await ctx.runMutation(api.reports.upsertAdsCampaign, {
        brandId: mv._id,
        period: "Q1 2026",
        campaignName: c.name,
        campaignType: c.type,
        budgetPerDay: c.budget,
        spend: c.spend,
        impressions: c.impr,
        clicks: c.clicks,
        ctr: c.ctr,
        conversions: c.conv,
      });
    }

    return `Seeded: ${WEEKLY_DATA.length} weeks, ${CRM_LEADS.length} leads, ${ADS_CAMPAIGNS.length} campaigns`;
  },
});
