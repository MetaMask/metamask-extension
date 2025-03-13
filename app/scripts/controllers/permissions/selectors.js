import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getEthAccounts,
  getPermittedEthChainIds,
} from '@metamask/multichain';
import { createSelector } from 'reselect';

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
 * Get the permitted accounts for a given origin and scope.
 *
 * @param {Record<string, Record<string, unknown>>} state - The PermissionController state
 * @param {string[]} scopes - The scopes to get the permitted accounts for
 * @returns {Map<string, string[]>} A map of origins to permitted accounts for the given scope
 */
export const getPermittedAccountsForScopesByOrigin = (state, scopes) => {
  const subjects = getSubjects(state);

  return Object.values(subjects).reduce((originToAccountsMap, subject) => {
    const caveats =
      subject.permissions?.[Caip25EndowmentPermissionName]?.caveats || [];

    const caveat = caveats.find(({ type }) => type === Caip25CaveatType);

    // this part should probably be a helper in the multichain library
    if (caveat) {
      const scopeAccounts = [];

      scopes.forEach((scope) => {
        if (caveat.value.requiredScopes[scope]) {
          scopeAccounts.push(...caveat.value.requiredScopes[scope].accounts);
        }

        if (caveat.value.optionalScopes[scope]) {
          scopeAccounts.push(...caveat.value.optionalScopes[scope].accounts);
        }
      });

      if (scopeAccounts.length > 0) {
        originToAccountsMap.set(subject.origin, scopeAccounts);
      }
    }
    return originToAccountsMap;
  }, new Map());
};
/**
 * Get the authorized CAIP-25 scopes for each subject, keyed by origin.
 * The values of the returned map are immutable values from the
 * PermissionController state.
 *
 * @returns {Map<string, Caip25Authorization>} The current origin:authorization map.
 */
export const getAuthorizedScopesByOrigin = createSelector(
  getSubjects,
  (subjects) => {
    return Object.values(subjects).reduce(
      (originToAuthorizationsMap, subject) => {
        const caveats =
          subject.permissions?.[Caip25EndowmentPermissionName]?.caveats || [];

        const caveat = caveats.find(({ type }) => type === Caip25CaveatType);

        if (caveat) {
          originToAuthorizationsMap.set(subject.origin, caveat.value);
        }
        return originToAuthorizationsMap;
      },
      new Map(),
    );
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
