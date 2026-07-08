import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Daily at 06:00 UTC = 07:00 CET / 08:00 CEST
crons.daily("sync GSC",    { hourUTC: 6, minuteUTC:  0 }, api.actions.syncGSC.syncGSC);
crons.daily("sync Publer",          { hourUTC: 6, minuteUTC: 10 }, api.actions.syncPubler.syncPubler);
crons.daily("sync Publer Accounts", { hourUTC: 6, minuteUTC: 15 }, api.actions.syncPublerAccounts.syncPublerAccounts);
crons.daily("sync Ads",          { hourUTC: 6, minuteUTC: 20 }, api.actions.syncAds.syncAds);
crons.daily("sync Traffic",      { hourUTC: 6, minuteUTC: 25 }, api.actions.syncTraffic.syncTraffic, {});
crons.daily("sync Publer Posts", { hourUTC: 6, minuteUTC: 30 }, api.actions.syncPublerPosts.syncPublerPosts, { days: 2 });
crons.daily("sync SE Ranking",   { hourUTC: 6, minuteUTC: 35 }, api.actions.syncSERanking.syncSERanking);
crons.daily("sync Daily Traffic", { hourUTC: 6, minuteUTC: 40 }, api.actions.syncDailyTraffic.syncDailyTraffic, {});
crons.daily("sync Bing",         { hourUTC: 6, minuteUTC: 45 }, api.actions.syncBing.syncBing, {});
// Mittags-Refresh, damit der Tagesreport tagsüber aktuelle Zahlen zeigt.
crons.daily("sync Daily Traffic (noon)", { hourUTC: 11, minuteUTC: 0 }, api.actions.syncDailyTraffic.syncDailyTraffic, {});
// SE Ranking AI Search wird monatlich aktualisiert und ist credits-basiert; wöchentlich reicht.
crons.weekly("sync AI Visibility", { dayOfWeek: "monday", hourUTC: 7, minuteUTC: 0 }, api.actions.syncAIVisibility.syncAIVisibility, {});

export default crons;
