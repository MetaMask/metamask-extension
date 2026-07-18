import { renderHook } from '@testing-library/react-hooks';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  dismissToast,
  showFailedToast,
  showPendingToast,
  showSuccessToast,
} from './shared';
import { useTransactionEventToasts } from './useTransactionEventToasts';

const transactionControllerEvent =
  'TransactionController:transactionStatusUpdated';
const accountsControllerEvent = 'AccountsController:accountTransactionsUpdated';

const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockGetState = jest.fn(() => ({
  metamask: { transactions: [] as TransactionMeta[] },
}));

jest.mock('../../../hooks/useMessenger', () => ({
  useMessenger: () => ({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  }),
}));

jest.mock('react-redux', () => ({
  useStore: () => ({
    getState: mockGetState,
  }),
}));

jest.mock('./shared', () => ({
  dismissToast: jest.fn(),
  showPendingToast: jest.fn(),
  showSuccessToast: jest.fn(),
  showFailedToast: jest.fn(),
}));

const mockShowPendingToast = jest.mocked(showPendingToast);
const mockShowSuccessToast = jest.mocked(showSuccessToast);
const mockShowFailedToast = jest.mocked(showFailedToast);
const mockDismissToast = jest.mocked(dismissToast);

function createTransactionMeta(
  overrides: Partial<TransactionMeta> & Pick<TransactionMeta, 'id' | 'status'>,
): TransactionMeta {
  return {
    chainId: '0x1',
    networkClientId: 'network-1',
    time: 1,
    txParams: { from: '0x0' },
    type: TransactionType.contractInteraction,
    ...overrides,
  };
}

function setupHandlers() {
  const handlers: Record<string, (raw: unknown) => void> = {};
  mockSubscribe.mockImplementation((event, handler) => {
    handlers[event] = handler;
  });
  return handlers;
}

function mountHook() {
  const handlers = setupHandlers();
  const { unmount } = renderHook(() => useTransactionEventToasts());
  return { handlers, unmount };
}

describe('useTransactionEventToasts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      metamask: { transactions: [] },
    });
  });

  it('subscribes to transaction lifecycle messenger events', () => {
    renderHook(() => useTransactionEventToasts());

    expect(mockSubscribe).toHaveBeenCalledTimes(2);
    expect(mockSubscribe).toHaveBeenCalledWith(
      transactionControllerEvent,
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      accountsControllerEvent,
      expect.any(Function),
    );
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = mountHook();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      transactionControllerEvent,
      expect.any(Function),
    );
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      accountsControllerEvent,
      expect.any(Function),
    );
  });

  describe('EVM via TransactionController', () => {
    it('shows a pending toast when a tx is submitted', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'id1',
          status: TransactionStatus.submitted,
        }),
      });

      expect(mockShowPendingToast).toHaveBeenCalledWith('tx-id1', {
        transactionId: 'id1',
      });
    });

    it('shows a success toast when a pending tx confirms', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'id1',
          status: TransactionStatus.submitted,
        }),
      });
      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'id1',
          status: TransactionStatus.confirmed,
        }),
      });

      expect(mockShowSuccessToast).toHaveBeenCalledWith('tx-id1', {
        transactionId: 'id1',
      });
    });

    it('dismisses the original pending toast when a tx is dropped for speed-up', () => {
      mockGetState.mockReturnValue({
        metamask: {
          transactions: [
            createTransactionMeta({
              id: 'id1',
              status: TransactionStatus.dropped,
              replacedById: 'id2',
            }),
            createTransactionMeta({
              id: 'id2',
              status: TransactionStatus.submitted,
              type: TransactionType.retry,
            }),
          ],
        },
      });

      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'id1',
          status: TransactionStatus.submitted,
        }),
      });
      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'id1',
          status: TransactionStatus.dropped,
          replacedById: 'id2',
        }),
      });

      expect(mockDismissToast).toHaveBeenCalledWith('tx-id1');
      expect(mockShowFailedToast).not.toHaveBeenCalled();
    });

    it('dismisses the original pending toast on speed-up before the replacement tx is in Redux', () => {
      mockGetState.mockReturnValue({
        metamask: {
          transactions: [
            createTransactionMeta({
              id: 'id1',
              status: TransactionStatus.submitted,
            }),
          ],
        },
      });

      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'id1',
          status: TransactionStatus.submitted,
        }),
      });
      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'id1',
          status: TransactionStatus.dropped,
          replacedById: 'id2',
        }),
      });

      expect(mockDismissToast).toHaveBeenCalledWith('tx-id1');
      expect(mockShowFailedToast).not.toHaveBeenCalled();
    });

    it('shows a failed toast when a pending tx is dropped for cancel', () => {
      mockGetState.mockReturnValue({
        metamask: {
          transactions: [
            createTransactionMeta({
              id: 'cancel-id1',
              status: TransactionStatus.dropped,
              replacedById: 'cancel-id2',
            }),
            createTransactionMeta({
              id: 'cancel-id2',
              status: TransactionStatus.confirmed,
              type: TransactionType.cancel,
            }),
          ],
        },
      });

      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'cancel-id1',
          status: TransactionStatus.submitted,
        }),
      });
      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'cancel-id1',
          status: TransactionStatus.dropped,
          replacedById: 'cancel-id2',
        }),
      });

      expect(mockShowFailedToast).toHaveBeenCalledWith('tx-cancel-id1', {
        transactionId: 'cancel-id1',
      });
      expect(mockDismissToast).not.toHaveBeenCalled();
    });

    it('shows a failed toast when a pending tx fails', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'id1',
          status: TransactionStatus.submitted,
        }),
      });
      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'id1',
          status: TransactionStatus.failed,
        }),
      });

      expect(mockShowFailedToast).toHaveBeenCalledWith('tx-id1', {
        transactionId: 'id1',
      });
    });

    it('does not toast excluded approval transactions', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'id3',
          status: TransactionStatus.submitted,
          type: TransactionType.bridgeApproval,
        }),
      });

      expect(mockShowPendingToast).not.toHaveBeenCalled();
    });

    it('shows a pending toast for musdConversion transactions', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'musd-id1',
          status: TransactionStatus.submitted,
          type: TransactionType.musdConversion,
        }),
      });

      expect(mockShowPendingToast).toHaveBeenCalledWith('tx-musd-id1', {
        transactionId: 'musd-id1',
      });
    });
  });

  describe('non-EVM via AccountsController', () => {
    it('shows a pending toast when a tx is unconfirmed', () => {
      const { handlers } = mountHook();

      handlers[accountsControllerEvent]({
        transactions: {
          'account-1': [
            {
              id: 'id4',
              status: 'unconfirmed',
              type: 'send',
              chain: 'tron:728126428',
            },
          ],
        },
      });

      expect(mockShowPendingToast).toHaveBeenCalledWith('tx-id4');
    });
  });
});
