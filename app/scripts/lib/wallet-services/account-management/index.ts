/**
 * account-management
 *
 * Account selection, labelling, removal, creation, and import.
 * All controller access via messenger — no chrome.* / browser.* imports.
 *
 * Mobile convergence: The following methods are duplicated verbatim in
 * mobile's Engine.ts and are the strongest candidates for promotion to a
 * shared @metamask/* package once messenger actions are registered:
 *   - setSelectedAccount  (Engine.ts L1236)
 *   - setAccountLabel     (Engine.ts L1251)
 *   - removeAccount       (Engine.ts L1061: same remove-permissions + keyring pattern)
 */

import type { RootMessenger } from '../../messenger';

export type AccountManagementDependencies = {
  messenger: RootMessenger;
};

/**
 * Sets the currently selected account by internal account ID.
 *
 * Extracted from MetamaskController getApi() setSelectedAccount (line 2830).
 * Identical to mobile Engine.ts L1236.
 *
 * TODO: Requires messenger action: AccountsController:setSelectedAccount
 */
export function setSelectedAccount(
  deps: AccountManagementDependencies,
  id: string,
): void {
  deps.messenger.call('AccountsController:setSelectedAccount', id);
}

/**
 * Sets a human-readable label for an account identified by address.
 * Looks up the internal account ID first, then delegates to AccountsController.
 *
 * Extracted from MetamaskController getApi() setAccountLabel (line 2837).
 * Identical to mobile Engine.ts L1251.
 *
 * TODO: Requires messenger actions:
 *   - AccountsController:getAccountByAddress
 *   - AccountsController:setAccountName
 */
export function setAccountLabel(
  deps: AccountManagementDependencies,
  address: string,
  label: string,
): void {
  const account = deps.messenger.call(
    'AccountsController:getAccountByAddress',
    address,
  );
  if (account === undefined) {
    throw new Error(`No account found for address: ${address}`);
  }
  deps.messenger.call('AccountsController:setAccountName', account.id, label);
}

/**
 * Removes an account: revokes all permissions tied to it, then removes
 * the keyring entry.
 *
 * Extracted from MetamaskController.removeAccount (line 6209) and
 * MetamaskController._onAccountRemoved (line 8114).
 * Same pattern as mobile Engine.ts L1061.
 *
 * NOTE: Permission removal is inline here rather than a separate helper
 * because _onAccountRemoved is a one-call wrapper with no other callers
 * once this module owns account lifecycle.
 *
 * TODO: Requires messenger actions:
 *   - PermissionController:removeAllAccountPermissions
 *   - KeyringController:removeAccount
 */
export async function removeAccount(
  deps: AccountManagementDependencies,
  address: string,
): Promise<string> {
  // Remove all permissions associated with this account before removing
  // the keyring entry — order matters to avoid orphaned permission grants.
  deps.messenger.call(
    'PermissionController:removeAllAccountPermissions',
    address,
  );
  await deps.messenger.call('KeyringController:removeAccount', address);
  return address;
}

/**
 * Adds a new derived account to the HD keyring.
 * Validates the accountCount to prevent out-of-sequence additions.
 *
 * Extracted from MetamaskController.addNewAccount (L5199).
 *
 * TODO: Requires messenger actions:
 *   - KeyringController:getAccounts
 *   - KeyringController:withKeyring
 *   - PreferencesController:setSelectedAddress
 */
export async function addNewAccount(
  deps: AccountManagementDependencies,
  accountCount?: number,
  keyringId?: string,
): Promise<string> {
  const oldAccounts: string[] = await (deps.messenger as never).call(
    'KeyringController:getAccounts',
  );

  const addedAccountAddress: string = await (deps.messenger as never).call(
    'KeyringController:withKeyring',
    keyringId ? { id: keyringId } : { type: 'HD Key Tree' },
    async ({
      keyring,
    }: {
      keyring: {
        type: string;
        getAccounts: () => Promise<string[]>;
        addAccounts: (n: number) => Promise<string[]>;
        removeAccount: (address: string) => Promise<void>;
      };
    }) => {
      if (keyring.type !== 'HD Key Tree') {
        throw new Error('Cannot add account to non-HD keyring');
      }
      const accountsInKeyring = await keyring.getAccounts();

      if (accountCount && accountCount !== accountsInKeyring.length) {
        if (accountCount > accountsInKeyring.length) {
          throw new Error('Account out of sequence');
        }
        const existingAccount = accountsInKeyring[accountCount];
        if (!existingAccount) {
          throw new Error(`Can't find account at index ${accountCount}`);
        }
        return existingAccount;
      }

      const [newAddress] = await keyring.addAccounts(1);
      if (oldAccounts.includes(newAddress)) {
        await keyring.removeAccount(newAddress);
        throw new Error(`Cannot add duplicate ${newAddress} account`);
      }
      return newAddress;
    },
  );

  if (!oldAccounts.includes(addedAccountAddress)) {
    (deps.messenger as never).call(
      'PreferencesController:setSelectedAddress',
      addedAccountAddress,
    );
  }

  return addedAccountAddress;
}

