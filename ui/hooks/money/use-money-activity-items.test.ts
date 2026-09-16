import { renderHook } from '@testing-library/react';
import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { AccountsApiActivity } from '../../pages/money/types/money-activity';
import { MoneyActivityFilter } from '../../pages/money/utils/money-activity-filters';
import MOCK_MONEY_TRANSACTIONS from '../../pages/money/constants/mock-activity-data';
import { useMoneyAccountTransactions } from './use-money-account-transactions';
import { useMoneyAccountApiActivity } from './use-money-account-api-activity';
import {
  AUTO_FILL_MAX_PAGES,
  buildMergedMoneyActivityBuckets,
  mergeMoneyActivity,
  useMoneyActivityItems,
} from './use-money-activity-items';

jest.mock('./use-money-account-transactions');
jest.mock('./use-money-account-api-activity');

const mockUseMoneyAccountTransactions = jest.mocked(
  useMoneyAccountTransactions,
);
const mockUseMoneyAccountApiActivity = jest.mocked(useMoneyAccountApiActivity);

function onchainTx(
  id: string,
  time: number,
  hash?: Hex,
  type: TransactionType = TransactionType.moneyAccountDeposit,
): TransactionMeta {
  return {
    id,
    time,
    hash,
    type,
    chainId: '0x8f',
    txParams: { from: '0x1', to: '0x2', value: '0x0' },
  } as unknown as TransactionMeta;
}

function cardTx(hash: Hex, time: number): AccountsApiActivity {
  return {
    kind: 'card',
    hash,
    time,
    chainId: '0x8f',
    token: { address: '0xtoken', symbol: 'mUSD', decimals: 6 },
    amount: '1000000',
    paidTo: '0xmerchant',
  };
}

const deposit = onchainTx('dep', 40);
const transfer = onchainTx(
  'xfer',
  30,
  undefined,
  TransactionType.moneyAccountWithdraw,
);
const onchain = {
  all: [deposit, transfer],
  deposits: [deposit],
  transfers: [transfer],
};

describe('mergeMoneyActivity', () => {
  it('drops on-chain rows whose hash is represented by the API', () => {
    const shared = '0xCaRd' as Hex;
    const local = onchainTx('dup', 200, shared);
    const api = cardTx('0xcard' as Hex, 200);

    expect(
      mergeMoneyActivity([local], [api]).map((item) => item.id),
    ).toStrictEqual(['card:0xcard']);
  });

  it('sorts by time then stable id', () => {
    const older = onchainTx('a', 1);
    const newer = cardTx('0xnew' as Hex, 2);

    expect(
      mergeMoneyActivity([older], [newer]).map((item) => item.id),
    ).toStrictEqual(['card:0xnew', 'a']);
  });
});

describe('buildMergedMoneyActivityBuckets', () => {
  const card = cardTx('0xcard' as Hex, 200);
  const cashback: AccountsApiActivity = {
    ...cardTx('0xback' as Hex, 250),
    kind: 'cashback',
    receivedFrom: '0xrewarder',
  };

  it('keeps API rows in All only', () => {
    const buckets = buildMergedMoneyActivityBuckets(onchain, [card, cashback]);
    const ids = (filter: MoneyActivityFilter) =>
      buckets[filter].map((item) => item.id);

    expect(ids(MoneyActivityFilter.All)).toStrictEqual([
      'cashback:0xback',
      'card:0xcard',
      'dep',
      'xfer',
    ]);
    expect(ids(MoneyActivityFilter.Deposits)).toStrictEqual(['dep']);
    expect(ids(MoneyActivityFilter.Transfers)).toStrictEqual(['xfer']);
  });

  it('withholds rows at or below the watermark', () => {
    const buckets = buildMergedMoneyActivityBuckets(
      onchain,
      [card, cashback],
      200,
    );

    expect(
      buckets[MoneyActivityFilter.All].map((item) => item.id),
    ).toStrictEqual(['cashback:0xback']);
    expect(buckets[MoneyActivityFilter.Deposits]).toStrictEqual([]);
    expect(buckets[MoneyActivityFilter.Transfers]).toStrictEqual([]);
  });
});

