import { renderHook } from '@testing-library/react';
import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { MoneyActivityFilter } from '../../pages/money/utils/money-activity-filters';
import MOCK_MONEY_TRANSACTIONS from '../../pages/money/constants/mock-activity-data';
import { useMoneyAccountTransactions } from './use-money-account-transactions';
import { useMoneyActivityItems } from './use-money-activity-items';

jest.mock('./use-money-account-transactions');

const mockUseMoneyAccountTransactions = jest.mocked(
  useMoneyAccountTransactions,
);

describe('useMoneyActivityItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyAccountTransactions.mockReturnValue({
      allTransactions: [],
      deposits: [],
      transfers: [],
      moneyAddress: '0x1',
      mockDataEnabled: false,
    });
  });

  it('returns empty buckets when there are no transactions', () => {
    const { result } = renderHook(() => useMoneyActivityItems());

    expect(result.current.items).toStrictEqual([]);
    expect(result.current.buckets[MoneyActivityFilter.All]).toStrictEqual([]);
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
    expect(result.current.mockDataEnabled).toBe(true);
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
