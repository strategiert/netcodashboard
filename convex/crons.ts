import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Daily at 06:00 UTC = 07:00 CET / 08:00 CEST
crons.daily("sync GSC",    { hourUTC: 6, minuteUTC:  0 }, api.actions.syncGSC.syncGSC);
crons.daily("sync Publer",          { hourUTC: 6, minuteUTC: 10 }, api.actions.syncPubler.syncPubler);
crons.daily("sync Publer Accounts", { hourUTC: 6, minuteUTC: 15 }, api.actions.syncPublerAccounts.syncPublerAccounts);
crons.daily("sync Ads",          { hourUTC: 6, minuteUTC: 20 }, api.actions.syncAds.syncAds);
crons.daily("sync Publer Posts", { hourUTC: 6, minuteUTC: 30 }, api.actions.syncPublerPosts.syncPublerPosts, { days: 2 });

export default crons;
