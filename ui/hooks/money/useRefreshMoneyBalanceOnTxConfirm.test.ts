import { renderHook, waitFor } from '@testing-library/react';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { CanonicalMoneyAccountBalanceResponse } from '@metamask/money-account-balance-service';
import { MUSD_TOKEN_ADDRESS } from '@metamask/money-account-utils';
import { CHAIN_IDS } from '../../../shared/constants/chain-ids';
import {
  fetchFreshMoneyAccountBalance,
  invalidateMoneyAccountBalanceSourceCaches,
} from '../../helpers/money/invalidate-balance-caches';
import { reportMoneyError } from '../../helpers/money/report-money-error';
import { queryClient } from '../../contexts/query-client';
import { selectPrimaryMoneyAccount } from '../../selectors/money-account';
import { useRefreshMoneyBalanceOnTxConfirm } from './useRefreshMoneyBalanceOnTxConfirm';

const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock('../useMessenger', () => ({
  useMessenger: () => ({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  }),
}));

jest.mock('react-redux', () => ({
  useStore: () => ({ getState: jest.fn(() => ({})) }),
}));

jest.mock('../../selectors/money-account', () => ({
  selectPrimaryMoneyAccount: jest.fn(),
}));

jest.mock('../../contexts/query-client', () => ({
  queryClient: {
    getQueryData: jest.fn(),
  },
}));

jest.mock('../../helpers/money/invalidate-balance-caches', () => ({
  fetchFreshMoneyAccountBalance: jest.fn(),
  invalidateMoneyAccountBalanceSourceCaches: jest
    .fn()
    .mockResolvedValue(undefined),
}));

jest.mock('../../helpers/money/report-money-error', () => ({
  reportMoneyError: jest.fn(),
}));

const mockGetQueryData = jest.mocked(queryClient.getQueryData);
const mockFetchFreshMoneyAccountBalance = jest.mocked(
  fetchFreshMoneyAccountBalance,
);
const mockInvalidateMoneyAccountBalanceSourceCaches = jest.mocked(
  invalidateMoneyAccountBalanceSourceCaches,
);
const mockReportMoneyError = jest.mocked(reportMoneyError);
const mockSelectPrimaryMoneyAccount = jest.mocked(selectPrimaryMoneyAccount);

const EVENT = 'TransactionController:transactionStatusUpdated';

const MOCK_ADDRESS = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';

const BASELINE_TOTAL = '3000000';
const CHANGED_TOTAL = '3200000';

const balance = (
  totalBalance: string,
  extras: Partial<CanonicalMoneyAccountBalanceResponse> = {},
): CanonicalMoneyAccountBalanceResponse =>
  ({
    musdBalance: '1000000',
    vmusdValueInMusd: '2000000',
    totalBalance,
    source: 'api',
    usedFallback: false,
    ...extras,
  }) as CanonicalMoneyAccountBalanceResponse;

const baseTx = {
  id: 'tx-1',
  time: 0,
  txParams: {},
} as unknown as TransactionMeta;

const makeTx = (
  type: TransactionType,
  status: TransactionStatus = TransactionStatus.confirmed,
  nested?: { type: TransactionType }[],
): TransactionMeta =>
  ({
    ...baseTx,
    type,
    status,
    nestedTransactions: nested,
  }) as unknown as TransactionMeta;

type StatusUpdatedHandler = (raw: { transactionMeta: TransactionMeta }) => void;

const getStatusUpdatedHandler = (): StatusUpdatedHandler => {
  const call = mockSubscribe.mock.calls.find(([event]) => event === EVENT);
  if (!call) {
    throw new Error('transactionStatusUpdated handler not subscribed');
  }
  return call[1];
};

const emit = (
  handler: StatusUpdatedHandler,
  transactionMeta: TransactionMeta,
) => handler({ transactionMeta });

beforeEach(() => {
  jest.clearAllMocks();
  mockInvalidateMoneyAccountBalanceSourceCaches.mockResolvedValue(undefined);
  mockGetQueryData.mockReturnValue(
    balance(BASELINE_TOTAL) as ReturnType<typeof queryClient.getQueryData>,
  );
  mockFetchFreshMoneyAccountBalance.mockResolvedValue(balance(CHANGED_TOTAL));

  mockSelectPrimaryMoneyAccount.mockReturnValue({
    address: MOCK_ADDRESS,
  } as unknown as ReturnType<typeof selectPrimaryMoneyAccount>);
});

