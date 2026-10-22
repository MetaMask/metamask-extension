import { MoneyKeyring } from '@metamask/eth-money-keyring';
import { MoneyKeyring as MoneyKeyringV2 } from '@metamask/eth-money-keyring/v2';
import { KeyringTypes } from '@metamask/keyring-controller';
import { encodeMnemonic } from '@metamask/keyring-sdk';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { bytesToHex } from '@metamask/utils';
import {
  buildMoneyKeyringBuilder,
  buildMoneyKeyringV2Builder,
  getMfaMoneyAccountEncryptionKey,
  getMoneyAccountPrivateKey,
  type MoneyKeyringBuilderMessenger,
} from './money-keyring-builder';

const TEST_MNEMONIC =
  'spread raise short crane omit tent fringe mandate neglect detail suspect cradle';

/**
 * The money account address for `TEST_MNEMONIC`. The same vector
 * `get-money-account-address.test.ts` asserts, so a registered keyring and D3's
 * bare deriver are held to producing the same account.
 */
const EXPECTED_MONEY_ADDRESS = '0xd5fe9b0579443e7025cf3309ba420977710e7183';

/**
 * The private key for `EXPECTED_MONEY_ADDRESS`. Hard-coded so that any change
 * to the derivation path, the mnemonic encoding, or the account index shows up
 * as a failure here.
 */
const EXPECTED_MONEY_PRIVATE_KEY =
  'c523f60cc6d537f09a17d785729287e782e4eac3eb9a1c3cc6b034b454b98756';

/**
 * HKDF-SHA256 of `EXPECTED_MONEY_PRIVATE_KEY` with the MFA encryption-key
 * info string. Hard-coded so a change to the label, hash, or length fails here.
 */
const EXPECTED_MFA_ENCRYPTION_KEY =
  '0xeab419629b14806650848a2ad513616e91ea0684d467a81d7dafa441c73146f3';

const ENTROPY_SOURCE = 'primary-hd-keyring-id';

/**
 * Encode a mnemonic the way `HdKeyring` holds it internally: a byte view over
 * the 16-bit indices of its words in the English wordlist.
 *
 * @param mnemonic - The mnemonic phrase.
 * @returns The wordlist indices as a byte array.
 */
function toMnemonicIndicesBytes(mnemonic: string): Uint8Array {
  const indices = mnemonic.split(' ').map((word) => wordlist.indexOf(word));

  return new Uint8Array(new Uint16Array(indices).buffer);
}

type KeyringFilter = (
  keyring: { type: string },
  metadata: { id: string },
) => boolean;

type WithKeyringUnsafeCall = [
  'KeyringController:withKeyringUnsafe',
  { filter: KeyringFilter },
  (args: { keyring: unknown }) => Promise<unknown>,
];

/**
 * Build a messenger whose `withKeyringUnsafe` hands the callback a stub HD
 * keyring, and record the calls so the selector can be inspected.
 *
 * @param options - Options.
 * @param options.mnemonic - The mnemonic the stub keyring holds, or `null` for
 * a keyring that has none.
 * @returns The messenger and the recorded calls.
 */
function buildMessengerMock({
  mnemonic = TEST_MNEMONIC,
}: { mnemonic?: string | null } = {}) {
  const calls: WithKeyringUnsafeCall[] = [];

  const keyring = {
    type: KeyringTypes.hd,
    mnemonic: mnemonic === null ? null : toMnemonicIndicesBytes(mnemonic),
  };

  const messenger = {
    call: (...args: unknown[]) => {
      calls.push(args as WithKeyringUnsafeCall);
      const [, , operation] = args as WithKeyringUnsafeCall;
      return operation({ keyring });
    },
  } as unknown as MoneyKeyringBuilderMessenger;

  return { messenger, calls };
}

