import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 182;

type OldAccountBalance = {
  address: string;
  balance: string;
};

type OldAccountTrackerControllerState = {
  accountsByChainId: Record<string, Record<string, OldAccountBalance>>;
  accounts: Record<string, OldAccountBalance>;
  currentBlockGasLimit: string;
  currentBlockGasLimitByChainId: Record<string, string>;
};

type AccountInformation = {
  balance: string;
};

type NewAccountTrackerControllerState = {
  accountsByChainId: Record<string, Record<string, AccountInformation>>;
};

/**
 * This migration removes the unused `showIncomingTransactions` property from
 * PreferencesController state.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  const accountTrackerControllerState = state?.AccountTracker as
    | OldAccountTrackerControllerState
    | undefined;

  if (!accountTrackerControllerState) {
    return state;
  }

  // Recreate accountsByChainId with checksummed addresses as keys
  const newAccountsByChainId: NewAccountTrackerControllerState['accountsByChainId'] =
    {};
  if (
    accountTrackerControllerState.accountsByChainId &&
    isObject(accountTrackerControllerState.accountsByChainId)
  ) {
    Object.entries(accountTrackerControllerState.accountsByChainId).forEach(
      ([chainId, accounts]) => {
        if (!isObject(accounts)) {
          return;
        }

        const newAccounts: NewAccountTrackerControllerState['accountsByChainId'][string] =
          {};

        Object.entries(accounts).forEach(([address, oldBalance]) => {
          const checksummedAddress = toChecksumHexAddress(address);
          newAccounts[checksummedAddress] = {
            balance: oldBalance.balance,
          };
        });

        newAccountsByChainId[chainId] = newAccounts;
      },
    );
  }

  state.AccountTracker = {
    accountsByChainId: newAccountsByChainId,
  };

  return state;
}
