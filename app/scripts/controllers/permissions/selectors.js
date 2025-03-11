import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getEthAccounts,
  getPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
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

// This will be moved to the @metamask/chain-agnostic-permission package
/**
 * Get the permitted accounts for a given scope.
 *
 * @param {Pick<Caip25CaveatValue, 'requiredScopes' | 'optionalScopes'>} caip25CaveatValue - The CAIP-25 CaveatValue to get the permitted accounts for
 * @param {string[]} scopes - The scopes to get the permitted accounts for
 * @returns {string[]} An array of permitted accounts
 */
export const getPermittedAccountsForScopes = (caip25CaveatValue, scopes) => {
  const scopeAccounts = [];

  scopes.forEach((scope) => {
    const requiredScope = caip25CaveatValue.requiredScopes[scope];
    const optionalScope = caip25CaveatValue.optionalScopes[scope];
    if (requiredScope) {
      scopeAccounts.push(...requiredScope.accounts);
    }

    if (optionalScope) {
      scopeAccounts.push(...optionalScope.accounts);
    }
  });
  return scopeAccounts;
};

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

    if (caveat) {
      const scopeAccounts = getPermittedAccountsForScopes(caveat.value, scopes);

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
