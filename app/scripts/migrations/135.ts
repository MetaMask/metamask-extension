import { AccountsControllerState } from '@metamask/accounts-controller';
import {
  BtcAccountType,
  EthAccountType,
  EthScopes,
} from '@metamask/keyring-api';
import { hasProperty } from '@metamask/utils';
import { cloneDeep, isObject, isString, isArray } from 'lodash';

export const version = 135;

type VersionedData = Record<string, unknown>;

/**
 * Explain the purpose of the migration here.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: VersionedData;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(
    originalVersionedData.data,
    versionedData.data,
  );
  return versionedData;
}

function transformState(
  originalVersionedData: VersionedData,
  versionedData: VersionedData,
): VersionedData {
  // Skip this migration if there's no `AccountsController` state.
  if (!hasProperty(versionedData, 'AccountsController')) {
    return originalVersionedData;
  }

  // Will return the original error and capture the error on sentry. Basically discarding the migration if
  // any error happens.
  const error = (message: string) => {
    const migrationError = new Error(`Migration ${version}: ${message}`);

    global.sentry?.captureException(migrationError);
    return originalVersionedData;
  };

  const state = versionedData.AccountsController;
  if (!isObject(state)) {
    return error(
      `Invalid AccountsController state of type '${typeof versionedData.AccountsController}'`,
    );
  } else if (!hasProperty(state, 'internalAccounts')) {
    return error('Invalid AccountsController state, missing internalAccounts');
  } else if (!isObject(state.internalAccounts)) {
    return error(
      `Invalid AccountsController internalAccounts state of type '${typeof state.internalAccounts}'`,
    );
  } else if (!hasProperty(state.internalAccounts, 'accounts')) {
    return error(
      `Invalid AccountsController internalAccounts state, missing accounts`,
    );
  } else if (!isObject(state.internalAccounts.accounts)) {
    return error(
      `Invalid AccountsController internalAccounts.accounts state of type '${typeof state
        .internalAccounts.accounts}'`,
    );
  }

  for (const account of Object.values(state.internalAccounts.accounts)) {
    // NOTE: We use continue instead of returning (and stopping) the execution here, to iterate over all accounts.
    if (!isObject(account)) {
      error(
        `Invalid AccountsController's account (object) type, is '${typeof account}'`,
      );
      continue;
    }
    if (!hasProperty(account, 'type')) {
      error(`Invalid AccountsController's account missing 'type' property`);
      continue;
    }
    if (!isString(account.type)) {
      error(
        `Invalid AccountsController's account.type type, is '${typeof account.type}'`,
      );
      continue;
    }

    // By default, we consider that the account is not valid
    let hasValidScopes = true;
    if (hasProperty(account, 'scopes')) {
      // This should not really happen, but just in case, we check it (if accounts have not been created correctly).
      if (!isArray(account.scopes)) {
        // We log the error here.
        error(
          `Invalid AccountsController's account.scopes type, is '${typeof account.scopes}'`,
        );
        // But we still continue to "fix" the scopes field (this should never really happen though...).
        hasValidScopes = false;
      }
      // TODO: Should we check of array's content here too?
    } else {
      hasValidScopes = false;
    }

    // Now we fix the scopes if they are not valid or missing:
    if (!hasValidScopes) {
      const badAccount = account as unknown as { scopes: string[] };
      if (account.type === EthAccountType.Eoa) {
        // EVM EOA account
        badAccount.scopes = [EthScopes.Namespace];
      } else if (account.type === EthAccountType.Erc4337) {
        // EVM Erc4337 account
        // NOTE: A Smart Contract account might not be compatible with every chain, but we still use
        // "generic" scope for now. Also, there's no official Snap as of today that uses this account type. So
        // this case should never happen.
        badAccount.scopes = [EthScopes.Namespace];
        // Logging in case this happen
        global.sentry?.captureException(
          new Error(
            'Injecting EVM scope for ERC4337 account (should never happen for now)',
          ),
        );
      }
    }
    // We are not migrating Bitcoin/Solana accounts for now.
  }

  return versionedData;
}
