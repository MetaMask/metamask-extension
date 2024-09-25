import { isCaipReference, KnownCaipNamespace } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { validateAddEthereumChainParams } from '../../rpc-method-middleware/handlers/ethereum-chain-utils';
import {
  ExternalScopeString,
  parseScopeString,
  ExternalScopeObject,
  ExternalScopesObject,
} from './scope';

export const isValidScope = (
  scopeString: ExternalScopeString,
  scopeObject: ExternalScopeObject,
): boolean => {
  const { namespace, reference } = parseScopeString(scopeString);

  if (!namespace && !reference) {
    return false;
  }

  const {
    references,
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
  if (reference && references && references.length > 0) {
    return false;
  }
  if (namespace && references) {
    const areReferencesValid = references.every((nestedReference) => {
      return isCaipReference(nestedReference);
    });

    if (!areReferencesValid) {
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
  requiredScopes?: ExternalScopesObject,
  optionalScopes?: ExternalScopesObject,
) => {
  const validRequiredScopes: ExternalScopesObject = {};
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

  const validOptionalScopes: ExternalScopesObject = {};
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

  return {
    validRequiredScopes,
    validOptionalScopes,
  };
};

export const validateScopedPropertyEip3085 = (
  scopeString: string,
  eip3085Params: unknown,
) => {
  if (!eip3085Params) {
    throw new Error('eip3085 params are missing');
  }

  const { namespace, reference } = parseScopeString(scopeString);

  if (!namespace || !reference) {
    throw new Error('scopeString is malformed');
  }

  if (namespace !== KnownCaipNamespace.Eip155) {
    throw new Error('namespace is not eip155');
  }

  const validParams = validateAddEthereumChainParams(eip3085Params);

  if (validParams.chainId !== toHex(reference)) {
    throw new Error('eip3085 chainId does not match reference');
  }

  return validParams;
};
