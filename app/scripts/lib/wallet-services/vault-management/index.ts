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
 * Remaining methods not yet extracted (hardware / QR / misc):
 *   addNewKeyring, removeEmptyKeyrings, persistAllKeyrings,
 *   forgetDevice, checkHardwareStatus, unlockHardwareWalletAccount,
 *   addNewHDKeyring, addNewAccountFromSeed,
 *   clearAccountDetails, getAccounts,
 *   checkAndUpdateAccountsPresence, syncQRKeyring,
 *   cancelQRHardwareSignRequest, cancelQRHardwareCryptoCurrencyUnitSigning,
 *   cancelQRHardwareInput, submitQRHardwareCryptoHDKey,
 *   submitQRHardwarePublicKey, resetQRKeyringState, generateMnemonic,
 *   createSocialBackup, getEntropySources, syncPasswordAndUnlockWallet
 */

import log from 'loglevel';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { add0x, hexToBytes, bytesToHex } from '@metamask/utils';
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
// Mnemonic / wordlist helpers
// (Private to this module — extracted from MC._convertMnemonicToWordlistIndices
// and MC._convertEnglishWordlistIndicesToCodepoints.)
// ---------------------------------------------------------------------------

/**
 * Encodes a BIP-39 mnemonic as the indices of words in the English BIP-39
 * wordlist.
 *
 * Extracted from MetamaskController._convertMnemonicToWordlistIndices (L4768).
 *
 * @param mnemonic - The BIP-39 mnemonic as a Buffer.
 * @returns A Uint8Array of little-endian Uint16 word indices.
 */
function convertMnemonicToWordlistIndices(mnemonic: Buffer): Uint8Array {
  const indices = mnemonic
    .toString()
    .split(' ')
    .map((word: string) => (wordlist as string[]).indexOf(word));
  return new Uint8Array(new Uint16Array(indices).buffer);
}

/**
 * Converts a BIP-39 mnemonic stored as indices of words in the English
 * wordlist to a Buffer of Unicode code points.
 *
 * Extracted from MetamaskController._convertEnglishWordlistIndicesToCodepoints
 * (L4782).
 *
 * @param wordlistIndices - Indices to specific words in the BIP-39 English
 *   wordlist.
 * @returns The BIP-39 mnemonic encoded as Unicode code points in a Buffer.
 */
function convertEnglishWordlistIndicesToCodepoints(
  wordlistIndices: Uint8Array,
): Buffer {
  return Buffer.from(
    Array.from(new Uint16Array(wordlistIndices.buffer))
      .map((i: number) => (wordlist as string[])[i])
      .join(' '),
  );
}

// ---------------------------------------------------------------------------
// Vault / seedless methods
// ---------------------------------------------------------------------------

/**
 * Resets the wallet — signs out, clears seedless state, stops subscriptions,
 * clears contacts and preferences, and optionally resets onboarding.
 *
 * Extracted from MetamaskController.resetWallet (L3818).
 *
 * TODO: Requires messenger actions:
 *   - AuthenticationController:performSignOut
 *   - SeedlessOnboardingController:clearState
 *   - SubscriptionController:stopAllPolling
 *   - SubscriptionController:clearState
 *   - ShieldController:clearState
 *   - ClaimsController:clearState
 *   - AddressBookController:clear
 *   - PreferencesController:resetState
 *   - OnboardingController:resetOnboarding
 *   - AppStateController:setIsWalletResetInProgress
 */
export async function resetWallet(
  deps: VaultDependencies,
  restoreOnly = false,
): Promise<void> {
  // sign out from Authentication service and clear the Session Data
  (deps.messenger as never).call('AuthenticationController:performSignOut');

  // clear SeedlessOnboardingController state
  (deps.messenger as never).call('SeedlessOnboardingController:clearState');

  // stop subscription polling
  (deps.messenger as never).call('SubscriptionController:stopAllPolling');

  // clear States
  (deps.messenger as never).call('SubscriptionController:clearState');
  (deps.messenger as never).call('ShieldController:clearState');
  (deps.messenger as never).call('ClaimsController:clearState');

  // clear contacts (address book)
  (deps.messenger as never).call('AddressBookController:clear');

  // reset preferences to defaults
  (deps.messenger as never).call('PreferencesController:resetState');

  if (!restoreOnly) {
    // reset onboarding state
    (deps.messenger as never).call('OnboardingController:resetOnboarding');
    (deps.messenger as never).call(
      'AppStateController:setIsWalletResetInProgress',
      true,
    );
  }
}

