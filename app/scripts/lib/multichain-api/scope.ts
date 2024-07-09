import { toHex } from '@metamask/controller-utils';
import { InternalAccount } from '@metamask/keyring-api';
import { NetworkClientId } from '@metamask/network-controller';
import {
  CaipAccountId,
  CaipChainId,
  CaipReference,
  Hex,
  isCaipChainId,
  isCaipNamespace,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import MetaMaskOpenRPCDocument from '@metamask/api-specs';
import { EthereumRpcError } from 'eth-rpc-errors';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';

export type Scope = CaipChainId | CaipReference;

export type ScopeObject = {
  scopes?: CaipChainId[];
  methods: string[];
  notifications: string[];
  accounts?: CaipAccountId[];
  rpcDocuments?: string[];
  rpcEndpoints?: string[];
};

export type ScopesObject = Record<Scope, ScopeObject>;

export type Caip25Authorization =
  | {
      requiredScopes: ScopesObject;
      optionalScopes?: ScopesObject;
      sessionProperties?: Record<string, unknown>;
    }
  | ({
      requiredScopes?: ScopesObject;
      optionalScopes: ScopesObject;
    } & {
      sessionProperties?: Record<string, unknown>;
    });

const validRpcMethods = MetaMaskOpenRPCDocument.methods.map(({ name }) => name);

const parseScopeString = (
  scopeString: string,
): {
  namespace?: string;
  reference?: string;
} => {
  if (isCaipNamespace(scopeString)) {
    return {
      namespace: scopeString,
    };
  }
  if (isCaipChainId(scopeString)) {
    return parseCaipChainId(scopeString);
  }

  return {};
};

// Make this an assert
export const isValidScope = (
  scopeString: string,
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

  // Note we are not validating the chainId here, only the namespace
  const areAccountsValid = (accounts || []).every((account) => {
    try {
      return parseCaipAccountId(account).chain.namespace === namespace;
    } catch (e) {
      // parsing caipAccountId failed
      console.log(e);
      return false;
    }
  });

  if (!areAccountsValid) {
    return false;
  }
  // not validating rpcDocuments or rpcEndpoints currently

  // unexpected properties found on scopeObject
  if (Object.keys(restScopeObject).length !== 0) {
    return false;
  }

  return true;
};

// TODO: Needs to go into a capabilties/routing controller
export const isSupportedNotification = (notification: string): boolean => {
  return ['accountsChanged', 'chainChanged'].includes(notification);
};

// TODO: Remove this after bumping utils
enum KnownCaipNamespace {
  /** EIP-155 compatible chains. */
  Eip155 = 'eip155',
  Wallet = 'wallet', // Needs to be added to utils
}

export const isSupportedScopeString = (
  scopeString: string,
  findNetworkClientIdByChainId: (chainId: Hex) => NetworkClientId,
) => {
  const isNamespaceScoped = isCaipNamespace(scopeString);
  const isChainScoped = isCaipChainId(scopeString);

  if (isNamespaceScoped) {
    switch (scopeString) {
      case KnownCaipNamespace.Wallet:
        return true;
      case KnownCaipNamespace.Eip155:
        return true;
      default:
        return false;
    }
  }

  if (isChainScoped) {
    const { namespace, reference } = parseCaipChainId(scopeString);
    switch (namespace) {
      case KnownCaipNamespace.Eip155:
        try {
          findNetworkClientIdByChainId(toHex(reference));
          return true;
        } catch (err) {
          console.log(
            'failed to find network client that can serve chainId',
            err,
          );
        }
        return false;
      default:
        return false;
    }
  }

  return false;
};

export const isSupportedAccount = (
  account: CaipAccountId,
  getInternalAccounts: () => InternalAccount[],
) => {
  const {
    address,
    chain: { namespace },
  } = parseCaipAccountId(account);
  switch (namespace) {
    case KnownCaipNamespace.Eip155:
      try {
        return getInternalAccounts().some(
          (internalAccount) =>
            ['eip155:eoa', 'eip155:erc4337'].includes(internalAccount.type) &&
            isEqualCaseInsensitive(address, internalAccount.address),
        );
      } catch (err) {
        console.log('failed to check if account is supported by wallet', err);
      }
      return false;
    default:
      return false;
  }
};

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
  const isChainScoped = isCaipChainId(scopeString);

  if (isChainScoped) {
    return { [scopeString]: scopeObject };
  }

  // TODO: Either change `scopes` to `references` or do a namespace check here?
  // Do we need to handle the case where chain scoped is passed in with `scopes` defined too?

  const { scopes, ...restScopeObject } = scopeObject;
  const scopeMap: Record<CaipChainId, ScopeObject> = {};
  scopes?.forEach((scope) => {
    scopeMap[scope] = restScopeObject;
  });
  return scopeMap;
};

// DRY THIS
function unique<T>(list: T[]): T[] {
  return Array.from(new Set(list));
}

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