describe('getMoneyAccountPrivateKey', () => {
  it('returns the private key of the money account for the entropy source', async () => {
    const { messenger } = buildMessengerMock();

    await expect(
      getMoneyAccountPrivateKey(messenger, ENTROPY_SOURCE),
    ).resolves.toBe(EXPECTED_MONEY_PRIVATE_KEY);
  });

  it('returns a different key for a different seed', async () => {
    const { messenger } = buildMessengerMock({
      mnemonic:
        'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
    });

    const privateKey = await getMoneyAccountPrivateKey(
      messenger,
      ENTROPY_SOURCE,
    );

    expect(privateKey).not.toBe(EXPECTED_MONEY_PRIVATE_KEY);
  });

  it('reads the mnemonic for the given entropy source without taking the controller lock', async () => {
    const { messenger, calls } = buildMessengerMock();

    await getMoneyAccountPrivateKey(messenger, ENTROPY_SOURCE);

    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe('KeyringController:withKeyringUnsafe');
    expect(
      calls[0][1].filter({ type: KeyringTypes.hd }, { id: ENTROPY_SOURCE }),
    ).toBe(true);
    expect(
      calls[0][1].filter({ type: KeyringTypes.hd }, { id: 'other-srp' }),
    ).toBe(false);
  });

  it('throws when the selected keyring has no mnemonic', async () => {
    const { messenger } = buildMessengerMock({ mnemonic: null });

    await expect(
      getMoneyAccountPrivateKey(messenger, ENTROPY_SOURCE),
    ).rejects.toThrow('Unable to get mnemonic to initialize MoneyKeyring');
  });
});

describe('getMfaMoneyAccountEncryptionKey', () => {
  it('derives the AES-256 MFA key from the money account private key', async () => {
    const { messenger } = buildMessengerMock();
    const privateKey = await getMoneyAccountPrivateKey(
      messenger,
      ENTROPY_SOURCE,
    );

    const encryptionKey = getMfaMoneyAccountEncryptionKey(privateKey);

    expect(encryptionKey).toHaveLength(32);
    expect(bytesToHex(encryptionKey)).toBe(EXPECTED_MFA_ENCRYPTION_KEY);
  });

  it('accepts a 0x-prefixed private key', () => {
    expect(
      bytesToHex(
        getMfaMoneyAccountEncryptionKey(`0x${EXPECTED_MONEY_PRIVATE_KEY}`),
      ),
    ).toBe(EXPECTED_MFA_ENCRYPTION_KEY);
  });

  it('derives a different key for a different private key', () => {
    const encryptionKey = getMfaMoneyAccountEncryptionKey('11'.repeat(32));

    expect(bytesToHex(encryptionKey)).not.toBe(EXPECTED_MFA_ENCRYPTION_KEY);
    expect(encryptionKey).toHaveLength(32);
  });

  it('throws when the private key is not 32 bytes', () => {
    expect(() => getMfaMoneyAccountEncryptionKey('abcd')).toThrow(
      'Money account private key must be a 32-byte hex string',
    );
  });
});