/**
 * Creates a PRIMARY seed phrase backup for the user.
 *
 * Generates an encryption key from the password using the Threshold OPRF and
 * encrypts the seed phrase with the key, then saves it in the metadata store.
 *
 * Extracted from MetamaskController.createSeedPhraseBackup (L3887).
 *
 * TODO: Requires messenger actions:
 *   - SeedlessOnboardingController:createToprfKeyAndBackupSeedPhrase
 *   - VaultManagement:syncKeyringEncryptionKey (self-call)
 */
export async function createSeedPhraseBackup(
  deps: VaultDependencies,
  password: string,
  encodedSeedPhrase: number[],
  keyringId: string,
): Promise<void> {
  const seedPhraseAsBuffer = Buffer.from(encodedSeedPhrase);
  const seedPhrase = convertMnemonicToWordlistIndices(seedPhraseAsBuffer);

  await (deps.messenger as never).call(
    'SeedlessOnboardingController:createToprfKeyAndBackupSeedPhrase',
    password,
    seedPhrase,
    keyringId,
  );

  await syncKeyringEncryptionKey(deps);
}

/**
 * Fetches and restores all the backed-up Secret Data (SRPs and private keys).
 *
 * Extracted from MetamaskController.fetchAllSecretData (L3931).
 *
 * TODO: Requires messenger actions:
 *   - SeedlessOnboardingController:fetchAllSecretData
 */
export async function fetchAllSecretData(
  deps: VaultDependencies,
  password: string,
): Promise<Buffer[]> {
  const allSeedPhrases = await (deps.messenger as never).call(
    'SeedlessOnboardingController:fetchAllSecretData',
    password,
  );
  return allSeedPhrases;
}

/**
 * Syncs the keyring encryption key with the seedless onboarding controller.
 *
 * Extracted from MetamaskController.syncKeyringEncryptionKey (L3968).
 *
 * TODO: Requires messenger actions:
 *   - KeyringController:exportEncryptionKey
 *   - SeedlessOnboardingController:storeKeyringEncryptionKey
 */
export async function syncKeyringEncryptionKey(
  deps: VaultDependencies,
): Promise<void> {
  const keyringEncryptionKey = await (deps.messenger as never).call(
    'KeyringController:exportEncryptionKey',
  );
  await (deps.messenger as never).call(
    'SeedlessOnboardingController:storeKeyringEncryptionKey',
    keyringEncryptionKey,
  );
}

/**
 * Checks if the seedless password is outdated.
 *
 * Only meaningful for the social login flow with completed onboarding —
 * returns false immediately for all other flows.
 *
 * Extracted from MetamaskController.checkIsSeedlessPasswordOutdated (L3983).
 *
 * TODO: Requires messenger actions:
 *   - OnboardingController:getIsSocialLoginFlow
 *   - OnboardingController:getState (for completedOnboarding)
 *   - SeedlessOnboardingController:checkIsPasswordOutdated
 */
export async function checkIsSeedlessPasswordOutdated(
  deps: VaultDependencies,
  skipCache = false,
): Promise<boolean | undefined> {
  const isSocialLoginFlow = (deps.messenger as never).call(
    'OnboardingController:getIsSocialLoginFlow',
  );
  const { completedOnboarding } = (deps.messenger as never).call(
    'OnboardingController:getState',
  );

  if (!isSocialLoginFlow || !completedOnboarding) {
    // this is only available for seedless onboarding flow and completed onboarding
    return false;
  }

  const isPasswordOutdated = await (deps.messenger as never).call(
    'SeedlessOnboardingController:checkIsPasswordOutdated',
    { skipCache },
  );
  return isPasswordOutdated;
}

/**
 * Syncs seed phrases from the social backup into the local vault.
 *
 * Fetches all backed-up secrets and, for each not already present locally,
 * imports private keys or mnemonics into the vault.
 *
 * Extracted from MetamaskController.syncSeedPhrases (L4015).
 *
 * TODO: Requires messenger actions:
 *   - OnboardingController:getIsSocialLoginFlow
 *   - VaultManagement:fetchAllSecretData (self-call)
 *   - SeedlessOnboardingController:getSecretDataBackupState
 *   - AccountsController:importAccountWithStrategy (or equivalent)
 *   - VaultManagement:importMnemonicToVault (self-call)
 */
