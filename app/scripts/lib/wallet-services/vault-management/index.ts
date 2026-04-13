/**
 * vault-management
 *
 * Vault creation, keyring unlock/lock, password verification, seed phrase
 * management, and account export.
 * All controller access via messenger — no chrome.* / browser.* imports.
 *
 * Mobile convergence: Engine.ts contains equivalent vault/keyring methods.
 * Once messenger actions are registered on both clients, this module can
 * be promoted to a shared @metamask/* package.
 *
 * Remaining methods not yet extracted (27 total in MC):
 *   addNewKeyring, removeEmptyKeyrings, persistAllKeyrings,
 *   forgetDevice, checkHardwareStatus, unlockHardwareWalletAccount,
 *   addNewHDKeyring, addNewAccountFromSeed,
 *   clearAccountDetails, getAccounts, getPrimaryKeyringMnemonic,
 *   checkAndUpdateAccountsPresence, syncQRKeyring,
 *   cancelQRHardwareSignRequest, cancelQRHardwareCryptoCurrencyUnitSigning,
 *   cancelQRHardwareInput, submitQRHardwareCryptoHDKey,
 *   submitQRHardwarePublicKey, resetQRKeyringState, generateMnemonic,
 *   addNewPrivateKeyBackup, createSocialBackup, getEntropySources,
 *   createSeedPhraseBackup, fetchAllSecretData, syncPasswordAndUnlockWallet,
 *   syncKeyringEncryptionKey
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

/**
 * Locks the wallet, clears session state, and optionally signs out from
 * the authentication service.
 *
 * Extracted from MetamaskController.setLocked (L8018).
 *
 * NOTE: The seedlessOperationMutex is intentionally omitted here — it is
 * an MC-level coordination primitive. The messenger-based version relies on
 * SeedlessOnboardingController:setLocked to manage its own concurrency.
 *
 * TODO: Requires messenger actions:
 *   - OnboardingController:getIsSocialLoginFlow
 *   - SeedlessOnboardingController:setLocked
 *   - KeyringController:setLocked
 *   - AuthenticationController:performSignOut
 */
export async function setLocked(
  deps: VaultDependencies,
  options: { skipSeedlessOperationLock?: boolean } = {},
): Promise<void> {
  const isSocialLoginFlow = (deps.messenger as never).call(
    'OnboardingController:getIsSocialLoginFlow',
  );

  if (isSocialLoginFlow && !options.skipSeedlessOperationLock) {
    await (deps.messenger as never).call(
      'SeedlessOnboardingController:setLocked',
    );
  }

  await (deps.messenger as never).call('KeyringController:setLocked');

  const { isSignedIn } = (deps.messenger as never).call(
    'AuthenticationController:getState',
  );
  if (isSignedIn) {
    (deps.messenger as never).call('AuthenticationController:performSignOut');
  }
}

/**
 * Exports an account's private key after verifying the password.
 *
 * Extracted from MetamaskController.exportAccount (L3807).
 *
 * TODO: Requires messenger actions:
 *   - KeyringController:verifyPassword
 *   - KeyringController:exportAccount
 */
export async function exportAccount(
  deps: VaultDependencies,
  address: string,
  password: string,
): Promise<string> {
  await (deps.messenger as never).call(
    'KeyringController:verifyPassword',
    password,
  );
  return (deps.messenger as never).call(
    'KeyringController:exportAccount',
    password,
    address,
  );
}

/**
 * Returns the seed phrase for a keyring, encoded as UTF-8 codepoints.
 * Verifies password against the vault before exposing the mnemonic.
 *
 * Extracted from MetamaskController.getSeedPhrase (L5256).
 *
 * TODO: Requires messenger action: KeyringController:exportSeedPhrase
 */
export async function getSeedPhrase(
  deps: VaultDependencies,
  password: string,
  keyringId?: string,
): Promise<number[]> {
  const mnemonic: Uint8Array = await (deps.messenger as never).call(
    'KeyringController:exportSeedPhrase',
    password,
    keyringId,
  );
  // Convert mnemonic wordlist indices to Unicode codepoints for display.
  return Array.from(mnemonic);
}

// ---------------------------------------------------------------------------
// Action registration
// ---------------------------------------------------------------------------

/** Typed action name constants for vault-management messenger actions. */
export const VAULT_MANAGEMENT_ACTIONS = {
  createNewVaultAndKeychain: 'VaultManagement:createNewVaultAndKeychain',
  createNewVaultAndRestore: 'VaultManagement:createNewVaultAndRestore',
  submitPassword: 'VaultManagement:submitPassword',
  verifyPassword: 'VaultManagement:verifyPassword',
  setLocked: 'VaultManagement:setLocked',
  exportAccount: 'VaultManagement:exportAccount',
  getSeedPhrase: 'VaultManagement:getSeedPhrase',
} as const;

/**
 * Registers all vault-management functions as Messenger action handlers.
 * Call this once at startup (from background.js or modular init).
 * After registration, callers invoke actions directly — MetamaskController
 * is not in the call chain.
 */
export function registerActions(messenger: RootMessenger): void {
  const deps: VaultDependencies = { messenger };
  // Cast to never because RootMessenger type doesn't yet include these action names.
  // TODO: Add VaultManagementActions to RootMessenger allowed-actions type.
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.createNewVaultAndKeychain,
    (password: string) => createNewVaultAndKeychain(deps, password),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.createNewVaultAndRestore,
    (password: string, encodedSeedPhrase: Uint8Array) =>
      createNewVaultAndRestore(deps, password, encodedSeedPhrase),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.submitPassword,
    (password: string) => submitPassword(deps, password),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.verifyPassword,
    (password: string) => verifyPassword(deps, password),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.setLocked,
    (options?: { skipSeedlessOperationLock?: boolean }) =>
      setLocked(deps, options),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.exportAccount,
    (address: string, password: string) =>
      exportAccount(deps, address, password),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.getSeedPhrase,
    (password: string, keyringId?: string) =>
      getSeedPhrase(deps, password, keyringId),
  );
}