export const mergeFlattenedScopes = (
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

// TODO: spec this
export const validateScopes = (
  requiredScopes?: ScopesObject,
  optionalScopes?: ScopesObject,
) => {
  const validRequiredScopes: ScopesObject = {};
  for (const [scopeString, scopeObject] of Object.entries(requiredScopes || {})) {
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
  for (const [scopeString, scopeObject] of Object.entries(optionalScopes || {})) {
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

// TODO: spec this
export const flattenScopes = (scopes: ScopesObject) => {
  let flattenedScopes = {};
  Object.keys(scopes).forEach((scopeString) => {
    const flattenedScopeMap = flattenScope(scopeString, scopes[scopeString]);
    flattenedScopes = mergeFlattenedScopes(flattenedScopes, flattenedScopeMap);
  });

  return flattenedScopes;
};

// TODO: spec this
export const assertScopesSupported = (
  scopes: ScopesObject,
  {
    findNetworkClientIdByChainId,
    getInternalAccounts,
  }: {
    findNetworkClientIdByChainId: (chainId: Hex) => NetworkClientId;
    getInternalAccounts: () => InternalAccount[];
  },
) => {
  // TODO: Should we be less strict validating optional scopes? As in we can
  // drop parts or the entire optional scope when we hit something invalid which
  // is not true for the required scopes.

  // TODO:
  // Unless the dapp is known and trusted, give generic error messages for
  // - the user denies consent for exposing accounts that match the requested and approved chains,
  // - the user denies consent for requested methods,
  // - the user denies all requested or any required scope objects,
  // - the wallet cannot support all requested or any required scope objects,
  // - the requested chains are not supported by the wallet, or
  // - the requested methods are not supported by the wallet
  // return
  //     "code": 0,
  //     "message": "Unknown error"

  if (Object.keys(scopes).length === 0) {
    throw new EthereumRpcError(5000, 'Unknown error with request');
  }

  // TODO:
  // When user disapproves accepting calls with the request methods
  //   code = 5001
  //   message = "User disapproved requested methods"
  // When user disapproves accepting calls with the request notifications
  //   code = 5002
  //   message = "User disapproved requested notifications"

  for (const [
    scopeString,
    { methods, notifications, accounts },
  ] of Object.entries(scopes)) {
    if (!isSupportedScopeString(scopeString, findNetworkClientIdByChainId)) {
      throw new EthereumRpcError(5100, 'Requested chains are not supported');
    }

    // Needs to be split by namespace?
    const allMethodsSupported = methods.every((method) =>
      validRpcMethods.includes(method),
    );
    if (!allMethodsSupported) {
      // not sure which one of these to use
      // When provider evaluates requested methods to not be supported
      //   code = 5101
      //   message = "Requested methods are not supported"
      // When provider does not recognize one or more requested method(s)
      //   code = 5201
      //   message = "Unknown method(s) requested"

      throw new EthereumRpcError(5101, 'Requested methods are not supported');
    }

    if (notifications && !notifications.every(isSupportedNotification)) {
      // not sure which one of these to use
      // When provider evaluates requested notifications to not be supported
      //   code = 5102
      //   message = "Requested notifications are not supported"
      // When provider does not recognize one or more requested notification(s)
      //   code = 5202
      //   message = "Unknown notification(s) requested"
      throw new EthereumRpcError(
        5102,
        'Requested notifications are not supported',
      );
    }

    if (accounts) {
      const accountsSupported = accounts.every((account) =>
        isSupportedAccount(account, getInternalAccounts),
      );

      if (!accountsSupported) {
        // TODO: There is no error code or message specified in the CAIP-25 spec for when accounts are not supported
        // The below is made up
        throw new EthereumRpcError(
          5103,
          'Requested accounts are not supported',
        );
      }
    }
  }
};

// TODO: spec this
// TODO: Awful name. I think the other helpers need to be renamed as well
export const processScopes = (
  requiredScopes: ScopesObject,
  optionalScopes: ScopesObject,
  {
    findNetworkClientIdByChainId,
    getInternalAccounts,
  }: {
    findNetworkClientIdByChainId: (chainId: Hex) => NetworkClientId;
    getInternalAccounts: () => InternalAccount[];
  },
) => {
  const { validRequiredScopes, validOptionalScopes } = validateScopes(
    requiredScopes,
    optionalScopes,
  );

  // TODO: determine is merging is a valid strategy
  const flattenedRequiredScopes = flattenScopes(validRequiredScopes);
  const flattenedOptionalScopes = flattenScopes(validOptionalScopes);

  assertScopesSupported(flattenedRequiredScopes, {
    findNetworkClientIdByChainId,
    getInternalAccounts,
  });
  assertScopesSupported(flattenedOptionalScopes, {
    findNetworkClientIdByChainId,
    getInternalAccounts,
  });

  return {
    flattenedRequiredScopes,
    flattenedOptionalScopes,
  };
};