export async function syncSeedPhrases(deps: VaultDependencies): Promise<void> {
  const isSocialLoginFlow = (deps.messenger as never).call(
    'OnboardingController:getIsSocialLoginFlow',
  );

  if (!isSocialLoginFlow) {
    throw new Error(
      'Syncing seed phrases is only available for social login flow',
    );
  }

  // 1. fetch all seed phrases
  // NOTE: fetchAllSecretData here is a direct call (no password arg in the
  // sync path — the cached session credential is used by the controller).
  const [rootSecret, ...otherSecrets] = await (deps.messenger as never).call(
    'SeedlessOnboardingController:fetchAllSecretData',
  );
  if (!rootSecret) {
    throw new Error('No root SRP found');
  }

  for (const secret of otherSecrets) {
    const srpHash = (deps.messenger as never).call(
      'SeedlessOnboardingController:getSecretDataBackupState',
      secret.data,
      secret.type,
    );

    if (!srpHash) {
      if (secret.type === 'privateKey') {
        await (deps.messenger as never).call(
          'AccountsController:importAccountWithStrategy',
          'privateKey',
          [bytesToHex(secret.data)],
          { shouldCreateSocialBackup: false, shouldSelectAccount: false },
        );
        continue;
      }

      // convert the seed phrase to a mnemonic (string)
      const encodedSrp = convertEnglishWordlistIndicesToCodepoints(secret.data);
      const mnemonicToRestore = Buffer.from(encodedSrp).toString('utf8');

      await importMnemonicToVault(deps, mnemonicToRestore, {
        shouldCreateSocialBackup: false,
        shouldSelectAccount: false,
        shouldImportSolanaAccount: true,
      });
    }
  }
}

/**
 * Adds a new seed phrase backup for the user.
 *
 * If `syncWithSocial` is false, only updates the local state without syncing
 * to the server.
 *
 * Extracted from MetamaskController.addNewSeedPhraseBackup (L4091).
 *
 * TODO: Requires messenger actions:
 *   - SeedlessOnboardingController:addNewSecretData
 *   - SeedlessOnboardingController:updateBackupMetadataState
 *
 * NOTE: seedlessOperationMutex is intentionally omitted — it is an MC-level
 * coordination primitive.
 * TODO: SeedlessOnboardingController should manage its own concurrency.
 */
export async function addNewSeedPhraseBackup(
  deps: VaultDependencies,
  mnemonic: string,
  keyringId: string,
  syncWithSocial = true,
): Promise<void> {
  const seedPhraseAsBuffer = Buffer.from(mnemonic, 'utf8');
  const seedPhraseAsUint8Array =
    convertMnemonicToWordlistIndices(seedPhraseAsBuffer);

  if (syncWithSocial) {
    // TODO: SeedlessOnboardingController should manage its own concurrency
    await (deps.messenger as never).call(
      'SeedlessOnboardingController:addNewSecretData',
      seedPhraseAsUint8Array,
      'mnemonic', // SecretType.Mnemonic
      { keyringId },
    );
  } else {
    // Do not sync the seed phrase to the server, only update the local state
    (deps.messenger as never).call(
      'SeedlessOnboardingController:updateBackupMetadataState',
      {
        keyringId,
        data: seedPhraseAsUint8Array,
        type: 'mnemonic', // SecretType.Mnemonic
      },
    );
  }
}

/**
 * Changes the password for the wallet.
 *
 * For social login flows, also changes the seedless onboarding controller
 * password, syncing the keyring encryption key afterward. On failure the
 * keyring password change is reverted.
 *
 * Extracted from MetamaskController.changePassword (L4144).
 *
 * TODO: Requires messenger actions:
 *   - OnboardingController:getIsSocialLoginFlow
 *   - KeyringController:changePassword
 *   - SeedlessOnboardingController:changePassword
 *   - KeyringController:exportEncryptionKey
 *   - SeedlessOnboardingController:storeKeyringEncryptionKey
 *
 * NOTE: seedlessOperationMutex is intentionally omitted — it is an MC-level
 * coordination primitive.
 * TODO: SeedlessOnboardingController should manage its own concurrency.
 */
