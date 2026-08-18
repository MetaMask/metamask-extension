import { renderHook } from '@testing-library/react';
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

    it('does not toast excluded approval transactions', () => {
      const { handlers } = mountHook();

      handlers[transactionControllerEvent]({
        transactionMeta: createTransactionMeta({
          id: 'excluded-approval',
          status: TransactionStatus.submitted,
          type: TransactionType.bridgeApproval,
        }),
      });

      expect(mockShowPendingToast).not.toHaveBeenCalled();
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
