import { hasProperty } from '@metamask/utils';
import { cloneDeep, isObject } from 'lodash';
import log from 'loglevel';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 121.1;

/**
 * Fix AccountsController state corruption, where the `selectedAccount` state is set to an invalid
 * ID.
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

function transformState(state: Record<string, unknown>): void {
  if (!hasProperty(state, 'AccountsController')) {
    return;
  }

  const accountsControllerState = state.AccountsController;

  if (!isObject(accountsControllerState)) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid AccountsController state of type '${typeof accountsControllerState}'`,
      ),
    );
    return;
  } else if (!hasProperty(accountsControllerState, 'internalAccounts')) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid AccountsController state, missing internalAccounts`,
      ),
    );
    return;
  } else if (!isObject(accountsControllerState.internalAccounts)) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid AccountsController internalAccounts state of type '${typeof accountsControllerState.internalAccounts}'`,
      ),
    );
    return;
  } else if (
    !hasProperty(accountsControllerState.internalAccounts, 'selectedAccount')
  ) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid AccountsController internalAccounts state, missing selectedAccount`,
      ),
    );
    return;
  } else if (
    typeof accountsControllerState.internalAccounts.selectedAccount !== 'string'
  ) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid AccountsController internalAccounts.selectedAccount state of type '${typeof accountsControllerState
          .internalAccounts.selectedAccount}'`,
      ),
    );
    return;
  } else if (
    !hasProperty(accountsControllerState.internalAccounts, 'accounts')
  ) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid AccountsController internalAccounts state, missing accounts`,
      ),
    );
    return;
  } else if (!isObject(accountsControllerState.internalAccounts.accounts)) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid AccountsController internalAccounts.accounts state of type '${typeof accountsControllerState
          .internalAccounts.accounts}'`,
      ),
    );
    return;
  }

  if (
    Object.keys(accountsControllerState.internalAccounts.accounts).length === 0
  ) {
    log.warn(`Migration ${version}: Skipping, no accounts found`);
    return;
  } else if (accountsControllerState.internalAccounts.selectedAccount === '') {
    log.warn(`Migration ${version}: Skipping, no selected account set`);
    return;
  }

  const firstAccount = Object.values(
    accountsControllerState.internalAccounts.accounts,
  )[0];
  if (!isObject(firstAccount)) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid AccountsController internalAccounts.accounts state, entry found of type '${typeof firstAccount}'`,
      ),
    );
    return;
  } else if (!hasProperty(firstAccount, 'id')) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid AccountsController internalAccounts.accounts state, entry found that is missing an id`,
      ),
    );
    return;
  } else if (typeof firstAccount.id !== 'string') {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid AccountsController internalAccounts.accounts state, entry found with an id of type '${typeof firstAccount.id}'`,
      ),
    );
    return;
  }

  if (
    !hasProperty(
      accountsControllerState.internalAccounts.accounts,
      accountsControllerState.internalAccounts.selectedAccount,
    )
  ) {
    accountsControllerState.internalAccounts.selectedAccount = firstAccount.id;
  }
}
