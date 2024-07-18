import MetaMaskOpenRPCDocument from '@metamask/api-specs';
import { Hex } from '@metamask/utils';
import { EthereumRpcError } from 'eth-rpc-errors';
import { isSupportedNotification, isSupportedScopeString } from './supported';
import { ScopeObject, ScopesObject } from './scope';

const validRpcMethods = MetaMaskOpenRPCDocument.methods.map(({ name }) => name);

export const assertScopeSupported = (
  scopeString: string,
  scopeObject: ScopeObject,
  {
    existsNetworkClientForChainId,
  }: {
    existsNetworkClientForChainId: (chainId: Hex) => boolean;
  },
) => {
  const { methods, notifications } = scopeObject;
  if (!isSupportedScopeString(scopeString, existsNetworkClientForChainId)) {
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
    existsNetworkClientForChainId,
  }: {
    existsNetworkClientForChainId: (chainId: Hex) => boolean;
  },
) => {
  for (const [scopeString, scopeObject] of Object.entries(scopes)) {
    assertScopeSupported(scopeString, scopeObject, {
      existsNetworkClientForChainId,
    });
  }
};
