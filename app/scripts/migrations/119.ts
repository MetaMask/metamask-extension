import { cloneDeep, isObject } from 'lodash';
import { hasProperty } from '@metamask/utils';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { InternalAccount } from '@metamask/keyring-api';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 119;

/**
 * Add a default value for importTime in the InternalAccount
 *
 * @param originalVersionedData
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformState(state: Record<string, any>) {
  const accountsController = state?.AccountsController || {};

  if (
    isObject(state.AccountsController) &&
    hasProperty(state.AccountsController, 'internalAccounts') &&
    hasProperty(
      state.AccountsController
        .internalAccounts as AccountsControllerState['internalAccounts'],
      'accounts',
    ) &&
    Array.isArray(
      Object.values(
        (state.AccountsController as AccountsControllerState).internalAccounts
          .accounts,
      ),
    ) &&
    Object.values(
      (state.AccountsController as AccountsControllerState).internalAccounts
        .accounts,
    ).length > 0
  ) {
    Object.values<InternalAccount>(
      accountsController.internalAccounts.accounts,
    ).forEach((internalAccount) => {
      if (!internalAccount.metadata?.importTime) {
        internalAccount.metadata.importTime = Date.now();
      }
    });
  }

  return {
    ...state,
    AccountsController: accountsController,
  };
}
