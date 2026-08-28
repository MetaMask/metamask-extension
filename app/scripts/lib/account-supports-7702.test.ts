import { accountSupports7702 } from './account-supports-7702';

const ADDRESS_MOCK = '0x1234567890123456789012345678901234567890';

function keyringControllerWithType(type: string) {
  return {
    getKeyringForAccount: jest.fn().mockResolvedValue({ type }),
  };
}

describe('accountSupports7702', () => {
  it('returns true for HD keyring accounts', async () => {
    expect(
      await accountSupports7702(
        ADDRESS_MOCK,
        keyringControllerWithType('HD Key Tree'),
      ),
    ).toBe(true);
  });

  it('returns true for simple keyring accounts', async () => {
    expect(
      await accountSupports7702(
        ADDRESS_MOCK,
        keyringControllerWithType('Simple Key Pair'),
      ),
    ).toBe(true);
  });

  it('returns true for money keyring accounts', async () => {
    // Sponsored Money Account transactions (e.g. Monad withdrawals) are
    // externally signed and must publish via the EIP-7702 relay; treating the
    // money keyring as unsupported skipped the relay hook and raw-sent an
    // unsigned payload.
    expect(
      await accountSupports7702(
        ADDRESS_MOCK,
        keyringControllerWithType('Money Keyring'),
      ),
    ).toBe(true);
  });

  it('returns false for hardware keyring accounts', async () => {
    expect(
      await accountSupports7702(
        ADDRESS_MOCK,
        keyringControllerWithType('Ledger Hardware'),
      ),
    ).toBe(false);
  });

  it('returns true when the address is missing', async () => {
    expect(
      await accountSupports7702(undefined, keyringControllerWithType('any')),
    ).toBe(true);
  });

  it('returns true when the keyring lookup fails', async () => {
    expect(
      await accountSupports7702(ADDRESS_MOCK, {
        getKeyringForAccount: jest.fn().mockRejectedValue(new Error('nope')),
      }),
    ).toBe(true);
  });
});
