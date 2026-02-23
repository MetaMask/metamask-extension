import {
  KeyringControllerWithKeyringAction,
  KeyringTypes,
} from '@metamask/keyring-controller';
import type { HdKeyring } from '@metamask/eth-hd-keyring';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get the mnemonic for a given entropy source. If no source is
 * provided, the primary HD keyring's mnemonic will be returned.
 *
 * @param messenger - The messenger.
 * @param source - The ID of the entropy source keyring.
 * @returns The mnemonic.
 */
export async function getMnemonic(
  messenger: RootMessenger<KeyringControllerWithKeyringAction, never>,
  source?: string | undefined,
): Promise<Uint8Array> {
  if (!source) {
    const mnemonic = (await messenger.call(
      'KeyringController:withKeyring',
      {
        type: KeyringTypes.hd,
        index: 0,
      },
      async ({ keyring }) => (keyring as HdKeyring).mnemonic,
    )) as Uint8Array | null;

    if (!mnemonic) {
      throw new Error('Primary keyring mnemonic unavailable.');
    }

    return mnemonic;
  }

  try {
    const keyringData = await messenger.call(
      'KeyringController:withKeyring',
      {
        id: source,
      },
      async ({ keyring }) => ({
        type: keyring.type,
        mnemonic: (keyring as HdKeyring).mnemonic,
      }),
    );

    const { type, mnemonic } = keyringData as {
      type: string;
      mnemonic?: Uint8Array;
    };

    if (type !== KeyringTypes.hd || !mnemonic) {
      // The keyring isn't guaranteed to have a mnemonic (e.g.,
      // hardware wallets, which can't be used as entropy sources),
      // so we throw an error if it doesn't.
      throw new Error(`Entropy source with ID "${source}" not found.`);
    }

    return mnemonic;
  } catch {
    throw new Error(`Entropy source with ID "${source}" not found.`);
  }
}

/**
 * Get the mnemonic seed for a given entropy source. If no source is
 * provided, the primary HD keyring's mnemonic seed will be returned.
 *
 * @param messenger - The messenger.
 * @param source - The ID of the entropy source keyring.
 * @returns The mnemonic seed.
 */
export async function getMnemonicSeed(
  messenger: RootMessenger<KeyringControllerWithKeyringAction, never>,
  source?: string | undefined,
): Promise<Uint8Array> {
  if (!source) {
    const seed = (await messenger.call(
      'KeyringController:withKeyring',
      {
        type: KeyringTypes.hd,
        index: 0,
      },
      async ({ keyring }) => (keyring as HdKeyring).seed,
    )) as Uint8Array | null;

    if (!seed) {
      throw new Error('Primary keyring mnemonic unavailable.');
    }

    return seed;
  }

  try {
    const keyringData = await messenger.call(
      'KeyringController:withKeyring',
      {
        id: source,
      },
      async ({ keyring }) => ({
        type: keyring.type,
        seed: (keyring as HdKeyring).seed,
      }),
    );

    const { type, seed } = keyringData as { type: string; seed?: Uint8Array };

    if (type !== KeyringTypes.hd || !seed) {
      // The keyring isn't guaranteed to have a mnemonic (e.g.,
      // hardware wallets, which can't be used as entropy sources),
      // so we throw an error if it doesn't.
      throw new Error(`Entropy source with ID "${source}" not found.`);
    }

    return seed;
  } catch {
    throw new Error(`Entropy source with ID "${source}" not found.`);
  }
}
