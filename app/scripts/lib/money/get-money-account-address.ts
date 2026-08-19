import type { HdKeyring } from '@metamask/eth-hd-keyring';
import { MoneyKeyring } from '@metamask/eth-money-keyring';
import {
  KeyringTypes,
  type KeyringControllerWithKeyringUnsafeAction,
} from '@metamask/keyring-controller';
import { encodeMnemonic } from '@metamask/keyring-sdk';
import type { Messenger } from '@metamask/messenger';
import type { Hex } from '@metamask/utils';

export type MoneyAccountAddressMessenger = Messenger<
  string,
  KeyringControllerWithKeyringUnsafeAction,
  never
>;

/**
 * The primary HD seed, in the shape `MoneyKeyring` needs it: the id of the
 * entropy source it came from, plus the mnemonic as UTF-8 byte values.
 */
type PrimarySeed = {
  entropySource: string;
  mnemonic: number[];
};

/**
 * Read the primary HD keyring's mnemonic.
 *
 * Uses `withKeyringUnsafe`, which asserts the wallet is unlocked but does not
 * require the password. The `{ type }` selector picks the first keyring of that
 * type, which is the primary HD keyring. This is because the money account is always
 * derived from the primary SRP
 *
 * @param messenger - The messenger used to reach the `KeyringController`.
 * @returns The primary entropy source id and its mnemonic as UTF-8 byte values.
 */
async function getPrimarySeed(
  messenger: MoneyAccountAddressMessenger,
): Promise<PrimarySeed> {
  return (await messenger.call(
    'KeyringController:withKeyringUnsafe',
    { type: KeyringTypes.hd },
    async ({ keyring, metadata }) => {
      // `mnemonic` holds wordlist indices as a byte view, not the phrase
      // itself; `encodeMnemonic` turns it into the UTF-8 bytes of the phrase.
      const { mnemonic } = keyring as HdKeyring;

      if (!mnemonic) {
        throw new Error(
          'Unable to get mnemonic to derive the money account address',
        );
      }

      return {
        entropySource: metadata.id,
        mnemonic: encodeMnemonic(mnemonic),
      };
    },
  )) as unknown as PrimarySeed;
}

/**
 * Derive the money account address.
 *
 * The address is a deterministic BIP-44 derivation of the user's existing
 * primary HD seed at `MONEY_DERIVATION_PATH`, so it can be recomputed at any
 * time from an unlocked wallet.
 *
 * @param messenger - The messenger used to reach the `KeyringController`.
 * @returns The money account address.
 */
export async function deriveMoneyAccountAddress(
  messenger: MoneyAccountAddressMessenger,
): Promise<Hex> {
  const { entropySource, mnemonic } = await getPrimarySeed(messenger);

  const keyring = new MoneyKeyring({
    getMnemonic: async () => mnemonic,
  });

  // `MoneyKeyring` derives lazily and needs an entropy source before it will
  // do anything, so it has to be deserialized before adding the account.
  await keyring.deserialize({ entropySource });

  const [address] = await keyring.addAccounts(1);

  if (!address) {
    throw new Error('Failed to derive the money account address');
  }

  return address;
}
