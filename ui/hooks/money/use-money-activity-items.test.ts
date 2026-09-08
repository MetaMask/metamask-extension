import { renderHook } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
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
});
