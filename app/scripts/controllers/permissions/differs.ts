import {
  Caip25CaveatValue,
  InternalScopesObject,
  InternalScopeString,
} from '@metamask/chain-agnostic-permission';

/**
 * Returns a map containing key/value pairs for those that have been
 * added, changed, or removed between two string:string[] maps
 *
 * @param currentMap - The new string:string[] map.
 * @param previousMap - The previous string:string[] map.
 * @returns The string:string[] map of changed key/values.
 */
export const diffMap = (
  currentMap: Map<string, string[]>,
  previousMap?: Map<string, string[]>,
): Map<string, string[]> => {
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
 * subject, returns a new map containing the current value of scopes added/changed in an authorization.
 * The values of each map must be immutable values directly from the
 * PermissionController state, or an empty object instantiated in this
 * function.
 *
 * @param newAuthorizationsMap - The new origin:authorization map.
 * @param [previousAuthorizationsMap] - The previous origin:authorization map.
 * @returns The origin:authorization map of changed authorizations.
 */
export const getChangedAuthorizations = (
  newAuthorizationsMap: Map<string, Caip25CaveatValue>,
  previousAuthorizationsMap?: Map<string, Caip25CaveatValue>,
): Map<
  string,
  Pick<Caip25CaveatValue, 'requiredScopes' | 'optionalScopes'>
> => {
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
      changedAuthorizations.set(origin, {
        requiredScopes: newAuthorizations.requiredScopes,
        optionalScopes: newAuthorizations.optionalScopes,
      });
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