describe('useRefreshMoneyBalanceOnTxConfirm', () => {
  it('subscribes to TransactionController:transactionStatusUpdated on mount', () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    expect(mockSubscribe).toHaveBeenCalledWith(EVENT, expect.any(Function));
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledWith(EVENT, expect.any(Function));
  });

  it('fetches a fresh balance on confirmed deposit tx', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.moneyAccountDeposit));
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });

    expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledWith(
      MOCK_ADDRESS,
      { fresh: true },
    );
    expect(mockInvalidateMoneyAccountBalanceSourceCaches).toHaveBeenCalledWith(
      MOCK_ADDRESS,
    );
  });

  it('fetches a fresh balance on confirmed withdraw tx', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.moneyAccountWithdraw));
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });
  });

  it('fetches a fresh balance on confirmed tx with nested deposit', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(
      handler,
      makeTx(TransactionType.contractInteraction, TransactionStatus.confirmed, [
        { type: TransactionType.moneyAccountDeposit },
      ]),
    );
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });
  });

  it('fetches a fresh balance on confirmed tx with nested withdraw', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(
      handler,
      makeTx(TransactionType.contractInteraction, TransactionStatus.confirmed, [
        { type: TransactionType.moneyAccountWithdraw },
      ]),
    );
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });
  });

  it('sends minBlock from the receipt when the tx confirmed on the Money Account chain', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, {
      ...makeTx(TransactionType.moneyAccountDeposit),
      chainId: CHAIN_IDS.MONAD,
      txReceipt: { blockNumber: '0x10' },
    } as unknown as TransactionMeta);
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });

    expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledWith(
      MOCK_ADDRESS,
      { fresh: true, minBlock: 16 },
    );
  });

  it('sends fresh without minBlock when a Money Account chain tx has no receipt block', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, {
      ...makeTx(TransactionType.moneyAccountDeposit),
      chainId: CHAIN_IDS.MONAD,
    } as unknown as TransactionMeta);
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });

    expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledWith(
      MOCK_ADDRESS,
      { fresh: true },
    );
  });

  const MUSD_ON_MONAD = {
    tokenAddress: MUSD_TOKEN_ADDRESS,
    chainId: CHAIN_IDS.MONAD,
  };

  it('sends fresh without minBlock for a Perps deposit confirmed on another chain', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, {
      ...makeTx(TransactionType.perpsDeposit),
      chainId: CHAIN_IDS.ARBITRUM,
      txReceipt: { blockNumber: '0x10' },
      metamaskPay: MUSD_ON_MONAD,
    } as unknown as TransactionMeta);
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });

    expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledWith(
      MOCK_ADDRESS,
      { fresh: true },
    );
  });

  it('fetches a fresh balance on a confirmed Predict withdraw landing in the Money account', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, {
      ...makeTx(TransactionType.batch, TransactionStatus.confirmed, [
        { type: TransactionType.predictWithdraw },
      ]),
      chainId: CHAIN_IDS.MONAD,
      txReceipt: { blockNumber: '0xa' },
      metamaskPay: MUSD_ON_MONAD,
    } as unknown as TransactionMeta);
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });

    expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledWith(
      MOCK_ADDRESS,
      { fresh: true, minBlock: 10 },
    );
  });

  it('does not fetch for a Perps deposit NOT funded from the Money account', () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, {
      ...makeTx(TransactionType.perpsDeposit),
      metamaskPay: {
        tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        chainId: CHAIN_IDS.ARBITRUM,
      },
    } as unknown as TransactionMeta);

    expect(mockFetchFreshMoneyAccountBalance).not.toHaveBeenCalled();
  });

  it('does not fetch for non-confirmed status', () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(
      handler,
      makeTx(TransactionType.moneyAccountDeposit, TransactionStatus.failed),
    );

    expect(mockFetchFreshMoneyAccountBalance).not.toHaveBeenCalled();
  });

  it('does not fetch for unrelated tx type', () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.contractInteraction));

    expect(mockFetchFreshMoneyAccountBalance).not.toHaveBeenCalled();
  });

  it('does not fetch when no primary money account address', () => {
    mockSelectPrimaryMoneyAccount.mockReturnValue(undefined);
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.moneyAccountDeposit));

    expect(mockFetchFreshMoneyAccountBalance).not.toHaveBeenCalled();
  });

  it('reads store state at call time (not stale closure)', async () => {
    mockSelectPrimaryMoneyAccount.mockReturnValue(undefined);
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    mockSelectPrimaryMoneyAccount.mockReturnValue({
      address: MOCK_ADDRESS,
    } as unknown as ReturnType<typeof selectPrimaryMoneyAccount>);

    emit(handler, makeTx(TransactionType.moneyAccountDeposit));
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });
  });

  it('refreshes once per transaction id when the confirmed status re-fires', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.moneyAccountDeposit));
    emit(handler, makeTx(TransactionType.moneyAccountDeposit));
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });

    expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
  });

  it('runs one refresh per address and queues a single follow-up at the highest minBlock', async () => {
    let resolveFirstRead: (
      value: CanonicalMoneyAccountBalanceResponse,
    ) => void = () => undefined;
    mockFetchFreshMoneyAccountBalance
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirstRead = resolve;
        }),
      )
      .mockResolvedValueOnce(
        balance(BASELINE_TOTAL, { source: 'api', asOfBlock: 32 }),
      );

    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();
    const confirmOnMoneyChain = (id: string, blockNumber: string) =>
      emit(handler, {
        ...makeTx(TransactionType.moneyAccountDeposit),
        id,
        chainId: CHAIN_IDS.MONAD,
        txReceipt: { blockNumber },
      } as unknown as TransactionMeta);

    confirmOnMoneyChain('tx-1', '0x10');
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });
    confirmOnMoneyChain('tx-2', '0x20');
    confirmOnMoneyChain('tx-3', '0x14');
    expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);

    resolveFirstRead(balance(BASELINE_TOTAL, { source: 'api', asOfBlock: 16 }));
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(2);
    });

    expect(mockFetchFreshMoneyAccountBalance).toHaveBeenNthCalledWith(
      1,
      MOCK_ADDRESS,
      { fresh: true, minBlock: 16 },
    );
    expect(mockFetchFreshMoneyAccountBalance).toHaveBeenNthCalledWith(
      2,
      MOCK_ADDRESS,
      { fresh: true, minBlock: 32 },
    );
    expect(mockInvalidateMoneyAccountBalanceSourceCaches).toHaveBeenCalledTimes(
      2,
    );
    expect(mockReportMoneyError).not.toHaveBeenCalled();
  });

  it('accepts the array-wrapped event payload', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler() as unknown as (
      raw: [{ transactionMeta: TransactionMeta }],
    ) => void;

    handler([{ transactionMeta: makeTx(TransactionType.moneyAccountDeposit) }]);
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });
  });

  it('stops on the first read when there is no cached baseline', async () => {
    mockGetQueryData.mockReturnValue(undefined);
    mockFetchFreshMoneyAccountBalance.mockResolvedValue(
      balance('3000000', { source: 'rpc' }),
    );

    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, {
      ...makeTx(TransactionType.moneyAccountDeposit),
      chainId: CHAIN_IDS.MONAD,
      txReceipt: { blockNumber: '0x10' },
    } as unknown as TransactionMeta);
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });

    expect(mockReportMoneyError).not.toHaveBeenCalled();
  });

  it('stops when an api read has reached minBlock even if the total is unchanged', async () => {
    mockFetchFreshMoneyAccountBalance.mockResolvedValue(
      balance(BASELINE_TOTAL, { source: 'api', asOfBlock: 16 }),
    );

    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, {
      ...makeTx(TransactionType.moneyAccountDeposit),
      chainId: CHAIN_IDS.MONAD,
      txReceipt: { blockNumber: '0x10' },
    } as unknown as TransactionMeta);
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });

    expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledWith(
      MOCK_ADDRESS,
      { fresh: true, minBlock: 16 },
    );
    expect(mockInvalidateMoneyAccountBalanceSourceCaches).toHaveBeenCalledTimes(
      1,
    );
    expect(mockReportMoneyError).not.toHaveBeenCalled();
  });

  it('retries a rejected attempt, then stops when a later read changes the balance', async () => {
    jest.useFakeTimers();
    try {
      mockFetchFreshMoneyAccountBalance
        .mockRejectedValueOnce(new Error('indexer lag'))
        .mockResolvedValueOnce(balance(CHANGED_TOTAL));

      renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
      const handler = getStatusUpdatedHandler();

      emit(handler, makeTx(TransactionType.moneyAccountDeposit));
      await jest.advanceTimersByTimeAsync(30_000);

      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(2);
      expect(mockReportMoneyError).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('retries an rpc fallback that has not moved the balance, then stops on an authoritative api read', async () => {
    jest.useFakeTimers();
    try {
      mockFetchFreshMoneyAccountBalance
        .mockResolvedValueOnce(balance(BASELINE_TOTAL, { source: 'rpc' }))
        .mockResolvedValueOnce(
          balance(BASELINE_TOTAL, { source: 'api', asOfBlock: 16 }),
        );

      renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
      const handler = getStatusUpdatedHandler();

      emit(handler, {
        ...makeTx(TransactionType.moneyAccountDeposit),
        chainId: CHAIN_IDS.MONAD,
        txReceipt: { blockNumber: '0x10' },
      } as unknown as TransactionMeta);
      await jest.advanceTimersByTimeAsync(30_000);

      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(2);
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledWith(
        MOCK_ADDRESS,
        { fresh: true, minBlock: 16 },
      );
      expect(mockReportMoneyError).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('retries while the balance stays unchanged, then busts the source caches', async () => {
    jest.useFakeTimers();
    try {
      mockFetchFreshMoneyAccountBalance.mockResolvedValue(
        balance(BASELINE_TOTAL, { source: 'rpc' }),
      );

      renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
      const handler = getStatusUpdatedHandler();

      emit(handler, makeTx(TransactionType.moneyAccountDeposit));
      // Attempts back off at 500ms/1s/2s then 4s capped; ~20s covers all 8.
      await jest.advanceTimersByTimeAsync(30_000);

      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(8);
      // Once before each attempt, plus one more after the budget is spent.
      expect(
        mockInvalidateMoneyAccountBalanceSourceCaches,
      ).toHaveBeenCalledTimes(9);
      expect(
        mockInvalidateMoneyAccountBalanceSourceCaches,
      ).toHaveBeenCalledWith(MOCK_ADDRESS);
      expect(mockReportMoneyError).toHaveBeenCalledWith(
        '[Money Balance Refresh] Balance unchanged after 8 retries; awaiting 30s auto-poll',
        expect.objectContaining({
          message: 'Money Account balance unchanged after retries',
        }),
        { attempts: 8 },
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('busts the source caches once and does not report when the balance changes', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.moneyAccountDeposit));
    await waitFor(() => {
      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(1);
    });

    expect(mockInvalidateMoneyAccountBalanceSourceCaches).toHaveBeenCalledTimes(
      1,
    );
    expect(mockReportMoneyError).not.toHaveBeenCalled();
  });

  it('reports to Sentry when every attempt fails', async () => {
    jest.useFakeTimers();
    try {
      const error = new Error('disconnected');
      mockFetchFreshMoneyAccountBalance.mockRejectedValue(error);

      renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
      const handler = getStatusUpdatedHandler();

      emit(handler, makeTx(TransactionType.moneyAccountDeposit));
      await jest.advanceTimersByTimeAsync(30_000);

      expect(mockFetchFreshMoneyAccountBalance).toHaveBeenCalledTimes(8);
      expect(mockReportMoneyError).toHaveBeenCalledWith(
        '[Money Balance Refresh] Balance refresh failed',
        error,
        { attempts: 8 },
      );
    } finally {
      jest.useRealTimers();
    }
  });
});