describe('useMoneyActivityItems', () => {
  const loadMore = jest.fn();
  const refetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyAccountTransactions.mockReturnValue({
      allTransactions: [],
      deposits: [],
      transfers: [],
      moneyAddress: '0x1',
      mockDataEnabled: false,
    });
    mockUseMoneyAccountApiActivity.mockReturnValue({
      activity: [],
      watermark: Number.NEGATIVE_INFINITY,
      pageCount: 1,
      hasMore: false,
      loadMore,
      isLoadingMore: false,
      isLoading: false,
      error: false,
      refetch,
    });
  });

  it('returns empty buckets when both sources are empty', () => {
    const { result } = renderHook(() => useMoneyActivityItems());

    expect(result.current.items).toStrictEqual([]);
    expect(result.current.buckets[MoneyActivityFilter.All]).toStrictEqual([]);
    expect(result.current.isSettling).toBe(false);
  });

  it('returns mock transactions newest-first when mock data is enabled', () => {
    mockUseMoneyAccountTransactions.mockReturnValue({
      allTransactions: [...MOCK_MONEY_TRANSACTIONS],
      deposits: MOCK_MONEY_TRANSACTIONS.filter(
        (tx) =>
          tx.type === TransactionType.moneyAccountDeposit ||
          tx.type === TransactionType.incoming,
      ),
      transfers: MOCK_MONEY_TRANSACTIONS.filter(
        (tx) => tx.type === TransactionType.moneyAccountWithdraw,
      ),
      moneyAddress: '0x1',
      mockDataEnabled: true,
    });

    const { result } = renderHook(() => useMoneyActivityItems());

    expect(result.current.items[0].id).toBe('money-tx-deposited');
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.isSettling).toBe(false);
  });

  it('auto-fills while the target bucket is short of the requested count', () => {
    mockUseMoneyAccountApiActivity.mockReturnValue({
      activity: [],
      watermark: 1,
      pageCount: 1,
      hasMore: true,
      loadMore,
      isLoadingMore: false,
      isLoading: false,
      error: false,
      refetch,
    });

    renderHook(() =>
      useMoneyActivityItems({
        fill: { bucket: MoneyActivityFilter.All, count: 5 },
      }),
    );

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('stops auto-fill once the page budget is spent and the bucket has rows', () => {
    mockUseMoneyAccountTransactions.mockReturnValue({
      allTransactions: [onchainTx('dep', 500)],
      deposits: [onchainTx('dep', 500)],
      transfers: [],
      moneyAddress: '0x1',
      mockDataEnabled: false,
    });
    mockUseMoneyAccountApiActivity.mockReturnValue({
      activity: [],
      watermark: Number.NEGATIVE_INFINITY,
      pageCount: AUTO_FILL_MAX_PAGES,
      hasMore: true,
      loadMore,
      isLoadingMore: false,
      isLoading: false,
      error: false,
      refetch,
    });

    renderHook(() =>
      useMoneyActivityItems({
        fill: { bucket: MoneyActivityFilter.All, count: 15 },
      }),
    );

    expect(loadMore).not.toHaveBeenCalled();
  });

  it('keeps auto-filling past the page budget while the target bucket is empty', () => {
    mockUseMoneyAccountApiActivity.mockReturnValue({
      activity: [],
      watermark: 1,
      pageCount: AUTO_FILL_MAX_PAGES,
      hasMore: true,
      loadMore,
      isLoadingMore: false,
      isLoading: false,
      error: false,
      refetch,
    });

    renderHook(() =>
      useMoneyActivityItems({
        fill: { bucket: MoneyActivityFilter.All, count: 5 },
      }),
    );

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('surfaces every visibility-filtered transaction on All, including Pay txs', () => {
    const payFromMoney = {
      id: 'pay-from-money',
      type: TransactionType.contractInteraction,
      time: 10,
      chainId: '0x8f',
      status: 'confirmed',
      metamaskPay: { tokenAddress: '0xmusd', chainId: '0x8f' },
      txParams: { from: '0x1', to: '0x2', value: '0x0' },
    } as unknown as TransactionMeta;

    mockUseMoneyAccountTransactions.mockReturnValue({
      allTransactions: [payFromMoney],
      deposits: [],
      transfers: [],
      moneyAddress: '0x1',
      mockDataEnabled: false,
    });

    const { result } = renderHook(() => useMoneyActivityItems());

    expect(result.current.items.map((item) => item.id)).toStrictEqual([
      'pay-from-money',
    ]);
    expect(result.current.buckets[MoneyActivityFilter.Deposits]).toStrictEqual(
      [],
    );
  });
});
