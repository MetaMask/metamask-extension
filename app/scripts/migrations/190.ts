import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import type { InternalAccount } from '@metamask/keyring-internal-api';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 190;

/**
 * This migration fixes accounts in the AccountsController that have undefined
 * `scopes` properties by initializing them as empty arrays.
 *
 * This issue occurs when accounts were created before the `scopes` field was
 * added to the InternalAccount type, or when accounts were migrated from older
 * versions without properly initializing the scopes field.
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state with fixed account scopes.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  versionedData.data = transformState(versionedData.data);

  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  // Check if AccountsController exists
  if (!hasProperty(state, 'AccountsController')) {
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: AccountsController not found.`),
    );
    return state;
  }

  const accountsControllerState = state.AccountsController;

  if (!isObject(accountsControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: AccountsController is type '${typeof accountsControllerState}', expected object.`,
      ),
    );
    return state;
  }

  // Check if internalAccounts exists
  if (!hasProperty(accountsControllerState, 'internalAccounts')) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: AccountsController.internalAccounts not found.`,
      ),
    );
    return state;
  }

  const internalAccountsState = accountsControllerState.internalAccounts;

  if (!isObject(internalAccountsState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: AccountsController.internalAccounts is type '${typeof internalAccountsState}', expected object.`,
      ),
    );
    return state;
  }

  // Check if accounts exists
  if (!hasProperty(internalAccountsState, 'accounts')) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: AccountsController.internalAccounts.accounts not found.`,
      ),
    );
    return state;
  }

  const { accounts } = internalAccountsState;

  if (!isObject(accounts)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: AccountsController.internalAccounts.accounts is type '${typeof accounts}', expected object.`,
      ),
    );
    return state;
  }

  // Fix accounts with undefined scopes
  let fixedCount = 0;
  for (const accountId of Object.keys(accounts)) {
    const account = accounts[accountId];

    if (!isObject(account)) {
      continue;
    }

    // If scopes is undefined or not an array, initialize it as an empty array
    if (!hasProperty(account, 'scopes') || !Array.isArray(account.scopes)) {
      (account as InternalAccount).scopes = [];
      fixedCount += 1;
    }
  }

  if (fixedCount > 0) {
    console.log(
      `Migration ${version}: Fixed ${fixedCount} account(s) with undefined scopes.`,
    );
  }

  return state;
}
