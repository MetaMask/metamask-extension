import { hkdfSha256 } from '@metamask/cryptography/hkdf';
import { HdKeyring } from '@metamask/eth-hd-keyring';
import {
  MONEY_DERIVATION_PATH,
  MoneyKeyring,
} from '@metamask/eth-money-keyring';
import { MoneyKeyring as MoneyKeyringV2 } from '@metamask/eth-money-keyring/v2';
import {
  KeyringTypes,
  type KeyringControllerWithKeyringUnsafeAction,
  type KeyringV2Builder,
} from '@metamask/keyring-controller';
import { encodeMnemonic } from '@metamask/keyring-sdk';
import type { Messenger } from '@metamask/messenger';
import { add0x, hexToBytes } from '@metamask/utils';

export type MoneyKeyringBuilderMessenger = Messenger<
  'MoneyKeyringBuilder',
  KeyringControllerWithKeyringUnsafeAction
>;

/**
 * HKDF info that binds the MFA encryption key to this purpose. The label is
 * mixed into the output, so the AES key stays distinct from the account key
 * it is derived from.
 */
const MFA_MONEY_ACCOUNT_ENCRYPTION_KEY_INFO = new TextEncoder().encode(
  'metamask:money-account:mfa:encryption-key:v1',
);

/**
 * Salt for the MFA encryption-key HKDF. 32 zero bytes is the SHA-256 default
 * salt from RFC 5869.
 */
const MFA_MONEY_ACCOUNT_ENCRYPTION_KEY_SALT = new Uint8Array(32);

/** AES-256 keys are 32 bytes. */
const AES_256_KEY_LENGTH = 32;

/**
 * Read the mnemonic of the HD keyring identified by an entropy source id.
 *
 * `MoneyKeyring` never stores a mnemonic itself: it holds only the entropy
 * source id, and resolves the mnemonic through this callback whenever it needs
 * to derive or sign. The callback is therefore invoked lazily, and — because
 * `createMoneyAccount` derives the account from inside a locked
 * `KeyringController:withKeyring` — potentially while the controller's mutex is
 * held. `withKeyringUnsafe` is what makes that safe: it takes no lock, so this
 * cannot deadlock against the operation that triggered it. The read is
 * legitimately "unsafe"-eligible, being a read of a field that an `HdKeyring`
 * sets during `deserialize` and never mutates.
 *
 * @param messenger - The messenger used to reach the `KeyringController`.
 * @param entropySource - The id of the keyring whose mnemonic to read.
 * @returns The mnemonic as UTF-8 byte values, which is what `MoneyKeyring`
 * expects.
 */
async function getMnemonic(
  messenger: MoneyKeyringBuilderMessenger,
  entropySource: string,
): Promise<number[]> {
  return (await messenger.call(
    'KeyringController:withKeyringUnsafe',
    {
      filter: (keyring, metadata) =>
        keyring.type === KeyringTypes.hd && metadata.id === entropySource,
    },
    async ({ keyring }) => {
      // `mnemonic` holds wordlist indices as a byte view, not the phrase
      // itself; `encodeMnemonic` turns it into the UTF-8 bytes of the phrase.
      const { mnemonic } = keyring as HdKeyring;

      if (!mnemonic) {
        throw new Error('Unable to get mnemonic to initialize MoneyKeyring');
      }

      return encodeMnemonic(mnemonic);
      // The action type erases `withKeyringUnsafe`'s `CallbackResult` generic
      // to its `void` default, so the callback's return type is lost here.
    },
  )) as unknown as number[];
}

/**
 * Derive the private key of the Money account for an entropy source.
 *
 * The account is the first account on `MONEY_DERIVATION_PATH`, the same
 * account `MoneyKeyring` creates. The mnemonic is resolved the same way the
 * keyring resolves it: through `withKeyringUnsafe`, which takes no lock, so
 * this can run while the controller mutex is held.
 *
 * @param messenger - The messenger used to reach the `KeyringController`.
 * @param entropySource - The id of the HD keyring the Money account is derived
 * from.
 * @returns The private key as a hex string without a `0x` prefix, which is
 * what `HdKeyring.exportAccount` returns.
 */
