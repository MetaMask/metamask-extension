import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import { subscribeToMessengerEvent } from '../../../store/background-connection';
import { HardwareWalletSignatureEvent } from './hardware-wallet-signatures-state-machine';
import { useHwBatchSignTracker } from './useHwBatchSignTracker';

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
  };
});

const mockSubscribe = subscribeToMessengerEvent as jest.MockedFunction<
  typeof subscribeToMessengerEvent
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

describe('useHwBatchSignTracker', () => {
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
      useHwBatchSignTracker(undefined, true, true, dispatchEvent),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('does not subscribe when hardwareWalletUsed is false', () => {
    renderHook(() =>
      useHwBatchSignTracker(FROM_ADDRESS, false, true, dispatchEvent),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes when fromAddress and hardwareWalletUsed are set', async () => {
    renderHook(() =>
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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

  it('dispatches TransactionRejected on status failed', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('dispatches TransactionRejected on failed event even when device reconnects mid-flow', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('dispatches TransactionRejected on transactionRejected event', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionRejected');

    await act(async () => {
      callback?.([{ transactionMeta: createTxMeta() }]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('dispatches TransactionRejected on transactionRejected event even when device reconnects mid-flow', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionRejected');

    await act(async () => {
      callback?.([{ transactionMeta: createTxMeta() }]);
    });

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('dispatches TransactionRejected when transaction finished with rejected status', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('dispatches TransactionFailed when transaction finished with failed status', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  });

  it('dispatches TransactionFailed on transactionFinished even when device reconnects mid-flow', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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

    expect(dispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  });

  it('ignores transactionFinished for other statuses', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
        useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatch),
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
        useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
        useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
        useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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

    it('resets batchId tracking on retry generation change and allows stale terminal events', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = { current: 0 };

      renderHook(() =>
        useHwBatchSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
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

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('processes events from new batch after generation reset', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = { current: 0 };

      renderHook(() =>
        useHwBatchSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
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
      const retryGenerationRef: React.MutableRefObject<number> = { current: 0 };

      renderHook(() =>
        useHwBatchSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
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
      const retryGenerationRef: React.MutableRefObject<number> = { current: 0 };

      renderHook(() =>
        useHwBatchSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
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

    it('allows rejection from stale batch after retry until new batch is established', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = { current: 0 };

      renderHook(() =>
        useHwBatchSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
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

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
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

    it('allows stale batch finished event after retry when no signed event was seen', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = { current: 0 };

      renderHook(() =>
        useHwBatchSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
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

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });

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

      expect(dispatchEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.TransactionRejected,
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
      const retryGenerationRef: React.MutableRefObject<number> = { current: 0 };

      renderHook(() =>
        useHwBatchSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
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
});
