/**
 * vault-management
 *
 * Vault creation, keyring unlock, password verification, and seed phrase
 * management. All controller access goes through the messenger — no direct
 * controller references, no chrome.* / browser.* imports.
 *
 * Mobile convergence: Engine.ts contains equivalent vault/keyring methods.
 * Once messenger actions are registered on both clients, this module can
 * be promoted to a shared @metamask/* package.
 *
 * Remaining methods not yet extracted (31 total in MC, 4 shown here):
 *   addNewAccount, addNewAccountForKeyring, addExistingHDAccount,
 *   createNewVaultAndKeychain (wallet reset variant), importAccountWithStrategy,
 *   addNewKeyring, removeEmptyKeyrings, persistAllKeyrings,
 *   setLocked, forgetDevice, checkHardwareStatus, unlockHardwareWalletAccount,
 *   addNewHDKeyring, addNewAccountFromSeed, exportAccount, exportSeedPhrase,
 *   clearAccountDetails, getAccounts, getSeedPhrase, getPrimaryKeyringMnemonic,
 *   checkAndUpdateAccountsPresence, syncQRKeyring, cancelQRHardwareSignRequest,
 *   cancelQRHardwareCryptoCurrencyUnitSigning, cancelQRHardwareInput,
 *   submitQRHardwareCryptoHDKey, submitQRHardwarePublicKey,
 *   resetQRKeyringState, generateMnemonic, addNewPrivateKeyBackup,
 *   createSocialBackup, getEntropySources
 */

import type { RootMessenger } from '../../messenger';

export type VaultDependencies = {
  messenger: RootMessenger;
};

/**
 * Creates a new HD wallet vault and keychain from scratch.
 *
 * Clears permission, snap, and account-tree state first if a wallet reset
 * is in progress, then delegates to MultichainAccountService.
 *
 * Extracted from MetamaskController.createNewVaultAndKeychain (line 4507).
 *
 * TODO: Requires messenger actions:
 *   - AppStateController:getIsWalletResetInProgress
 *   - PermissionController:clearState
 *   - SnapController:clearState
 *   - AccountTreeController:clearState + reinit
 *   - MultichainAccountService:createWallet
 *   - AccountsController:updateAccounts
 */
export async function createNewVaultAndKeychain(
  deps: VaultDependencies,
  password: string,
): Promise<void> {
  const isWalletResetInProgress = deps.messenger.call(
    'AppStateController:getIsWalletResetInProgress',
  );

  if (isWalletResetInProgress) {
    deps.messenger.call('PermissionController:clearState');
    await deps.messenger.call('SnapController:clearState');
    deps.messenger.call('AccountTreeController:clearState');
    deps.messenger.call('AccountOrderController:updateHiddenAccountsList', []);
    deps.messenger.call('TransactionController:clearUnapprovedTransactions');
  }

  await deps.messenger.call('MultichainAccountService:createWallet', {
    type: 'create',
    password,
  });

  deps.messenger.call('AppStateController:setIsWalletResetInProgress', false);
  await deps.messenger.call('AccountsController:updateAccounts');
  deps.messenger.call('AccountTreeController:reinit');
}

/**
 * Restores a vault from a seed phrase, resetting all account + permission state.
 *
 * Extracted from MetamaskController.createNewVaultAndRestore (line 4876).
 *
 * TODO: Requires messenger actions (same as createNewVaultAndKeychain, plus):
 *   - OnboardingController:getState (for completedOnboarding)
 *   - TokenDetectionController:enable
 *   - MultichainAccountService:init
 */
export async function createNewVaultAndRestore(
  deps: VaultDependencies,
  password: string,
  encodedSeedPhrase: Uint8Array,
): Promise<void> {
  const { completedOnboarding } = deps.messenger.call(
    'OnboardingController:getState',
  );

  deps.messenger.call('PermissionController:clearState');
  await deps.messenger.call('SnapController:clearState');
  deps.messenger.call('AccountTreeController:clearState');
  deps.messenger.call('AccountOrderController:updateHiddenAccountsList', []);
  deps.messenger.call('TransactionController:clearUnapprovedTransactions');

  if (completedOnboarding) {
    deps.messenger.call('TokenDetectionController:enable');
  }

  await deps.messenger.call('MultichainAccountService:createWallet', {
    type: 'restore',
    password,
    mnemonic: encodedSeedPhrase,
  });

  deps.messenger.call('AppStateController:setIsWalletResetInProgress', false);
  await deps.messenger.call('AccountsController:updateAccounts');
  await deps.messenger.call('MultichainAccountService:init');
  deps.messenger.call('AccountTreeController:reinit');
}

/**
 * Submits the user's password to unlock the vault.
 *
 * Extracted from MetamaskController.submitPassword (line 5292).
 *
 * TODO: Requires messenger actions:
 *   - KeyringController:submitPassword
 *   - SeedlessOnboardingController:submitPassword (social login flow)
 *   - AccountsController:updateAccounts
 *   - MultichainAccountService:init
 *   - AccountTreeController:init
 */
export async function submitPassword(
  deps: VaultDependencies,
  password: string,
): Promise<void> {
  const isSocialLoginFlow = deps.messenger.call(
    'OnboardingController:getIsSocialLoginFlow',
  );

  await deps.messenger.call('KeyringController:submitPassword', password);

  if (isSocialLoginFlow) {
    await deps.messenger.call(
      'SeedlessOnboardingController:submitPassword',
      password,
    );
  }

  await deps.messenger.call('AccountsController:updateAccounts');
  await deps.messenger.call('MultichainAccountService:init');
  deps.messenger.call('AccountTreeController:init');
}

/**
 * Verifies a password against the encrypted vault without unlocking.
 *
 * Extracted from MetamaskController.verifyPassword (line 5434).
 * Delegates to KeyringController:verifyPassword — no side effects.
 */
export async function verifyPassword(
  deps: VaultDependencies,
  password: string,
): Promise<void> {
  await deps.messenger.call('KeyringController:verifyPassword', password);
}
