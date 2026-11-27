import {
  decryptWithDetail,
  encryptWithDetail,
} from '@metamask/browser-passworder';
import {
  AuthConnection,
  SeedlessOnboardingCheckpoint,
  SeedlessOnboardingOperation,
  type SeedlessOnboardingControllerState,
} from '@metamask/seedless-onboarding-controller';
import { bytesToBase64 } from '@metamask/utils';
import { gcm } from '@noble/ciphers/aes';
import { managedNonce } from '@noble/ciphers/webcrypto';
import { utf8ToBytes } from '@noble/ciphers/utils';
import { hexToBytes } from '@noble/hashes/utils';
import { MOCK_GOOGLE_ACCOUNT, WALLET_PASSWORD } from '../constants';
import { SSSNodeKeyPairs } from '../helpers/seedless-onboarding/constants';
import {
  PasswordSyncMockAuthPrivateKey,
  PasswordSyncMockAuthPubKey,
  PasswordSyncMockEncryptionKey,
  PasswordSyncMockPwdEncryptionKey,
  SeedlessGlobalPassword,
} from '../helpers/seedless-onboarding/data';
import { generateMockJwtToken } from '../helpers/seedless-onboarding/utils';

const PASSWORDER_OPTIONS = {
  algorithm: 'PBKDF2' as const,
  params: {
    iterations: 600_000,
  },
};

type CreateSeedlessPasswordRecoveryStateOptions = {
  keyringVault: string;
  userEmail?: string;
};

export type SeedlessPasswordRecoveryState = {
  state: SeedlessOnboardingControllerState;
  authPubKey: string;
};

export type SeedlessPasswordKeySyncPendingState =
  SeedlessPasswordRecoveryState & {
    keyringVault: string;
  };

/**
 * Create a persisted Seedless state representing a password change that
 * completed remotely but **failed** before the local Keyring password changed.
 *
 * @param options - State construction options.
 * @param options.keyringVault - The local Keyring vault encrypted with the old password.
 * @param options.userEmail - The social-login user identifier.
 * @returns The Seedless controller state and its remote auth public key.
 */
export async function createSeedlessLocalPasswordPendingState({
  keyringVault,
  userEmail = MOCK_GOOGLE_ACCOUNT,
}: CreateSeedlessPasswordRecoveryStateOptions): Promise<SeedlessPasswordRecoveryState> {
  // Step 1: Read the existing Keyring encryption key using the old wallet
  // password so the local vault can remain unchanged during recovery.
  const { exportedKeyString: keyringEncryptionKey } = await decryptWithDetail(
    WALLET_PASSWORD,
    keyringVault,
  );

  return createSeedlessPasswordRecoveryControllerState({
    keyringEncryptionKey,
    userEmail,
    checkpoint: SeedlessOnboardingCheckpoint.LocalPasswordPending,
  });
}

/**
 * Create a persisted Seedless state representing a password change that
 * completed on both vaults but **failed** while synchronizing the current
 * Keyring encryption key to Seedless.
 *
 * @param options - State construction options.
 * @param options.keyringVault - The local Keyring vault encrypted with the old password.
 * @param options.userEmail - The social-login user identifier.
 * @returns The Seedless controller state, remote auth public key, and re-encrypted Keyring vault.
 */
export async function createSeedlessPasswordKeySyncPendingState({
  keyringVault,
  userEmail = MOCK_GOOGLE_ACCOUNT,
}: CreateSeedlessPasswordRecoveryStateOptions): Promise<SeedlessPasswordKeySyncPendingState> {
  // Step 1: Read the old Keyring encryption key and vault contents. The old
  // key is intentionally kept in Seedless state to represent an interrupted
  // key synchronization.
  const {
    exportedKeyString: oldKeyringEncryptionKey,
    vault: decryptedKeyringVault,
  } = await decryptWithDetail(WALLET_PASSWORD, keyringVault);

  // Step 2: Re-encrypt the same Keyring contents with the new password. This
  // models KeyringController:changePassword succeeding before key sync fails.
  const { vault: updatedKeyringVault } = await encryptWithDetail(
    SeedlessGlobalPassword,
    decryptedKeyringVault,
    undefined,
    PASSWORDER_OPTIONS,
  );

  // Step 3: Create Seedless state at the exact key-sync recovery checkpoint,
  // retaining the old Keyring encryption key until recovery updates it.
  const recoveryState = await createSeedlessPasswordRecoveryControllerState({
    keyringEncryptionKey: oldKeyringEncryptionKey,
    userEmail,
    checkpoint: SeedlessOnboardingCheckpoint.KeySyncPending,
  });

  return {
    ...recoveryState,
    keyringVault: updatedKeyringVault,
  };
}

