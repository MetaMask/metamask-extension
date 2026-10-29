import { renderHook } from '@testing-library/react';
import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { selectNonReplacedTransactions } from '../../selectors/transactionController';
import { selectMoneyActivityMockDataEnabled } from '../../selectors/money/money-account-feature-flags';
import MOCK_MONEY_TRANSACTIONS from '../../pages/money/constants/mock-activity-data';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';
import { useMoneyAccountTransactions } from './use-money-account-transactions';

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../selectors/transactionController', () => ({
  selectNonReplacedTransactions: jest.fn(),
}));

jest.mock('../../selectors/money/money-account-feature-flags', () => ({
  selectMoneyActivityMockDataEnabled: jest.fn(),
}));

jest.mock('./useMoneyAccountInfo', () => ({
  useMoneyAccountInfo: jest.fn(),
}));

const mockSelectNonReplacedTransactions = jest.mocked(
  selectNonReplacedTransactions,
);
const mockSelectMoneyActivityMockDataEnabled = jest.mocked(
  selectMoneyActivityMockDataEnabled,
);
const mockUseMoneyAccountInfo = jest.mocked(useMoneyAccountInfo);

const MONEY_ADDRESS = '0x00000000000000000000000000000000000000Aa';

function makeTx(extra: Record<string, unknown>): TransactionMeta {
  return {
    id: 'tx-1',
    chainId: '0x8f',
    time: 1,
    status: TransactionStatus.confirmed,
    txParams: { from: MONEY_ADDRESS, to: MONEY_ADDRESS, value: '0x0' },
    ...extra,
  } as unknown as TransactionMeta;
}

describe('useMoneyAccountTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectMoneyActivityMockDataEnabled.mockReturnValue(false);
    mockSelectNonReplacedTransactions.mockReturnValue([]);
    mockUseMoneyAccountInfo.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: true,
      primaryMoneyAccount: { address: MONEY_ADDRESS },
    });
  });

  it('returns mock transactions when mock data is enabled', () => {
    mockSelectMoneyActivityMockDataEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useMoneyAccountTransactions());

    expect(result.current.mockDataEnabled).toBe(true);
    expect(result.current.allTransactions).toHaveLength(
      MOCK_MONEY_TRANSACTIONS.length,
    );
    expect(result.current.deposits.length).toBeGreaterThan(0);
    expect(result.current.transfers.length).toBeGreaterThan(0);
  });

  it('filters live transactions to Money Account types', () => {
    mockSelectNonReplacedTransactions.mockReturnValue([
      makeTx({
        id: 'deposit',
        type: TransactionType.moneyAccountDeposit,
        time: 2,
      }),
      makeTx({
        id: 'swap',
        type: TransactionType.swap,
        time: 3,
      }),
    ]);

    const { result } = renderHook(() => useMoneyAccountTransactions());

    expect(result.current.allTransactions.map((tx) => tx.id)).toStrictEqual([
      'deposit',
    ]);
    expect(result.current.deposits).toHaveLength(1);
    expect(result.current.transfers).toHaveLength(0);
  });
});
