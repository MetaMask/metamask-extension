import { renderHook, waitFor } from '@testing-library/react';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { MUSD_TOKEN_ADDRESS } from '@metamask/money-account-utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  invalidateMoneyAccountBalanceCaches,
  invalidateMoneyAccountBalanceSourceCaches,
} from '../../helpers/money/invalidate-balance-caches';
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
  invalidateMoneyAccountBalanceCaches: jest.fn().mockResolvedValue(undefined),
  invalidateMoneyAccountBalanceSourceCaches: jest
    .fn()
    .mockResolvedValue(undefined),
}));

const mockGetQueryData = jest.mocked(queryClient.getQueryData);
const mockInvalidateMoneyAccountBalanceCaches = jest.mocked(
  invalidateMoneyAccountBalanceCaches,
);
const mockInvalidateMoneyAccountBalanceSourceCaches = jest.mocked(
  invalidateMoneyAccountBalanceSourceCaches,
);
const mockSelectPrimaryMoneyAccount = jest.mocked(selectPrimaryMoneyAccount);

const EVENT = 'TransactionController:transactionStatusUpdated';

const MOCK_ADDRESS = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';

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

type StatusUpdatedHandler = (raw: {
  transactionMeta: TransactionMeta;
}) => void;

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
  mockInvalidateMoneyAccountBalanceCaches.mockResolvedValue(undefined);

  let readCount = 0;
  mockGetQueryData.mockImplementation(() => {
    const phase = readCount < 1 ? 'baseline' : 'next';
    readCount += 1;

    return {
      musdBalance: phase === 'baseline' ? '1000000' : '1100000',
      vmusdValueInMusd: phase === 'baseline' ? '2000000' : '2100000',
      totalBalance: phase === 'baseline' ? '3000000' : '3200000',
    };
  });

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

  it('invalidates the balance query on confirmed deposit tx', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.moneyAccountDeposit));
    await waitFor(() => {
      expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(1);
    });

    expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledWith(
      MOCK_ADDRESS,
    );
  });

  it('invalidates the balance query on confirmed withdraw tx', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.moneyAccountWithdraw));
    await waitFor(() => {
      expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(1);
    });
  });

  it('invalidates on confirmed tx with nested deposit', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(
      handler,
      makeTx(TransactionType.contractInteraction, TransactionStatus.confirmed, [
        { type: TransactionType.moneyAccountDeposit },
      ]),
    );
    await waitFor(() => {
      expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(1);
    });
  });

  it('invalidates on confirmed tx with nested withdraw', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(
      handler,
      makeTx(TransactionType.contractInteraction, TransactionStatus.confirmed, [
        { type: TransactionType.moneyAccountWithdraw },
      ]),
    );
    await waitFor(() => {
      expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(1);
    });
  });

  const MUSD_ON_MONAD = {
    tokenAddress: MUSD_TOKEN_ADDRESS,
    chainId: CHAIN_IDS.MONAD,
  };

  it('invalidates on a confirmed Perps deposit funded from the Money account', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, {
      ...makeTx(TransactionType.perpsDeposit),
      metamaskPay: MUSD_ON_MONAD,
    } as unknown as TransactionMeta);
    await waitFor(() => {
      expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(1);
    });
  });

  it('invalidates on a confirmed Predict withdraw landing in the Money account', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, {
      ...makeTx(TransactionType.batch, TransactionStatus.confirmed, [
        { type: TransactionType.predictWithdraw },
      ]),
      metamaskPay: MUSD_ON_MONAD,
    } as unknown as TransactionMeta);
    await waitFor(() => {
      expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(1);
    });
  });

  it('does not invalidate for a Perps deposit NOT funded from the Money account', () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, {
      ...makeTx(TransactionType.perpsDeposit),
      metamaskPay: {
        tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        chainId: CHAIN_IDS.ARBITRUM,
      },
    } as unknown as TransactionMeta);

    expect(mockInvalidateMoneyAccountBalanceCaches).not.toHaveBeenCalled();
  });

  it('does not invalidate for non-confirmed status', () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(
      handler,
      makeTx(TransactionType.moneyAccountDeposit, TransactionStatus.failed),
    );

    expect(mockInvalidateMoneyAccountBalanceCaches).not.toHaveBeenCalled();
  });

  it('does not invalidate for unrelated tx type', () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.contractInteraction));

    expect(mockInvalidateMoneyAccountBalanceCaches).not.toHaveBeenCalled();
  });

  it('does not invalidate when no primary money account address', () => {
    mockSelectPrimaryMoneyAccount.mockReturnValue(undefined);
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.moneyAccountDeposit));

    expect(mockInvalidateMoneyAccountBalanceCaches).not.toHaveBeenCalled();
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
      expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(1);
    });
  });

  it('refreshes once per transaction id when the confirmed status re-fires', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.moneyAccountDeposit));
    emit(handler, makeTx(TransactionType.moneyAccountDeposit));
    await waitFor(() => {
      expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(1);
    });

    expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(1);
  });

  it('accepts the array-wrapped event payload', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler() as unknown as (
      raw: [{ transactionMeta: TransactionMeta }],
    ) => void;

    handler([
      { transactionMeta: makeTx(TransactionType.moneyAccountDeposit) },
    ]);
    await waitFor(() => {
      expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(1);
    });
  });

  it('retries while the balance stays unchanged, then busts the source caches', async () => {
    jest.useFakeTimers();
    try {
      mockGetQueryData.mockReturnValue({
        totalBalance: '3000000',
      } as ReturnType<typeof queryClient.getQueryData>);

      renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
      const handler = getStatusUpdatedHandler();

      emit(handler, makeTx(TransactionType.moneyAccountDeposit));
      // Attempts back off at 500ms/1s/2s then 4s capped; ~20s covers all 8.
      await jest.advanceTimersByTimeAsync(30_000);

      expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(8);
      expect(
        mockInvalidateMoneyAccountBalanceSourceCaches,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockInvalidateMoneyAccountBalanceSourceCaches,
      ).toHaveBeenCalledWith(MOCK_ADDRESS);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not bust the source caches when a retry sees the balance change', async () => {
    renderHook(() => useRefreshMoneyBalanceOnTxConfirm());
    const handler = getStatusUpdatedHandler();

    emit(handler, makeTx(TransactionType.moneyAccountDeposit));
    await waitFor(() => {
      expect(mockInvalidateMoneyAccountBalanceCaches).toHaveBeenCalledTimes(1);
    });

    expect(
      mockInvalidateMoneyAccountBalanceSourceCaches,
    ).not.toHaveBeenCalled();
  });
});
