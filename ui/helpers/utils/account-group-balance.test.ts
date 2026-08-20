import { getAccountGroupDisplayBalance } from './account-group-balance';

describe('getAccountGroupDisplayBalance', () => {
  const formatCurrency = jest.fn(
    (value: number, currency: string) => `${currency}:${value}`,
  );

  beforeEach(() => {
    formatCurrency.mockClear();
  });

  it('formats a non-zero balance', () => {
    expect(
      getAccountGroupDisplayBalance(
        { totalBalanceInUserCurrency: 2400, userCurrency: 'usd' },
        formatCurrency,
      ),
    ).toBe('usd:2400');
    expect(formatCurrency).toHaveBeenCalledWith(2400, 'usd');
  });

  it('returns undefined when the group balance is missing', () => {
    expect(
      getAccountGroupDisplayBalance(undefined, formatCurrency),
    ).toBeUndefined();
    expect(formatCurrency).not.toHaveBeenCalled();
  });

  // An account group whose balance has not been fetched yet aggregates to 0,
  // exactly like a genuinely empty one, so neither renders a balance.
  it('returns undefined when the balance is zero', () => {
    expect(
      getAccountGroupDisplayBalance(
        { totalBalanceInUserCurrency: 0, userCurrency: 'usd' },
        formatCurrency,
      ),
    ).toBeUndefined();
    expect(formatCurrency).not.toHaveBeenCalled();
  });

  it('returns undefined when the balance is undefined', () => {
    expect(
      getAccountGroupDisplayBalance({ userCurrency: 'usd' }, formatCurrency),
    ).toBeUndefined();
    expect(formatCurrency).not.toHaveBeenCalled();
  });

  it('returns undefined when the currency is missing', () => {
    expect(
      getAccountGroupDisplayBalance(
        { totalBalanceInUserCurrency: 2400 },
        formatCurrency,
      ),
    ).toBeUndefined();
    expect(formatCurrency).not.toHaveBeenCalled();
  });
});
