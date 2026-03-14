/**
 * Send-ether-related selectors that do not depend on metamask duck or the rest
 * of selectors. Used to break the metamask ↔ selectors circular dependency.
 *
 * Imports only from: shared, ui/selectors/accounts, ui/selectors/shared.
 */

import { createSelector } from 'reselect';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  getCurrentChainId,
  getSelectedNetworkClientId,
} from '../../shared/lib/selectors/networks';
import {
  getAccountTrackerControllerAccountsByChainId,
  getMultiChainBalancesControllerBalances,
} from '../../shared/lib/selectors/assets-migration';
import { getEnabledNetworks } from '../../shared/lib/selectors/multichain';
import { createParameterizedShallowEqualSelector } from '../../shared/lib/selectors/selector-creators';
import { MULTICHAIN_PROVIDER_CONFIGS } from '../../shared/constants/multichain/networks';
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../shared/constants/multichain/assets';
import type { MetaMaskReduxState } from '../store/store';
import { getInternalAccounts } from './accounts';
import { EMPTY_OBJECT } from './shared';

// -----------------------------------------------------------------------------
// getAddressBook
// -----------------------------------------------------------------------------

export function getAddressBook(state: MetaMaskReduxState): unknown[] {
  const chainId = getCurrentChainId(state);
  if (!state.metamask.addressBook[chainId]) {
    return [];
  }
  return Object.values(state.metamask.addressBook[chainId]);
}

// -----------------------------------------------------------------------------
// isEIP1559Network & checkNetworkAndAccountSupports1559
// -----------------------------------------------------------------------------

export function isEIP1559Network(
  state: MetaMaskReduxState,
  networkClientId?: string,
): boolean {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);

  return (
    state.metamask.networksMetadata?.[
      networkClientId ?? selectedNetworkClientId
    ]?.EIPS?.[1559] === true
  );
}

export function checkNetworkAndAccountSupports1559(
  state: MetaMaskReduxState,
  networkClientId?: string,
): boolean {
  return isEIP1559Network(state, networkClientId);
}

export function isNotEIP1559Network(state: MetaMaskReduxState): boolean {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);
  return (
    state.metamask.networksMetadata?.[selectedNetworkClientId]?.EIPS?.[1559] ===
    false
  );
}

// -----------------------------------------------------------------------------
// getMetaMaskAccountBalances, getMetaMaskCachedBalances, getMetaMaskAccounts
// (internal helpers for accountsWithSendEtherInfoSelector)
// -----------------------------------------------------------------------------

const getMetaMaskAccountBalances = createSelector(
  getAccountTrackerControllerAccountsByChainId,
  getCurrentChainId,
  (accountsByChainId, currentChainId) => {
    const balancesForCurrentChain = accountsByChainId?.[currentChainId] ?? {};
    if (Object.keys(balancesForCurrentChain).length === 0) {
      return EMPTY_OBJECT;
    }
    return Object.entries(balancesForCurrentChain).reduce(
      (acc: Record<string, unknown>, [address, value]) => {
        acc[address.toLowerCase()] = value;
        return acc;
      },
      {},
    );
  },
);

const getMetaMaskCachedBalances = createSelector(
  getAccountTrackerControllerAccountsByChainId,
  getEnabledNetworks,
  getCurrentChainId,
  (_state: MetaMaskReduxState, networkChainId?: string) => networkChainId,
  (accountsByChainId, enabledNetworks, currentChainId, networkChainId) => {
    const eip155 = enabledNetworks?.eip155 ?? {};
    const enabledIds = Object.keys(eip155).filter((id) => Boolean(eip155[id]));
    if (enabledIds.length === 1) {
      const chainId = enabledIds[0];
      if (Object.keys(accountsByChainId?.[chainId] ?? {}).length === 0) {
        return EMPTY_OBJECT;
      }
      return Object.entries(accountsByChainId[chainId]).reduce(
        (accumulator: Record<string, string>, [key, value]) => {
          accumulator[key.toLowerCase()] = value.balance ?? '0';
          return accumulator;
        },
        {},
      );
    }

    const chainId = networkChainId ?? currentChainId;
    if (Object.keys(accountsByChainId?.[chainId] ?? {}).length === 0) {
      return EMPTY_OBJECT;
    }
    return Object.entries(accountsByChainId[chainId]).reduce(
      (accumulator: Record<string, string>, [key, value]) => {
        accumulator[key.toLowerCase()] = value.balance ?? '0';
        return accumulator;
      },
      {},
    );
  },
);

const createChainIdSelector = createParameterizedShallowEqualSelector(10);

const getMetaMaskAccounts = createChainIdSelector(
  getInternalAccounts,
  getMetaMaskAccountBalances,
  getMetaMaskCachedBalances,
  getMultiChainBalancesControllerBalances,
  getCurrentChainId,
  (_state: MetaMaskReduxState, chainId?: string) => chainId,
  (
    internalAccounts: InternalAccount[],
    balances: Record<string, unknown>,
    cachedBalances: Record<string, string>,
    multichainBalances:
      | Record<string, Record<string, { amount?: string }>>
      | undefined,
    currentChainId: string,
    chainId: string | undefined,
  ) => {
    return internalAccounts.reduce(
      (
        accounts: Record<string, InternalAccount & { balance?: string }>,
        internalAccount,
      ) => {
        let account: InternalAccount & { balance?: string } = internalAccount;

        if (chainId === undefined || currentChainId === chainId) {
          if (isEvmAccountType(internalAccount.type)) {
            if (balances?.[internalAccount.address]) {
              account = {
                ...account,
                ...(balances[internalAccount.address] as object),
              };
            }
          } else {
            const multichainNetwork = Object.values(
              MULTICHAIN_PROVIDER_CONFIGS,
            ).find((network) =>
              internalAccount.scopes?.some(
                (scope) => scope === network.chainId,
              ),
            );
            account = {
              ...account,
              balance:
                multichainBalances?.[internalAccount.id]?.[
                  multichainNetwork
                    ? MULTICHAIN_NETWORK_TO_ASSET_TYPES[
                        multichainNetwork.chainId as keyof typeof MULTICHAIN_NETWORK_TO_ASSET_TYPES
                      ]?.[0] ?? ''
                    : ''
                ]?.amount ?? '0',
            };
          }

          if (account.balance === null || account.balance === undefined) {
            account = {
              ...account,
              balance: cachedBalances?.[internalAccount.address] ?? '0x0',
            };
          }
        } else {
          account = {
            ...account,
            balance: cachedBalances?.[internalAccount.address] ?? '0x0',
          };
        }

        accounts[internalAccount.address] = account;
        return accounts;
      },
      {},
    );
  },
);

// -----------------------------------------------------------------------------
// accountsWithSendEtherInfoSelector (memoized)
// -----------------------------------------------------------------------------

export const accountsWithSendEtherInfoSelector = createSelector(
  getInternalAccounts,
  (state: MetaMaskReduxState) => getMetaMaskAccounts(state),
  (
    internalAccounts: InternalAccount[],
    accounts: Record<string, InternalAccount & { balance?: string }>,
  ) => {
    return internalAccounts.map((internalAccount) => ({
      ...internalAccount,
      ...accounts[internalAccount.address],
    }));
  },
);
