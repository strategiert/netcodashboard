/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_aggregateBautvWeekly from "../actions/aggregateBautvWeekly.js";
import type * as actions_backfill from "../actions/backfill.js";
import type * as actions_computeAttribution from "../actions/computeAttribution.js";
import type * as actions_fetchPublerWorkspaces from "../actions/fetchPublerWorkspaces.js";
import type * as actions_publerHelpers from "../actions/publerHelpers.js";
import type * as actions_seedBautvGsc from "../actions/seedBautvGsc.js";
import type * as actions_seedBautvLeads from "../actions/seedBautvLeads.js";
import type * as actions_seedGadsKeywords from "../actions/seedGadsKeywords.js";
import type * as actions_seedMicrovistaKeywords from "../actions/seedMicrovistaKeywords.js";
import type * as actions_seedMicrovistaReport from "../actions/seedMicrovistaReport.js";
import type * as actions_serankingResearch from "../actions/serankingResearch.js";
import type * as actions_syncAIVisibility from "../actions/syncAIVisibility.js";
import type * as actions_syncAds from "../actions/syncAds.js";
import type * as actions_syncBing from "../actions/syncBing.js";
import type * as actions_syncClickViews from "../actions/syncClickViews.js";
import type * as actions_syncDailyTraffic from "../actions/syncDailyTraffic.js";
import type * as actions_syncGSC from "../actions/syncGSC.js";
import type * as actions_syncGSCBrandSplit from "../actions/syncGSCBrandSplit.js";
import type * as actions_syncGadsCosts from "../actions/syncGadsCosts.js";
import type * as actions_syncIndexCoverage from "../actions/syncIndexCoverage.js";
import type * as actions_syncMetaCosts from "../actions/syncMetaCosts.js";
import type * as actions_syncMsCosts from "../actions/syncMsCosts.js";
import type * as actions_syncPubler from "../actions/syncPubler.js";
import type * as actions_syncPublerAccounts from "../actions/syncPublerAccounts.js";
import type * as actions_syncPublerPosts from "../actions/syncPublerPosts.js";
import type * as actions_syncSERanking from "../actions/syncSERanking.js";
import type * as actions_syncTraffic from "../actions/syncTraffic.js";
import type * as actions_syncWebSessions from "../actions/syncWebSessions.js";
import type * as adCosts from "../adCosts.js";
import type * as adsMapping from "../adsMapping.js";
import type * as aiVisibility from "../aiVisibility.js";
import type * as attribution from "../attribution.js";
import type * as auth from "../auth.js";
import type * as authEmail from "../authEmail.js";
import type * as authz from "../authz.js";
import type * as brands from "../brands.js";
import type * as campaigns from "../campaigns.js";
import type * as content from "../content.js";
import type * as crons from "../crons.js";
import type * as dailyTraffic from "../dailyTraffic.js";
import type * as datalake from "../datalake.js";
import type * as datalakeHmac from "../datalakeHmac.js";
import type * as forecast from "../forecast.js";
import type * as gads from "../gads.js";
import type * as gscExtras from "../gscExtras.js";
import type * as http from "../http.js";
import type * as journeys from "../journeys.js";
import type * as kpi from "../kpi.js";
import type * as migrations from "../migrations.js";
import type * as phases from "../phases.js";
import type * as previews from "../previews.js";
import type * as publer from "../publer.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as seoClusters from "../seoClusters.js";
import type * as seranking from "../seranking.js";
import type * as stakeholders from "../stakeholders.js";
import type * as teamBoard from "../teamBoard.js";
import type * as users from "../users.js";
import type * as webSessions from "../webSessions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/aggregateBautvWeekly": typeof actions_aggregateBautvWeekly;
  "actions/backfill": typeof actions_backfill;
  "actions/computeAttribution": typeof actions_computeAttribution;
  "actions/fetchPublerWorkspaces": typeof actions_fetchPublerWorkspaces;
  "actions/publerHelpers": typeof actions_publerHelpers;
  "actions/seedBautvGsc": typeof actions_seedBautvGsc;
  "actions/seedBautvLeads": typeof actions_seedBautvLeads;
  "actions/seedGadsKeywords": typeof actions_seedGadsKeywords;
  "actions/seedMicrovistaKeywords": typeof actions_seedMicrovistaKeywords;
  "actions/seedMicrovistaReport": typeof actions_seedMicrovistaReport;
  "actions/serankingResearch": typeof actions_serankingResearch;
  "actions/syncAIVisibility": typeof actions_syncAIVisibility;
  "actions/syncAds": typeof actions_syncAds;
  "actions/syncBing": typeof actions_syncBing;
  "actions/syncClickViews": typeof actions_syncClickViews;
  "actions/syncDailyTraffic": typeof actions_syncDailyTraffic;
  "actions/syncGSC": typeof actions_syncGSC;
  "actions/syncGSCBrandSplit": typeof actions_syncGSCBrandSplit;
  "actions/syncGadsCosts": typeof actions_syncGadsCosts;
  "actions/syncIndexCoverage": typeof actions_syncIndexCoverage;
  "actions/syncMetaCosts": typeof actions_syncMetaCosts;
  "actions/syncMsCosts": typeof actions_syncMsCosts;
  "actions/syncPubler": typeof actions_syncPubler;
  "actions/syncPublerAccounts": typeof actions_syncPublerAccounts;
  "actions/syncPublerPosts": typeof actions_syncPublerPosts;
  "actions/syncSERanking": typeof actions_syncSERanking;
  "actions/syncTraffic": typeof actions_syncTraffic;
  "actions/syncWebSessions": typeof actions_syncWebSessions;
  adCosts: typeof adCosts;
  adsMapping: typeof adsMapping;
  aiVisibility: typeof aiVisibility;
  attribution: typeof attribution;
  auth: typeof auth;
  authEmail: typeof authEmail;
  authz: typeof authz;
  brands: typeof brands;
  campaigns: typeof campaigns;
  content: typeof content;
  crons: typeof crons;
  dailyTraffic: typeof dailyTraffic;
  datalake: typeof datalake;
  datalakeHmac: typeof datalakeHmac;
  forecast: typeof forecast;
  gads: typeof gads;
  gscExtras: typeof gscExtras;
  http: typeof http;
  journeys: typeof journeys;
  kpi: typeof kpi;
  migrations: typeof migrations;
  phases: typeof phases;
  previews: typeof previews;
  publer: typeof publer;
  reports: typeof reports;
  seed: typeof seed;
  seoClusters: typeof seoClusters;
  seranking: typeof seranking;
  stakeholders: typeof stakeholders;
  teamBoard: typeof teamBoard;
  users: typeof users;
  webSessions: typeof webSessions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