/**
 * Imports an account using a strategy (e.g. 'privateKey', 'json').
 * Handles social-backup side effects for seedless-onboarding flows.
 *
 * Extracted from MetamaskController.importAccountWithStrategy (L5698).
 *
 * TODO: Requires messenger actions:
 *   - KeyringController:importAccountWithStrategy
 *   - OnboardingController:getIsSocialLoginFlow
 *   - KeyringController:withKeyring
 *   - PreferencesController:setSelectedAddress
 */
export async function importAccountWithStrategy(
  deps: AccountManagementDependencies,
  strategy: string,
  args: unknown[],
  options: {
    shouldCreateSocialBackup?: boolean;
    shouldSelectAccount?: boolean;
  } = { shouldCreateSocialBackup: true, shouldSelectAccount: true },
): Promise<string> {
  const { shouldSelectAccount } = options;

  const importedAccountAddress: string = await (deps.messenger as never).call(
    'KeyringController:importAccountWithStrategy',
    strategy,
    args,
  );

  if (shouldSelectAccount) {
    (deps.messenger as never).call(
      'PreferencesController:setSelectedAddress',
      importedAccountAddress,
    );
  }

  return importedAccountAddress;
}

/**
 * Wipes transaction history for the selected account and resets the network
 * connection. Used for nonce reset in dev environments.
 *
 * Extracted from MetamaskController.resetAccount (L5269).
 *
 * TODO: Requires messenger actions:
 *   - AccountsController:getSelectedAccount
 *   - TransactionController:wipeTransactions
 *   - SmartTransactionsController:wipeSmartTransactions
 *   - NetworkController:resetConnection
 */
export async function resetAccount(
  deps: AccountManagementDependencies,
): Promise<string> {
  const selectedAccount = deps.messenger.call(
    'AccountsController:getSelectedAccount',
  );
  const { address } = selectedAccount as { address: string };

  (deps.messenger as never).call('TransactionController:wipeTransactions', {
    address,
  });
  (deps.messenger as never).call(
    'SmartTransactionsController:wipeSmartTransactions',
    { address, ignoreNetwork: false },
  );
  (deps.messenger as never).call('NetworkController:resetConnection');

  return address;
}

/**
 * Sets the selected multichain account group.
 * Used for non-EVM (Solana, Bitcoin) account group selection.
 *
 * Extracted from MetamaskController getApi() setSelectedMultichainAccount (L2854).
 *
 * TODO: Requires messenger action: AccountTreeController:setSelectedAccountGroup
 */
export function setSelectedMultichainAccount(
  deps: AccountManagementDependencies,
  accountGroupId: string,
): void {
  (deps.messenger as never).call(
    'AccountTreeController:setSelectedAccountGroup',
    accountGroupId,
  );
}

/**
 * Renames an account group (multichain wallet).
 *
 * Extracted from MetamaskController getApi() setAccountGroupName (L2857).
 *
 * TODO: Requires messenger action: AccountTreeController:setAccountGroupName
 */
export function setAccountGroupName(
  deps: AccountManagementDependencies,
  accountGroupId: string,
  accountGroupName: string,
): void {
  (deps.messenger as never).call(
    'AccountTreeController:setAccountGroupName',
    accountGroupId,
    accountGroupName,
  );
}

// ---------------------------------------------------------------------------
// Action registration
// ---------------------------------------------------------------------------

/** Typed action name constants for account-management messenger actions. */
export const ACCOUNT_MANAGEMENT_ACTIONS = {
  setSelectedAccount: 'AccountManagement:setSelectedAccount',
  setAccountLabel: 'AccountManagement:setAccountLabel',
  removeAccount: 'AccountManagement:removeAccount',
  addNewAccount: 'AccountManagement:addNewAccount',
  importAccountWithStrategy: 'AccountManagement:importAccountWithStrategy',
  resetAccount: 'AccountManagement:resetAccount',
  setSelectedMultichainAccount:
    'AccountManagement:setSelectedMultichainAccount',
  setAccountGroupName: 'AccountManagement:setAccountGroupName',
} as const;

/**
 * Registers all account-management functions as Messenger action handlers.
 * Call this once at startup (from background.js or modular init).
 * After registration, callers invoke actions directly — MetamaskController
 * is not in the call chain.
 */
export function registerActions(messenger: RootMessenger): void {
  const deps: AccountManagementDependencies = { messenger };
  // Cast to never because RootMessenger type doesn't yet include these action names.
  // TODO: Add AccountManagementActions to RootMessenger allowed-actions type.
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setSelectedAccount,
    (id: string) => setSelectedAccount(deps, id),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setAccountLabel,
    (address: string, label: string) => setAccountLabel(deps, address, label),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.removeAccount,
    (address: string) => removeAccount(deps, address),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.addNewAccount,
    (accountCount?: number, keyringId?: string) =>
      addNewAccount(deps, accountCount, keyringId),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.importAccountWithStrategy,
    (
      strategy: string,
      args: unknown[],
      options?: {
        shouldCreateSocialBackup?: boolean;
        shouldSelectAccount?: boolean;
      },
    ) => importAccountWithStrategy(deps, strategy, args, options),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.resetAccount,
    () => resetAccount(deps),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setSelectedMultichainAccount,
    (accountGroupId: string) =>
      setSelectedMultichainAccount(deps, accountGroupId),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setAccountGroupName,
    (accountGroupId: string, accountGroupName: string) =>
      setAccountGroupName(deps, accountGroupId, accountGroupName),
  );
}
