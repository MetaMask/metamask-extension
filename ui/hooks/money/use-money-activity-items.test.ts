import { renderHook } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { selectMoneyActivityMockDataEnabled } from '../../selectors/money/money-account-feature-flags';
import MOCK_MONEY_TRANSACTIONS from '../../pages/money/constants/mock-activity-data';
import { MoneyActivityFilter } from '../../pages/money/utils/money-activity-filters';
import { useMoneyActivityItems } from './use-money-activity-items';

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../selectors/money/money-account-feature-flags', () => ({
  ...jest.requireActual('../../selectors/money/money-account-feature-flags'),
  selectMoneyActivityMockDataEnabled: jest.fn(),
}));

const mockSelectMoneyActivityMockDataEnabled = jest.mocked(
  selectMoneyActivityMockDataEnabled,
);

describe('useMoneyActivityItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectMoneyActivityMockDataEnabled.mockReturnValue(false);
  });

  it('returns empty buckets when mock data is disabled', () => {
    const { result } = renderHook(() => useMoneyActivityItems());
    expect(result.current.items).toStrictEqual([]);
    expect(result.current.buckets[MoneyActivityFilter.All]).toStrictEqual([]);
    expect(result.current.buckets[MoneyActivityFilter.Deposits]).toStrictEqual(
      [],
    );
    expect(result.current.buckets[MoneyActivityFilter.Transfers]).toStrictEqual(
      [],
    );
  });

  it('returns mock transactions newest-first when mock data is enabled', () => {
    mockSelectMoneyActivityMockDataEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useMoneyActivityItems());

    expect(result.current.items).toBe(
      result.current.buckets[MoneyActivityFilter.All],
    );
    expect(result.current.items[0].id).toBe('money-tx-deposited');
    expect(result.current.items.every((item) => item.kind === 'onchain')).toBe(
      true,
    );
    const times = result.current.items.map((item) => item.time);
    expect(times).toStrictEqual([...times].sort((left, right) => right - left));
  });

  it('splits mock transactions into Deposits and Sends buckets', () => {
    mockSelectMoneyActivityMockDataEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useMoneyActivityItems());
    const { buckets } = result.current;

    expect(buckets[MoneyActivityFilter.All]).toHaveLength(
      MOCK_MONEY_TRANSACTIONS.length,
    );
    expect(
      buckets[MoneyActivityFilter.Deposits].every(
        (item) =>
          item.tx.type === TransactionType.moneyAccountDeposit ||
          item.tx.type === TransactionType.incoming,
      ),
    ).toBe(true);
    expect(
      buckets[MoneyActivityFilter.Transfers].every(
        (item) => item.tx.type === TransactionType.moneyAccountWithdraw,
      ),
    ).toBe(true);
    expect(
      buckets[MoneyActivityFilter.Deposits].length +
        buckets[MoneyActivityFilter.Transfers].length,
    ).toBe(buckets[MoneyActivityFilter.All].length);
  });
});