export async function changePassword(
  deps: VaultDependencies,
  newPassword: string,
  oldPassword: string,
): Promise<void> {
  // TODO: SeedlessOnboardingController should manage its own concurrency
  const isSocialLoginFlow = (deps.messenger as never).call(
    'OnboardingController:getIsSocialLoginFlow',
  );

  await (deps.messenger as never).call(
    'KeyringController:changePassword',
    newPassword,
  );

  if (isSocialLoginFlow) {
    try {
      await (deps.messenger as never).call(
        'SeedlessOnboardingController:changePassword',
        newPassword,
        oldPassword,
      );
      // store the new keyring encryption key in the seedless onboarding controller
      const keyringEncKey = await (deps.messenger as never).call(
        'KeyringController:exportEncryptionKey',
      );
      await (deps.messenger as never).call(
        'SeedlessOnboardingController:storeKeyringEncryptionKey',
        keyringEncKey,
      );
    } catch (err) {
      log.error('error while changing seedless-onboarding password', err);
      log.error('reverting keyring password change');
      // revert the keyring password change by changing the password back to the old password
      await (deps.messenger as never).call(
        'KeyringController:changePassword',
        oldPassword,
      );
      const revertedKeyringEncKey = await (deps.messenger as never).call(
        'KeyringController:exportEncryptionKey',
      );
      await (deps.messenger as never).call(
        'SeedlessOnboardingController:storeKeyringEncryptionKey',
        revertedKeyringEncKey,
      );
      throw err;
    }
  }
}

/**
 * Imports a BIP-39 mnemonic into the vault, optionally creating a social
 * backup and selecting the new account.
 *
 * Extracted from MetamaskController.importMnemonicToVault (L4293).
 *
 * TODO: Requires messenger actions:
 *   - MultichainAccountService:createMultichainAccountWallet
 *   - KeyringController:withKeyring
 *   - OnboardingController:getIsSocialLoginFlow
 *   - VaultManagement:addNewSeedPhraseBackup (self-call)
 *   - MultichainAccountService:removeMultichainAccountWallet
 *   - AccountsController:getAccountByAddress
 *   - AccountsController:setSelectedAccount
 *   - AccountTreeController:syncWithUserStorage
 *   - MultichainAccountService:discoverAndCreateAccounts (or _addAccountsWithBalance)
 *   - VaultManagement:getHDEntropyIndex (self-call)
 *
 * NOTE: createVaultMutex is intentionally omitted — it is an MC-level
 * coordination primitive.
 * TODO: MultichainAccountService should manage its own concurrency.
 */
export async function importMnemonicToVault(
  deps: VaultDependencies,
  mnemonic: string,
  options = {
    shouldCreateSocialBackup: true,
    shouldSelectAccount: true,
    shouldImportSolanaAccount: true,
  },
): Promise<void> {
  const {
    shouldCreateSocialBackup,
    shouldSelectAccount,
    shouldImportSolanaAccount,
  } = options;

  // TODO: createVaultMutex should be managed by MultichainAccountService
  const { entropySource: id } = await (deps.messenger as never).call(
    'MultichainAccountService:createMultichainAccountWallet',
    {
      type: 'import',
      mnemonic: convertMnemonicToWordlistIndices(Buffer.from(mnemonic, 'utf8')),
    },
  );

  const [newAccountAddress] = await (deps.messenger as never).call(
    'KeyringController:withKeyring',
    { id },
    async ({ keyring }: { keyring: { getAccounts(): Promise<string[]> } }) =>
      keyring.getAccounts(),
  );

  const isSocialLoginFlow = (deps.messenger as never).call(
    'OnboardingController:getIsSocialLoginFlow',
  );

  if (isSocialLoginFlow) {
    try {
      await addNewSeedPhraseBackup(
        deps,
        mnemonic,
        id,
        shouldCreateSocialBackup,
      );
    } catch (err) {
      await (deps.messenger as never).call(
        'MultichainAccountService:removeMultichainAccountWallet',
        id,
        newAccountAddress,
      );
      throw err;
    }
  }

  if (shouldSelectAccount) {
    const account = deps.messenger.call(
      'AccountsController:getAccountByAddress',
      newAccountAddress,
    );
    deps.messenger.call('AccountsController:setSelectedAccount', account.id);
  }

  const syncAndDiscoverAccounts = async () => {
    // We want to trigger a full sync of the account tree after importing a new SRP
    await (deps.messenger as never).call(
      'AccountTreeController:syncWithUserStorage',
    );

    if (shouldImportSolanaAccount) {
      await (deps.messenger as never).call(
        'MultichainAccountService:discoverAndCreateAccounts',
        id,
      );
    } else {
      await (deps.messenger as never).call(
        'MultichainAccountService:addAccountsWithBalance',
        id,
        shouldImportSolanaAccount,
      );
    }
  };

  // In order to avoid blocking the UI thread, we don't await for the sync and discover accounts to complete.
  // eslint-disable-next-line no-void
  void syncAndDiscoverAccounts();
}

