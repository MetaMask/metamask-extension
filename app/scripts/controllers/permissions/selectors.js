import { createSelector } from 'reselect';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain/caip25Permission';
import { getEthAccounts } from '@metamask/multichain/adapters/caip-permission-adapter-eth-accounts';
import { getPermittedEthChainIds } from '@metamask/multichain/adapters/caip-permission-adapter-permittedChains';

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

/**
 * Given the current and previous exposed CAIP-25 authorization for each PermissionController
 * subject, returns a new map containing all authorizations that have changed.
 * The values of each map must be immutable values directly from the
 * PermissionController state, or an empty object instantiated in this
 * function.
 *
 * @param {Map<string, Caip25Authorization>} newAuthorizationsMap - The new origin:authorization map.
 * @param {Map<string, Caip25Authorization>} [previousAuthorizationsMap] - The previous origin:authorization map.
 * @returns {Map<string, Caip25Authorization>} The origin:authorization map of changed authorizations.
 */
export const getChangedAuthorizations = (
  newAuthorizationsMap,
  previousAuthorizationsMap,
) => {
  if (previousAuthorizationsMap === undefined) {
    return newAuthorizationsMap;
  }

  const changedAuthorizations = new Map();
  if (newAuthorizationsMap === previousAuthorizationsMap) {
    return changedAuthorizations;
  }

  const newOrigins = new Set([...newAuthorizationsMap.keys()]);

  for (const origin of previousAuthorizationsMap.keys()) {
    const newAuthorizations = newAuthorizationsMap.get(origin) ?? {
      requiredScopes: {},
      optionalScopes: {},
    };

    // The values of these maps are references to immutable values, which is why
    // a strict equality check is enough for diffing. The values are either from
    // PermissionController state, or an empty object initialized in the previous
    // call to this function. `newAuthorizationsMap` will never contain any empty
    // objects.
    if (previousAuthorizationsMap.get(origin) !== newAuthorizations) {
      changedAuthorizations.set(origin, newAuthorizations);
    }

    newOrigins.delete(origin);
  }

  // By now, newOrigins is either empty or contains some number of previously
  // unencountered origins, and all of their authorizations have "changed".
  for (const origin of newOrigins.keys()) {
    changedAuthorizations.set(origin, newAuthorizationsMap.get(origin));
  }
  return changedAuthorizations;
};

/**
 *
 * @param {Map<string, Caip25Authorization>} newAuthorizationsMap - The new origin:authorization map.
 * @param {Map<string, Caip25Authorization>} [previousAuthorizationsMap] - The previous origin:authorization map.
 * @returns {Map<string, Caip25Authorization>} The origin:authorization map of changed authorizations.
 */
export const getRemovedAuthorizations = (
  newAuthorizationsMap,
  previousAuthorizationsMap,
) => {
  const removedAuthorizations = new Map();

  // If there are no previous authorizations, there are no removed authorizations.
  // OR If the new authorizations map is the same as the previous authorizations map,
  // there are no removed authorizations
  if (
    previousAuthorizationsMap === undefined ||
    newAuthorizationsMap === previousAuthorizationsMap
  ) {
    return removedAuthorizations;
  }

  const previousOrigins = new Set([...previousAuthorizationsMap.keys()]);
  for (const origin of newAuthorizationsMap.keys()) {
    previousOrigins.delete(origin);
  }

  for (const origin of previousOrigins.keys()) {
    removedAuthorizations.set(origin, previousAuthorizationsMap.get(origin));
  }

  return removedAuthorizations;
};
