import { createSelector } from 'reselect';
import { CaveatTypes } from '../../../../shared/constants/permissions';

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
 * Given the current and previous exposed accounts for each PermissionController
 * subject, returns a new map containing all accounts that have changed.
 * The values of each map must be immutable values directly from the
 * PermissionController state, or an empty array instantiated in this
 * function.
 *
 * @param {Map<string, string[]>} newAccountsMap - The new origin:accounts[] map.
 * @param {Map<string, string[]>} [previousAccountsMap] - The previous origin:accounts[] map.
 * @returns {Map<string, string[]>} The origin:accounts[] map of changed accounts.
 */
export const getChangedAccounts = (newAccountsMap, previousAccountsMap) => {
  if (previousAccountsMap === undefined) {
    return newAccountsMap;
  }

  const changedAccounts = new Map();
  if (newAccountsMap === previousAccountsMap) {
    return changedAccounts;
  }

  const newOrigins = new Set([...newAccountsMap.keys()]);

  for (const origin of previousAccountsMap.keys()) {
    const newAccounts = newAccountsMap.get(origin) ?? [];

    // The values of these maps are references to immutable values, which is why
    // a strict equality check is enough for diffing. The values are either from
    // PermissionController state, or an empty array initialized in the previous
    // call to this function. `newAccountsMap` will never contain any empty
    // arrays.
    if (previousAccountsMap.get(origin) !== newAccounts) {
      changedAccounts.set(origin, newAccounts);
    }

    newOrigins.delete(origin);
  }

  // By now, newOrigins is either empty or contains some number of previously
  // unencountered origins, and all of their accounts have "changed".
  for (const origin of newOrigins.keys()) {
    changedAccounts.set(origin, newAccountsMap.get(origin));
  }
  return changedAccounts;
};
