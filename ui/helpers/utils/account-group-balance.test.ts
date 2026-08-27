import { getAccountGroupDisplayBalance } from './account-group-balance';

describe('getAccountGroupDisplayBalance', () => {
  it('returns the amount and currency for a non-zero balance', () => {
    expect(
      getAccountGroupDisplayBalance({
        totalBalanceInUserCurrency: 2400,
        userCurrency: 'usd',
      }),
    ).toStrictEqual({ amount: 2400, currency: 'usd' });
  });

  it('returns undefined when the group balance is missing', () => {
    expect(getAccountGroupDisplayBalance(undefined)).toBeUndefined();
  });

  // An account group whose balance has not been fetched yet aggregates to 0,
  // exactly like a genuinely empty one, so neither renders a balance.
  it('returns undefined when the balance is zero', () => {
    expect(
      getAccountGroupDisplayBalance({
        totalBalanceInUserCurrency: 0,
        userCurrency: 'usd',
      }),
    ).toBeUndefined();
  });

  it('returns undefined when the balance is undefined', () => {
    expect(
      getAccountGroupDisplayBalance({ userCurrency: 'usd' }),
    ).toBeUndefined();
  });

  it('returns undefined when the currency is missing', () => {
    expect(
      getAccountGroupDisplayBalance({ totalBalanceInUserCurrency: 2400 }),
    ).toBeUndefined();
  });
});
