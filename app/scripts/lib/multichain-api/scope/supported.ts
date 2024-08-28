import {
  CaipAccountId,
  Hex,
  isCaipChainId,
  isCaipNamespace,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { InternalAccount } from '@metamask/keyring-api';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import {
  KnownCaipNamespace,
  KnownNotifications,
  KnownRpcMethods,
  KnownWalletNamespaceRpcMethods,
  KnownWalletRpcMethods,
  NonWalletKnownCaipNamespace,
  parseScopeString,
  Scope,
} from './scope';

export const isSupportedScopeString = (
  scopeString: string,
  isChainIdSupported: (chainId: Hex) => boolean,
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
        return isChainIdSupported(toHex(reference));
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

export const isSupportedMethod = (scope: Scope, method: string): boolean => {
  const { namespace, reference } = parseScopeString(scope);

  if (namespace === KnownCaipNamespace.Wallet) {
    if (reference) {
      return (
        KnownWalletNamespaceRpcMethods[
          reference as NonWalletKnownCaipNamespace
        ] || []
      ).includes(method);
    }

    return KnownWalletRpcMethods.includes(method);
  }

  return (
    KnownRpcMethods[namespace as NonWalletKnownCaipNamespace] || []
  ).includes(method);
};

export const isSupportedNotification = (
  scope: Scope,
  notification: string,
): boolean => {
  const { namespace } = parseScopeString(scope);

  return (
    KnownNotifications[namespace as NonWalletKnownCaipNamespace] || []
  ).includes(notification);
};
