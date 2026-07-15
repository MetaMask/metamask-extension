import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import {
  subscribeToMessengerEvent,
  submitRequestToBackground,
} from '../../store/background-connection';
import { HardwareWalletSignatureEvent } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { useHwSignTracker } from './useHwSignTracker';
import { UNKNOWN_BATCH_ID } from './hw-sign-tracker/constants';

jest.mock('../../store/background-connection', () => {
  const createMockUnsubscribe = () => {
    const fn = jest.fn().mockResolvedValue(undefined) as jest.Mock & {
      catch: jest.Mock;
    };
    fn.catch = jest.fn();
    return fn;
  };
  return {
    subscribeToMessengerEvent: jest
      .fn()
      .mockResolvedValue(createMockUnsubscribe()),
    submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
  };
});

const mockSubscribe = subscribeToMessengerEvent as jest.MockedFunction<
  typeof subscribeToMessengerEvent
>;

const mockSubmitRequestToBackground =
  submitRequestToBackground as jest.MockedFunction<
    typeof submitRequestToBackground
  >;

// ============================================================
// CONSTANTS & HELPERS
// ============================================================

const FROM_ADDRESS = '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452';

const STATUS_UPDATED = 'TransactionController:transactionStatusUpdated';
const REJECTED = 'TransactionController:transactionRejected';
const FINISHED = 'TransactionController:transactionFinished';

type TxMetaOverrides = Partial<{
  status: string;
  type: string;
  from: string;
  data: string;
  batchId: string;
  id: string;
  to: string;
  value: string;
}>;

function createTxMeta(overrides: TxMetaOverrides = {}) {
  return {
    id: overrides.id ?? 'tx-1',
    status: overrides.status ?? 'signed',
    type: overrides.type ?? TransactionType.bridgeApproval,
    txParams: {
      data: overrides.data,
      from: overrides.from ?? FROM_ADDRESS,
      to: overrides.to,
      value: overrides.value,
    },
    batchId: overrides.batchId,
  };
}

function setupCallbacks() {
  const callbacks = new Map<string, (...args: unknown[]) => void>();
  mockSubscribe.mockImplementation(async (event, callback) => {
    callbacks.set(event as string, callback as (...args: unknown[]) => void);
    const fn = jest.fn().mockResolvedValue(undefined) as jest.Mock & {
      catch: jest.Mock;
    };
    fn.catch = jest.fn();
    return fn;
  });
  return callbacks;
}

function createRetryGenRef(): React.MutableRefObject<number> {
  return { current: 0 };
}

async function setupTracker(options: {
  useBatchTracking: boolean;
  fromAddress?: string;
  hardwareWalletUsed?: boolean;
  enabled?: boolean;
  expectedTransactionParams?: Parameters<
    typeof useHwSignTracker
  >[3]['expectedTransactionParams'];
  expectedTxIds?: string[];
  includeSendBundleTransactions?: boolean;
  retryGenerationRef?: React.MutableRefObject<number>;
}) {
  const callbacks = setupCallbacks();
  const dispatchEvent = jest.fn();

  const { result } = renderHook(() =>
    useHwSignTracker(
      options.fromAddress ?? FROM_ADDRESS,
      options.hardwareWalletUsed ?? true,
      dispatchEvent,
      {
        enabled: options.enabled ?? true,
        expectedTransactionParams: options.expectedTransactionParams,
        expectedTxIds: options.expectedTxIds,
        includeSendBundleTransactions: options.includeSendBundleTransactions,
        useBatchTracking: options.useBatchTracking,
      },
      options.retryGenerationRef,
    ),
  );

  await act(async () => {
    await jest.runAllTimersAsync();
  });

  const fire = async (event: string, overrides: TxMetaOverrides = {}) => {
    const cb = callbacks.get(event);
    // transactionFinished is published with the meta directly, whereas
    // transactionStatusUpdated/transactionRejected wrap it in
    // { transactionMeta }. Mirror the real payload shapes so the handler's
    // shape-normalization is exercised (a bare-meta transactionFinished used to
    // crash the handler before destructuring `status`).
    const meta = createTxMeta(overrides);
    await act(async () => {
      cb?.(event === FINISHED ? [meta] : [{ transactionMeta: meta }]);
    });
  };

  const cancelAndWait = async () => {
    const cancelPromise = result.current.cancelCurrentBatch();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(6_000);
    });
    await cancelPromise;
  };

  return { result, dispatchEvent, callbacks, fire, cancelAndWait };
}

