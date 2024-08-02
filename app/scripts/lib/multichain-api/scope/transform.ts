import { CaipChainId, isCaipChainId } from '@metamask/utils';
import { ScopeObject, ScopesObject } from './scope';

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
  scopeObject: ScopeObject,
): ScopesObject => {
  const { scopes, ...restScopeObject } = scopeObject;
  const isChainScoped = isCaipChainId(scopeString);

  if (isChainScoped || !scopes) {
    return { [scopeString]: scopeObject };
  }

  // TODO: Either change `scopes` to `references` or do a namespace check here?
  // Do we need to handle the case where chain scoped is passed in with `scopes` defined too?

  const scopeMap: Record<CaipChainId, ScopeObject> = {};
  scopes.forEach((scope) => {
    scopeMap[scope] = restScopeObject;
  });
  return scopeMap;
};

export const mergeScopeObject = (
  // scopeStringA: CaipChainId,
  scopeObjectA: ScopeObject,
  // scopeStringB: CaipChainId,
  scopeObjectB: ScopeObject,
) => {
  // if (scopeStringA !== scopeStringB) {
  //   throw new Error('cannot merge ScopeObjects for different ScopeStrings')
  // }

  // TODO: Should we be verifying that these scopeStrings are flattened / the scopeObjects do not contain `scopes` array?

  const mergedScopeObject: ScopeObject = {
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
  scopeA: Record<CaipChainId, ScopeObject>,
  scopeB: Record<CaipChainId, ScopeObject>,
): Record<CaipChainId, ScopeObject> => {
  const scope: Record<CaipChainId, ScopeObject> = {};

  Object.entries(scopeA).forEach(([_, { scopes }]) => {
    if (scopes) {
      throw new Error('unexpected `scopes` property');
    }
  });

  Object.entries(scopeB).forEach(([_, { scopes }]) => {
    if (scopes) {
      throw new Error('unexpected `scopes` property');
    }
  });

  Object.keys(scopeA).forEach((_scopeString: string) => {
    const scopeString = _scopeString as CaipChainId;
    const scopeObjectA = scopeA[scopeString];
    const scopeObjectB = scopeB[scopeString];

    if (scopeObjectA && scopeObjectB) {
      scope[scopeString] = mergeScopeObject(scopeObjectA, scopeObjectB);
    } else {
      scope[scopeString] = scopeObjectA;
    }
  });

  Object.keys(scopeB).forEach((_scopeString: string) => {
    const scopeString = _scopeString as CaipChainId;
    const scopeObjectA = scopeA[scopeString];
    const scopeObjectB = scopeB[scopeString];

    if (!scopeObjectA && scopeObjectB) {
      scope[scopeString] = scopeObjectB;
    }
  });

  return scope;
};

export const flattenMergeScopes = (scopes: ScopesObject) => {
  let flattenedScopes = {};
  Object.keys(scopes).forEach((scopeString) => {
    const flattenedScopeMap = flattenScope(scopeString, scopes[scopeString]);
    flattenedScopes = mergeScopes(flattenedScopes, flattenedScopeMap);
  });

  return flattenedScopes;
};
