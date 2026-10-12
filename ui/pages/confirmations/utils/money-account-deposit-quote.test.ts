import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';

import { doesDepositQuoteMatchAmount } from './money-account-deposit-quote';

describe('doesDepositQuoteMatchAmount', () => {
  it('matches a quote requested for the typed mUSD amount', () => {
    expect(
      doesDepositQuoteMatchAmount(
        {
          strategy: TransactionPayStrategy.Relay,
          request: { targetAmountMinimum: '1000000' },
        },
        '1',
      ),
    ).toBe(true);
  });

  it('matches a hex target amount for the same raw value', () => {
    expect(
      doesDepositQuoteMatchAmount(
        {
          strategy: TransactionPayStrategy.Relay,
          request: { targetAmountMinimum: '0xf4240' },
        },
        '1',
      ),
    ).toBe(true);
  });

  it('rejects a stale Max quote after the user types a smaller amount', () => {
    expect(
      doesDepositQuoteMatchAmount(
        {
          strategy: TransactionPayStrategy.Relay,
          request: {
            isMaxAmount: true,
            sourceTokenAmount: '2208000',
            targetAmountMinimum: '2208000',
          },
        },
        '1',
      ),
    ).toBe(false);
  });

  it('accepts a Max quote when the recorded amount is that Max balance', () => {
    expect(
      doesDepositQuoteMatchAmount(
        {
          strategy: TransactionPayStrategy.Relay,
          request: {
            isMaxAmount: true,
            sourceTokenAmount: '1123456',
            targetAmountMinimum: '0',
          },
        },
        '1.123456',
      ),
    ).toBe(true);
  });

  it('rejects a no-op quote and a missing quote', () => {
    expect(
      doesDepositQuoteMatchAmount(
        {
          strategy: TransactionPayStrategy.None,
          request: { targetAmountMinimum: '1000000' },
        },
        '1',
      ),
    ).toBe(false);
    expect(doesDepositQuoteMatchAmount(undefined, '1')).toBe(false);
  });

  it('rejects a zero or missing amount', () => {
    const quote = {
      strategy: TransactionPayStrategy.Relay,
      request: { targetAmountMinimum: '1000000' },
    };

    expect(doesDepositQuoteMatchAmount(quote, '0')).toBe(false);
    expect(doesDepositQuoteMatchAmount(quote, undefined)).toBe(false);
  });

  it('rejects an amount that cannot be parsed', () => {
    expect(
      doesDepositQuoteMatchAmount(
        {
          strategy: TransactionPayStrategy.Relay,
          request: { targetAmountMinimum: '1000000' },
        },
        'foo',
      ),
    ).toBe(false);
  });

  it('rejects a Max quote that has no source amount', () => {
    expect(
      doesDepositQuoteMatchAmount(
        {
          strategy: TransactionPayStrategy.Relay,
          request: { isMaxAmount: true, targetAmountMinimum: '0' },
        },
        '1',
      ),
    ).toBe(false);
  });

  it('rejects a target amount that is not an integer', () => {
    expect(
      doesDepositQuoteMatchAmount(
        {
          strategy: TransactionPayStrategy.Relay,
          request: { targetAmountMinimum: 'not-raw' },
        },
        '1',
      ),
    ).toBe(false);
  });
});
