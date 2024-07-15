import { parseCaipChainId } from '@metamask/utils';
import { ScopeObject, Scope, parseScopeString, ScopesObject } from './scope';

// Make this an assert
export const isValidScope = (
  scopeString: Scope,
  scopeObject: ScopeObject,
): boolean => {
  const { namespace, reference } = parseScopeString(scopeString);

  if (!namespace && !reference) {
    return false;
  }

  const {
    scopes,
    methods,
    notifications,
    accounts,
    rpcDocuments,
    rpcEndpoints,
    ...restScopeObject
  } = scopeObject;

  if (!methods || !notifications) {
    return false;
  }

  // These assume that the namespace has a notion of chainIds
  if (reference && scopes && scopes.length > 0) {
    // TODO: Probably requires refactoring this helper a bit
    // When a badly-formed request includes a chainId mismatched to scope
    //   code = 5203
    //   message = "Scope/chain mismatch"
    // When a badly-formed request defines one chainId two ways
    //  code = 5204
    //  message = "ChainId defined in two different scopes"
    return false;
  }
  if (namespace && scopes) {
    const areScopesValid = scopes.every((scope) => {
      try {
        return parseCaipChainId(scope).namespace === namespace;
      } catch (e) {
        // parsing caipChainId failed
        console.log(e);
        return false;
      }
    });

    if (!areScopesValid) {
      return false;
    }
  }

  const areMethodsValid = methods.every(
    (method) => typeof method === 'string' && method !== '',
  );
  if (!areMethodsValid) {
    return false;
  }

  const areNotificationsValid = notifications.every(
    (notification) => typeof notification === 'string' && notification !== '',
  );
  if (!areNotificationsValid) {
    return false;
  }

  // unexpected properties found on scopeObject
  if (Object.keys(restScopeObject).length !== 0) {
    return false;
  }

  return true;
};

export const validateScopes = (
  requiredScopes?: ScopesObject,
  optionalScopes?: ScopesObject,
) => {
  const validRequiredScopes: ScopesObject = {};
  for (const [scopeString, scopeObject] of Object.entries(
    requiredScopes || {},
  )) {
    if (isValidScope(scopeString, scopeObject)) {
      validRequiredScopes[scopeString] = {
        accounts: [],
        ...scopeObject,
      };
    }
  }
  if (requiredScopes && Object.keys(validRequiredScopes).length === 0) {
    // What error code and message here?
    throw new Error(
      '`requiredScopes` object MUST contain 1 more `scopeObjects`, if present',
    );
  }

  const validOptionalScopes: ScopesObject = {};
  for (const [scopeString, scopeObject] of Object.entries(
    optionalScopes || {},
  )) {
    if (isValidScope(scopeString, scopeObject)) {
      validOptionalScopes[scopeString] = {
        accounts: [],
        ...scopeObject,
      };
    }
  }
  if (optionalScopes && Object.keys(validOptionalScopes).length === 0) {
    // What error code and message here?
    throw new Error(
      '`optionalScopes` object MUST contain 1 more `scopeObjects`, if present',
    );
  }

  return {
    validRequiredScopes,
    validOptionalScopes,
  };
};
