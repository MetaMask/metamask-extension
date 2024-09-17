import { createSelector } from 'reselect';
import { CaveatTypes } from '../../../../shared/constants/permissions';
import { PermissionNames } from './specifications';

/**
 * This file contains selectors for PermissionController selector event
 * subscriptions, used to detect whenever a subject's accounts change so that
 * we can notify the subject via the `accountsChanged` provider event.
 */

/**
 * @param {Record<string, Record<string, unknown>>} state - The
 * PermissionController state.
 * @returns {Record<string, unknown>} The PermissionController subjects.
 */
const getSubjects = (state) => state.subjects;

/**
 * Get the permitted accounts for each subject, keyed by origin.
 * The values of the returned map are immutable values from the
 * PermissionController state.
 *
 * @returns {Map<string, string[]>} The current origin:accounts[] map.
 */
export const getPermittedAccountsByOrigin = createSelector(
  getSubjects,
  (subjects) => {
    return Object.values(subjects).reduce((originToAccountsMap, subject) => {
      const caveats = subject.permissions?.eth_accounts?.caveats || [];

      const caveat = caveats.find(
        ({ type }) => type === CaveatTypes.restrictReturnedAccounts,
      );

      if (caveat) {
        originToAccountsMap.set(subject.origin, caveat.value);
      }
      return originToAccountsMap;
    }, new Map());
  },
);

/**
 * Get the permitted chains for each subject, keyed by origin.
 * The values of the returned map are immutable values from the
 * PermissionController state.
 *
 * @returns {Map<string, string[]>} The current origin:chainIds[] map.
 */
export const getPermittedChainsByOrigin = createSelector(
  getSubjects,
  (subjects) => {
    return Object.values(subjects).reduce((originToChainsMap, subject) => {
      const caveats =
        subject.permissions?.[PermissionNames.permittedChains]?.caveats || [];

      const caveat = caveats.find(
        ({ type }) => type === CaveatTypes.restrictNetworkSwitching,
      );

      if (caveat) {
        originToChainsMap.set(subject.origin, caveat.value);
      }
      return originToChainsMap;
    }, new Map());
  },
);

/**
 * Given the current and previous exposed origins for each PermissionController
 * subject, returns a new map containing all origins that have changed.
 * The values of each map must be immutable values directly from the
 * PermissionController state, or an empty array instantiated in this
 * function.
 *
 * @param {Map<string, string[]>} newOriginsMap - The new origin:string[] map.
 * @param {Map<string, string[]>} [previousOriginsMap] - The previous origin:string[] map.
 * @returns {Map<string, string[]>} The origin:string[] map of changed origins.
 */
export const getChangedOrigins = (newOriginsMap, previousOriginsMap) => {
  if (previousOriginsMap === undefined) {
    return newOriginsMap;
  }

  const changedOriginsMap = new Map();
  if (newOriginsMap === previousOriginsMap) {
    return changedOriginsMap;
  }

  const newOrigins = new Set([...newOriginsMap.keys()]);

  for (const origin of previousOriginsMap.keys()) {
    const newValue = newOriginsMap.get(origin) ?? [];
    const previousValue = previousOriginsMap.get(origin);

    // The values of these maps are references to immutable values, which is why
    // a strict equality check is enough for diffing. The values are either from
    // PermissionController state, or an empty array initialized in the previous
    // call to this function. `newOriginsMap` will never contain any empty
    // arrays.
    if (newValue !== previousValue) {
      changedOriginsMap.set(origin, newValue);
    }

    newOrigins.delete(origin);
  }

  // By now, newOrigins is either empty or contains some number of previously
  // unencountered origins, and all of their origins have "changed".
  for (const origin of newOrigins.keys()) {
    changedOriginsMap.set(origin, newOriginsMap.get(origin));
  }
  return changedOriginsMap;
};
