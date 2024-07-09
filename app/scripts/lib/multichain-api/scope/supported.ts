
import MetaMaskOpenRPCDocument from '@metamask/api-specs';
import { NetworkClientId } from '@metamask/network-controller';
import { CaipAccountId, Hex, isCaipChainId, isCaipNamespace, parseCaipAccountId, parseCaipChainId } from '@metamask/utils';
import { KnownCaipNamespace, ScopeObject, ScopesObject } from './scope';
import { toHex } from '@metamask/controller-utils';
import { InternalAccount } from '@metamask/keyring-api';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { EthereumRpcError } from 'eth-rpc-errors';

const validRpcMethods = MetaMaskOpenRPCDocument.methods.map(({ name }) => name);

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

// TODO: Needs to go into a capabilties/routing controller
// TODO: These make no sense in a multichain world. accountsChange becomes authorization/permissionChanged?
export const isSupportedNotification = (notification: string): boolean => {
  return ['accountsChanged', 'chainChanged'].includes(notification);
};

// TODO: spec this
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
  const { methods, notifications, accounts } = scopeObject
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

  if (Object.keys(scopes).length === 0) {
    throw new EthereumRpcError(5000, 'Unknown error with request');
  }

  for (const [
    scopeString,
    scopeObject
  ] of Object.entries(scopes)) {
    assertScopeSupported(scopeString, scopeObject,   {
      findNetworkClientIdByChainId,
      getInternalAccounts,
    })
  }
};
