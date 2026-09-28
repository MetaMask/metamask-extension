import { isMpcBackedMoneyAccount } from './mpc-money-account';

describe('isMpcBackedMoneyAccount', () => {
  it('accepts an account marked as an MPC keyring account', () => {
    expect(
      isMpcBackedMoneyAccount({
        address: '0x2222222222222222222222222222222222222222',
        options: { mpcKeyring: true },
      }),
    ).toBe(true);
  });

  it('rejects an HD-derived money account', () => {
    expect(
      isMpcBackedMoneyAccount({
        address: '0x1111111111111111111111111111111111111111',
        options: { entropy: { id: 'primary' } },
      }),
    ).toBe(false);
  });

  it('rejects a missing account', () => {
    expect(isMpcBackedMoneyAccount(undefined)).toBe(false);
  });
});
