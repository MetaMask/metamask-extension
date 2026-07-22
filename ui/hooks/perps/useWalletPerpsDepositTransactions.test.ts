import { renderHook } from '@testing-library/react-hooks';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { useWalletPerpsDepositTransactions } from './useWalletPerpsDepositTransactions';

const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

const SELECTED_ADDRESS = '0x1234567890123456789012345678901234567890';

const createMockTx = (
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta =>
  ({
    id: 'tx-1',
    chainId: '0xa4b1',
    time: Date.now(),
    status: TransactionStatus.confirmed,
    type: TransactionType.perpsDeposit,
    hash: '0xabc',
    txParams: {
      from: SELECTED_ADDRESS,
      to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      data: '0x',
    },
    ...overrides,
  }) as TransactionMeta;

function setSelectors({
  transactions = [],
  address = SELECTED_ADDRESS,
}: {
  transactions?: TransactionMeta[];
  address?: string | undefined;
} = {}) {
  mockUseSelector.mockImplementation((selector: unknown) => {
    if (selector === getSelectedInternalAccount) {
      return address ? { address } : undefined;
    }
    // useWalletPerpsDepositTransactions calls useSelector with an inline
    // arrow that internally invokes selectTransactions(state) — simulate
    // that by invoking the passed selector against a fake state.
    return (selector as (state: unknown) => unknown)({
      metamask: { transactions },
    });
  });
}

describe('useWalletPerpsDepositTransactions', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
  });

  it('returns an empty array when no account is selected', () => {
    setSelectors({ transactions: [createMockTx()], address: '' });

    const { result } = renderHook(() => useWalletPerpsDepositTransactions());

    expect(result.current).toEqual([]);
  });

  it('returns a PerpsTransaction for a confirmed perpsDeposit from the selected account', () => {
    setSelectors({ transactions: [createMockTx()] });

    const { result } = renderHook(() => useWalletPerpsDepositTransactions());

    expect(result.current).toHaveLength(1);
    expect(result.current[0].type).toBe('deposit');
  });

  it('includes perpsDepositAndOrder transactions', () => {
    setSelectors({
      transactions: [
        createMockTx({ type: TransactionType.perpsDepositAndOrder }),
      ],
    });

    const { result } = renderHook(() => useWalletPerpsDepositTransactions());

    expect(result.current).toHaveLength(1);
  });

  it('excludes transactions from other accounts', () => {
    setSelectors({
      transactions: [
        createMockTx({
          txParams: {
            from: '0x9999999999999999999999999999999999999999',
            to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            data: '0x',
          },
        }),
      ],
    });

    const { result } = renderHook(() => useWalletPerpsDepositTransactions());

    expect(result.current).toHaveLength(0);
  });

  it('matches the selected account case-insensitively', () => {
    setSelectors({
      transactions: [
        createMockTx({
          txParams: {
            from: SELECTED_ADDRESS.toUpperCase(),
            to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            data: '0x',
          },
        }),
      ],
    });

    const { result } = renderHook(() => useWalletPerpsDepositTransactions());

    expect(result.current).toHaveLength(1);
  });

  it('excludes unrelated transaction types (e.g. simple sends)', () => {
    setSelectors({
      transactions: [createMockTx({ type: TransactionType.simpleSend })],
    });

    const { result } = renderHook(() => useWalletPerpsDepositTransactions());

    expect(result.current).toHaveLength(0);
  });
});