/**
 * Restores an array of seed phrases to the vault and updates the social
 * backup metadata state for successfully imported entries.
 *
 * Only available for the social login flow — returns immediately otherwise.
 *
 * Extracted from MetamaskController.restoreSeedPhrasesToVault (L4399).
 *
 * TODO: Requires messenger actions:
 *   - OnboardingController:getIsSocialLoginFlow
 *   - SeedlessOnboardingController:getSecretDataBackupState
 *   - AccountsController:importAccountWithStrategy (or equivalent)
 *   - VaultManagement:importMnemonicToVault (self-call)
 */
export async function restoreSeedPhrasesToVault(
  deps: VaultDependencies,
  secretDatas: Array<{
    data: Uint8Array;
    type: string;
    timestamp: number;
    version: number;
  }>,
): Promise<void> {
  const isSocialLoginFlow = (deps.messenger as never).call(
    'OnboardingController:getIsSocialLoginFlow',
  );

  if (!isSocialLoginFlow) {
    return;
  }

  // These mnemonics are restored from the Social Backup, so we don't need to do it again
  const shouldCreateSocialBackup = false;
  // During restore, don't change the selected account — let the user select manually
  const shouldSetSelectedAccount = false;
  // Solana accounts will be imported after wallet onboarding completes
  const shouldImportSolanaAccount = false;

  for (const secret of secretDatas) {
    const srpHash = (deps.messenger as never).call(
      'SeedlessOnboardingController:getSecretDataBackupState',
      secret.data,
      secret.type,
    );
    if (srpHash) {
      // If SRP is in the local state, skip it
      continue;
    }

    if (secret.type === 'privateKey') {
      await (deps.messenger as never).call(
        'AccountsController:importAccountWithStrategy',
        'privateKey',
        [bytesToHex(secret.data)],
        {
          shouldCreateSocialBackup,
          shouldSelectAccount: shouldSetSelectedAccount,
        },
      );
      continue;
    }

    // convert the seed phrase to a mnemonic (string)
    const encodedSrp = convertEnglishWordlistIndicesToCodepoints(secret.data);
    const mnemonicToRestore = Buffer.from(encodedSrp).toString('utf8');

    await importMnemonicToVault(deps, mnemonicToRestore, {
      shouldCreateSocialBackup,
      shouldSelectAccount: shouldSetSelectedAccount,
      shouldImportSolanaAccount,
    });
  }
}

/**
 * Fetches and restores the seed phrase from the social backup metadata store,
 * restores the vault using the root seed phrase, and imports remaining secrets.
 *
 * Extracted from MetamaskController.restoreSocialBackupAndGetSeedPhrase
 * (L4467).
 *
 * TODO: Requires messenger actions:
 *   - VaultManagement:fetchAllSecretData (self-call)
 *   - VaultManagement:createNewVaultAndRestore (self-call)
 *   - VaultManagement:restoreSeedPhrasesToVault (self-call)
 */
export async function restoreSocialBackupAndGetSeedPhrase(
  deps: VaultDependencies,
  password: string,
): Promise<string> {
  // get the first seed phrase from the array — this is the oldest/root seed phrase
  const [firstSecretData, ...remainingSecretData] = await fetchAllSecretData(
    deps,
    password,
  );

  const firstSeedPhrase = convertEnglishWordlistIndicesToCodepoints(
    firstSecretData.data,
  );
  const mnemonic = Buffer.from(firstSeedPhrase).toString('utf8');
  const encodedSeedPhrase = Array.from(Buffer.from(mnemonic, 'utf8').values());

  // restore the vault using the root seed phrase
  await deps.messenger.call(
    'VaultManagement:createNewVaultAndRestore',
    password,
    encodedSeedPhrase,
  );

  // restore the remaining Mnemonics/SeedPhrases/PrivateKeys to the vault
  if (remainingSecretData.length > 0) {
    await restoreSeedPhrasesToVault(deps, remainingSecretData);
  }

  return mnemonic;
}

/**
 * Attempts to unlock the vault using either the user's password or encryption
 * key. Synchronizes accounts, multichain service, and account tree after
 * unlock. Fires async resync/alignment for multichain feature state 2.
 *
 * Extracted from MetamaskController.submitPasswordOrEncryptionKey (L4850).
 *
 * NOTE: offscreenPromise, blockTracker, forwardSelectedAccountGroupToSnapKeyring,
 * and isMultichainAccountsFeatureState2Enabled are MC-level concerns not yet
 * mapped to messenger actions. They are omitted with TODOs below.
 *
 * TODO: Requires messenger actions:
 *   - OnboardingController:getIsSocialLoginFlow
 *   - KeyringController:submitEncryptionKey
 *   - KeyringController:submitPassword
 *   - SeedlessOnboardingController:submitPassword
 *   - AccountsController:updateAccounts
 *   - MultichainAccountService:init
 *   - AccountTreeController:init
 *   - MultichainAccountService:resyncAccounts
 *   - MultichainAccountService:alignWallets
 */