// ============================================================
// SHARED BEHAVIOR (both batch and sequential modes)
// ============================================================
// @ts-expect-error The Mocha types are incorrect.
describe.each<string, boolean>([
  ['batch', true],
  ['sequential', false],
])('useHwSignTracker (%s mode)', (_mode: string, useBatchTracking: boolean) => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSubscribe.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not subscribe when fromAddress is undefined', async () => {
    setupCallbacks();
    const dispatchEvent = jest.fn();
    renderHook(() =>
      useHwSignTracker(undefined, true, dispatchEvent, {
        useBatchTracking,
      }),
    );
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('does not subscribe when hardwareWalletUsed is false', async () => {
    await setupTracker({ useBatchTracking, hardwareWalletUsed: false });
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('does not subscribe when enabled is false', async () => {
    await setupTracker({ useBatchTracking, enabled: false });
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes to 3 TransactionController events when properly configured', async () => {
    await setupTracker({ useBatchTracking });
    expect(mockSubscribe).toHaveBeenCalledTimes(3);
    expect(mockSubscribe).toHaveBeenCalledWith(
      STATUS_UPDATED,
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalledWith(REJECTED, expect.any(Function));
    expect(mockSubscribe).toHaveBeenCalledWith(FINISHED, expect.any(Function));
  });

  it('unsubscribes subscriptions that complete after effect cleanup', async () => {
    const pendingResolvers: (() => void)[] = [];
    const unsubs: jest.Mock[] = [];

    mockSubscribe.mockImplementation(async () => {
      const unsub = jest.fn().mockResolvedValue(undefined);
      unsubs.push(unsub);
      return new Promise<() => Promise<void>>((resolve) => {
        pendingResolvers.push(() => resolve(unsub));
      });
    });

    const dispatchEvent = jest.fn();
    const { unmount } = renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, dispatchEvent, {
        useBatchTracking,
      }),
    );

    expect(mockSubscribe).toHaveBeenCalledTimes(3);
    expect(pendingResolvers).toHaveLength(3);

    unmount();

    await act(async () => {
      pendingResolvers.forEach((complete) => complete());
      await Promise.resolve();
    });

    for (const unsub of unsubs) {
      expect(unsub).toHaveBeenCalledTimes(1);
    }
  });

  it('dispatches FirstSignatureSubmitted when approval tx is signed', async () => {
    const { dispatchEvent, fire } = await setupTracker({ useBatchTracking });
    await fire(STATUS_UPDATED);
    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('dispatches TransactionSubmitted when trade tx is signed', async () => {
    const { dispatchEvent, fire } = await setupTracker({ useBatchTracking });
    await fire(STATUS_UPDATED, { type: TransactionType.bridge });
    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('dispatches TransactionSubmitted for swap trade type', async () => {
    const { dispatchEvent, fire } = await setupTracker({ useBatchTracking });
    await fire(STATUS_UPDATED, { type: TransactionType.swap });
    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('dispatches FirstSignatureSubmitted for swap approval type', async () => {
    const { dispatchEvent, fire } = await setupTracker({ useBatchTracking });
    await fire(STATUS_UPDATED, { type: TransactionType.swapApproval });
    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('dispatches sendBundle hardware wallet events for expected bundle member and main transaction', async () => {
    const { dispatchEvent, fire } = await setupTracker({
      expectedTransactionParams: [
        {
          to: '0xabc0000000000000000000000000000000000000',
        },
      ],
      expectedTxIds: ['tx-main'],
      includeSendBundleTransactions: true,
      useBatchTracking,
    });

    // Real-world signing order: SEND tx (root) signs first, then the GAS
    // tx (generated batch member) signs second. See useHwSignTracker.
    await fire(STATUS_UPDATED, {
      id: 'tx-main',
      type: TransactionType.simpleSend,
    });
    await fire(STATUS_UPDATED, {
      data: '0x123',
      id: 'tx-generated-bundle-member',
      to: '0xabc0000000000000000000000000000000000000',
      type: TransactionType.contractInteraction,
      value: '0x0',
    });

    expect(dispatchEvent).toHaveBeenNthCalledWith(1, {
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
    expect(dispatchEvent).toHaveBeenNthCalledWith(2, {
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('ignores matching send events outside the expected transaction IDs', async () => {
    const { dispatchEvent, fire } = await setupTracker({
      expectedTxIds: ['tx-expected'],
      includeSendBundleTransactions: true,
      useBatchTracking,
    });

    await fire(STATUS_UPDATED, {
      id: 'tx-unrelated',
      type: TransactionType.simpleSend,
    });
    await fire(STATUS_UPDATED, {
      id: 'tx-expected',
      type: TransactionType.simpleSend,
    });

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('tracks generated sendBundle batch members by expected params', async () => {
    const { dispatchEvent, fire } = await setupTracker({
      expectedTransactionParams: [
        {
          to: '0xabc0000000000000000000000000000000000000',
        },
      ],
      expectedTxIds: ['tx-main'],
      includeSendBundleTransactions: true,
      useBatchTracking,
    });

    // Real-world signing order: SEND tx (root) signs first, then the GAS
    // tx (generated batch member) signs second.
    await fire(STATUS_UPDATED, {
      id: 'tx-main',
      type: TransactionType.simpleSend,
    });
    await fire(STATUS_UPDATED, {
      data: '0x123',
      id: 'tx-generated-gas-payment',
      to: '0xabc0000000000000000000000000000000000000',
      type: TransactionType.contractInteraction,
      value: '0x0',
    });

    expect(dispatchEvent).toHaveBeenNthCalledWith(1, {
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
    expect(dispatchEvent).toHaveBeenNthCalledWith(2, {
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('does not classify a contract-creation tx (no `to`) as the gas step when expected.to is set', async () => {
    const { dispatchEvent, fire } = await setupTracker({
      expectedTransactionParams: [
        {
          to: '0xabc0000000000000000000000000000000000000',
          value: '0x0',
        },
      ],
      expectedTxIds: ['tx-main'],
      includeSendBundleTransactions: true,
      useBatchTracking,
    });

    // Root SEND tx signs first → FirstSignatureSubmitted.
    await fire(STATUS_UPDATED, {
      id: 'tx-main',
      type: TransactionType.simpleSend,
    });

    // An unrelated contract-creation tx has no `to` but happens to share the
    // gas step's `value`. It must NOT be misclassified as the bundle gas step
    // (TransactionSubmitted), or the real gas-tx signature would be dropped
    // when the state machine advances to terminal.
    await fire(STATUS_UPDATED, {
      data: '0xdeploy',
      id: 'tx-unrelated-contract-creation',
      type: TransactionType.contractInteraction,
      value: '0x0',
    });

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('does not match transactions when an expected param entry is empty', async () => {
    const { dispatchEvent, fire } = await setupTracker({
      expectedTransactionParams: [{}],
      expectedTxIds: ['tx-main'],
      includeSendBundleTransactions: true,
      useBatchTracking,
    });

    // The root SEND tx still advances via expectedTxIds, but the generated
    // batch member must NOT be classified as TransactionSubmitted by an empty
    // param entry (which would otherwise match every transaction and drop the
    // gas-tx signature).
    await fire(STATUS_UPDATED, {
      id: 'tx-main',
      type: TransactionType.simpleSend,
    });
    await fire(STATUS_UPDATED, {
      data: '0x123',
      id: 'tx-generated-gas-payment',
      to: '0xabc0000000000000000000000000000000000000',
      type: TransactionType.contractInteraction,
      value: '0x0',
    });

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('ignores signed events from other addresses', async () => {
    const { dispatchEvent, fire } = await setupTracker({ useBatchTracking });
    await fire(STATUS_UPDATED, {
      from: '0x0000000000000000000000000000000000000000',
    });
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('ignores signed events for untracked transaction types', async () => {
    const { dispatchEvent, fire } = await setupTracker({ useBatchTracking });
    await fire(STATUS_UPDATED, { type: TransactionType.contractInteraction });
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('ignores sendBundle transaction types unless sendBundle tracking is active', async () => {
    const { dispatchEvent, fire } = await setupTracker({ useBatchTracking });

    await fire(STATUS_UPDATED, { type: TransactionType.gasPayment });
    await fire(STATUS_UPDATED, { type: TransactionType.simpleSend });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('ignores transactionFinished for other statuses', async () => {
    const { dispatchEvent, fire } = await setupTracker({ useBatchTracking });
    await fire(STATUS_UPDATED, { batchId: 'batch-1' });
    dispatchEvent.mockClear();
    await fire(FINISHED, { status: 'confirmed', batchId: 'batch-1' });
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('uses latest dispatchEvent via ref', async () => {
    const callbacks = setupCallbacks();
    const dispatch1 = jest.fn();
    const dispatch2 = jest.fn();

    const { rerender } = renderHook(
      ({ dispatch }) =>
        useHwSignTracker(FROM_ADDRESS, true, dispatch, {
          useBatchTracking,
        }),
      { initialProps: { dispatch: dispatch1 } },
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    rerender({ dispatch: dispatch2 });

    const cb = callbacks.get(STATUS_UPDATED);
    await act(async () => {
      cb?.([{ transactionMeta: createTxMeta() }]);
    });

    expect(dispatch2).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  describe('cancelCurrentBatch', () => {
    it('does nothing when no txs have been tracked', async () => {
      const { result } = await setupTracker({ useBatchTracking });
      mockSubmitRequestToBackground.mockClear();
      await act(async () => {
        await result.current.cancelCurrentBatch();
      });
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('returns early when enabled is false', async () => {
      const { result } = await setupTracker({
        useBatchTracking,
        enabled: false,
      });
      mockSubmitRequestToBackground.mockClear();
      await act(async () => {
        await result.current.cancelCurrentBatch();
      });
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('continues cleanup even when abortTransactionSigning throws', async () => {
      const { result, fire } = await setupTracker({ useBatchTracking });
      await fire(STATUS_UPDATED, { id: 'tx-1', batchId: 'batch-1' });
      mockSubmitRequestToBackground.mockClear();
      mockSubmitRequestToBackground.mockRejectedValueOnce(
        new Error('abort failed'),
      );
      await act(async () => {
        await result.current.cancelCurrentBatch();
      });
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-1'],
      );
    });

    it('calls abortTransactionSigning for tracked tx ids', async () => {
      const { fire, cancelAndWait } = await setupTracker({ useBatchTracking });
      await fire(STATUS_UPDATED, {
        id: 'tx-approval',
        type: TransactionType.bridgeApproval,
        batchId: 'batch-1',
      });
      await fire(STATUS_UPDATED, {
        id: 'tx-trade',
        type: TransactionType.bridge,
        batchId: 'batch-1',
      });
      mockSubmitRequestToBackground.mockClear();
      await cancelAndWait();
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-approval'],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-trade'],
      );
    });

    it('allows reused tx ids to dispatch after cancel times out without abort events', async () => {
      const { dispatchEvent, fire, result } = await setupTracker({
        useBatchTracking,
      });

      await fire(STATUS_UPDATED, {
        id: 'tx-reuse',
        batchId: 'batch-1',
      });
      dispatchEvent.mockClear();

      const cancelPromise = result.current.cancelCurrentBatch();
      await act(async () => {
        await jest.advanceTimersByTimeAsync(6_000);
      });
      await cancelPromise;

      dispatchEvent.mockClear();
      await fire(STATUS_UPDATED, {
        id: 'tx-reuse',
        batchId: 'batch-1',
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });
    });

    it('does not dispatch transactionRejected when cancel runs twice during settle', async () => {
      const { dispatchEvent, fire, result } = await setupTracker({
        useBatchTracking,
      });

      await fire(STATUS_UPDATED, {
        id: 'tx-abort',
        batchId: 'batch-1',
      });
      dispatchEvent.mockClear();

      const firstCancelPromise = result.current.cancelCurrentBatch();
      await act(async () => {
        await result.current.cancelCurrentBatch();
      });

      await fire(REJECTED, { id: 'tx-abort', batchId: 'batch-1' });
      expect(dispatchEvent).not.toHaveBeenCalled();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(6_000);
      });
      await firstCancelPromise;

      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('does not dispatch transactionRejected when enabled toggles during settle', async () => {
      const callbacks = setupCallbacks();
      const dispatchEvent = jest.fn();

      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useHwSignTracker(FROM_ADDRESS, true, dispatchEvent, {
            useBatchTracking,
            enabled,
          }),
        { initialProps: { enabled: true } },
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCb = callbacks.get(STATUS_UPDATED);
      await act(async () => {
        statusCb?.([
          {
            transactionMeta: createTxMeta({
              id: 'tx-abort',
              batchId: 'batch-1',
            }),
          },
        ]);
      });

      dispatchEvent.mockClear();

      const cancelPromise = result.current.cancelCurrentBatch();

      rerender({ enabled: false });
      rerender({ enabled: true });

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const rejectedCb = callbacks.get(REJECTED);
      await act(async () => {
        rejectedCb?.([
          {
            transactionMeta: createTxMeta({
              id: 'tx-abort',
              batchId: 'batch-1',
            }),
          },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(6_000);
      });
      await cancelPromise;

      expect(dispatchEvent).not.toHaveBeenCalled();
    });
  });

  describe('subscription lifecycle', () => {
    it('clears tracked tx ids when enabled toggles off and on', async () => {
      const callbacks = setupCallbacks();
      const dispatchEvent = jest.fn();

      const { rerender } = renderHook(
        ({ enabled }) =>
          useHwSignTracker(FROM_ADDRESS, true, dispatchEvent, {
            useBatchTracking,
            enabled,
          }),
        { initialProps: { enabled: true } },
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCb = callbacks.get(STATUS_UPDATED);
      await act(async () => {
        statusCb?.([
          {
            transactionMeta: createTxMeta({
              id: 'tx-old',
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      rerender({ enabled: false });
      rerender({ enabled: true });

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      dispatchEvent.mockClear();

      const rejectedCb = callbacks.get(REJECTED);
      await act(async () => {
        rejectedCb?.([
          {
            transactionMeta: createTxMeta({
              id: 'tx-old',
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('dispatches transactionRejected for re-subscribed flow after stale cancel timeout', async () => {
      const callbacks = setupCallbacks();
      const dispatchEvent = jest.fn();

      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useHwSignTracker(FROM_ADDRESS, true, dispatchEvent, {
            useBatchTracking,
            enabled,
          }),
        { initialProps: { enabled: true } },
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCb = callbacks.get(STATUS_UPDATED);
      await act(async () => {
        statusCb?.([
          {
            transactionMeta: createTxMeta({
              id: 'tx-old',
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      const cancelPromise = result.current.cancelCurrentBatch();

      rerender({ enabled: false });
      rerender({ enabled: true });

      await act(async () => {
        await Promise.resolve();
      });

      const statusCbAfterResubscribe = callbacks.get(STATUS_UPDATED);
      const rejectedCbAfterResubscribe = callbacks.get(REJECTED);

      dispatchEvent.mockClear();
      await act(async () => {
        statusCbAfterResubscribe?.([
          {
            transactionMeta: createTxMeta({
              id: 'tx-new',
              batchId: 'batch-new',
            }),
          },
        ]);
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(6_000);
      });
      await cancelPromise;

      dispatchEvent.mockClear();
      await act(async () => {
        rejectedCbAfterResubscribe?.([
          {
            transactionMeta: createTxMeta({
              id: 'tx-new',
              batchId: 'batch-new',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('does not abort stale txs after fromAddress changes', async () => {
      const callbacks = setupCallbacks();
      const dispatchEvent = jest.fn();
      const otherAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      const { result, rerender } = renderHook(
        ({ fromAddress }) =>
          useHwSignTracker(fromAddress, true, dispatchEvent, {
            useBatchTracking,
          }),
        { initialProps: { fromAddress: FROM_ADDRESS } },
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCb = callbacks.get(STATUS_UPDATED);
      await act(async () => {
        statusCb?.([
          {
            transactionMeta: createTxMeta({
              id: 'tx-old',
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      rerender({ fromAddress: otherAddress });

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      mockSubmitRequestToBackground.mockClear();
      await act(async () => {
        await result.current.cancelCurrentBatch();
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });
});

// ============================================================
// BATCH MODE SPECIFIC
// ============================================================
describe('useHwSignTracker (batch mode specific)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSubscribe.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('batch identification', () => {
    it('dispatches TransactionFailed on status failed before batch is identified when the tx was tracked', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
      });
      // The tx is observed first (unapproved on creation), so a subsequent
      // failure is the current flow failing and must surface instead of
      // leaving the UI stuck awaiting.
      await fire(STATUS_UPDATED, { status: 'unapproved' });
      dispatchEvent.mockClear();
      await fire(STATUS_UPDATED, { status: 'failed' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    it('dispatches TransactionFailed on status failed after batch is identified', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
      });
      await fire(STATUS_UPDATED, { batchId: 'batch-1' });
      dispatchEvent.mockClear();
      await fire(STATUS_UPDATED, { status: 'failed', batchId: 'batch-1' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    it('dispatches TransactionRejected on transactionRejected before batch is identified when the tx was tracked', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
      });
      await fire(STATUS_UPDATED, { status: 'unapproved' });
      dispatchEvent.mockClear();
      await fire(REJECTED);
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('dispatches TransactionRejected on transactionRejected after batch identified', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
      });
      await fire(STATUS_UPDATED, { batchId: 'batch-1' });
      dispatchEvent.mockClear();
      await fire(REJECTED, { batchId: 'batch-1' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('dispatches TransactionRejected when transactionFinished with rejected before batch identified (tracked tx)', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
      });
      await fire(STATUS_UPDATED, { status: 'unapproved' });
      dispatchEvent.mockClear();
      await fire(FINISHED, { status: 'rejected' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('dispatches TransactionRejected when transactionFinished with rejected after batch identified', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
      });
      await fire(STATUS_UPDATED, { batchId: 'batch-1' });
      dispatchEvent.mockClear();
      await fire(FINISHED, { status: 'rejected', batchId: 'batch-1' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('dispatches TransactionFailed when transactionFinished with failed before batch identified (tracked tx)', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
      });
      await fire(STATUS_UPDATED, { status: 'unapproved' });
      dispatchEvent.mockClear();
      await fire(FINISHED, { status: 'failed' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    it('dispatches TransactionFailed when transactionFinished with failed after batch identified', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
      });
      await fire(STATUS_UPDATED, { batchId: 'batch-1' });
      dispatchEvent.mockClear();
      await fire(FINISHED, { status: 'failed', batchId: 'batch-1' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    // Regression: transactionFinished is published with the transaction meta
    // directly (not wrapped in { transactionMeta }). The handler must unwrap
    // both payload shapes; otherwise destructuring `status` from the bare meta
    // throws and transactionFinished-based failure/rejection detection becomes
    // a no-op (the error is swallowed per-callback, leaving the UI stuck).
    it('does not throw and dispatches on a bare-meta transactionFinished payload', async () => {
      const { dispatchEvent, fire, callbacks } = await setupTracker({
        useBatchTracking: true,
      });
      // Track the tx first so the finished event is treated as the current
      // flow's (an untracked tx's finished event is correctly ignored).
      await fire(STATUS_UPDATED, { status: 'unapproved' });
      dispatchEvent.mockClear();
      const finishedCb = callbacks.get(FINISHED);
      await act(async () => {
        finishedCb?.([createTxMeta({ status: 'failed', batchId: 'batch-1' })]);
      });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });
  });

  describe('batchId filtering', () => {
    it('ignores rejection events from stale batches', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
      });
      await fire(STATUS_UPDATED, { batchId: 'batch-current' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });
      dispatchEvent.mockClear();
      await fire(FINISHED, { status: 'rejected', batchId: 'batch-stale' });
      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('processes rejection events from the current batch', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
      });
      await fire(STATUS_UPDATED, { batchId: 'batch-current' });
      dispatchEvent.mockClear();
      await fire(FINISHED, {
        status: 'rejected',
        batchId: 'batch-current',
      });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('ignores signed events from stale batches after learning batchId', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
      });
      await fire(STATUS_UPDATED, { batchId: 'batch-current' });
      dispatchEvent.mockClear();
      await fire(STATUS_UPDATED, {
        type: TransactionType.bridge,
        batchId: 'batch-stale',
      });
      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('resets batchId tracking on retry generation change and blocks stale terminal events', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
        retryGenerationRef,
      });

      await fire(STATUS_UPDATED, { batchId: 'batch-old' });

      retryGenerationRef.current = 1;
      dispatchEvent.mockClear();

      await fire(FINISHED, { status: 'rejected', batchId: 'batch-old' });
      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('processes events from new batch after generation reset', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
        retryGenerationRef,
      });

      await fire(STATUS_UPDATED, { batchId: 'batch-old' });

      retryGenerationRef.current = 1;
      dispatchEvent.mockClear();

      await fire(STATUS_UPDATED, {
        type: TransactionType.bridge,
        batchId: 'batch-new',
      });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    });

    it('blocks stale signed events after retry generation change', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
        retryGenerationRef,
      });

      await fire(STATUS_UPDATED, { batchId: 'batch-old' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });

      retryGenerationRef.current = 1;
      dispatchEvent.mockClear();

      await fire(STATUS_UPDATED, {
        type: TransactionType.bridge,
        batchId: 'batch-old',
      });
      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('allows rejection from new batch before any signed event', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
        retryGenerationRef,
      });

      await fire(STATUS_UPDATED, { batchId: 'batch-old' });

      retryGenerationRef.current = 1;
      dispatchEvent.mockClear();

      await fire(REJECTED, { batchId: 'batch-new' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('blocks stale batch finished event after retry until new batch is established', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
        retryGenerationRef,
      });

      await fire(STATUS_UPDATED, { batchId: 'batch-old' });

      retryGenerationRef.current = 1;
      dispatchEvent.mockClear();

      // Stale batch event is blocked
      await fire(FINISHED, { status: 'rejected', batchId: 'batch-old' });
      expect(dispatchEvent).not.toHaveBeenCalled();

      // New batch event is allowed
      await fire(FINISHED, { status: 'rejected', batchId: 'batch-new' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('blocks stale batch finished event after retry when no signed event was seen', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
        retryGenerationRef,
      });

      // Rejection before batch identification is blocked
      await fire(REJECTED, { batchId: 'batch-old' });
      expect(dispatchEvent).not.toHaveBeenCalled();

      retryGenerationRef.current = 1;

      // Stale finished event is blocked
      await fire(FINISHED, { status: 'rejected', batchId: 'batch-old' });
      expect(dispatchEvent).not.toHaveBeenCalled();

      // New batch's signed event establishes the batch
      await fire(STATUS_UPDATED, { batchId: 'batch-new' });
      dispatchEvent.mockClear();

      // New batch's finished event is allowed
      await fire(FINISHED, { status: 'rejected', batchId: 'batch-new' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('allows terminal events after retry when no batch event was seen before retry', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: true,
        retryGenerationRef,
      });

      retryGenerationRef.current = 1;

      // Terminal event from unknown batch passes (null state accepts non-stale)
      await fire(FINISHED, {
        status: 'rejected',
        batchId: UNKNOWN_BATCH_ID,
      });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });

      // Signed event establishes new batch
      await fire(STATUS_UPDATED, { batchId: 'batch-new' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });
      dispatchEvent.mockClear();

      // Old unknown batch is now stale
      await fire(FINISHED, {
        status: 'rejected',
        batchId: UNKNOWN_BATCH_ID,
      });
      expect(dispatchEvent).not.toHaveBeenCalled();

      // New batch event is allowed
      await fire(FINISHED, { status: 'rejected', batchId: 'batch-new' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });
  });

  describe('cancelCurrentBatch (batch-specific)', () => {
    it('aborts all tracked tx ids after retry', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { fire, cancelAndWait } = await setupTracker({
        useBatchTracking: true,
        retryGenerationRef,
      });

      await fire(STATUS_UPDATED, {
        batchId: 'batch-1',
        id: 'tx-1a',
        type: TransactionType.bridgeApproval,
      });

      retryGenerationRef.current = 1;

      await fire(STATUS_UPDATED, {
        batchId: 'batch-2',
        id: 'tx-2a',
        type: TransactionType.bridgeApproval,
      });

      mockSubmitRequestToBackground.mockClear();
      await cancelAndWait();

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-1a'],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-2a'],
      );
    });

    it('aborts tx ids tracked via rejected events even before batch is identified', async () => {
      const { fire, cancelAndWait } = await setupTracker({
        useBatchTracking: true,
      });

      await fire(REJECTED, { batchId: 'batch-1', id: 'tx-rejected' });

      mockSubmitRequestToBackground.mockClear();
      await cancelAndWait();

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-rejected'],
      );
    });

    it('aborts tx ids tracked via finished events even before batch is identified', async () => {
      const { fire, cancelAndWait } = await setupTracker({
        useBatchTracking: true,
      });

      await fire(FINISHED, {
        status: 'rejected',
        batchId: 'batch-1',
        id: 'tx-finished',
      });

      mockSubmitRequestToBackground.mockClear();
      await cancelAndWait();

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-finished'],
      );
    });

    it('resets batch tracking after cancel so a new batch can dispatch signed events', async () => {
      const { dispatchEvent, fire, cancelAndWait } = await setupTracker({
        useBatchTracking: true,
      });

      await fire(STATUS_UPDATED, { batchId: 'batch-1' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });

      await cancelAndWait();

      dispatchEvent.mockClear();
      await fire(STATUS_UPDATED, {
        batchId: 'batch-2',
        id: 'tx-2',
        type: TransactionType.bridgeApproval,
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });
    });
  });
});

// ============================================================
// SEQUENTIAL MODE SPECIFIC
// ============================================================
describe('useHwSignTracker (sequential mode specific)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSubscribe.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('tx tracking', () => {
    it('dispatches TransactionFailed on status failed after tx is tracked', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: false,
      });
      await fire(STATUS_UPDATED);
      dispatchEvent.mockClear();
      await fire(STATUS_UPDATED, { status: 'failed' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    it('dispatches TransactionFailed on status failed for an untracked tx', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: false,
      });
      await fire(STATUS_UPDATED, { status: 'failed' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    it('ignores rejection events for untracked tx ids', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: false,
      });
      await fire(REJECTED, { id: 'tx-never-tracked' });
      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('dispatches TransactionRejected on transactionRejected after tx is tracked', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: false,
      });
      await fire(STATUS_UPDATED, { id: 'tx-1' });
      dispatchEvent.mockClear();
      await fire(REJECTED, { id: 'tx-1' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('dispatches TransactionRejected when transactionFinished with rejected after tx tracked', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: false,
      });
      await fire(STATUS_UPDATED, { id: 'tx-1' });
      dispatchEvent.mockClear();
      await fire(FINISHED, { status: 'rejected', id: 'tx-1' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('dispatches TransactionFailed when transactionFinished with failed after tx tracked', async () => {
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: false,
      });
      await fire(STATUS_UPDATED, { id: 'tx-1' });
      dispatchEvent.mockClear();
      await fire(FINISHED, { status: 'failed', id: 'tx-1' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });
  });

  describe('retry generation tracking', () => {
    it('clears tracked tx ids on retry generation change', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: false,
        retryGenerationRef,
      });

      await fire(STATUS_UPDATED, { id: 'tx-old' });

      retryGenerationRef.current = 1;
      dispatchEvent.mockClear();

      await fire(REJECTED, { id: 'tx-old' });
      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('processes events from new tx after retry', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: false,
        retryGenerationRef,
      });

      await fire(STATUS_UPDATED, { id: 'tx-old' });

      retryGenerationRef.current = 1;
      dispatchEvent.mockClear();

      await fire(STATUS_UPDATED, {
        id: 'tx-new',
        type: TransactionType.bridge,
      });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    });

    it('blocks stale rejection after retry until new tx is tracked', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: false,
        retryGenerationRef,
      });

      await fire(STATUS_UPDATED, { id: 'tx-old' });

      retryGenerationRef.current = 1;
      dispatchEvent.mockClear();

      // Stale tx rejected → blocked
      await fire(FINISHED, { status: 'rejected', id: 'tx-old' });
      expect(dispatchEvent).not.toHaveBeenCalled();

      // New tx tracked
      await fire(STATUS_UPDATED, { id: 'tx-new' });
      dispatchEvent.mockClear();

      // New tx rejected → allowed
      await fire(FINISHED, { status: 'rejected', id: 'tx-new' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('blocks stale signed events after retry generation change', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: false,
        retryGenerationRef,
      });

      await fire(STATUS_UPDATED, { id: 'tx-old' });
      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });

      retryGenerationRef.current = 1;
      dispatchEvent.mockClear();

      await fire(STATUS_UPDATED, {
        id: 'tx-old',
        type: TransactionType.bridge,
      });
      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('blocks stale failed events after retry generation change', async () => {
      const retryGenerationRef = createRetryGenRef();
      const { dispatchEvent, fire } = await setupTracker({
        useBatchTracking: false,
        retryGenerationRef,
      });

      await fire(STATUS_UPDATED, { id: 'tx-old' });

      retryGenerationRef.current = 1;
      dispatchEvent.mockClear();

      await fire(STATUS_UPDATED, { id: 'tx-old', status: 'failed' });
      expect(dispatchEvent).not.toHaveBeenCalled();
    });
  });

  describe('cancelCurrentBatch (sequential-specific)', () => {
    it('clears tracked tx ids after cancel', async () => {
      const { dispatchEvent, fire, cancelAndWait } = await setupTracker({
        useBatchTracking: false,
      });

      await fire(STATUS_UPDATED, { id: 'tx-1' });

      await cancelAndWait();

      dispatchEvent.mockClear();
      await fire(REJECTED, { id: 'tx-1' });
      expect(dispatchEvent).not.toHaveBeenCalled();
    });
  });
});
