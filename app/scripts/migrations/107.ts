import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

export const version = 107;

interface AccountBalance {
  address: string;
  balance: string;
}

interface AccountTrackerControllerState {
  accountsByChainId: Record<string, Record<string, AccountBalance>>;
  accounts: Record<string, AccountBalance>;
  currentBlockGasLimit: string;
  currentBlockGasLimitByChainId: Record<string, string>;
}

/**
 * Migrates state from the now removed CachedBalancesController to the AccountTrackerController and formats it accordingly.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    !hasProperty(state, 'CachedBalancesController') ||
    !isObject(state.CachedBalancesController) ||
    !hasProperty(state.CachedBalancesController, 'cachedBalances') ||
    !isObject(state.CachedBalancesController.cachedBalances) ||
    !hasProperty(state, 'AccountTracker') ||
    !isObject(state.AccountTracker)
  ) {
    return state;
  }

  if (!state.AccountTracker.accountsByChainId) {
    state.AccountTracker.accountsByChainId = {};
  }

  const accountTrackerControllerState =
    state.AccountTracker as unknown as AccountTrackerControllerState;

  const cachedBalances = state.CachedBalancesController
    .cachedBalances as Record<string, Record<string, string>>;

  Object.keys(cachedBalances).forEach((chainId) => {
    if (!accountTrackerControllerState.accountsByChainId[chainId]) {
      accountTrackerControllerState.accountsByChainId[chainId] = {};
    }

    Object.keys(cachedBalances[chainId]).forEach((accountAddress) => {
      // if the account is already in the accountsByChainId state, don't overwrite it
      if (
        accountTrackerControllerState.accountsByChainId[chainId][
          accountAddress
        ] === undefined
      ) {
        const balance = cachedBalances[chainId][accountAddress];
        accountTrackerControllerState.accountsByChainId[chainId][
          accountAddress
        ] = {
          address: accountAddress,
          balance,
        };
      }
    });
  });

  delete state.CachedBalancesController;

  state.AccountTracker = accountTrackerControllerState;

  return state;
}
