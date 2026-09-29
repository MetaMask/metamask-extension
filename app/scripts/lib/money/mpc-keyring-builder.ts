import type { HdKeyring } from '@metamask/eth-hd-keyring';
import {
  KeyringTypes,
  type KeyringControllerWithKeyringUnsafeAction,
} from '@metamask/keyring-controller';
import type { Keyring } from '@metamask/keyring-utils';
import { encodeMnemonic } from '@metamask/keyring-sdk';
import type { Messenger } from '@metamask/messenger';
import { MPC_KEYRING_TYPE } from '../../../../shared/constants/mpc-keyring';

/**
 * Dev cloud signer used when `MFA_CLOUD_SIGNER_URL` is not set.
 * Override it from `.metamaskrc`.
 */
const DEFAULT_MFA_CLOUD_SIGNER_URL =
  'https://mpc-service-non-enclave.dev-api.cx.metamask.io/v2';

/**
 * Dev relayer used when `MFA_RELAYER_URL` is not set.
 * Override it from `.metamaskrc`.
 */
const DEFAULT_MFA_RELAYER_URL =
  'wss://mm-sdk-relay.dev-api.cx.metamask.io/connection/websocket';

type AuthenticationControllerGetBearerTokenAction = {
  type: 'AuthenticationController:getBearerToken';
  handler: () => Promise<string>;
};

export type MpcKeyringBuilderMessenger = Messenger<
  'MpcKeyringBuilder',
  | KeyringControllerWithKeyringUnsafeAction
  | AuthenticationControllerGetBearerTokenAction
>;

type MpcKeyringConstructor = new (opts: {
  getRandomBytes: (size: number) => Uint8Array;
  dkls23Lib: unknown;
  cloudURL: string;
  relayerURL: string;
  getProfileToken: (opts?: {
    twoFactor?: boolean;
    challenge?: Uint8Array;
  }) => Promise<string>;
  getBackupEncryptionKey: () => Promise<Uint8Array>;
}) => Keyring;

/**
 * Read a build-time env var, falling back when it was not configured.
 *
 * @param name - The env var name.
 * @param fallback - Value used when the env var is missing.
 * @returns The configured value, or `fallback`.
 */
function readEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

/**
 * SHA-256 of the primary HD mnemonic.
 *
 * The MPC keyring encrypts its key-share backup with this key. It has to be
 * stable across unlocks, and `withKeyringUnsafe` is required because key
 * creation runs while `KeyringController` already holds its mutex.
 *
 * @param messenger - The messenger used to read the HD keyring.
 * @returns A 32-byte AES key.
 */
async function getBackupEncryptionKey(
  messenger: MpcKeyringBuilderMessenger,
): Promise<Uint8Array> {
  const mnemonic = (await messenger.call(
    'KeyringController:withKeyringUnsafe',
    { type: KeyringTypes.hd },
    async ({ keyring }) => {
      const { mnemonic: phrase } = keyring as HdKeyring;
      if (!phrase) {
        throw new Error('Unable to get mnemonic to encrypt the MPC key share');
      }
      return encodeMnemonic(phrase);
    },
  )) as unknown as number[];

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new Uint8Array(mnemonic),
  );
  return new Uint8Array(digest);
}

/**
 * Profile token presented to the MPC cloud.
 *
 * The keyring asks for this on every cloud call, including a 2FA flag and an
 * optional signing challenge. This POC sends the MetaMask bearer token. A
 * released integration would exchange that token for an MFA profile token
 * bound to `opts.challenge`.
 *
 * @param messenger - The messenger used to read the bearer token.
 * @returns The bearer token.
 */
async function getProfileToken(
  messenger: MpcKeyringBuilderMessenger,
): Promise<string> {
  const token = await messenger.call('AuthenticationController:getBearerToken');
  if (!token) {
    throw new Error('Sign in to MetaMask before enabling MFA');
  }
  return token;
}

/**
 * Build the keyring builder for `MPC Keyring`.
 *
 * Registered unconditionally, like the Money keyring: a vault that already
 * holds an MPC keyring must be able to deserialize it.
 *
 * The WASM library and the keyring class are loaded on first use so the
 * extension can start when those local packages are not under test.
 *
 * @param messenger - The messenger used for the profile token and backup key.
 * @returns The MPC keyring builder.
 */
export function buildMpcKeyringBuilder(messenger: MpcKeyringBuilderMessenger) {
  const builder = () => {
    // Loaded lazily. Both packages are unpublished local tarballs.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mpcKeyringModule = require('@metamask/eth-mpc-keyring') as Record<
      string,
      MpcKeyringConstructor
    >;
    // The package export is the class name. `new-cap` requires that name.

    const { MpcKeyring } = mpcKeyringModule;
    if (!MpcKeyring) {
      throw new Error('MPC keyring package did not export a constructor');
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { loadSync } = require('@metamask/mpc-dkls23') as {
      loadSync: () => unknown;
    };

    return new MpcKeyring({
      getRandomBytes: (size) => {
        const bytes = new Uint8Array(size);
        crypto.getRandomValues(bytes);
        return bytes;
      },
      dkls23Lib: loadSync(),
      cloudURL: readEnv('MFA_CLOUD_SIGNER_URL', DEFAULT_MFA_CLOUD_SIGNER_URL),
      relayerURL: readEnv('MFA_RELAYER_URL', DEFAULT_MFA_RELAYER_URL),
      getProfileToken: () => getProfileToken(messenger),
      getBackupEncryptionKey: () => getBackupEncryptionKey(messenger),
    });
  };

  builder.type = MPC_KEYRING_TYPE;

  return builder;
}
