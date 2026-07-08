/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as contacts from "../contacts.js";
import type * as contractors from "../contractors.js";
import type * as dumpsters from "../dumpsters.js";
import type * as expenses from "../expenses.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as listbuilder from "../listbuilder.js";
import type * as listbuilderAction from "../listbuilderAction.js";
import type * as suppliers from "../suppliers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  contacts: typeof contacts;
  contractors: typeof contractors;
  dumpsters: typeof dumpsters;
  expenses: typeof expenses;
  http: typeof http;
  leads: typeof leads;
  listbuilder: typeof listbuilder;
  listbuilderAction: typeof listbuilderAction;
  suppliers: typeof suppliers;
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
