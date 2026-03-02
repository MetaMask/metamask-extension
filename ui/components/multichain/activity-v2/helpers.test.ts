import type { TransactionMeta } from '@metamask/transaction-controller';
import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';
import type {
  Token,
  TransactionGroup,
  TransactionViewModel,
} from '../../../../shared/lib/multichain/types';
import {
  getPrimaryAmount,
  calculateFiatFromMarketRates,
  mergeAllTransactionsByTime,
  groupAndFlattenMergedTransactions,
} from './helpers';

const ethToken: Token = {
  address: NATIVE_TOKEN_ADDRESS,
  symbol: 'ETH',
  decimals: 18,
  chainId: '0x1',
};

const usdcToken: Token = {
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  symbol: 'USDC',
  decimals: 6,
  chainId: '0x1',
};

describe('getPrimaryAmount', () => {
  it('prefers from over to when both exist', () => {
    const result = getPrimaryAmount({
      from: { token: ethToken, amount: 2000000000000000000n },
      to: { token: usdcToken, amount: 3000000000n },
    });
    expect(result).toStrictEqual({
      amount: '-2',
      token: ethToken,
    });
  });

  it('negates the from amount', () => {
    const result = getPrimaryAmount({
      from: { token: ethToken, amount: 1000000000000000000n },
    });
    expect(result).toStrictEqual({
      amount: '-1',
      token: ethToken,
    });
  });

  it('keeps already-negative from amounts as negative', () => {
    const result = getPrimaryAmount({
      from: { token: ethToken, amount: -500000000000000000n },
    });
    expect(result).toStrictEqual({
      amount: '-0.5',
      token: ethToken,
    });
  });

  it('returns empty object when no amounts provided', () => {
    expect(getPrimaryAmount({})).toStrictEqual({});
  });
});

describe('calculateFiatFromMarketRates', () => {
  const marketRates = {
    1: { [NATIVE_TOKEN_ADDRESS]: 2500 },
  };

  it('returns fiat amount for a valid token and amount', () => {
    const result = calculateFiatFromMarketRates('1.5', ethToken, marketRates);
    expect(result).toBe(3750);
  });

  it('preserves sign for negative amounts', () => {
    const result = calculateFiatFromMarketRates('-1', ethToken, marketRates);
    expect(result).toBe(-2500);
  });

  it('returns undefined when amount, token, or rate is missing', () => {
    expect(
      calculateFiatFromMarketRates(undefined, ethToken, marketRates),
    ).toBeUndefined();
    expect(
      calculateFiatFromMarketRates('1', undefined, marketRates),
    ).toBeUndefined();
    expect(
      calculateFiatFromMarketRates('1', usdcToken, marketRates),
    ).toBeUndefined();
  });
});

function makeLocalGroup(
  overrides: Partial<TransactionMeta> & { time: number; nonce?: string },
): TransactionGroup {
  const { time, nonce = '0x0', ...rest } = overrides;
  const tx = {
    id: `local-${time}`,
    time,
    txParams: { nonce },
    ...rest,
  } as TransactionMeta;
  return {
    primaryTransaction: tx,
    initialTransaction: tx,
    transactions: [tx],
    nonce: nonce as `0x${string}`,
    hasCancelled: false,
    hasRetried: false,
  };
}

function makeApiTx(
  overrides: Partial<TransactionViewModel> & { time: number },
): TransactionViewModel {
  const { time, ...rest } = overrides;
  return {
    id: `api-${time}`,
    time,
    nonce: 0,
    transactionType: '',
    transactionCategory: '',
    ...rest,
  } as TransactionViewModel;
}

describe('mergeAllTransactionsByTime', () => {
  it('returns empty array when no transactions', () => {
    expect(mergeAllTransactionsByTime([], [])).toStrictEqual([]);
  });

  it('sorts mixed local and API transactions by time descending', () => {
    const local = [makeLocalGroup({ time: 1000 })];
    const api = [makeApiTx({ time: 3000 }), makeApiTx({ time: 2000 })];

    const result = mergeAllTransactionsByTime(local, api);

    expect(result.map((r) => r.time)).toStrictEqual([3000, 2000, 1000]);
    expect(result.map((r) => r.type)).toStrictEqual([
      'completed',
      'completed',
      'local',
    ]);
  });

  it('breaks time ties by nonce descending', () => {
    const api = [
      makeApiTx({ time: 1000, nonce: 1 }),
      makeApiTx({ time: 1000, nonce: 5 }),
    ];

    const result = mergeAllTransactionsByTime([], api);

    expect(result.map((r) => r.nonce)).toStrictEqual([5, 1]);
  });
});

describe('groupAndFlattenMergedTransactions', () => {
  it('returns empty array for empty input', () => {
    expect(groupAndFlattenMergedTransactions([])).toStrictEqual([]);
  });

  it('inserts date headers and groups items by day', () => {
    const jan1 = new Date('2025-01-01T10:00:00Z').getTime();
    const jan1Later = new Date('2025-01-01T18:00:00Z').getTime();
    const jan2 = new Date('2025-01-02T12:00:00Z').getTime();

    const merged = mergeAllTransactionsByTime(
      [],
      [
        makeApiTx({ time: jan2 }),
        makeApiTx({ time: jan1Later }),
        makeApiTx({ time: jan1 }),
      ],
    );

    const result = groupAndFlattenMergedTransactions(merged);

    const types = result.map((r) => r.type);
    expect(types).toStrictEqual([
      'date-header',
      'completed',
      'date-header',
      'completed',
      'completed',
    ]);
  });
});
