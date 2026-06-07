import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import {
  subscribeToMessengerEvent,
  submitRequestToBackground,
} from '../../../store/background-connection';
import { HardwareWalletSignatureEvent } from './hardware-wallet-signatures-state-machine';
import { useHwSignTracker } from './useHwSignTracker';

jest.mock('../../../store/background-connection', () => {
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

const FROM_ADDRESS = '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452';

function createTxMeta(
  overrides: Partial<{
    status: string;
    type: string;
    from: string;
    batchId: string;
    id: string;
  }> = {},
) {
  return {
    id: overrides.id ?? 'tx-1',
    status: overrides.status ?? 'signed',
    type: overrides.type ?? TransactionType.bridgeApproval,
    txParams: {
      from: overrides.from ?? FROM_ADDRESS,
    },
    batchId: overrides.batchId,
  };
}

// ============================================================
// BATCH MODE (useBatchTracking: true)
// ============================================================
describe('useHwSignTracker (batch mode)', () => {
  let dispatchEvent: jest.Mock;
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    dispatchEvent = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function setupAndReturnCallbacks() {
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

  it('does not subscribe when fromAddress is undefined', () => {
    renderHook(() =>
      useHwSignTracker(undefined, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('does not subscribe when hardwareWalletUsed is false', () => {
    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, false, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes when fromAddress and hardwareWalletUsed are set', async () => {
    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(mockSubscribe).toHaveBeenCalledTimes(3);
    expect(mockSubscribe).toHaveBeenCalledWith(
      'TransactionController:transactionStatusUpdated',
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      'TransactionController:transactionRejected',
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      'TransactionController:transactionFinished',
      expect.any(Function),
    );
  });

  it('dispatches FirstSignatureSubmitted when approval tx is signed', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([{ transactionMeta: createTxMeta() }]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('dispatches TransactionSubmitted when trade tx is signed', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({
            type: TransactionType.bridge,
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('dispatches TransactionSubmitted for swap trade type', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({
            type: TransactionType.swap,
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('dispatches FirstSignatureSubmitted for swap approval type', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({
            type: TransactionType.swapApproval,
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('ignores signed events from other addresses', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({
            from: '0x0000000000000000000000000000000000000000',
          }),
        },
      ]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('ignores signed events for non-batch transaction types', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({
            type: 'simpleSend',
          }),
        },
      ]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('blocks TransactionFailed on status failed before batch is identified', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({ status: 'failed' }),
        },
      ]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches TransactionFailed on status failed after batch is identified', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([
        {
          transactionMeta: createTxMeta({ batchId: 'batch-1' }),
        },
      ]);
    });

    dispatchEvent.mockClear();

    await act(async () => {
      statusCallback?.([
        {
          transactionMeta: createTxMeta({
            status: 'failed',
            batchId: 'batch-1',
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  });

  it('dispatches TransactionFailed on failed event after batch identified even when device reconnects mid-flow', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([
        {
          transactionMeta: createTxMeta({ batchId: 'batch-1' }),
        },
      ]);
    });

    dispatchEvent.mockClear();

    await act(async () => {
      statusCallback?.([
        {
          transactionMeta: createTxMeta({
            status: 'failed',
            batchId: 'batch-1',
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  });

  it('blocks TransactionRejected on transactionRejected event before batch is identified', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionRejected');

    await act(async () => {
      callback?.([{ transactionMeta: createTxMeta() }]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches TransactionRejected on transactionRejected event after batch identified', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([
        {
          transactionMeta: createTxMeta({ batchId: 'batch-1' }),
        },
      ]);
    });

    const rejectedCallback = callbacks.get(
      'TransactionController:transactionRejected',
    );

    dispatchEvent.mockClear();

    await act(async () => {
      rejectedCallback?.([
        { transactionMeta: createTxMeta({ batchId: 'batch-1' }) },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('dispatches TransactionRejected on transactionRejected event after batch identified even when device reconnects mid-flow', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([
        {
          transactionMeta: createTxMeta({ batchId: 'batch-1' }),
        },
      ]);
    });

    const rejectedCallback = callbacks.get(
      'TransactionController:transactionRejected',
    );

    dispatchEvent.mockClear();

    await act(async () => {
      rejectedCallback?.([
        { transactionMeta: createTxMeta({ batchId: 'batch-1' }) },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('blocks TransactionRejected when transaction finished with rejected status before batch identified', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionFinished');

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({ status: 'rejected' }),
        },
      ]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches TransactionRejected when transaction finished with rejected status after batch identified', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([
        {
          transactionMeta: createTxMeta({ batchId: 'batch-1' }),
        },
      ]);
    });

    const finishedCallback = callbacks.get(
      'TransactionController:transactionFinished',
    );

    dispatchEvent.mockClear();

    await act(async () => {
      finishedCallback?.([
        {
          transactionMeta: createTxMeta({
            status: 'rejected',
            batchId: 'batch-1',
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('blocks TransactionFailed when transaction finished with failed status before batch identified', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionFinished');

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({ status: 'failed' }),
        },
      ]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches TransactionFailed when transaction finished with failed status after batch identified', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([
        {
          transactionMeta: createTxMeta({ batchId: 'batch-1' }),
        },
      ]);
    });

    const finishedCallback = callbacks.get(
      'TransactionController:transactionFinished',
    );

    dispatchEvent.mockClear();

    await act(async () => {
      finishedCallback?.([
        {
          transactionMeta: createTxMeta({
            status: 'failed',
            batchId: 'batch-1',
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  });

  it('dispatches TransactionFailed on transactionFinished after batch identified even when device reconnects mid-flow', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([
        {
          transactionMeta: createTxMeta({ batchId: 'batch-1' }),
        },
      ]);
    });

    const finishedCallback = callbacks.get(
      'TransactionController:transactionFinished',
    );

    dispatchEvent.mockClear();

    await act(async () => {
      finishedCallback?.([
        {
          transactionMeta: createTxMeta({
            status: 'failed',
            batchId: 'batch-1',
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  });

  it('ignores transactionFinished for other statuses', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: true,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionFinished');

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({ status: 'confirmed' }),
        },
      ]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('uses latest dispatchEvent via ref', async () => {
    const callbacks = setupAndReturnCallbacks();
    const newDispatchEvent = jest.fn();

    const { rerender } = renderHook(
      ({ dispatch }) =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatch, {
          useBatchTracking: true,
        }),
      { initialProps: { dispatch: dispatchEvent } },
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    rerender({ dispatch: newDispatchEvent });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([{ transactionMeta: createTxMeta() }]);
    });

    expect(newDispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  describe('batchId filtering', () => {
    it('ignores rejection events from stale batches', async () => {
      const callbacks = setupAndReturnCallbacks();

      renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: true,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-current',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });

      const finishedCallback = callbacks.get(
        'TransactionController:transactionFinished',
      );

      dispatchEvent.mockClear();

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              batchId: 'batch-stale',
            }),
          },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('processes rejection events from the current batch', async () => {
      const callbacks = setupAndReturnCallbacks();

      renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: true,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-current',
            }),
          },
        ]);
      });

      const finishedCallback = callbacks.get(
        'TransactionController:transactionFinished',
      );

      dispatchEvent.mockClear();

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              batchId: 'batch-current',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('ignores signed events from stale batches after learning batchId', async () => {
      const callbacks = setupAndReturnCallbacks();

      renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: true,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-current',
            }),
          },
        ]);
      });

      dispatchEvent.mockClear();

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              type: TransactionType.bridge,
              batchId: 'batch-stale',
            }),
          },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('resets batchId tracking on retry generation change and blocks stale terminal events', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = {
        current: 0,
      };

      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { useBatchTracking: true },
          retryGenerationRef,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      retryGenerationRef.current = 1;

      const finishedCallback = callbacks.get(
        'TransactionController:transactionFinished',
      );

      dispatchEvent.mockClear();

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('processes events from new batch after generation reset', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = {
        current: 0,
      };

      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { useBatchTracking: true },
          retryGenerationRef,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      retryGenerationRef.current = 1;

      dispatchEvent.mockClear();

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              type: TransactionType.bridge,
              batchId: 'batch-new',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    });

    it('blocks stale signed events after retry generation change', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = {
        current: 0,
      };

      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { useBatchTracking: true },
          retryGenerationRef,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });

      retryGenerationRef.current = 1;

      dispatchEvent.mockClear();

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              type: TransactionType.bridge,
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('allows rejection from new batch before any signed event', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = {
        current: 0,
      };

      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { useBatchTracking: true },
          retryGenerationRef,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      retryGenerationRef.current = 1;

      const rejectedCallback = callbacks.get(
        'TransactionController:transactionRejected',
      );

      dispatchEvent.mockClear();

      await act(async () => {
        rejectedCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-new',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('blocks stale batch finished event after retry until new batch is established', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = {
        current: 0,
      };

      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { useBatchTracking: true },
          retryGenerationRef,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      retryGenerationRef.current = 1;

      const finishedCallback = callbacks.get(
        'TransactionController:transactionFinished',
      );

      dispatchEvent.mockClear();

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();

      dispatchEvent.mockClear();

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              batchId: 'batch-new',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('blocks stale batch finished event after retry when no signed event was seen', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = {
        current: 0,
      };

      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { useBatchTracking: true },
          retryGenerationRef,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const rejectedCallback = callbacks.get(
        'TransactionController:transactionRejected',
      );

      await act(async () => {
        rejectedCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();

      retryGenerationRef.current = 1;

      dispatchEvent.mockClear();

      const finishedCallback = callbacks.get(
        'TransactionController:transactionFinished',
      );

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              batchId: 'batch-old',
            }),
          },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-new',
            }),
          },
        ]);
      });

      dispatchEvent.mockClear();

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              batchId: 'batch-new',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('allows terminal events after retry when no batch event was seen before retry', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = {
        current: 0,
      };

      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { useBatchTracking: true },
          retryGenerationRef,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      retryGenerationRef.current = 1;

      const finishedCallback = callbacks.get(
        'TransactionController:transactionFinished',
      );

      dispatchEvent.mockClear();

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              batchId: 'batch-unknown',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      dispatchEvent.mockClear();

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-new',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });

      dispatchEvent.mockClear();

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              batchId: 'batch-unknown',
            }),
          },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              batchId: 'batch-new',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });
  });

  describe('cancelCurrentBatch', () => {
    it('calls abortTransactionSigning for tracked batch transactions', async () => {
      const callbacks = setupAndReturnCallbacks();

      const { result } = renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: true,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-1',
              id: 'tx-approval',
              type: TransactionType.bridgeApproval,
            }),
          },
        ]);
      });

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-1',
              id: 'tx-trade',
              type: TransactionType.bridge,
            }),
          },
        ]);
      });

      mockSubmitRequestToBackground.mockClear();

      const cancelPromise = act(async () => {
        await result.current.cancelCurrentBatch();
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(6_000);
      });

      await cancelPromise;

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-approval'],
      );

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-trade'],
      );
    });

    it('continues cleanup even when abortTransactionSigning throws', async () => {
      const callbacks = setupAndReturnCallbacks();

      const { result } = renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: true,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-1',
              id: 'tx-approval',
            }),
          },
        ]);
      });

      mockSubmitRequestToBackground.mockClear();
      mockSubmitRequestToBackground.mockRejectedValueOnce(
        new Error('abort failed'),
      );

      const cancelPromise = act(async () => {
        await result.current.cancelCurrentBatch();
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(6_000);
      });

      await cancelPromise;

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-approval'],
      );
    });

    it('does nothing when no batch has been seen', async () => {
      const { result } = renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: true,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      mockSubmitRequestToBackground.mockClear();

      await act(async () => {
        await result.current.cancelCurrentBatch();
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('aborts all tracked tx ids after retry', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = {
        current: 0,
      };

      const { result } = renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { useBatchTracking: true },
          retryGenerationRef,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-1',
              id: 'tx-1a',
              type: TransactionType.bridgeApproval,
            }),
          },
        ]);
      });

      retryGenerationRef.current = 1;

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-2',
              id: 'tx-2a',
              type: TransactionType.bridgeApproval,
            }),
          },
        ]);
      });

      mockSubmitRequestToBackground.mockClear();

      const cancelPromise = act(async () => {
        await result.current.cancelCurrentBatch();
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(6_000);
      });

      await cancelPromise;

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
      const callbacks = setupAndReturnCallbacks();

      const { result } = renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: true,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const rejectedCallback = callbacks.get(
        'TransactionController:transactionRejected',
      );

      await act(async () => {
        rejectedCallback?.([
          {
            transactionMeta: createTxMeta({
              batchId: 'batch-1',
              id: 'tx-rejected',
            }),
          },
        ]);
      });

      mockSubmitRequestToBackground.mockClear();

      const cancelPromise = act(async () => {
        await result.current.cancelCurrentBatch();
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(6_000);
      });

      await cancelPromise;

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-rejected'],
      );
    });

    it('aborts tx ids tracked via finished events even before batch is identified', async () => {
      const callbacks = setupAndReturnCallbacks();

      const { result } = renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: true,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const finishedCallback = callbacks.get(
        'TransactionController:transactionFinished',
      );

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              batchId: 'batch-1',
              id: 'tx-finished',
            }),
          },
        ]);
      });

      mockSubmitRequestToBackground.mockClear();

      const cancelPromise = act(async () => {
        await result.current.cancelCurrentBatch();
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(6_000);
      });

      await cancelPromise;

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-finished'],
      );
    });

    it('returns early when enabled is false', async () => {
      const { result } = renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { enabled: false, useBatchTracking: true },
          undefined,
        ),
      );

      mockSubmitRequestToBackground.mockClear();

      await act(async () => {
        await result.current.cancelCurrentBatch();
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });

  describe('enabled option', () => {
    it('does not subscribe when enabled is false', () => {
      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { enabled: false, useBatchTracking: true },
          undefined,
        ),
      );

      expect(mockSubscribe).not.toHaveBeenCalled();
    });

    it('subscribes when enabled is true', async () => {
      const createMockUnsubscribe = () => {
        const fn = jest.fn().mockResolvedValue(undefined) as jest.Mock & {
          catch: jest.Mock;
        };
        fn.catch = jest.fn();
        return fn;
      };
      mockSubscribe.mockResolvedValue(createMockUnsubscribe());

      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { enabled: true, useBatchTracking: true },
          undefined,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      expect(mockSubscribe).toHaveBeenCalledTimes(3);
    });

    it('subscribes by default when options not provided', async () => {
      const createMockUnsubscribe = () => {
        const fn = jest.fn().mockResolvedValue(undefined) as jest.Mock & {
          catch: jest.Mock;
        };
        fn.catch = jest.fn();
        return fn;
      };
      mockSubscribe.mockResolvedValue(createMockUnsubscribe());

      renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: true,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      expect(mockSubscribe).toHaveBeenCalledTimes(3);
    });
  });
});