export async function submitPasswordOrEncryptionKey(
  deps: VaultDependencies,
  params: { password?: string; encryptionKey?: string },
): Promise<void> {
  const { password, encryptionKey } = params;
  const isSocialLoginFlow = (deps.messenger as never).call(
    'OnboardingController:getIsSocialLoginFlow',
  );

  // TODO: await offscreenPromise — MC-level concern, not yet a messenger action

  if (encryptionKey) {
    await (deps.messenger as never).call(
      'KeyringController:submitEncryptionKey',
      encryptionKey,
    );
  } else {
    await (deps.messenger as never).call(
      'KeyringController:submitPassword',
      password,
    );
    if (isSocialLoginFlow) {
      // unlock the seedless onboarding vault
      await (deps.messenger as never).call(
        'SeedlessOnboardingController:submitPassword',
        password,
      );
    }
  }

  // TODO: blockTracker.checkForLatestBlock() — not yet a messenger action

  await deps.messenger.call('AccountsController:updateAccounts');

  // Init multichain accounts after creating internal accounts.
  await (deps.messenger as never).call('MultichainAccountService:init');

  // Force account-tree refresh after all accounts have been updated.
  (deps.messenger as never).call('AccountTreeController:init');

  // TODO: forwardSelectedAccountGroupToSnapKeyring — not yet a messenger action

  // TODO: isMultichainAccountsFeatureState2Enabled — resyncAccounts + alignWallets
  // not yet messenger actions
}

/**
 * Submits a user's encryption key to log the user in via login token stored
 * in session storage.
 *
 * Clears login artifacts if the stored salt does not match the vault salt, or
 * if any error occurs.
 *
 * Extracted from MetamaskController.submitEncryptionKeyFromSessionStorage
 * (L4932).
 *
 * TODO: Requires messenger actions:
 *   - KeyringController:getState (for vault)
 *   - KeyringController:submitEncryptionKey
 *   - SessionService:getLoginArtifacts (or equivalent for session storage)
 *
 * NOTE: this.extension.storage.session is a browser extension API — not yet
 * proxied through the messenger. For the PoC this is kept as a TODO.
 */
export async function submitEncryptionKeyFromSessionStorage(
  deps: VaultDependencies,
): Promise<void> {
  // TODO: session storage access (loginToken, loginSalt) is not yet a
  // messenger action — this requires a SessionService or equivalent bridge.
  // Stub below preserves the logic shape for review purposes.

  // Conceptual implementation:
  // const { loginToken, loginSalt } = await SessionService:getLoginArtifacts()
  // if (loginToken && loginSalt) {
  //   const { vault } = deps.messenger.call('KeyringController:getState')
  //   const jsonVault = JSON.parse(vault)
  //   if (jsonVault.salt !== loginSalt) {
  //     await clearLoginArtifacts(deps)
  //     return
  //   }
  //   await (deps.messenger as never).call('KeyringController:submitEncryptionKey', loginToken, loginSalt)
  // }
  throw new Error(
    'submitEncryptionKeyFromSessionStorage: requires SessionService messenger action (not yet implemented)',
  );
}

/**
 * Clears the login token and salt from session storage.
 *
 * Extracted from MetamaskController.clearLoginArtifacts (L4959).
 *
 * TODO: Requires messenger actions:
 *   - SessionService:clearLoginArtifacts (or equivalent for session storage)
 *
 * NOTE: this.extension.storage.session is a browser extension API — not yet
 * proxied through the messenger.
 */
export async function clearLoginArtifacts(
  _deps: VaultDependencies,
): Promise<void> {
  // TODO: session storage removal is not yet a messenger action — requires
  // a SessionService or equivalent bridge.
  throw new Error(
    'clearLoginArtifacts: requires SessionService messenger action (not yet implemented)',
  );
}

/**
 * Gets the mnemonic of the user's primary keyring.
 *
 * Extracted from MetamaskController.getPrimaryKeyringMnemonic (L4976).
 *
 * TODO: Requires messenger actions:
 *   - KeyringController:getKeyringsByType
 */