async function createSeedlessPasswordRecoveryControllerState({
  keyringEncryptionKey,
  userEmail,
  checkpoint,
}: {
  keyringEncryptionKey: string;
  userEmail: string;
  checkpoint: SeedlessOnboardingCheckpoint;
}): Promise<SeedlessPasswordRecoveryState> {
  // Step 2: Use the complete TOPRF key bundle derived from the new password.
  // The public key is stored as Base64 in the controller state and vault.
  const authPublicKey = hexToBytes(PasswordSyncMockAuthPubKey);
  const authPublicKeyBase64 = bytesToBase64(authPublicKey);

  // Step 3: Build the Seedless vault data that represents an authenticated
  // user whose remote password change has already completed.
  const seedlessVaultData = JSON.stringify({
    toprfEncryptionKey: bytesToBase64(PasswordSyncMockEncryptionKey),
    toprfPwEncryptionKey: bytesToBase64(PasswordSyncMockPwdEncryptionKey),
    toprfAuthKeyPair: JSON.stringify({
      sk: PasswordSyncMockAuthPrivateKey,
      pk: authPublicKeyBase64,
    }),
    revokeToken: 'mock-revoke-token',
    accessToken: generateMockJwtToken(userEmail, 3600),
  });

  // Step 4: Encrypt the Seedless vault with the new password.
  const { vault, exportedKeyString: seedlessVaultEncryptionKey } =
    await encryptWithDetail(
      SeedlessGlobalPassword,
      seedlessVaultData,
      undefined,
      PASSWORDER_OPTIONS,
    );

  // Step 5: Wrap both vault encryption keys with the password-sync key, matching
  // the format expected by SeedlessOnboardingController.
  const encryptedKeyringEncryptionKey =
    encryptWithSeedlessPasswordKey(keyringEncryptionKey);
  const encryptedSeedlessEncryptionKey = encryptWithSeedlessPasswordKey(
    seedlessVaultEncryptionKey,
  );

  // Step 6: Supply the node credentials needed for the authenticated Seedless
  // controller state. Node auth tokens are Base64-encoded JSON because the
  // controller decodes the first token to check its expiry during unlock.
  const mockNodeAuthToken = bytesToBase64(
    utf8ToBytes(
      JSON.stringify({
        data: 'mock-auth-token-data',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ),
  );
  const nodeAuthTokens = [1, 2, 3].map((nodeIndex) => ({
    authToken: mockNodeAuthToken,
    nodeIndex,
    nodePubKey: SSSNodeKeyPairs[nodeIndex].pubKey,
  }));

  // Step 7: Stop at the requested checkpoint so the unlock flow exercises the
  // corresponding password-change recovery branch.
  return {
    state: {
      authConnection: AuthConnection.Google,
      authConnectionId: AuthConnection.Google,
      authPubKey: authPublicKeyBase64,
      encryptedKeyringEncryptionKey,
      encryptedSeedlessEncryptionKey,
      isSeedlessOnboardingUserAuthenticated: true,
      metadataAccessToken: generateMockJwtToken(userEmail, 3600),
      migrationVersion: 1,
      nodeAuthTokens,
      refreshToken: 'mock-refresh-token',
      seedlessOperationLifecycle: {
        operation: SeedlessOnboardingOperation.PasswordChange,
        checkpoint,
      },
      socialBackupsMetadata: [],
      socialLoginEmail: userEmail,
      userId: userEmail,
      vault,
    },
    authPubKey: PasswordSyncMockAuthPubKey,
  };
}

function encryptWithSeedlessPasswordKey(value: string): string {
  const encryptedValue = managedNonce(gcm)(
    PasswordSyncMockPwdEncryptionKey,
  ).encrypt(utf8ToBytes(value));
  return bytesToBase64(encryptedValue);
}