// ============================================================
// SEQUENTIAL MODE (useBatchTracking: false)
// ============================================================
describe('useHwSignTracker (sequential mode)', () => {
  let dispatchEvent: jest.Mock;
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    dispatchEvent = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function setupAndReturnCallbacks() {
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

  it('does not subscribe when fromAddress is undefined', () => {
    renderHook(() =>
      useHwSignTracker(undefined, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('does not subscribe when hardwareWalletUsed is false', () => {
    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, false, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('does not subscribe when enabled is false', () => {
    renderHook(() =>
      useHwSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        { enabled: false, useBatchTracking: false },
        undefined,
      ),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes when fromAddress and hardwareWalletUsed are set', async () => {
    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(mockSubscribe).toHaveBeenCalledTimes(3);
    expect(mockSubscribe).toHaveBeenCalledWith(
      'TransactionController:transactionStatusUpdated',
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      'TransactionController:transactionRejected',
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      'TransactionController:transactionFinished',
      expect.any(Function),
    );
  });

  it('dispatches FirstSignatureSubmitted when approval tx is signed', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([{ transactionMeta: createTxMeta() }]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('dispatches TransactionSubmitted when trade tx is signed', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({
            type: TransactionType.bridge,
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('dispatches TransactionSubmitted for swap trade type', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({
            type: TransactionType.swap,
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('dispatches FirstSignatureSubmitted for swap approval type', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({
            type: TransactionType.swapApproval,
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('ignores signed events from other addresses', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({
            from: '0x0000000000000000000000000000000000000000',
          }),
        },
      ]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('ignores signed events for non-batch transaction types', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({
            type: 'simpleSend',
          }),
        },
      ]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches TransactionFailed on status failed after tx is tracked', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([{ transactionMeta: createTxMeta() }]);
    });

    dispatchEvent.mockClear();

    await act(async () => {
      statusCallback?.([
        {
          transactionMeta: createTxMeta({
            status: 'failed',
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  });

  it('dispatches TransactionFailed on status failed for an untracked tx', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([
        {
          transactionMeta: createTxMeta({
            status: 'failed',
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  });

  it('ignores rejection events for untracked tx ids', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const rejectedCallback = callbacks.get(
      'TransactionController:transactionRejected',
    );

    await act(async () => {
      rejectedCallback?.([
        { transactionMeta: createTxMeta({ id: 'tx-never-tracked' }) },
      ]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches TransactionRejected on transactionRejected event after tx is tracked', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([{ transactionMeta: createTxMeta({ id: 'tx-1' }) }]);
    });

    const rejectedCallback = callbacks.get(
      'TransactionController:transactionRejected',
    );

    dispatchEvent.mockClear();

    await act(async () => {
      rejectedCallback?.([
        { transactionMeta: createTxMeta({ id: 'tx-1' }) },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('dispatches TransactionRejected when transaction finished with rejected status after tx tracked', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([{ transactionMeta: createTxMeta({ id: 'tx-1' }) }]);
    });

    const finishedCallback = callbacks.get(
      'TransactionController:transactionFinished',
    );

    dispatchEvent.mockClear();

    await act(async () => {
      finishedCallback?.([
        {
          transactionMeta: createTxMeta({
            status: 'rejected',
            id: 'tx-1',
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('dispatches TransactionFailed when transaction finished with failed status after tx tracked', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([{ transactionMeta: createTxMeta({ id: 'tx-1' }) }]);
    });

    const finishedCallback = callbacks.get(
      'TransactionController:transactionFinished',
    );

    dispatchEvent.mockClear();

    await act(async () => {
      finishedCallback?.([
        {
          transactionMeta: createTxMeta({
            status: 'failed',
            id: 'tx-1',
          }),
        },
      ]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  });

  it('ignores transactionFinished for other statuses', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
        useBatchTracking: false,
      }),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const statusCallback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      statusCallback?.([{ transactionMeta: createTxMeta({ id: 'tx-1' }) }]);
    });

    const finishedCallback = callbacks.get(
      'TransactionController:transactionFinished',
    );

    dispatchEvent.mockClear();

    await act(async () => {
      finishedCallback?.([
        {
          transactionMeta: createTxMeta({
            status: 'confirmed',
            id: 'tx-1',
          }),
        },
      ]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('uses latest dispatchEvent via ref', async () => {
    const callbacks = setupAndReturnCallbacks();
    const newDispatchEvent = jest.fn();

    const { rerender } = renderHook(
      ({ dispatch }) =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatch, {
          useBatchTracking: false,
        }),
      { initialProps: { dispatch: dispatchEvent } },
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    rerender({ dispatch: newDispatchEvent });

    const callback = callbacks.get(
      'TransactionController:transactionStatusUpdated',
    );

    await act(async () => {
      callback?.([{ transactionMeta: createTxMeta() }]);
    });

    expect(newDispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  describe('retry generation tracking', () => {
    it('clears tracked tx ids on retry generation change', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = {
        current: 0,
      };

      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { useBatchTracking: false },
          retryGenerationRef,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          { transactionMeta: createTxMeta({ id: 'tx-old' }) },
        ]);
      });

      retryGenerationRef.current = 1;

      const rejectedCallback = callbacks.get(
        'TransactionController:transactionRejected',
      );

      dispatchEvent.mockClear();

      await act(async () => {
        rejectedCallback?.([
          { transactionMeta: createTxMeta({ id: 'tx-old' }) },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();
    });

    it('processes events from new tx after retry', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = {
        current: 0,
      };

      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { useBatchTracking: false },
          retryGenerationRef,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          { transactionMeta: createTxMeta({ id: 'tx-old' }) },
        ]);
      });

      retryGenerationRef.current = 1;

      dispatchEvent.mockClear();

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              id: 'tx-new',
              type: TransactionType.bridge,
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    });

    it('blocks stale rejection after retry until new tx is tracked', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = {
        current: 0,
      };

      renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { useBatchTracking: false },
          retryGenerationRef,
        ),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          { transactionMeta: createTxMeta({ id: 'tx-old' }) },
        ]);
      });

      retryGenerationRef.current = 1;

      const finishedCallback = callbacks.get(
        'TransactionController:transactionFinished',
      );

      dispatchEvent.mockClear();

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              id: 'tx-old',
            }),
          },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();

      await act(async () => {
        statusCallback?.([
          { transactionMeta: createTxMeta({ id: 'tx-new' }) },
        ]);
      });

      dispatchEvent.mockClear();

      await act(async () => {
        finishedCallback?.([
          {
            transactionMeta: createTxMeta({
              status: 'rejected',
              id: 'tx-new',
            }),
          },
        ]);
      });

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });
  });

  describe('cancelCurrentBatch', () => {
    it('does nothing when no txs have been tracked', async () => {
      const { result } = renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: false,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      mockSubmitRequestToBackground.mockClear();

      await act(async () => {
        await result.current.cancelCurrentBatch();
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('returns early when disabled', async () => {
      const { result } = renderHook(() =>
        useHwSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          { enabled: false, useBatchTracking: false },
          undefined,
        ),
      );

      mockSubmitRequestToBackground.mockClear();

      await act(async () => {
        await result.current.cancelCurrentBatch();
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('calls abortTransactionSigning for tracked tx ids', async () => {
      const callbacks = setupAndReturnCallbacks();

      const { result } = renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: false,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              id: 'tx-approval',
              type: TransactionType.bridgeApproval,
            }),
          },
        ]);
      });

      await act(async () => {
        statusCallback?.([
          {
            transactionMeta: createTxMeta({
              id: 'tx-trade',
              type: TransactionType.bridge,
            }),
          },
        ]);
      });

      mockSubmitRequestToBackground.mockClear();

      const cancelPromise = result.current.cancelCurrentBatch();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(6_000);
      });

      await act(async () => {
        await cancelPromise;
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-approval'],
      );

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-trade'],
      );
    });

    it('clears tracked tx ids after cancel', async () => {
      const callbacks = setupAndReturnCallbacks();

      const { result } = renderHook(() =>
        useHwSignTracker(FROM_ADDRESS, true, true, dispatchEvent, {
          useBatchTracking: false,
        }),
      );

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      const statusCallback = callbacks.get(
        'TransactionController:transactionStatusUpdated',
      );

      await act(async () => {
        statusCallback?.([
          { transactionMeta: createTxMeta({ id: 'tx-1' }) },
        ]);
      });

      const cancelPromise = result.current.cancelCurrentBatch();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(6_000);
      });

      await act(async () => {
        await cancelPromise;
      });

      const rejectedCallback = callbacks.get(
        'TransactionController:transactionRejected',
      );

      mockSubmitRequestToBackground.mockClear();
      dispatchEvent.mockClear();

      await act(async () => {
        rejectedCallback?.([
          { transactionMeta: createTxMeta({ id: 'tx-1' }) },
        ]);
      });

      expect(dispatchEvent).not.toHaveBeenCalled();
    });
  });
});