export async function getMoneyAccountPrivateKey(
  messenger: MoneyKeyringBuilderMessenger,
  entropySource: string,
): Promise<string> {
  const mnemonic = await getMnemonic(messenger, entropySource);

  const keyring = new HdKeyring();
  await keyring.deserialize({
    mnemonic,
    numberOfAccounts: 1,
    hdPath: MONEY_DERIVATION_PATH,
  });

  const [address] = await keyring.getAccounts();

  if (!address) {
    throw new Error('Failed to derive the money account private key');
  }

  return keyring.exportAccount(address);
}

/**
 * Derive the AES-256 key used to encrypt Money account MFA material.
 *
 * The input is the hex private key returned by
 * {@link getMoneyAccountPrivateKey}. HKDF-SHA256 expands that key to 32 bytes
 * labeled with `metamask:money-account:mfa:encryption-key:v1`.
 *
 * @param moneyAccountPrivateKey - The Money account private key, as hex. A
 * `0x` prefix is accepted.
 * @returns A 32-byte AES-256 key.
 */
export async function getMfaMoneyAccountEncryptionKey(
  moneyAccountPrivateKey: string,
): Promise<Uint8Array> {
  // `hexToBytes` returns a view over `ArrayBufferLike`, which includes
  // `SharedArrayBuffer`. WebCrypto's `BufferSource` only accepts an
  // `ArrayBuffer`, so copy into a fresh one.
  const privateKeyBytes = new Uint8Array(
    hexToBytes(add0x(moneyAccountPrivateKey)),
  );

  if (privateKeyBytes.length !== AES_256_KEY_LENGTH) {
    throw new Error('Money account private key must be a 32-byte hex string');
  }

  return hkdfSha256(
    privateKeyBytes,
    MFA_MONEY_ACCOUNT_ENCRYPTION_KEY_SALT,
    MFA_MONEY_ACCOUNT_ENCRYPTION_KEY_INFO,
    AES_256_KEY_LENGTH,
  );
}

/**
 * Build the V1 keyring builder for the Money keyring.
 *
 * The builder is registered unconditionally, and not behind the Money feature
 * flag. A builder is what lets `KeyringController` recognise the
 * `"Money Keyring"` type while deserializing the vault, so a user who has a
 * Money keyring must always have the builder available — including when the
 * flag has since been turned off. Registering it creates nothing on its own:
 * the keyring only enters the vault when `MoneyAccountController` asks for it.
 *
 * @param messenger - The messenger used to resolve the mnemonic.
 * @returns The Money keyring builder.
 */
export function buildMoneyKeyringBuilder(
  messenger: MoneyKeyringBuilderMessenger,
) {
  const builder = () =>
    new MoneyKeyring({
      getMnemonic: async (entropySource: string) =>
        getMnemonic(messenger, entropySource),
    });

  builder.type = MoneyKeyring.type;

  return builder;
}

/**
 * Build the V2 keyring builder for the Money keyring.
 *
 * Unlike the hardware V2 wrappers, `MoneyKeyringV2` takes the legacy keyring
 * directly rather than a `{ legacyKeyring, entropySource }` options object —
 * it reads the entropy source from the wrapped keyring, which already knows it.
 *
 * @returns The Money keyring V2 builder.
 */
export function buildMoneyKeyringV2Builder(): KeyringV2Builder {
  const builder = Object.assign(
    (keyring: unknown) => new MoneyKeyringV2(keyring as MoneyKeyring),
    { type: MoneyKeyring.type },
  );

  // `KeyringV2Builder` declares its parameter and return types in terms of
  // `@metamask/keyring-controller`'s `Keyring` / `KeyringV2`, which the wrapper
  // satisfies structurally; this single boundary cast keeps callers free of
  // repeated assertions, as it does for the hardware builders.
  return builder as unknown as KeyringV2Builder;
}
