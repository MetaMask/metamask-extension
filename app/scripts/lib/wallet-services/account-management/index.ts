/**
 * account-management
 *
 * Account selection, labelling, and removal. All controller access via
 * messenger — no chrome.* / browser.* imports.
 *
 * Mobile convergence: The following methods are duplicated verbatim in
 * mobile's Engine.ts and are the strongest candidates for promotion to a
 * shared @metamask/* package once messenger actions are registered:
 *   - setSelectedAccount  (Engine.ts L1236)
 *   - setAccountLabel     (Engine.ts L1251)
 *   - removeAccount       (Engine.ts L1061: same remove-permissions + keyring pattern)
 *
 * Remaining methods not yet extracted (11 of 14):
 *   addNewAccount, addNewAccountForKeyring, addExistingHDAccount,
 *   importAccountWithStrategy, getAccounts, checkAndUpdateAccountsPresence,
 *   setAccountDetails, clearAccountDetails, setSelectedMultichainAccount,
 *   setAccountGroupName, forwardSelectedAccountGroupToSnapKeyring
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