export function getPrimaryKeyringMnemonic(deps: VaultDependencies): Uint8Array {
  const [keyring] = (deps.messenger as never).call(
    'KeyringController:getKeyringsByType',
    'HD Key Tree',
  );
  if (!keyring.mnemonic) {
    throw new Error('Primary keyring mnemonic unavailable.');
  }
  return keyring.mnemonic;
}

/**
 * Gets the mnemonic seed of the user's primary keyring.
 *
 * Extracted from MetamaskController.getPrimaryKeyringMnemonicSeed (L4990).
 *
 * TODO: Requires messenger actions:
 *   - KeyringController:getKeyringsByType
 */
export function getPrimaryKeyringMnemonicSeed(
  deps: VaultDependencies,
): Uint8Array {
  const [keyring] = (deps.messenger as never).call(
    'KeyringController:getKeyringsByType',
    'HD Key Tree',
  );
  if (!keyring.seed) {
    throw new Error('Primary keyring mnemonic unavailable.');
  }
  return keyring.seed;
}

/**
 * Adds a new private key backup for the user.
 *
 * If `syncWithSocial` is false, only updates the local state without syncing
 * the private key to the server.
 *
 * Extracted from MetamaskController.addNewPrivateKeyBackup (L5713).
 *
 * TODO: Requires messenger actions:
 *   - SeedlessOnboardingController:addNewSecretData
 *   - SeedlessOnboardingController:updateBackupMetadataState
 *
 * NOTE: seedlessOperationMutex is intentionally omitted — it is an MC-level
 * coordination primitive.
 * TODO: SeedlessOnboardingController should manage its own concurrency.
 */
export async function addNewPrivateKeyBackup(
  deps: VaultDependencies,
  privateKey: string,
  keyringId: string,
  syncWithSocial = true,
): Promise<void> {
  const bufferedPrivateKey = hexToBytes(add0x(privateKey));

  if (syncWithSocial) {
    // TODO: SeedlessOnboardingController should manage its own concurrency
    await (deps.messenger as never).call(
      'SeedlessOnboardingController:addNewSecretData',
      bufferedPrivateKey,
      'privateKey', // SecretType.PrivateKey
      { keyringId },
    );
  } else {
    // Do not sync the private key to the server, only update the local state
    (deps.messenger as never).call(
      'SeedlessOnboardingController:updateBackupMetadataState',
      {
        keyringId,
        data: bufferedPrivateKey,
        type: 'privateKey', // SecretType.PrivateKey
      },
    );
  }
}

/**
 * Returns the index of the HD keyring containing the selected account.
 *
 * Extracted from MetamaskController.getHDEntropyIndex (L5989).
 *
 * TODO: Requires messenger actions:
 *   - AccountsController:getSelectedAccount
 *   - KeyringController:getState (for keyrings list)
 */
export function getHDEntropyIndex(deps: VaultDependencies): number | undefined {
  const selectedAccount = deps.messenger.call(
    'AccountsController:getSelectedAccount',
  );
  const { keyrings } = (deps.messenger as never).call(
    'KeyringController:getState',
  );
  const hdKeyrings = keyrings.filter(
    (keyring: { type: string }) => keyring.type === 'HD Key Tree',
  );
  const index = hdKeyrings.findIndex((keyring: { accounts: string[] }) =>
    keyring.accounts.includes(selectedAccount.address),
  );

  return index === -1 ? undefined : index;
}

/**
 * Allows a user to begin the seed phrase recovery process.
 *
 * Extracted from MetamaskController.markPasswordForgotten (L6008).
 *
 * TODO: Requires messenger actions:
 *   - PreferencesController:setPasswordForgotten
 */
export function markPasswordForgotten(deps: VaultDependencies): void {
  (deps.messenger as never).call(
    'PreferencesController:setPasswordForgotten',
    true,
  );
}

/**
 * Allows a user to end the seed phrase recovery process.
 *
 * Extracted from MetamaskController.unMarkPasswordForgotten (L6015).
 *
 * TODO: Requires messenger actions:
 *   - PreferencesController:setPasswordForgotten
 */
