import {
  isValidPerpsWithdrawAmount,
  PERPS_WITHDRAW_AMOUNT_DECIMALS,
} from './constants';

describe('isValidPerpsWithdrawAmount', () => {
  it('uses six fractional digits for Perps withdraw amount precision', () => {
    expect(PERPS_WITHDRAW_AMOUNT_DECIMALS).toBe(6);
  });

  it('returns true for empty and well-formed amounts up to six decimal places', () => {
    ['', '0', '1', '0.1', '1.01', '100.123456', '.5'].forEach((value) => {
      expect(isValidPerpsWithdrawAmount(value)).toBe(true);
    });
  });

  it('returns false for more than six fractional digits and non-numeric input', () => {
    ['1.1234567', 'abc', '1..2', '1e6', '-1'].forEach((value) => {
      expect(isValidPerpsWithdrawAmount(value)).toBe(false);
    });
  });
});
