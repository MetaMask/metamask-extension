import { act } from '@testing-library/react';
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
} from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine/test-helpers';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { rejectPendingApproval } from '../../store/actions';
import { useHwSwapSubmission } from './useHwSwapSubmission';

jest.mock('../../store/actions', () => ({
  rejectPendingApproval: jest.fn(() => () => Promise.resolve()),
}));

const mockRejectPendingApproval = rejectPendingApproval as jest.MockedFunction<
  typeof rejectPendingApproval
>;

const mockEnsureDeviceReady = jest.fn();
let mockConnectionState: { status: string } = { status: 'error' };

jest.mock('../../contexts/hardware-wallets', () => ({
  useHardwareWalletActions: (): {
    ensureDeviceReady: typeof mockEnsureDeviceReady;
  } => ({
    ensureDeviceReady: mockEnsureDeviceReady,
  }),
  useHardwareWalletState: (): { connectionState: { status: string } } => ({
    connectionState: mockConnectionState,
  }),
}));

const createAppClosedError = () =>
  new HardwareWalletError('Ethereum app is not open', {
    code: ErrorCode.DeviceStateEthAppClosed,
    severity: Severity.Err,
    category: Category.DeviceState,
    userMessage: 'Ethereum app is not open',
  });

/** Flushes microtasks so submissions and effects settle within act(). */
const flushAsync = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

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
    mockEnsureDeviceReady.mockResolvedValue(true);
    mockConnectionState = { status: 'error' };
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

  it('keeps hasStartedSubmission set after a submission error', async () => {
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

    expect(result.current.hasStartedSubmission.current).toBe(true);
  });

  it('does not auto-resubmit after a rejection when submitBridgeTransaction identity changes', async () => {
    const lockedQuote = createMockLockedQuote('request-1');
    const rejectionError = new Error('Ledger: User rejected the transaction');
    mockSubmitBridgeTransaction.mockRejectedValue(rejectionError);

    // Simulates the real caller, where `submitBridgeTransaction` gets a new
    // identity on every render (e.g. after the rejected event re-renders).
    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapSubmission({
          lockedQuote,
          needsTwoConfirmations: false,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          submitBridgeTransaction: (...args: unknown[]) =>
            mockSubmitBridgeTransaction(...args),
        }),
      {},
    );

    await act(async () => {
      await Promise.resolve();
    });

    rerender();
    await act(async () => {
      await Promise.resolve();
    });
    rerender();

    expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(1);
  });

  describe('recovery from errors that map to no signature event', () => {
    // Mirrors the real caller: `submitBridgeTransaction` gets a new identity
    // every render.
    const renderSubmissionHook = () => {
      const lockedQuote = createMockLockedQuote('request-1');

      return renderHookWithProvider(
        () =>
          useHwSwapSubmission({
            lockedQuote,
            needsTwoConfirmations: false,
            signatureState: createSignatureState(
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
            ),
            dispatchSignatureEvent: mockDispatchSignatureEvent,
            submitBridgeTransaction: (...args: unknown[]) =>
              mockSubmitBridgeTransaction(...args),
          }),
        {},
      );
    };

    it('keeps auto-submit disarmed while the device is not ready', async () => {
      mockSubmitBridgeTransaction.mockRejectedValueOnce(createAppClosedError());
      mockEnsureDeviceReady.mockResolvedValue(false);

      const { result, rerender } = renderSubmissionHook();

      await flushAsync();

      // A live readiness check is made...
      expect(mockEnsureDeviceReady).toHaveBeenCalled();
      // ...but the flag stays armed, so rerenders cannot resubmit while the
      // Ethereum app is still closed.
      expect(result.current.hasStartedSubmission.current).toBe(true);
      expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(1);

      rerender();
      await flushAsync();
      rerender();
      await flushAsync();

      expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(1);
      expect(result.current.hasStartedSubmission.current).toBe(true);
    });

    it('re-arms auto-submit once after the device recovers', async () => {
      mockSubmitBridgeTransaction
        .mockRejectedValueOnce(createAppClosedError())
        .mockResolvedValue(undefined);
      mockEnsureDeviceReady.mockResolvedValueOnce(false);

      const { result, rerender } = renderSubmissionHook();

      await flushAsync();

      expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(1);
      expect(result.current.hasStartedSubmission.current).toBe(true);

      // Device recovers: readiness passes and connectionState changes.
      mockEnsureDeviceReady.mockResolvedValue(true);
      mockConnectionState = { status: 'ready' };
      rerender();
      await flushAsync();

      expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(2);
      // The restarted attempt succeeded, so auto-submit stays armed.
      expect(result.current.hasStartedSubmission.current).toBe(true);
    });

    it('clears the pending recovery when the locked quote changes', async () => {
      const quote1 = createMockLockedQuote('request-1');
      const quote2 = createMockLockedQuote('request-2');
      let lockedQuote = quote1;
      mockSubmitBridgeTransaction.mockRejectedValueOnce(createAppClosedError());
      mockEnsureDeviceReady.mockResolvedValue(false);

      const { rerender } = renderHookWithProvider(
        () =>
          useHwSwapSubmission({
            lockedQuote,
            needsTwoConfirmations: false,
            signatureState: createSignatureState(
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
            ),
            dispatchSignatureEvent: mockDispatchSignatureEvent,
            submitBridgeTransaction: (...args: unknown[]) =>
              mockSubmitBridgeTransaction(...args),
          }),
        {},
      );

      await flushAsync();
      expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(1);

      // A new quote auto-submits immediately, even with the old quote's
      // recovery still pending.
      lockedQuote = quote2;
      mockSubmitBridgeTransaction.mockClear();
      rerender();
      await flushAsync();

      expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(1);
      expect(mockSubmitBridgeTransaction).toHaveBeenCalledWith(quote2);
    });
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

  describe('retrySubmission with firstSignatureDone', () => {
    const createMockLockedQuoteWithApproval = (requestId: string) =>
      ({
        quote: { requestId },
        quoteMetadata: {},
        approval: { data: '0xapproval' },
        trade: { data: '0xtrade' },
      }) as never;

    it('strips approval from lockedQuote when firstSignatureDone is true', async () => {
      const lockedQuote = createMockLockedQuoteWithApproval('request-1');

      const { result } = renderHookWithProvider(
        () =>
          useHwSwapSubmission({
            lockedQuote,
            needsTwoConfirmations: true,
            signatureState: createSignatureState(
              HardwareWalletSignatureStatus.AwaitingFinalSignature,
            ),
            dispatchSignatureEvent: mockDispatchSignatureEvent,
            submitBridgeTransaction: mockSubmitBridgeTransaction,
            firstSignatureDone: true,
          }),
        {},
      );

      await act(async () => {
        await result.current.retrySubmission();
      });

      const [callArg] = mockSubmitBridgeTransaction.mock.lastCall;
      expect(callArg.approval).toBeUndefined();
      expect(callArg.trade).toEqual({ data: '0xtrade' });
    });

    it('does not strip approval when firstSignatureDone is false', async () => {
      const lockedQuote = createMockLockedQuoteWithApproval('request-1');

      const { result } = renderHookWithProvider(
        () =>
          useHwSwapSubmission({
            lockedQuote,
            needsTwoConfirmations: true,
            signatureState: createSignatureState(
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
            ),
            dispatchSignatureEvent: mockDispatchSignatureEvent,
            submitBridgeTransaction: mockSubmitBridgeTransaction,
            firstSignatureDone: false,
          }),
        {},
      );

      mockSubmitBridgeTransaction.mockClear();

      await act(async () => {
        await result.current.retrySubmission();
      });

      const [callArg] = mockSubmitBridgeTransaction.mock.lastCall;
      expect(callArg.approval).toEqual({ data: '0xapproval' });
      expect(callArg.trade).toEqual({ data: '0xtrade' });
    });

    it('does not strip approval when firstSignatureDone is not provided', async () => {
      const lockedQuote = createMockLockedQuoteWithApproval('request-1');

      const { result } = renderHookWithProvider(
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

      mockSubmitBridgeTransaction.mockClear();

      await act(async () => {
        await result.current.retrySubmission();
      });

      const [callArg] = mockSubmitBridgeTransaction.mock.lastCall;
      expect(callArg.approval).toEqual({ data: '0xapproval' });
    });

    it('calls onResetFirstSignature when requestId changes', () => {
      const onResetFirstSignature = jest.fn();
      let lockedQuote = createMockLockedQuoteWithApproval('request-1');

      const { rerender } = renderHookWithProvider(
        () =>
          useHwSwapSubmission({
            lockedQuote,
            needsTwoConfirmations: true,
            signatureState: createSignatureState(
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
            ),
            dispatchSignatureEvent: mockDispatchSignatureEvent,
            submitBridgeTransaction: mockSubmitBridgeTransaction,
            onResetFirstSignature,
          }),
        {},
      );

      // Initial mount fires the effect once for request-1.
      expect(onResetFirstSignature).toHaveBeenCalledTimes(1);

      rerender();
      expect(onResetFirstSignature).toHaveBeenCalledTimes(1);

      lockedQuote = createMockLockedQuoteWithApproval('request-2');
      rerender();
      expect(onResetFirstSignature).toHaveBeenCalledTimes(2);
    });

    it('does not strip approval when lockedQuote has no approval field', async () => {
      const lockedQuote = createMockLockedQuote('request-1');

      const { result } = renderHookWithProvider(
        () =>
          useHwSwapSubmission({
            lockedQuote,
            needsTwoConfirmations: false,
            signatureState: createSignatureState(
              HardwareWalletSignatureStatus.AwaitingFinalSignature,
            ),
            dispatchSignatureEvent: mockDispatchSignatureEvent,
            submitBridgeTransaction: mockSubmitBridgeTransaction,
            firstSignatureDone: true,
          }),
        {},
      );

      await act(async () => {
        await result.current.retrySubmission();
      });

      const [callArg] = mockSubmitBridgeTransaction.mock.lastCall;
      expect(callArg).toBe(lockedQuote);
    });
  });
});
