/* eslint-disable @typescript-eslint/naming-convention */
import { MetaMetricsEventName } from '../constants/metametrics';
import {
  getAmountBucket,
  AmountBucket,
  getMidnightISOTimestamp,
  hasNonZeroTokenBalance,
  hasNonZeroMultichainBalance,
  getWalletFundsObtainedEventProperties,
} from './wallet-funds-obtained-metric';

describe('getAmountBucket', () => {
  it('returns Low bucket for amounts less than $100', () => {
    expect(getAmountBucket('0')).toBe(AmountBucket.Low);
    expect(getAmountBucket('50')).toBe(AmountBucket.Low);
    expect(getAmountBucket('99.99')).toBe(AmountBucket.Low);
  });

  it('returns Medium bucket for amounts between $100 and $1000', () => {
    expect(getAmountBucket('100')).toBe(AmountBucket.Medium);
    expect(getAmountBucket('500')).toBe(AmountBucket.Medium);
    expect(getAmountBucket('999.99')).toBe(AmountBucket.Medium);
  });

  it('returns High bucket for amounts greater than $1000', () => {
    expect(getAmountBucket('1000.01')).toBe(AmountBucket.High);
    expect(getAmountBucket('5000')).toBe(AmountBucket.High);
    expect(getAmountBucket('1000000')).toBe(AmountBucket.High);
  });
});

describe('getMidnightISOTimestamp', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-07T15:30:00.000Z')); // Fixed time for testing
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns a timestamp with time set to midnight (00:00:00.000) in local timezone', () => {
    const result = getMidnightISOTimestamp();
    const date = new Date(result);

    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  it('returns a timestamp for the current day', () => {
    const result = getMidnightISOTimestamp();
    const resultDate = new Date(result);
    const today = new Date();

    expect(resultDate.getDate()).toBe(today.getDate());
    expect(resultDate.getMonth()).toBe(today.getMonth());
    expect(resultDate.getFullYear()).toBe(today.getFullYear());
  });
});

describe('hasNonZeroTokenBalance', () => {
  it('returns true for any non-zero balance', () => {
    const tokenBalances = {
      account1: {
        chain1: {
          token1: '0x0',
        },
      },
      account2: {
        chain1: {
          token1: '0x0',
        },
        chain2: {
          token1: '0x0',
          token2: '0x1', // Non-zero
        },
      },
    };
    expect(hasNonZeroTokenBalance(tokenBalances)).toBe(true);
  });

  it('returns false when all token balances are zero', () => {
    const tokenBalances = {
      account1: {
        chain1: {
          token1: '0x0',
          token2: '0x0',
        },
      },
    };
    expect(hasNonZeroTokenBalance(tokenBalances)).toBe(false);
  });

  it('returns false when token balances object is empty', () => {
    expect(hasNonZeroTokenBalance({})).toBe(false);
  });

  it('handles nested empty objects', () => {
    const tokenBalances = {
      account1: {},
      account2: {
        chain1: {},
      },
    };
    expect(hasNonZeroTokenBalance(tokenBalances)).toBe(false);
  });
});

describe('hasNonZeroMultichainBalance', () => {
  it('returns true for any non-zero balance', () => {
    const multichainBalances = {
      account1: {
        chain1: {
          amount: '0',
          unit: 'BTC',
        },
      },
      account2: {
        chain1: {
          amount: '0',
          unit: 'SOL',
        },
        chain2: {
          amount: '50', // Non-zero
          unit: 'SOL',
        },
      },
    };
    expect(hasNonZeroMultichainBalance(multichainBalances)).toBe(true);
  });

  it('returns false when all multichain balances are zero', () => {
    const multichainBalances = {
      account1: {
        chain1: {
          amount: '0',
          unit: 'SOL',
        },
      },
    };
    expect(hasNonZeroMultichainBalance(multichainBalances)).toBe(false);
  });

  it('returns false when multichain balances object is empty', () => {
    expect(hasNonZeroMultichainBalance({})).toBe(false);
  });

  it('handles nested empty objects', () => {
    const multichainBalances = {
      account1: {},
      account2: {
        chain1: {
          amount: '0',
          unit: 'SOL',
        },
      },
    };
    expect(hasNonZeroMultichainBalance(multichainBalances)).toBe(false);
  });

  it('handles chainBalances with empty amount property', () => {
    const multichainBalances = {
      account1: {
        chain1: {
          amount: '',
          unit: 'SOL',
        },
      },
    };
    expect(hasNonZeroMultichainBalance(multichainBalances)).toBe(false);
  });
});

describe('getWalletFundsObtainedEventProperties', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-07T15:30:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns event object correctly', () => {
    const result = getWalletFundsObtainedEventProperties({
      chainId: 1,
      amountUsd: '50',
    });

    // Calculate expected timestamp: local midnight for the current date
    const expectedDate = new Date('2024-06-07T15:30:00.000Z');
    expectedDate.setHours(0, 0, 0, 0);
    const expectedTimestamp = expectedDate.toISOString();

    expect(result.event).toBe(MetaMetricsEventName.WalletFundsObtained);
    expect(result.timestamp).toStrictEqual(expectedTimestamp);
    expect(result.properties).toStrictEqual({
      chain_id_caip: 'eip155:1',
      funding_amount_usd: AmountBucket.Low,
    });
  });
});
