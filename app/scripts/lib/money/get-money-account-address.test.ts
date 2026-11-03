import type { HdKeyring } from '@metamask/eth-hd-keyring';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import {
  deriveMoneyAccountAddress,
  type MoneyAccountAddressMessenger,
} from './get-money-account-address';

const TEST_MNEMONIC =
  'spread raise short crane omit tent fringe mandate neglect detail suspect cradle';

/**
 * The money account address for `TEST_MNEMONIC`, derived at
 * `m/44'/4392018'/0'/0`. Hard-coded so that any change to the derivation path,
 * the mnemonic encoding, or the keyring version shows up as a failure here.
 */
const EXPECTED_MONEY_ADDRESS = '0xd5fe9b0579443e7025cf3309ba420977710e7183';

const PRIMARY_KEYRING_ID = 'primary-hd-keyring-id';

/**
 * Encode a mnemonic the way `HdKeyring` holds it internally
 *
 * @param mnemonic - The mnemonic to encode.
 */
function toMnemonicIndicesBytes(mnemonic: string): Uint8Array {
  const indices = mnemonic.split(' ').map((word) => wordlist.indexOf(word));

  return new Uint8Array(new Uint16Array(indices).buffer);
}

function createMockMessenger({
  mnemonic = TEST_MNEMONIC,
}: { mnemonic?: string | null } = {}) {
  const keyring = {
    type: 'HD Key Tree',
    mnemonic: mnemonic === null ? null : toMnemonicIndicesBytes(mnemonic),
  } as unknown as HdKeyring;

  const call = jest.fn(
    async (
      _action: string,
      _selector: unknown,
      operation: (args: {
        keyring: HdKeyring;
        metadata: { id: string; name: string };
      }) => Promise<unknown>,
    ) =>
      operation({
        keyring,
        metadata: { id: PRIMARY_KEYRING_ID, name: '' },
      }),
  );

  return {
    messenger: { call } as unknown as MoneyAccountAddressMessenger,
    call,
  };
}

describe('deriveMoneyAccountAddress', () => {
  it('derives the money account address from the primary HD seed', async () => {
    const { messenger } = createMockMessenger();

    const address = await deriveMoneyAccountAddress(messenger);

    expect(address.toLowerCase()).toBe(EXPECTED_MONEY_ADDRESS);
  });

  it('derives the same address on every call', async () => {
    const { messenger } = createMockMessenger();

    const first = await deriveMoneyAccountAddress(messenger);
    const second = await deriveMoneyAccountAddress(messenger);

    expect(second).toBe(first);
  });

  it('derives a different address for a different seed', async () => {
    const { messenger } = createMockMessenger({
      mnemonic:
        'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
    });

    const address = await deriveMoneyAccountAddress(messenger);

    expect(address.toLowerCase()).not.toBe(EXPECTED_MONEY_ADDRESS);
  });

  it('selects the primary HD keyring without requiring the password', async () => {
    const { messenger, call } = createMockMessenger();

    await deriveMoneyAccountAddress(messenger);

    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith(
      'KeyringController:withKeyringUnsafe',
      { type: 'HD Key Tree' },
      expect.any(Function),
    );
  });

  it('throws if the primary keyring has no mnemonic', async () => {
    const { messenger } = createMockMessenger({ mnemonic: null });

    await expect(deriveMoneyAccountAddress(messenger)).rejects.toThrow(
      'Unable to get mnemonic to derive the money account address',
    );
  });
});
