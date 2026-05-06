import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import {
  subscribeToMessengerEvent,
  submitRequestToBackground,
} from '../../../store/background-connection';
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

  it('blocks TransactionFailed on status failed before batch is identified', async () => {
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

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches TransactionFailed on status failed after batch is identified', async () => {
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
      useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches TransactionRejected when transaction finished with rejected status after batch identified', async () => {
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

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches TransactionFailed when transaction finished with failed status after batch identified', async () => {
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

    it('resets batchId tracking on retry generation change and blocks stale terminal events', async () => {
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

      expect(dispatchEvent).not.toHaveBeenCalled();
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

    it('blocks stale batch finished event after retry until new batch is established', async () => {
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

  describe('cancelCurrentBatch', () => {
    it('calls cancelTransactionBatch and abortTransactionSigning for tracked batch transactions', async () => {
      const callbacks = setupAndReturnCallbacks();

      const { result } = renderHook(() =>
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

      await act(async () => {
        await result.current.cancelCurrentBatch();
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'cancelTransactionBatch',
        ['batch-1'],
      );

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-approval'],
      );

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-trade'],
      );
    });

    it('continues cleanup even when cancelTransactionBatch throws for completed batch', async () => {
      const callbacks = setupAndReturnCallbacks();

      const { result } = renderHook(() =>
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
              batchId: 'batch-1',
              id: 'tx-approval',
            }),
          },
        ]);
      });

      mockSubmitRequestToBackground.mockClear();
      mockSubmitRequestToBackground.mockRejectedValueOnce(
        new Error('Cannot cancel batch as it is not currently being processed'),
      );

      await act(async () => {
        await result.current.cancelCurrentBatch();
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'cancelTransactionBatch',
        ['batch-1'],
      );

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-approval'],
      );
    });

    it('does nothing when no batch has been seen', async () => {
      const { result } = renderHook(() =>
        useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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

    it('aborts all tracked tx ids and cancels the current batch after retry', async () => {
      const callbacks = setupAndReturnCallbacks();
      const retryGenerationRef: React.MutableRefObject<number> = { current: 0 };

      const { result } = renderHook(() =>
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

      await act(async () => {
        await result.current.cancelCurrentBatch();
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-1a'],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-2a'],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'cancelTransactionBatch',
        ['batch-2'],
      );
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'cancelTransactionBatch',
        ['batch-1'],
      );
    });

    it('aborts tx ids tracked via rejected events even before batch is identified', async () => {
      const callbacks = setupAndReturnCallbacks();

      const { result } = renderHook(() =>
        useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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

      await act(async () => {
        await result.current.cancelCurrentBatch();
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-rejected'],
      );
    });

    it('aborts tx ids tracked via finished events even before batch is identified', async () => {
      const callbacks = setupAndReturnCallbacks();

      const { result } = renderHook(() =>
        useHwBatchSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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

      await act(async () => {
        await result.current.cancelCurrentBatch();
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'abortTransactionSigning',
        ['tx-finished'],
      );
    });
  });
});
