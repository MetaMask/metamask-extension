import { renderHook } from '@testing-library/react-hooks';
import { useDeviceEventHandlers } from './HardwareWalletEventHandlers';
import {
  DeviceEvent,
  HardwareWalletType,
  HardwareWalletAdapter,
} from './types';
import { ConnectionState } from './connectionState';

describe('useDeviceEventHandlers', () => {
  let mockRefs: {
    abortControllerRef: { current: AbortController | null };
    isConnectingRef: { current: boolean };
    adapterRef: { current: HardwareWalletAdapter | null };
    currentConnectionIdRef: { current: number | null };
    hasAutoConnectedRef: { current: boolean };
    lastConnectedAccountRef: { current: string | null };
    connectRef: { current: (() => Promise<void>) | null };
    deviceIdRef: { current: string | null };
    walletTypeRef: { current: HardwareWalletType | null };
    previousWalletTypeRef: { current: HardwareWalletType | null };
  };
  let mockSetters: {
    setConnectionState: jest.Mock;
    setCurrentAppName: jest.Mock;
    cleanupAdapter: jest.Mock;
    abortAndCleanupController: jest.Mock;
    resetConnectionRefs: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRefs = {
      abortControllerRef: { current: new AbortController() },
      isConnectingRef: { current: false },
      adapterRef: { current: null },
      currentConnectionIdRef: { current: null },
      hasAutoConnectedRef: { current: false },
      lastConnectedAccountRef: { current: null },
      connectRef: { current: null },
      deviceIdRef: { current: null },
      walletTypeRef: { current: null },
      previousWalletTypeRef: { current: null },
    };

    mockSetters = {
      setConnectionState: jest.fn(),
      setCurrentAppName: jest.fn(),
      cleanupAdapter: jest.fn(),
      abortAndCleanupController: jest.fn(),
      resetConnectionRefs: jest.fn(),
    };
  });

  const setupHook = () => {
    return renderHook(() =>
      useDeviceEventHandlers({
        refs: mockRefs,
        setters: mockSetters,
      }),
    );
  };

  describe('updateConnectionState', () => {
    it('updates state when status changes', () => {
      const { result } = setupHook();

      const newState = ConnectionState.error('test_error', new Error('Test'));
      result.current.updateConnectionState(newState);

      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );

      // Test the updater function
      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.disconnected();
      const resultState = updater(prevState);

      expect(resultState).toEqual(newState);
    });

    it('does not update when status is the same', () => {
      const { result } = setupHook();

      const prevState = ConnectionState.connected();
      result.current.updateConnectionState(prevState);

      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );

      // Test the updater function
      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const resultState = updater(prevState);

      expect(resultState).toBe(prevState);
    });

    it('updates when ErrorState reason changes', () => {
      const { result } = setupHook();

      const newState = ConnectionState.error('new_reason', new Error('New'));
      result.current.updateConnectionState(newState);

      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.error('old_reason', new Error('Old'));
      const resultState = updater(prevState);

      expect(resultState).toEqual(newState);
    });

    it('updates when AwaitingApp reason or appName changes', () => {
      const { result } = setupHook();

      const newState = ConnectionState.awaitingApp('new_reason', 'NewApp');
      result.current.updateConnectionState(newState);

      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.awaitingApp('old_reason', 'OldApp');
      const resultState = updater(prevState);

      expect(resultState).toEqual(newState);
    });
  });

  describe('handleDeviceEvent', () => {
    it('handles DEVICE_LOCKED event', () => {
      const { result } = setupHook();

      const error = new Error('Device locked');
      result.current.handleDeviceEvent({
        event: DeviceEvent.DeviceLocked,
        error,
      });

      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );

      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.disconnected();
      const resultState = updater(prevState);

      expect(resultState).toEqual(
        ConnectionState.error(DeviceEvent.DeviceLocked, error),
      );
    });

    it('handles APP_NOT_OPEN event with error', () => {
      const { result } = setupHook();

      const error = new Error('App not open');
      result.current.handleDeviceEvent({
        event: DeviceEvent.AppNotOpen,
        error,
      });

      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );

      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.disconnected();
      const resultState = updater(prevState);

      expect(resultState).toEqual(ConnectionState.error('app_not_open', error));
    });

    it('handles APP_NOT_OPEN event without error', () => {
      const { result } = setupHook();

      result.current.handleDeviceEvent({
        event: DeviceEvent.AppNotOpen,
      });

      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );

      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.disconnected();
      const resultState = updater(prevState);

      expect(resultState).toEqual(ConnectionState.awaitingApp('not_open'));
    });

    it('handles DISCONNECTED event when not connecting', () => {
      const { result } = setupHook();

      result.current.handleDeviceEvent({
        event: DeviceEvent.Disconnected,
      });

      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );

      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.disconnected();
      const resultState = updater(prevState);

      expect(resultState).toEqual(ConnectionState.disconnected());
    });

    it('handles APP_CHANGED event with wrong app', () => {
      // Set up Ledger wallet type for this test
      mockRefs.walletTypeRef.current = HardwareWalletType.Ledger;
      const { result } = setupHook();

      result.current.handleDeviceEvent({
        event: DeviceEvent.AppChanged,
        currentAppName: 'Bitcoin',
      });

      expect(mockSetters.setCurrentAppName).toHaveBeenCalledWith('Bitcoin');
      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );

      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.disconnected();
      const resultState = updater(prevState);

      expect(resultState).toEqual(
        ConnectionState.awaitingApp(DeviceEvent.AppNotOpen, 'Bitcoin'),
      );
    });

    it('handles APP_CHANGED event with correct app', () => {
      // Set up Ledger wallet type for this test
      mockRefs.walletTypeRef.current = HardwareWalletType.Ledger;
      const { result } = setupHook();

      result.current.handleDeviceEvent({
        event: DeviceEvent.AppChanged,
        currentAppName: 'Ethereum',
      });

      expect(mockSetters.setCurrentAppName).toHaveBeenCalledWith('Ethereum');
      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );

      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.disconnected();
      const resultState = updater(prevState);

      expect(resultState).toEqual(ConnectionState.ready());
    });

    it('handles CONNECTION_FAILED event', () => {
      const { result } = setupHook();

      const error = new Error('Connection failed');
      result.current.handleDeviceEvent({
        event: DeviceEvent.ConnectionFailed,
        error,
      });

      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );

      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.disconnected();
      const resultState = updater(prevState);

      expect(resultState).toEqual(
        ConnectionState.error(DeviceEvent.ConnectionFailed, error),
      );
    });

    it('ignores CONNECTION_FAILED event without error', () => {
      const { result } = setupHook();

      result.current.handleDeviceEvent({
        event: DeviceEvent.ConnectionFailed,
      });

      expect(mockSetters.setConnectionState).not.toHaveBeenCalled();
    });

    it('handles OPERATION_TIMEOUT event with error', () => {
      const { result } = setupHook();

      const error = new Error('Operation timed out');
      result.current.handleDeviceEvent({
        event: DeviceEvent.OperationTimeout,
        error,
      });

      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );

      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.disconnected();
      const resultState = updater(prevState);

      expect(resultState).toEqual(
        ConnectionState.error(DeviceEvent.OperationTimeout, error),
      );
    });

    it('handles OPERATION_TIMEOUT event without error', () => {
      const { result } = setupHook();

      result.current.handleDeviceEvent({
        event: DeviceEvent.OperationTimeout,
      });

      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );

      const updater = mockSetters.setConnectionState.mock.calls[0][0];
      const prevState = ConnectionState.disconnected();
      const resultState = updater(prevState);

      expect(resultState).toEqual(
        ConnectionState.error(
          DeviceEvent.OperationTimeout,
          new Error('Operation timed out'),
        ),
      );
    });

    it('ignores unknown events', () => {
      const { result } = setupHook();

      result.current.handleDeviceEvent({
        event: 'unknown_event' as DeviceEvent,
      });

      expect(mockSetters.setConnectionState).not.toHaveBeenCalled();
      expect(mockSetters.setCurrentAppName).not.toHaveBeenCalled();
    });

    it('aborts when AbortController is aborted', () => {
      mockRefs.abortControllerRef.current?.abort();
      const { result } = setupHook();

      result.current.handleDeviceEvent({
        event: DeviceEvent.DeviceLocked,
      });

      expect(mockSetters.setConnectionState).not.toHaveBeenCalled();
    });

    it('calls onDeviceEvent callback when provided', () => {
      const onDeviceEvent = jest.fn();
      const { result } = renderHook(() =>
        useDeviceEventHandlers({
          refs: mockRefs,
          setters: mockSetters,
          onDeviceEvent,
        }),
      );

      const payload = { event: DeviceEvent.DeviceLocked };
      result.current.handleDeviceEvent(payload);

      expect(onDeviceEvent).toHaveBeenCalledWith(payload);
    });
  });

  describe('handleDisconnect', () => {
    it('handles disconnect when not connecting', () => {
      const { result } = setupHook();

      result.current.handleDisconnect();

      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('handles structured hardware wallet errors', () => {
      const { result } = setupHook();

      const error = { code: 'DEVICE_LOCKED_001' };
      result.current.handleDisconnect(error);

      expect(mockSetters.setConnectionState).toHaveBeenCalled();
      // Note: The actual error conversion is tested in connectionState tests
    });

    it('handles generic errors', () => {
      const { result } = setupHook();

      result.current.handleDisconnect(new Error('Generic error'));

      expect(mockSetters.setConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('aborts when AbortController is aborted', () => {
      mockRefs.abortControllerRef.current?.abort();
      const { result } = setupHook();

      result.current.handleDisconnect();

      expect(mockSetters.setConnectionState).not.toHaveBeenCalled();
    });

    it('calls cleanup functions on disconnect', () => {
      const { result } = setupHook();

      result.current.handleDisconnect();

      expect(mockSetters.abortAndCleanupController).toHaveBeenCalledTimes(1);
      expect(mockSetters.cleanupAdapter).toHaveBeenCalledTimes(1);
      expect(mockSetters.resetConnectionRefs).toHaveBeenCalledTimes(1);
    });
  });
});
