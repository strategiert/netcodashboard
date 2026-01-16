/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as brands from "../brands.js";
import type * as content from "../content.js";
import type * as journeys from "../journeys.js";
import type * as phases from "../phases.js";
import type * as seed from "../seed.js";
import type * as seoClusters from "../seoClusters.js";
import type * as stakeholders from "../stakeholders.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  brands: typeof brands;
  content: typeof content;
  journeys: typeof journeys;
  phases: typeof phases;
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