describe('buildMoneyKeyringBuilder', () => {
  it('is keyed by the Money keyring type', () => {
    const { messenger } = buildMessengerMock();

    expect(buildMoneyKeyringBuilder(messenger).type).toBe(KeyringTypes.money);
    expect(buildMoneyKeyringBuilder(messenger).type).toBe('Money Keyring');
  });

  it('builds a MoneyKeyring', () => {
    const { messenger } = buildMessengerMock();

    expect(buildMoneyKeyringBuilder(messenger)()).toBeInstanceOf(MoneyKeyring);
  });

  it('derives the money account for the primary seed', async () => {
    const { messenger } = buildMessengerMock();

    const keyring = buildMoneyKeyringBuilder(messenger)();
    // The keyring holds only the entropy source; the mnemonic is resolved
    // through the callback when it first has to derive.
    await keyring.deserialize({ entropySource: ENTROPY_SOURCE });

    await expect(keyring.addAccounts(1)).resolves.toStrictEqual([
      EXPECTED_MONEY_ADDRESS,
    ]);
  });

  it('reads the mnemonic without taking the controller lock', async () => {
    const { messenger, calls } = buildMessengerMock();

    const keyring = buildMoneyKeyringBuilder(messenger)();
    await keyring.deserialize({ entropySource: ENTROPY_SOURCE });
    await keyring.addAccounts(1);

    // `withKeyringUnsafe`, not `withKeyring`: the derivation above can run
    // inside a locked `withKeyring`, so a locking read would deadlock.
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe('KeyringController:withKeyringUnsafe');
  });

  it('selects the HD keyring matching the entropy source, and no other', async () => {
    const { messenger, calls } = buildMessengerMock();

    const keyring = buildMoneyKeyringBuilder(messenger)();
    await keyring.deserialize({ entropySource: ENTROPY_SOURCE });
    await keyring.addAccounts(1);

    const { filter } = calls[0][1];

    expect(filter({ type: KeyringTypes.hd }, { id: ENTROPY_SOURCE })).toBe(
      true,
    );
    // A second HD keyring (another SRP) must not be picked.
    expect(filter({ type: KeyringTypes.hd }, { id: 'other-srp' })).toBe(false);
    // Nor a non-HD keyring that happens to share the id.
    expect(filter({ type: KeyringTypes.simple }, { id: ENTROPY_SOURCE })).toBe(
      false,
    );
  });

  it('encodes the mnemonic the way MoneyKeyring expects it', async () => {
    const { messenger, calls } = buildMessengerMock();

    const keyring = buildMoneyKeyringBuilder(messenger)();
    await keyring.deserialize({ entropySource: ENTROPY_SOURCE });
    await keyring.addAccounts(1);

    const indices = toMnemonicIndicesBytes(TEST_MNEMONIC);

    await expect(
      calls[0][2]({ keyring: { mnemonic: indices } }),
    ).resolves.toStrictEqual(encodeMnemonic(indices));
  });

  it('throws when the selected keyring has no mnemonic', async () => {
    const { messenger } = buildMessengerMock({ mnemonic: null });

    const keyring = buildMoneyKeyringBuilder(messenger)();
    await keyring.deserialize({ entropySource: ENTROPY_SOURCE });

    await expect(keyring.addAccounts(1)).rejects.toThrow(
      'Unable to get mnemonic to initialize MoneyKeyring',
    );
  });

  it('does not read the mnemonic until the keyring needs it', () => {
    const { messenger, calls } = buildMessengerMock();

    buildMoneyKeyringBuilder(messenger)();

    expect(calls).toStrictEqual([]);
  });
});

describe('buildMoneyKeyringV2Builder', () => {
  it('is keyed by the legacy Money keyring type, which is how the controller dispatches it', () => {
    expect(buildMoneyKeyringV2Builder().type).toBe(MoneyKeyring.type);
  });

  it('wraps the legacy keyring, which it takes directly rather than in an options object', async () => {
    const legacyKeyring = buildMoneyKeyringBuilder(
      buildMessengerMock().messenger,
    )();
    await legacyKeyring.deserialize({ entropySource: ENTROPY_SOURCE });
    await legacyKeyring.addAccounts(1);

    // The metadata argument the hardware V2 builders use for their entropy
    // source is deliberately ignored: the Money keyring already knows its own.
    const wrapper = buildMoneyKeyringV2Builder()(legacyKeyring as never, {
      id: 'ignored-metadata-id',
      name: '',
    }) as unknown as MoneyKeyringV2;

    expect(wrapper).toBeInstanceOf(MoneyKeyringV2);
    expect(wrapper.entropySource).toBe(ENTROPY_SOURCE);
    expect(
      (await wrapper.getAccounts()).map((account) => account.address),
    ).toStrictEqual([EXPECTED_MONEY_ADDRESS]);
  });
});
