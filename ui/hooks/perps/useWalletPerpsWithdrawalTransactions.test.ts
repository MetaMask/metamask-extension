import { renderHook } from '@testing-library/react-hooks';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { useWalletPerpsWithdrawalTransactions } from './useWalletPerpsWithdrawalTransactions';

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
    type: TransactionType.perpsWithdraw,
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
    // useWalletPerpsWithdrawalTransactions calls useSelector with an inline
    // arrow that internally invokes selectTransactions(state) — simulate
    // that by invoking the passed selector against a fake state.
    return (selector as (state: unknown) => unknown)({
      metamask: { transactions },
    });
  });
}

describe('useWalletPerpsWithdrawalTransactions', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
  });

  it('returns an empty array when no account is selected', () => {
    setSelectors({ transactions: [createMockTx()], address: '' });

    const { result } = renderHook(() =>
      useWalletPerpsWithdrawalTransactions(),
    );

    expect(result.current).toEqual([]);
  });

  it('returns a PerpsTransaction for a confirmed perpsWithdraw from the selected account', () => {
    setSelectors({ transactions: [createMockTx()] });

    const { result } = renderHook(() =>
      useWalletPerpsWithdrawalTransactions(),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].type).toBe('withdrawal');
  });

  it('includes a submitted perpsWithdraw transaction with a pending status', () => {
    setSelectors({
      transactions: [
        createMockTx({ status: TransactionStatus.submitted }),
      ],
    });

    const { result } = renderHook(() =>
      useWalletPerpsWithdrawalTransactions(),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].depositWithdrawal?.status).toBe('pending');
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

    const { result } = renderHook(() =>
      useWalletPerpsWithdrawalTransactions(),
    );

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

    const { result } = renderHook(() =>
      useWalletPerpsWithdrawalTransactions(),
    );

    expect(result.current).toHaveLength(1);
  });

  it('excludes unrelated transaction types (e.g. simple sends)', () => {
    setSelectors({
      transactions: [createMockTx({ type: TransactionType.simpleSend })],
    });

    const { result } = renderHook(() =>
      useWalletPerpsWithdrawalTransactions(),
    );

    expect(result.current).toHaveLength(0);
  });

  it('excludes wallet deposit transactions', () => {
    setSelectors({
      transactions: [createMockTx({ type: TransactionType.perpsDeposit })],
    });

    const { result } = renderHook(() =>
      useWalletPerpsWithdrawalTransactions(),
    );

    expect(result.current).toHaveLength(0);
  });
});
