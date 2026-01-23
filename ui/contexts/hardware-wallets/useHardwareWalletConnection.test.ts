import { renderHook, act } from '@testing-library/react-hooks';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { useHardwareWalletConnection } from './useHardwareWalletConnection';
import {
  HardwareWalletType,
  ConnectionStatus,
  type HardwareWalletAdapter,
} from './types';
import { ConnectionState } from './connectionState';
import { createHardwareWalletError } from './errors';
import * as webConnectionUtils from './webConnectionUtils';
import { createAdapterForHardwareWalletType } from './adapters/factory';
import { MockHardwareWalletAdapter } from './__mocks__/MockHardwareWalletAdapter';

jest.mock('./webConnectionUtils');
jest.mock('./adapters/factory');

describe('useHardwareWalletConnection', () => {
  let mockRefs: {
    abortControllerRef: { current: AbortController | null };
    adapterRef: { current: HardwareWalletAdapter | null };
    connectingPromiseRef: { current: Promise<void> | null };
    isConnectingRef: { current: boolean };
    hasAutoConnectedRef: { current: boolean };
    lastConnectedAccountRef: { current: string | null };
    currentConnectionIdRef: { current: number | null };
    connectRef: { current: (() => Promise<void>) | null };
    deviceIdRef: { current: string | null };
    walletTypeRef: { current: HardwareWalletType | null };
    previousWalletTypeRef: { current: HardwareWalletType | null };
  };
  let mockSetters: {
    setDeviceId: jest.Mock;
    setConnectionState: jest.Mock;
  };
  let mockUpdateConnectionState: jest.Mock;
  let mockHandleDeviceEvent: jest.Mock;
  let mockHandleDisconnect: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUpdateConnectionState = jest.fn();
    mockHandleDeviceEvent = jest.fn();
    mockHandleDisconnect = jest.fn();

    mockRefs = {
      abortControllerRef: { current: null },
      adapterRef: { current: null },
      connectingPromiseRef: { current: null },
      isConnectingRef: { current: false },
      hasAutoConnectedRef: { current: false },
      lastConnectedAccountRef: { current: null },
      currentConnectionIdRef: { current: null },
      connectRef: { current: null },
      deviceIdRef: { current: null },
      walletTypeRef: { current: HardwareWalletType.Ledger },
      previousWalletTypeRef: { current: null },
    };

    mockSetters = {
      setDeviceId: jest.fn(),
      setConnectionState: jest.fn(),
    };
  });

  const setupHook = () => {
    return renderHook(() =>
      useHardwareWalletConnection({
        refs: mockRefs,
        setters: mockSetters,
        updateConnectionState: mockUpdateConnectionState,
        handleDeviceEvent: mockHandleDeviceEvent,
        handleDisconnect: mockHandleDisconnect,
      }),
    );
  };

  describe('connect', () => {
    it('connects successfully with device discovery', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
        mockAdapter,
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(webConnectionUtils.getHardwareWalletDeviceId).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
      );
      expect(createAdapterForHardwareWalletType).toHaveBeenCalled();
      expect(mockAdapter.connectMock).toHaveBeenCalledWith('device-123');
      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        ConnectionState.connected(),
      );
      expect(mockRefs.adapterRef.current).toBe(mockAdapter);
    });

    it('connects successfully with existing device ID', async () => {
      mockRefs.deviceIdRef.current = 'existing-device-123';
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
        mockAdapter,
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(
        webConnectionUtils.getHardwareWalletDeviceId,
      ).not.toHaveBeenCalled();
      expect(mockAdapter.connectMock).toHaveBeenCalledWith(
        'existing-device-123',
      );
    });

    it('handles device discovery failure', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockRejectedValue(new Error('Discovery failed'));

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConnectionStatus.ErrorState,
        }),
      );
    });

    it('handles device not found', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue(null);

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConnectionStatus.ErrorState,
        }),
      );
    });

    it('handles adapter creation failure', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');
      (createAdapterForHardwareWalletType as jest.Mock).mockImplementation(
        () => {
          throw new Error('Adapter creation failed');
        },
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConnectionStatus.ErrorState,
        }),
      );
    });

    it('handles connection errors', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockAdapter.connectMock.mockRejectedValue(new Error('Connection failed'));
      (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
        mockAdapter,
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConnectionStatus.ErrorState,
        }),
      );
      expect(mockAdapter.destroyMock).toHaveBeenCalled();
    });

    it('coalesces concurrent connection attempts into single promise', async () => {
      let resolveDiscovery: ((value: string) => void) | undefined;
      const discoveryPromise = new Promise<string>((resolve) => {
        resolveDiscovery = resolve;
      });

      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockImplementationOnce(() => discoveryPromise);

      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
        mockAdapter,
      );

      const { result } = setupHook();

      // Start first connection (will wait on device discovery)
      const firstConnectPromise = result.current.connect();

      // Start second connection - should return the same promise
      const secondConnectPromise = result.current.connect();

      // Both should be the same promise instance
      expect(firstConnectPromise).toBe(secondConnectPromise);

      // Resolve the discovery and let the connection complete
      resolveDiscovery?.('device-123');

      // Wait for both promises to complete
      await act(async () => {
        await firstConnectPromise;
      });

      // The adapter should have connected only once
      expect(mockAdapter.connectMock).toHaveBeenCalledTimes(1);
      expect(mockAdapter.connectMock).toHaveBeenCalledWith('device-123');
    });

    it('creates new AbortController for each connection attempt', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
        mockAdapter,
      );

      const { result } = setupHook();

      // AbortController should be null initially
      expect(mockRefs.abortControllerRef.current).toBeNull();

      await act(async () => {
        await result.current.connect();
      });

      // After connect, AbortController should be created
      expect(mockRefs.abortControllerRef.current).toBeInstanceOf(
        AbortController,
      );
    });

    it('handles unknown wallet type', async () => {
      mockRefs.walletTypeRef.current = null;

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConnectionStatus.ErrorState,
        }),
      );
    });

    it('destroys existing adapter before new connection', async () => {
      const existingAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockRefs.adapterRef.current = existingAdapter;

      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(existingAdapter.destroyMock).toHaveBeenCalled();
    });

    it('sets isConnectingRef to true during connection and resets to false after completion', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
        mockAdapter,
      );

      const { result } = setupHook();

      // Initially, isConnectingRef should be false
      expect(mockRefs.isConnectingRef.current).toBe(false);

      await act(async () => {
        await result.current.connect();
      });

      // After connection completes, isConnectingRef should be reset to false
      expect(mockRefs.isConnectingRef.current).toBe(false);
    });

    it('resets isConnectingRef to false even when connection fails', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockRejectedValue(new Error('Discovery failed'));

      const { result } = setupHook();

      // Initially, isConnectingRef should be false
      expect(mockRefs.isConnectingRef.current).toBe(false);

      await act(async () => {
        await result.current.connect();
      });

      // After connection fails, isConnectingRef should still be reset to false
      expect(mockRefs.isConnectingRef.current).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('disconnects successfully', async () => {
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockAdapter.disconnectMock).toHaveBeenCalled();
      expect(mockAdapter.destroyMock).toHaveBeenCalled();
      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        ConnectionState.disconnected(),
      );
      expect(mockSetters.setDeviceId).toHaveBeenCalledWith(null);
      expect(mockRefs.adapterRef.current).toBeNull();
    });

    it('does not update state when new connection started during disconnect', async () => {
      const oldAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockRefs.adapterRef.current = oldAdapter;

      // Set up an existing abort controller
      const originalAbortController = new AbortController();
      mockRefs.abortControllerRef.current = originalAbortController;

      // During disconnect, simulate a new connection starting (replaces the abort controller)
      oldAdapter.disconnectMock.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              // Simulate a new connect() being called during disconnect,
              // which creates a new abort controller
              mockRefs.abortControllerRef.current = new AbortController();
              resolve();
            }, 10);
          }),
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.disconnect();
      });

      // State should NOT be updated because the abort controller was replaced
      // (indicating a new connection started during disconnect)
      expect(mockUpdateConnectionState).not.toHaveBeenCalled();
      expect(oldAdapter.destroyMock).toHaveBeenCalled();
    });

    it('handles race condition when connect() is called during disconnect()', async () => {
      const oldAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      const newAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockRefs.adapterRef.current = oldAdapter;

      // Make disconnect() take some time to simulate async operation
      oldAdapter.disconnectMock.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            // Simulate async delay
            setTimeout(() => {
              // During disconnect, a new adapter is set (simulating connect() call)
              mockRefs.adapterRef.current = newAdapter;
              resolve();
            }, 10);
          }),
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.disconnect();
      });

      // The old adapter should be destroyed
      expect(oldAdapter.disconnectMock).toHaveBeenCalled();
      expect(oldAdapter.destroyMock).toHaveBeenCalled();

      // The new adapter should NOT be destroyed (race condition fix)
      expect(newAdapter.destroyMock).not.toHaveBeenCalled();

      // The adapter ref should now point to the new adapter
      expect(mockRefs.adapterRef.current).toBe(newAdapter);
    });

    it('does not destroy adapter when it was replaced during disconnect()', async () => {
      const oldAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      const newAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockRefs.adapterRef.current = oldAdapter;

      oldAdapter.disconnectMock.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              // Replace adapter during disconnect
              mockRefs.adapterRef.current = newAdapter;
              resolve();
            }, 10);
          }),
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.disconnect();
      });

      // Verify old adapter is destroyed
      expect(oldAdapter.destroyMock).toHaveBeenCalled();

      // Verify new adapter is NOT destroyed
      expect(newAdapter.destroyMock).not.toHaveBeenCalled();

      // Verify adapter ref points to new adapter
      expect(mockRefs.adapterRef.current).toBe(newAdapter);
    });
  });

  describe('clearError', () => {
    it('clears error when adapter is connected', () => {
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockAdapter.isConnectedMock.mockReturnValue(true);
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      result.current.clearError();

      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        ConnectionState.connected(),
      );
    });

    it('clears error when adapter is not connected', () => {
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockAdapter.isConnectedMock.mockReturnValue(false);
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      result.current.clearError();

      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        ConnectionState.disconnected(),
      );
    });

    it('does not update state when AbortController is aborted', () => {
      // Set up an aborted controller
      const abortController = new AbortController();
      abortController.abort();
      mockRefs.abortControllerRef.current = abortController;

      const { result } = setupHook();

      result.current.clearError();

      expect(mockUpdateConnectionState).not.toHaveBeenCalled();
    });
  });

  describe('ensureDeviceReady', () => {
    it('connects when not connected and verifies device', async () => {
      mockRefs.adapterRef.current = null;
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');

      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
        mockAdapter,
      );

      const { result } = setupHook();

      let ready: boolean | undefined;
      await act(async () => {
        ready = await result.current.ensureDeviceReady('device-123');
      });

      expect(ready).toBe(true);
      expect(mockAdapter.connectMock).toHaveBeenCalledWith('device-123');
      expect(mockAdapter.ensureDeviceReadyMock).toHaveBeenCalledWith(
        'device-123',
      );
      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        ConnectionState.ready(),
      );
    });

    it('verifies device when already connected', async () => {
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockAdapter.isConnectedMock.mockReturnValue(true);
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      let ready: boolean | undefined;
      await act(async () => {
        ready = await result.current.ensureDeviceReady('device-123');
      });

      expect(ready).toBe(true);
      expect(mockAdapter.ensureDeviceReadyMock).toHaveBeenCalledWith(
        'device-123',
      );
      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        ConnectionState.ready(),
      );
    });

    it('returns false when device verification fails', async () => {
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockAdapter.isConnectedMock.mockReturnValue(true);
      mockAdapter.ensureDeviceReadyMock.mockRejectedValue(
        new Error('Verification failed'),
      );
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      let ready: boolean | undefined;
      await act(async () => {
        ready = await result.current.ensureDeviceReady('device-123');
      });

      expect(ready).toBe(false);
      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConnectionStatus.ErrorState,
        }),
      );
    });

    it('uses existing device ID when none provided', async () => {
      mockRefs.deviceIdRef.current = 'existing-device-123';
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockAdapter.isConnectedMock.mockReturnValue(true);
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      await act(async () => {
        await result.current.ensureDeviceReady();
      });

      expect(mockAdapter.ensureDeviceReadyMock).toHaveBeenCalledWith(
        'existing-device-123',
      );
    });

    it('does not update state when AbortController is aborted', async () => {
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockAdapter.isConnectedMock.mockReturnValue(true);
      mockRefs.adapterRef.current = mockAdapter;

      // Set up an aborted controller (simulating abort during operation)
      const abortController = new AbortController();
      abortController.abort();
      mockRefs.abortControllerRef.current = abortController;

      const { result } = setupHook();

      const ready = await result.current.ensureDeviceReady('device-123');

      expect(ready).toBe(false);
      expect(mockAdapter.ensureDeviceReadyMock).not.toHaveBeenCalled();
    });

    it('handles connection failure during ensureDeviceReady', async () => {
      mockRefs.adapterRef.current = null;
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');

      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockAdapter.connectMock.mockRejectedValue(new Error('Connection failed'));
      (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
        mockAdapter,
      );

      const { result } = setupHook();

      let ready: boolean | undefined;
      await act(async () => {
        ready = await result.current.ensureDeviceReady('device-123');
      });

      expect(ready).toBe(false);
    });

    it('handles structured hardware wallet errors', async () => {
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockAdapter.isConnectedMock.mockReturnValue(true);
      mockAdapter.ensureDeviceReadyMock.mockRejectedValue(
        createHardwareWalletError(
          ErrorCode.AuthenticationDeviceLocked,
          HardwareWalletType.Ledger,
          'Device locked',
        ),
      );
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      let ready: boolean | undefined;
      await act(async () => {
        ready = await result.current.ensureDeviceReady('device-123');
      });

      expect(ready).toBe(false);
      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConnectionStatus.ErrorState,
        }),
      );
    });
  });
});
