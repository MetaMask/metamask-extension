import { CaipChainId, isCaipChainId } from '@metamask/utils';
import {
  ExternalScopeObject,
  ExternalScopesObject,
  InternalScope,
  InternalScopeObject,
  InternalScopesObject,
} from './scope';

// DRY THIS
function unique<T>(list: T[]): T[] {
  return Array.from(new Set(list));
}

/**
 * Flattens a ScopeString and ScopeObject into a separate
 * ScopeString and ScopeObject for each scope in the `scopes` value
 * if defined. Returns the ScopeString and ScopeObject unmodified if
 * it cannot be flattened
 *
 * @param scopeString - The string representing the scopeObject
 * @param scopeObject - The object that defines the scope
 * @returns a map of caipChainId to ScopeObjects
 */
export const flattenScope = (
  scopeString: string,
  scopeObject: ExternalScopeObject,
): InternalScopesObject => {
  const { scopes, ...restScopeObject } = scopeObject;
  const isChainScoped = isCaipChainId(scopeString);

  if (isChainScoped || !scopes) {
    return { [scopeString]: scopeObject };
  }

  const scopeMap: InternalScopesObject = {};
  scopes.forEach((scope: CaipChainId) => {
    scopeMap[scope] = restScopeObject;
  });
  return scopeMap;
};

export const mergeScopeObject = (
  scopeObjectA: InternalScopeObject,
  scopeObjectB: InternalScopeObject,
) => {
  const mergedScopeObject: InternalScopeObject = {
    methods: unique([...scopeObjectA.methods, ...scopeObjectB.methods]),
    notifications: unique([
      ...scopeObjectA.notifications,
      ...scopeObjectB.notifications,
    ]),
  };

  if (scopeObjectA.accounts || scopeObjectB.accounts) {
    mergedScopeObject.accounts = unique([
      ...(scopeObjectA.accounts ?? []),
      ...(scopeObjectB.accounts ?? []),
    ]);
  }

  if (scopeObjectA.rpcDocuments || scopeObjectB.rpcDocuments) {
    mergedScopeObject.rpcDocuments = unique([
      ...(scopeObjectA.rpcDocuments ?? []),
      ...(scopeObjectB.rpcDocuments ?? []),
    ]);
  }

  if (scopeObjectA.rpcEndpoints || scopeObjectB.rpcEndpoints) {
    mergedScopeObject.rpcEndpoints = unique([
      ...(scopeObjectA.rpcEndpoints ?? []),
      ...(scopeObjectB.rpcEndpoints ?? []),
    ]);
  }

  return mergedScopeObject;
};

export const mergeScopes = (
  scopeA: InternalScopesObject,
  scopeB: InternalScopesObject,
): InternalScopesObject => {
  const scope: InternalScopesObject = {};

  Object.entries(scopeA).forEach(([_scopeString, scopeObjectA]) => {
    const scopeString = _scopeString as InternalScope;
    const scopeObjectB = scopeB[scopeString];

    scope[scopeString] = scopeObjectB
      ? mergeScopeObject(scopeObjectA, scopeObjectB)
      : scopeObjectA;
  });

  Object.entries(scopeB).forEach(([_scopeString, scopeObjectB]) => {
    const scopeString = _scopeString as InternalScope;
    const scopeObjectA = scopeA[scopeString];

    if (!scopeObjectA) {
      scope[scopeString] = scopeObjectB;
    }
  });

  return scope;
};

export const flattenMergeScopes = (
  scopes: ExternalScopesObject,
): InternalScopesObject => {
  let flattenedScopes: InternalScopesObject = {};
  Object.keys(scopes).forEach((scopeString) => {
    const flattenedScopeMap = flattenScope(scopeString, scopes[scopeString]);
    flattenedScopes = mergeScopes(flattenedScopes, flattenedScopeMap);
  });

  return flattenedScopes;
};
