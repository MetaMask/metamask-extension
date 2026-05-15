import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import {
  subscribeToMessengerEvent,
  submitRequestToBackground,
} from '../../../store/background-connection';
import { HardwareWalletSignatureEvent } from './hardware-wallet-signatures-state-machine';
import { useHwSequentialSignTracker } from './useHwSequentialSignTracker';

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
  };
}

describe('useHwSequentialSignTracker', () => {
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
      useHwSequentialSignTracker(undefined, true, true, dispatchEvent),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('does not subscribe when hardwareWalletUsed is false', () => {
    renderHook(() =>
      useHwSequentialSignTracker(FROM_ADDRESS, false, true, dispatchEvent),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('does not subscribe when enabled is false', () => {
    renderHook(() =>
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent, undefined, { enabled: false }),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes when fromAddress and hardwareWalletUsed are set', async () => {
    renderHook(() =>
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
      useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
        useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatch),
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
        useHwSequentialSignTracker(
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
        useHwSequentialSignTracker(
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
        useHwSequentialSignTracker(
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
        useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
        useHwSequentialSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatchEvent,
          undefined,
          { enabled: false },
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
        useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
        useHwSequentialSignTracker(FROM_ADDRESS, true, true, dispatchEvent),
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
