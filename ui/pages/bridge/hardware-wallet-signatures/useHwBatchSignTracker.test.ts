import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from './hardware-wallet-signatures-state-machine';
import { useHwBatchSignTracker } from './useHwBatchSignTracker';

jest.mock('../../../store/background-connection', () => {
  const createMockUnsubscribe = () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    fn.catch = jest.fn();
    return fn;
  };
  return {
    subscribeToMessengerEvent: jest.fn().mockResolvedValue(createMockUnsubscribe()),
  };
});

import { subscribeToMessengerEvent } from '../../../store/background-connection';

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
  let isDeviceDisconnectedRef: React.RefObject<boolean>;

  beforeEach(() => {
    jest.clearAllMocks();
    dispatchEvent = jest.fn();
    isDeviceDisconnectedRef = { current: false } as React.RefObject<boolean>;
  });

  function setupAndReturnCallbacks() {
    const callbacks = new Map<string, (...args: unknown[]) => void>();
    mockSubscribe.mockImplementation(async (event, callback) => {
      callbacks.set(event as string, callback as (...args: unknown[]) => void);
      const fn = jest.fn().mockResolvedValue(undefined);
      fn.catch = jest.fn();
      return fn;
    });

    return callbacks;
  }

  it('does not subscribe when fromAddress is undefined', () => {
    renderHook(() =>
      useHwBatchSignTracker(
        undefined,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('does not subscribe when hardwareWalletUsed is false', () => {
    renderHook(() =>
      useHwBatchSignTracker(
        FROM_ADDRESS,
        false,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes when fromAddress and hardwareWalletUsed are set', async () => {
    renderHook(() =>
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
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
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionStatusUpdated');

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
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionStatusUpdated');

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
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionStatusUpdated');

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
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionStatusUpdated');

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
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionStatusUpdated');

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
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionStatusUpdated');

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
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionStatusUpdated');

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

  it('skips failed event when device is already disconnected', async () => {
    isDeviceDisconnectedRef.current = true;
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    const callback = callbacks.get('TransactionController:transactionStatusUpdated');

    await act(async () => {
      callback?.([
        {
          transactionMeta: createTxMeta({ status: 'failed' }),
        },
      ]);
    });

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches TransactionRejected on transactionRejected event', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
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

  it('skips transactionRejected when device is already disconnected', async () => {
    isDeviceDisconnectedRef.current = true;
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
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

  it('dispatches TransactionRejected when transaction finished with rejected status', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
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
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
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

  it('skips transactionFinished when device is already disconnected', async () => {
    isDeviceDisconnectedRef.current = true;
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
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

  it('ignores transactionFinished for other statuses', async () => {
    const callbacks = setupAndReturnCallbacks();

    renderHook(() =>
      useHwBatchSignTracker(
        FROM_ADDRESS,
        true,
        true,
        dispatchEvent,
        isDeviceDisconnectedRef,
      ),
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
        useHwBatchSignTracker(
          FROM_ADDRESS,
          true,
          true,
          dispatch,
          isDeviceDisconnectedRef,
        ),
      { initialProps: { dispatch: dispatchEvent } },
    );

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    rerender({ dispatch: newDispatchEvent });

    const callback = callbacks.get('TransactionController:transactionStatusUpdated');

    await act(async () => {
      callback?.([{ transactionMeta: createTxMeta() }]);
    });

    expect(newDispatchEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });
});
