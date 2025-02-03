import { createSelector } from 'reselect';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getEthAccounts,
  getPermittedEthChainIds,
} from '@metamask/multichain';

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
      const caveats =
        subject.permissions?.[Caip25EndowmentPermissionName]?.caveats || [];

      const caveat = caveats.find(({ type }) => type === Caip25CaveatType);

      if (caveat) {
        const ethAccounts = getEthAccounts(caveat.value);
        originToAccountsMap.set(subject.origin, ethAccounts);
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
        subject.permissions?.[Caip25EndowmentPermissionName]?.caveats || [];

      const caveat = caveats.find(({ type }) => type === Caip25CaveatType);

      if (caveat) {
        const ethChainIds = getPermittedEthChainIds(caveat.value);
        originToChainsMap.set(subject.origin, ethChainIds);
      }
      return originToChainsMap;
    }, new Map());
  },
);

/**
 * Returns a map containing key/value pairs for those that have been
 * added, changed, or removed between two string:string[] maps
 *
 * @param {Map<string, string[]>} currentMap - The new string:string[] map.
 * @param {Map<string, string[]>} previousMap - The previous string:string[] map.
 * @returns {Map<string, string[]>} The string:string[] map of changed key/values.
 */
export const diffMap = (currentMap, previousMap) => {
  if (previousMap === undefined) {
    return currentMap;
  }

  const changedMap = new Map();
  if (currentMap === previousMap) {
    return changedMap;
  }

  const newKeys = new Set([...currentMap.keys()]);

  for (const key of previousMap.keys()) {
    const currentValue = currentMap.get(key) ?? [];
    const previousValue = previousMap.get(key);

    // The values of these maps are references to immutable values, which is why
    // a strict equality check is enough for diffing. The values are either from
    // PermissionController state, or an empty array initialized in the previous
    // call to this function. `currentMap` will never contain any empty
    // arrays.
    if (currentValue !== previousValue) {
      changedMap.set(key, currentValue);
    }

    newKeys.delete(key);
  }

  // By now, newKeys is either empty or contains some number of previously
  // unencountered origins, and all of their origins have "changed".
  for (const origin of newKeys.keys()) {
    changedMap.set(origin, currentMap.get(origin));
  }
  return changedMap;
};