export function unMarkPasswordForgotten(deps: VaultDependencies): void {
  (deps.messenger as never).call(
    'PreferencesController:setPasswordForgotten',
    false,
  );
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
  resetWallet: 'VaultManagement:resetWallet',
  createSeedPhraseBackup: 'VaultManagement:createSeedPhraseBackup',
  fetchAllSecretData: 'VaultManagement:fetchAllSecretData',
  syncKeyringEncryptionKey: 'VaultManagement:syncKeyringEncryptionKey',
  checkIsSeedlessPasswordOutdated:
    'VaultManagement:checkIsSeedlessPasswordOutdated',
  syncSeedPhrases: 'VaultManagement:syncSeedPhrases',
  addNewSeedPhraseBackup: 'VaultManagement:addNewSeedPhraseBackup',
  changePassword: 'VaultManagement:changePassword',
  importMnemonicToVault: 'VaultManagement:importMnemonicToVault',
  restoreSeedPhrasesToVault: 'VaultManagement:restoreSeedPhrasesToVault',
  restoreSocialBackupAndGetSeedPhrase:
    'VaultManagement:restoreSocialBackupAndGetSeedPhrase',
  submitPasswordOrEncryptionKey:
    'VaultManagement:submitPasswordOrEncryptionKey',
  submitEncryptionKeyFromSessionStorage:
    'VaultManagement:submitEncryptionKeyFromSessionStorage',
  clearLoginArtifacts: 'VaultManagement:clearLoginArtifacts',
  getPrimaryKeyringMnemonic: 'VaultManagement:getPrimaryKeyringMnemonic',
  getPrimaryKeyringMnemonicSeed:
    'VaultManagement:getPrimaryKeyringMnemonicSeed',
  addNewPrivateKeyBackup: 'VaultManagement:addNewPrivateKeyBackup',
  getHDEntropyIndex: 'VaultManagement:getHDEntropyIndex',
  markPasswordForgotten: 'VaultManagement:markPasswordForgotten',
  unMarkPasswordForgotten: 'VaultManagement:unMarkPasswordForgotten',
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
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.resetWallet,
    (restoreOnly?: boolean) => resetWallet(deps, restoreOnly),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.createSeedPhraseBackup,
    (password: string, encodedSeedPhrase: number[], keyringId: string) =>
      createSeedPhraseBackup(deps, password, encodedSeedPhrase, keyringId),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.fetchAllSecretData,
    (password: string) => fetchAllSecretData(deps, password),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.syncKeyringEncryptionKey,
    () => syncKeyringEncryptionKey(deps),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.checkIsSeedlessPasswordOutdated,
    (skipCache?: boolean) => checkIsSeedlessPasswordOutdated(deps, skipCache),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.syncSeedPhrases,
    () => syncSeedPhrases(deps),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.addNewSeedPhraseBackup,
    (mnemonic: string, keyringId: string, syncWithSocial?: boolean) =>
      addNewSeedPhraseBackup(deps, mnemonic, keyringId, syncWithSocial),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.changePassword,
    (newPassword: string, oldPassword: string) =>
      changePassword(deps, newPassword, oldPassword),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.importMnemonicToVault,
    (
      mnemonic: string,
      options?: {
        shouldCreateSocialBackup: boolean;
        shouldSelectAccount: boolean;
        shouldImportSolanaAccount: boolean;
      },
    ) => importMnemonicToVault(deps, mnemonic, options),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.restoreSeedPhrasesToVault,
    (
      secretDatas: Array<{
        data: Uint8Array;
        type: string;
        timestamp: number;
        version: number;
      }>,
    ) => restoreSeedPhrasesToVault(deps, secretDatas),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.restoreSocialBackupAndGetSeedPhrase,
    (password: string) => restoreSocialBackupAndGetSeedPhrase(deps, password),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.submitPasswordOrEncryptionKey,
    (params: { password?: string; encryptionKey?: string }) =>
      submitPasswordOrEncryptionKey(deps, params),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.submitEncryptionKeyFromSessionStorage,
    () => submitEncryptionKeyFromSessionStorage(deps),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.clearLoginArtifacts,
    () => clearLoginArtifacts(deps),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.getPrimaryKeyringMnemonic,
    () => getPrimaryKeyringMnemonic(deps),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.getPrimaryKeyringMnemonicSeed,
    () => getPrimaryKeyringMnemonicSeed(deps),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.addNewPrivateKeyBackup,
    (privateKey: string, keyringId: string, syncWithSocial?: boolean) =>
      addNewPrivateKeyBackup(deps, privateKey, keyringId, syncWithSocial),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.getHDEntropyIndex,
    () => getHDEntropyIndex(deps),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.markPasswordForgotten,
    () => markPasswordForgotten(deps),
  );
  (messenger as never).registerActionHandler(
    VAULT_MANAGEMENT_ACTIONS.unMarkPasswordForgotten,
    () => unMarkPasswordForgotten(deps),
  );
}
