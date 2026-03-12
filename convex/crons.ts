import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily at 06:00 UTC = 07:00 CET / 08:00 CEST
crons.daily("sync GSC",    { hourUTC: 6, minuteUTC:  0 }, internal.actions.syncGSC.syncGSC);
crons.daily("sync Publer", { hourUTC: 6, minuteUTC: 10 }, internal.actions.syncPubler.syncPubler);
crons.daily("sync Ads",    { hourUTC: 6, minuteUTC: 20 }, internal.actions.syncAds.syncAds);

export default crons;
