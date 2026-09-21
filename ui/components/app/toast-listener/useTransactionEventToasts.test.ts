import { renderHook } from '@testing-library/react';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  clearMoneyBatchById,
  registerMoneyBatchById,
  registerMoneyBatchTransaction,
  resetMoneyBatchRegistry,
} from '../../../helpers/money/money-batch-registry';
import { clearToastPhase } from './toast-lifecycle';
import {
  dismissToast,
  showFailedToast,
  showPendingToast,
  showSuccessToast,
} from './shared';
import {
  batchHelperTransactionTypes,
  useTransactionEventToasts,
} from './useTransactionEventToasts';

const transactionControllerEvent =
  'TransactionController:transactionStatusUpdated';
const accountsControllerEvent = 'AccountsController:accountTransactionsUpdated';

const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockGetState = jest.fn(() => ({
  metamask: { transactions: [] as TransactionMeta[] },
}));
const mockStoreSubscribers = new Set<() => void>();
const mockStoreSubscribe = jest.fn((listener: () => void) => {
  mockStoreSubscribers.add(listener);
  return () => {
    mockStoreSubscribers.delete(listener);
  };
});

jest.mock('../../../hooks/useMessenger', () => ({
  useMessenger: () => ({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  }),
}));

jest.mock('react-redux', () => ({
  useStore: () => ({
    getState: mockGetState,
    subscribe: mockStoreSubscribe,
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

function flushStoreSubscribers() {
  for (const listener of [...mockStoreSubscribers]) {
    listener();
  }
}

describe('useTransactionEventToasts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockStoreSubscribers.clear();
    resetMoneyBatchRegistry();
    mockGetState.mockReturnValue({
      metamask: { transactions: [] },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('subscribes to transaction lifecycle messenger events', () => {
    renderHook(() => useTransactionEventToasts());

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
    it('shows a pending toast with a details link when hash is present', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'pending-with-hash',
          status: TransactionStatus.submitted,
          hash: '0xabc',
        }),
      });

      expect(mockShowPendingToast).toHaveBeenCalledWith(
        'tx-pending-with-hash',
        {
          transactionId: 'pending-with-hash',
          to: '/tx/eip155:1/0xabc',
        },
      );
    });

    it('shows a success toast with a details link when a pending tx confirms', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'success-with-hash',
          status: TransactionStatus.submitted,
          hash: '0xabc',
        }),
      });
      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'success-with-hash',
          status: TransactionStatus.confirmed,
          hash: '0xabc',
        }),
      });

      expect(mockShowSuccessToast).toHaveBeenCalledWith(
        'tx-success-with-hash',
        {
          transactionId: 'success-with-hash',
          to: '/tx/eip155:1/0xabc',
        },
      );
    });

    it('shows a failed toast with a details link when a pending tx fails', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'failed-with-hash',
          status: TransactionStatus.submitted,
          hash: '0xabc',
        }),
      });
      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'failed-with-hash',
          status: TransactionStatus.failed,
          hash: '0xabc',
        }),
      });

      expect(mockShowFailedToast).toHaveBeenCalledWith('tx-failed-with-hash', {
        transactionId: 'failed-with-hash',
        to: '/tx/eip155:1/0xabc',
      });
    });

    it('omits the details link when hash is missing', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'failed-no-hash',
          status: TransactionStatus.submitted,
        }),
      });
      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'failed-no-hash',
          status: TransactionStatus.failed,
        }),
      });

      expect(mockShowFailedToast).toHaveBeenCalledWith('tx-failed-no-hash', {
        transactionId: 'failed-no-hash',
        to: undefined,
      });
    });

    it('dismisses the original pending toast when a tx is dropped for speed-up', () => {
      mockGetState.mockReturnValue({
        metamask: {
          transactions: [
            createTransactionMeta({
              id: 'speed-up-original',
              status: TransactionStatus.dropped,
              replacedById: 'speed-up-replacement',
            }),
            createTransactionMeta({
              id: 'speed-up-replacement',
              status: TransactionStatus.submitted,
              type: TransactionType.retry,
            }),
          ],
        },
      });

      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'speed-up-original',
          status: TransactionStatus.submitted,
        }),
      });
      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'speed-up-original',
          status: TransactionStatus.dropped,
          replacedById: 'speed-up-replacement',
        }),
      });

      expect(mockDismissToast).toHaveBeenCalledWith('tx-speed-up-original');
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
        to: undefined,
      });
      expect(mockDismissToast).not.toHaveBeenCalled();
    });

    it('does not toast batch helper transaction types', () => {
      for (const type of batchHelperTransactionTypes) {
        mockShowPendingToast.mockClear();
        const { handlers } = mountHook();

        handlers[transactionControllerEvent]({
          transactionMeta: createTransactionMeta({
            id: `batch-helper-${type}`,
            status: TransactionStatus.submitted,
            type,
          }),
        });

        expect(mockShowPendingToast).not.toHaveBeenCalled();
      }
    });

    it('shows a pending toast for musdClaim transactions on approved', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'claim-approved',
          status: TransactionStatus.approved,
          type: TransactionType.musdClaim,
        }),
      });

      expect(mockShowPendingToast).toHaveBeenCalledWith(
        'tx-claim-approved',
        expect.objectContaining({ transactionId: 'claim-approved' }),
      );
    });

    it('shows a pending toast for perpsWithdraw transactions on approved', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'withdraw-approved',
          status: TransactionStatus.approved,
          type: TransactionType.perpsWithdraw,
        }),
      });

      expect(mockShowPendingToast).toHaveBeenCalledWith(
        'tx-withdraw-approved',
        expect.objectContaining({ transactionId: 'withdraw-approved' }),
      );
    });

    it('shows a pending toast for nested perpsWithdraw transactions on approved', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'nested-withdraw-approved',
          status: TransactionStatus.approved,
          type: TransactionType.simpleSend,
          nestedTransactions: [{ type: TransactionType.perpsWithdraw }],
        }),
      });

      expect(mockShowPendingToast).toHaveBeenCalledWith(
        'tx-nested-withdraw-approved',
        expect.objectContaining({
          transactionId: 'nested-withdraw-approved',
        }),
      );
    });

    it('does not toast money account batches, which have their own listener', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'money-deposit',
          status: TransactionStatus.submitted,
          type: TransactionType.batch,
          nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
        }),
      });

      expect(mockShowPendingToast).not.toHaveBeenCalled();
    });

    it('does not toast child transactions of a money account batch', () => {
      mockGetState.mockReturnValue({
        metamask: {
          transactions: [
            createTransactionMeta({
              id: 'money-deposit',
              status: TransactionStatus.unapproved,
              type: TransactionType.batch,
              nestedTransactions: [
                { type: TransactionType.moneyAccountDeposit },
              ],
              requiredTransactionIds: ['relay-submitted'],
            }),
          ],
        },
      });
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'relay-submitted',
          status: TransactionStatus.submitted,
          type: TransactionType.relayDeposit,
        }),
      });

      expect(mockShowPendingToast).not.toHaveBeenCalled();
    });

    it('still toasts relay deposits that fund other transactions', () => {
      mockGetState.mockReturnValue({
        metamask: {
          transactions: [
            createTransactionMeta({
              id: 'other-parent',
              status: TransactionStatus.unapproved,
              requiredTransactionIds: ['relay-submitted'],
            }),
          ],
        },
      });
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'relay-submitted',
          status: TransactionStatus.submitted,
          type: TransactionType.relayDeposit,
        }),
      });

      expect(mockShowPendingToast).toHaveBeenCalledWith(
        'tx-relay-submitted',
        expect.any(Object),
      );
    });

    it('suppresses a known money-batch Pay child without waiting for Redux', () => {
      registerMoneyBatchTransaction({
        id: 'money-deposit',
        requiredTransactionIds: ['relay-race'],
      });
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'relay-race',
          status: TransactionStatus.submitted,
          type: TransactionType.relayDeposit,
        }),
      });

      expect(mockShowPendingToast).not.toHaveBeenCalled();
      expect(mockStoreSubscribe).not.toHaveBeenCalled();
    });

    it('defers and drops a Pay child when Redux later links it to a money batch', () => {
      registerMoneyBatchById('money-deposit');
      mockGetState.mockReturnValue({
        metamask: {
          transactions: [
            createTransactionMeta({
              id: 'money-deposit',
              status: TransactionStatus.approved,
              type: TransactionType.batch,
              nestedTransactions: [
                { type: TransactionType.moneyAccountDeposit },
              ],
            }),
          ],
        },
      });
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'relay-deferred',
          status: TransactionStatus.submitted,
          type: TransactionType.relayDeposit,
        }),
      });

      expect(mockShowPendingToast).not.toHaveBeenCalled();
      expect(mockStoreSubscribe).toHaveBeenCalled();

      mockGetState.mockReturnValue({
        metamask: {
          transactions: [
            createTransactionMeta({
              id: 'money-deposit',
              status: TransactionStatus.approved,
              type: TransactionType.batch,
              nestedTransactions: [
                { type: TransactionType.moneyAccountDeposit },
              ],
              requiredTransactionIds: ['relay-deferred'],
            }),
            createTransactionMeta({
              id: 'relay-deferred',
              status: TransactionStatus.submitted,
              type: TransactionType.relayDeposit,
            }),
          ],
        },
      });
      flushStoreSubscribers();

      expect(mockShowPendingToast).not.toHaveBeenCalled();
    });

    it('still toasts an unrelated tx after the money-batch deferral times out', () => {
      jest.useFakeTimers();
      registerMoneyBatchById('money-deposit');
      clearToastPhase('unrelated-deferred');
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'unrelated-deferred',
          status: TransactionStatus.submitted,
          type: TransactionType.simpleSend,
        }),
      });

      expect(mockShowPendingToast).not.toHaveBeenCalled();

      jest.advanceTimersByTime(3000);

      expect(mockShowPendingToast).toHaveBeenCalledWith(
        'tx-unrelated-deferred',
        expect.objectContaining({ transactionId: 'unrelated-deferred' }),
      );
    });

    it('cancels a deferred pending toast for a money Pay child that confirms', () => {
      jest.useFakeTimers();
      registerMoneyBatchTransaction({
        id: 'money-deposit',
        requiredTransactionIds: ['relay-terminal'],
      });
      clearToastPhase('relay-terminal');
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'relay-terminal',
          status: TransactionStatus.submitted,
          type: TransactionType.relayDeposit,
        }),
      });
      // Known child is suppressed before deferral; confirm this path stays silent
      // even if status advances.
      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'relay-terminal',
          status: TransactionStatus.confirmed,
          type: TransactionType.relayDeposit,
        }),
      });

      jest.advanceTimersByTime(3000);

      expect(mockShowPendingToast).not.toHaveBeenCalled();
      expect(mockShowSuccessToast).not.toHaveBeenCalled();
    });

    it('still shows a terminal toast for an unrelated deferred tx that confirms', () => {
      jest.useFakeTimers();
      registerMoneyBatchById('money-deposit');
      clearToastPhase('unrelated-terminal');
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'unrelated-terminal',
          status: TransactionStatus.submitted,
          type: TransactionType.simpleSend,
        }),
      });
      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'unrelated-terminal',
          status: TransactionStatus.confirmed,
          type: TransactionType.simpleSend,
        }),
      });

      expect(mockShowPendingToast).not.toHaveBeenCalled();
      expect(mockShowSuccessToast).not.toHaveBeenCalled();

      jest.advanceTimersByTime(3000);

      expect(mockShowPendingToast).not.toHaveBeenCalled();
      expect(mockShowSuccessToast).toHaveBeenCalledWith(
        'tx-unrelated-terminal',
        expect.objectContaining({ transactionId: 'unrelated-terminal' }),
      );
    });

    it('shows unrelated pending toasts immediately when no money batch is in flight', () => {
      clearMoneyBatchById('money-deposit');
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'plain-send',
          status: TransactionStatus.submitted,
          type: TransactionType.simpleSend,
        }),
      });

      expect(mockShowPendingToast).toHaveBeenCalledWith(
        'tx-plain-send',
        expect.objectContaining({ transactionId: 'plain-send' }),
      );
      expect(mockStoreSubscribe).not.toHaveBeenCalled();
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
