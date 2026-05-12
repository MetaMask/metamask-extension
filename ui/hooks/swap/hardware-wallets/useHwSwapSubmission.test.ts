import { act } from '@testing-library/react-hooks';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
} from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine.test-helpers';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { rejectPendingApproval } from '../../../store/actions';
import { useHwSwapSubmission } from './useHwSwapSubmission';

jest.mock('../../../store/actions', () => ({
  rejectPendingApproval: jest.fn(() => () => Promise.resolve()),
}));

const mockRejectPendingApproval = rejectPendingApproval as jest.MockedFunction<
  typeof rejectPendingApproval
>;

const createMockLockedQuote = (requestId: string) =>
  ({
    quote: { requestId },
    quoteMetadata: {},
  }) as never;

describe('useHwSwapSubmission', () => {
  const mockDispatchSignatureEvent = jest.fn();
  const mockSubmitBridgeTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitBridgeTransaction.mockResolvedValue(undefined);
    mockRejectPendingApproval.mockImplementation(
      () => (() => Promise.resolve()) as never,
    );
  });

  it('dispatches Reset event when lockedQuote requestId changes', () => {
    const lockedQuote = createMockLockedQuote('request-1');

    renderHookWithProvider(
      () =>
        useHwSwapSubmission({
          lockedQuote,
          needsTwoConfirmations: false,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          submitBridgeTransaction: mockSubmitBridgeTransaction,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.Reset,
      needsTwoConfirmations: false,
    });
  });

  it('passes needsTwoConfirmations to Reset event', () => {
    const lockedQuote = createMockLockedQuote('request-1');

    renderHookWithProvider(
      () =>
        useHwSwapSubmission({
          lockedQuote,
          needsTwoConfirmations: true,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          submitBridgeTransaction: mockSubmitBridgeTransaction,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.Reset,
      needsTwoConfirmations: true,
    });
  });

  it('does not dispatch Reset event when requestId is the same', () => {
    const lockedQuote = createMockLockedQuote('request-1');

    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapSubmission({
          lockedQuote,
          needsTwoConfirmations: false,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          submitBridgeTransaction: mockSubmitBridgeTransaction,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).toHaveBeenCalledTimes(1);

    rerender();

    expect(mockDispatchSignatureEvent).toHaveBeenCalledTimes(1);
  });

  it('automatically submits the locked quote on mount', () => {
    const lockedQuote = createMockLockedQuote('request-1');

    renderHookWithProvider(
      () =>
        useHwSwapSubmission({
          lockedQuote,
          needsTwoConfirmations: false,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          submitBridgeTransaction: mockSubmitBridgeTransaction,
        }),
      {},
    );

    expect(mockSubmitBridgeTransaction).toHaveBeenCalledWith(lockedQuote);
  });

  it('does not auto-submit when lockedQuote is undefined', () => {
    renderHookWithProvider(
      () =>
        useHwSwapSubmission({
          lockedQuote: undefined,
          needsTwoConfirmations: false,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          submitBridgeTransaction: mockSubmitBridgeTransaction,
        }),
      {},
    );

    expect(mockSubmitBridgeTransaction).not.toHaveBeenCalled();
  });

  it('resets hasStartedSubmission on submission error', async () => {
    const lockedQuote = createMockLockedQuote('request-1');
    mockSubmitBridgeTransaction.mockRejectedValue(
      new Error('submission failed'),
    );

    const { result } = renderHookWithProvider(
      () =>
        useHwSwapSubmission({
          lockedQuote,
          needsTwoConfirmations: false,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          submitBridgeTransaction: mockSubmitBridgeTransaction,
        }),
      {},
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.hasStartedSubmission.current).toBe(false);
  });

  it('submitActiveQuote does nothing when lockedQuote is undefined', async () => {
    const { result } = renderHookWithProvider(
      () =>
        useHwSwapSubmission({
          lockedQuote: undefined,
          needsTwoConfirmations: false,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          submitBridgeTransaction: mockSubmitBridgeTransaction,
        }),
      {},
    );

    await act(async () => {
      await result.current.submitActiveQuote();
    });

    expect(mockSubmitBridgeTransaction).not.toHaveBeenCalled();
  });

  it('retrySubmission calls submitBridgeTransaction with retry rpcTimeoutMs', async () => {
    const lockedQuote = createMockLockedQuote('request-1');

    const { result } = renderHookWithProvider(
      () =>
        useHwSwapSubmission({
          lockedQuote,
          needsTwoConfirmations: false,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          submitBridgeTransaction: mockSubmitBridgeTransaction,
        }),
      {},
    );

    mockSubmitBridgeTransaction.mockClear();

    await act(async () => {
      await result.current.retrySubmission();
    });

    expect(mockSubmitBridgeTransaction).toHaveBeenCalledWith(lockedQuote, {
      rpcTimeoutMs: 120_000,
    });
  });

  it('retrySubmission sets hasStartedSubmission to true', async () => {
    const lockedQuote = createMockLockedQuote('request-1');

    const { result } = renderHookWithProvider(
      () =>
        useHwSwapSubmission({
          lockedQuote,
          needsTwoConfirmations: false,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          submitBridgeTransaction: mockSubmitBridgeTransaction,
        }),
      {},
    );

    expect(result.current.hasStartedSubmission.current).toBe(true);

    await act(async () => {
      await result.current.retrySubmission();
    });

    expect(result.current.hasStartedSubmission.current).toBe(true);
  });

  it('retrySubmission does nothing when lockedQuote is undefined', async () => {
    const { result } = renderHookWithProvider(
      () =>
        useHwSwapSubmission({
          lockedQuote: undefined,
          needsTwoConfirmations: false,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          submitBridgeTransaction: mockSubmitBridgeTransaction,
        }),
      {},
    );

    await act(async () => {
      await result.current.retrySubmission();
    });

    expect(mockSubmitBridgeTransaction).not.toHaveBeenCalled();
  });

  describe('retrySubmission with existing batch transactions', () => {
    const FROM_ADDRESS = '0xAbC0000000000000000000000000000000000001';
    const CHAIN_ID = '0x1';

    const buildStateWithTransactions = (
      transactions: {
        id: string;
        type: TransactionType;
        status: TransactionStatus;
        from: string;
        batchId?: string;
      }[],
    ) => ({
      metamask: {
        providerConfig: { chainId: CHAIN_ID },
        transactions: transactions.map((tx, index) => ({
          id: tx.id,
          type: tx.type,
          status: tx.status,
          chainId: CHAIN_ID,
          batchId: tx.batchId ?? `batch-${index}`,
          time: index,
          txParams: { from: tx.from },
        })),
      },
    });

    it('does not reject unapproved batch txs before retry', async () => {
      const lockedQuote = createMockLockedQuote('request-1');
      const state = buildStateWithTransactions([
        {
          id: 'tx-approval-1',
          type: TransactionType.swapApproval,
          status: TransactionStatus.unapproved,
          from: FROM_ADDRESS,
        },
        {
          id: 'tx-trade-1',
          type: TransactionType.swap,
          status: TransactionStatus.unapproved,
          from: FROM_ADDRESS,
        },
      ]);

      const { result } = renderHookWithProvider(
        () =>
          useHwSwapSubmission({
            lockedQuote,
            needsTwoConfirmations: true,
            signatureState: createSignatureState(
              HardwareWalletSignatureStatus.Rejected,
            ),
            dispatchSignatureEvent: mockDispatchSignatureEvent,
            submitBridgeTransaction: mockSubmitBridgeTransaction,
          } as never),
        state,
      );

      mockSubmitBridgeTransaction.mockClear();
      mockRejectPendingApproval.mockClear();

      await act(async () => {
        await result.current.retrySubmission();
      });

      expect(mockRejectPendingApproval).not.toHaveBeenCalled();
      expect(mockSubmitBridgeTransaction).toHaveBeenCalledWith(lockedQuote, {
        rpcTimeoutMs: 120_000,
      });
    });
  });
});
