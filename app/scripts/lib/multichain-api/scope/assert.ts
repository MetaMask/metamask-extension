import { Hex } from '@metamask/utils';
import { EthereumRpcError } from 'eth-rpc-errors';
import {
  isSupportedMethod,
  isSupportedNotification,
  isSupportedScopeString,
} from './supported';
import { ScopeObject, ScopesObject } from './scope';

// export const assertScopeValid = (
//   scopeString: Scope,
//   scopeObject: ScopeObject,
// ) => {
//   const { namespace, reference } = parseScopeString(scopeString);

//   if (!namespace && !reference) {
//     throw new Error('Invalid scopeString') ;
//   }

//   const {
//     scopes,
//     methods,
//     notifications,
//     accounts,
//     rpcDocuments,
//     rpcEndpoints,
//     ...restScopeObject
//   } = scopeObject;

//   if (!methods || !notifications) {
//     throw new Error('Missing expected properties on scopeObject') ;
//   }

//   // These assume that the namespace has a notion of chainIds
//   if (reference && scopes && scopes.length > 0) {
//     throw new EthereumRpcError(5204, 'ChainId defined in two different scopes');
//   }
//   if (namespace && scopes) {
//     const areScopesValid = scopes.every((scope) => {
//       return parseCaipChainId(scope).namespace === namespace;
//     });

//     if(!areScopesValid) {
//       throw new EthereumRpcError(5203, 'Scope/chain mismatch');
//     }
//   }

//   const areMethodsValid = methods.every(
//     (method) => typeof method === 'string' && method !== '',
//   );
//   if (!areMethodsValid) {
//     throw new Error('Expected methods to be non-empty strings')
//   }

//   const areNotificationsValid = notifications.every(
//     (notification) => typeof notification === 'string' && notification !== '',
//   );
//   if (!areNotificationsValid) {
//     throw new Error('Expected notifications to be non-empty strings')
//   }

//   // unexpected properties found on scopeObject
//   if (Object.keys(restScopeObject).length !== 0) {
//     throw new Error('Unexpected properties properties on scopeObject')
//   }
// };

export const assertScopeSupported = (
  scopeString: string,
  scopeObject: ScopeObject,
  {
    isChainIdSupported,
  }: {
    isChainIdSupported: (chainId: Hex) => boolean;
  },
) => {
  const { methods, notifications } = scopeObject;
  if (!isSupportedScopeString(scopeString, isChainIdSupported)) {
    throw new EthereumRpcError(5100, 'Requested chains are not supported');
  }

  // Needs to be split by namespace?
  const allMethodsSupported = methods.every((method) =>
    isSupportedMethod(method),
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

  if (
    notifications &&
    !notifications.every((notification) =>
      isSupportedNotification(notification),
    )
  ) {
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
};

export const assertScopesSupported = (
  scopes: ScopesObject,
  {
    isChainIdSupported,
  }: {
    isChainIdSupported: (chainId: Hex) => boolean;
  },
) => {
  for (const [scopeString, scopeObject] of Object.entries(scopes)) {
    assertScopeSupported(scopeString, scopeObject, {
      isChainIdSupported,
    });
  }
};
