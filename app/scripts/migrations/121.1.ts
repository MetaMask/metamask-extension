import { AccountsControllerState } from '@metamask/accounts-controller';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 121.1;

/**
 * This migration removes depreciated `Txcontroller` key if it is present in state.
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
  const accountsControllerState = state?.AccountsController as
    | AccountsControllerState
    | undefined;

  if (
    accountsControllerState &&
    Object.values(accountsControllerState?.internalAccounts.accounts).length >
      0 &&
    !accountsControllerState?.internalAccounts.accounts[
      accountsControllerState?.internalAccounts.selectedAccount
    ]
  ) {
    accountsControllerState.internalAccounts.selectedAccount = Object.values(
      accountsControllerState?.internalAccounts.accounts,
    )[0].id;
  }
  return state;
}
