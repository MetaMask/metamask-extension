import MetaMaskOpenRPCDocument from '@metamask/api-specs';
import { NetworkClientId } from '@metamask/network-controller';
import { Hex } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-api';
import { EthereumRpcError } from 'eth-rpc-errors';
import {
  isSupportedAccount,
  isSupportedNotification,
  isSupportedScopeString,
} from './supported';
import { ScopeObject, ScopesObject } from './scope';

const validRpcMethods = MetaMaskOpenRPCDocument.methods.map(({ name }) => name);

export const assertScopeSupported = (
  scopeString: string,
  scopeObject: ScopeObject,
  {
    findNetworkClientIdByChainId,
    getInternalAccounts,
  }: {
    findNetworkClientIdByChainId: (chainId: Hex) => NetworkClientId;
    getInternalAccounts: () => InternalAccount[];
  },
) => {
  const { methods, notifications, accounts } = scopeObject;
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

  if (accounts) {
    const accountsSupported = accounts.every((account) =>
      isSupportedAccount(account, getInternalAccounts),
    );

    if (!accountsSupported) {
      // TODO: There is no error code or message specified in the CAIP-25 spec for when accounts are not supported
      // The below is made up
      throw new EthereumRpcError(5103, 'Requested accounts are not supported');
    }
  }
};

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

  if (Object.keys(scopes).length === 0) {
    throw new EthereumRpcError(5000, 'Unknown error with request');
  }

  for (const [scopeString, scopeObject] of Object.entries(scopes)) {
    assertScopeSupported(scopeString, scopeObject, {
      findNetworkClientIdByChainId,
      getInternalAccounts,
    });
  }
};
