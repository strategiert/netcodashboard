/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_backfill from "../actions/backfill.js";
import type * as actions_seedMicrovistaReport from "../actions/seedMicrovistaReport.js";
import type * as actions_syncAds from "../actions/syncAds.js";
import type * as actions_syncGSC from "../actions/syncGSC.js";
import type * as actions_syncPubler from "../actions/syncPubler.js";
import type * as actions_syncPublerAccounts from "../actions/syncPublerAccounts.js";
import type * as actions_syncPublerPosts from "../actions/syncPublerPosts.js";
import type * as brands from "../brands.js";
import type * as campaigns from "../campaigns.js";
import type * as content from "../content.js";
import type * as crons from "../crons.js";
import type * as journeys from "../journeys.js";
import type * as kpi from "../kpi.js";
import type * as phases from "../phases.js";
import type * as publer from "../publer.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as seoClusters from "../seoClusters.js";
import type * as stakeholders from "../stakeholders.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/backfill": typeof actions_backfill;
  "actions/seedMicrovistaReport": typeof actions_seedMicrovistaReport;
  "actions/syncAds": typeof actions_syncAds;
  "actions/syncGSC": typeof actions_syncGSC;
  "actions/syncPubler": typeof actions_syncPubler;
  "actions/syncPublerAccounts": typeof actions_syncPublerAccounts;
  "actions/syncPublerPosts": typeof actions_syncPublerPosts;
  brands: typeof brands;
  campaigns: typeof campaigns;
  content: typeof content;
  crons: typeof crons;
  journeys: typeof journeys;
  kpi: typeof kpi;
  phases: typeof phases;
  publer: typeof publer;
  reports: typeof reports;
  seed: typeof seed;
  seoClusters: typeof seoClusters;
  stakeholders: typeof stakeholders;
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
