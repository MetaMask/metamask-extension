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

/**
 * Connection error reasons enum
 */
enum ConnectionErrorReason {
  Locked = 'locked',
  ConnectionFailed = 'connection_failed',
}

describe('useHardwareWalletConnection', () => {
  let mockRefs: {
    abortControllerRef: { current: AbortController | null };
    adapterRef: { current: HardwareWalletAdapter | null };
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
      abortControllerRef: { current: new AbortController() },
      adapterRef: { current: null },
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
          reason: ConnectionErrorReason.ConnectionFailed,
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
          reason: ConnectionErrorReason.ConnectionFailed,
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
          reason: ConnectionErrorReason.ConnectionFailed,
        }),
      );
      expect(mockAdapter.destroyMock).toHaveBeenCalled();
    });

    it('aborts when AbortController is aborted', async () => {
      (mockRefs.abortControllerRef.current as AbortController).abort();
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(mockUpdateConnectionState).not.toHaveBeenCalled();
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
          reason: ConnectionErrorReason.ConnectionFailed,
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
      mockRefs.isConnectingRef.current = true;

      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(existingAdapter.destroyMock).toHaveBeenCalled();
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

    it('aborts when AbortController is aborted', async () => {
      const mockAdapter = new MockHardwareWalletAdapter({
        onDisconnect: mockHandleDisconnect,
        onAwaitingConfirmation: jest.fn(),
        onDeviceLocked: jest.fn(),
        onAppNotOpen: jest.fn(),
        onDeviceEvent: mockHandleDeviceEvent,
      });
      mockRefs.adapterRef.current = mockAdapter;

      (mockRefs.abortControllerRef.current as AbortController).abort();

      const { result } = setupHook();

      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockUpdateConnectionState).not.toHaveBeenCalled();
      expect(mockAdapter.destroyMock).toHaveBeenCalled();
      expect(mockRefs.adapterRef.current).toBeNull();
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

    it('aborts when AbortController is aborted', () => {
      (mockRefs.abortControllerRef.current as AbortController).abort();

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
          reason: ConnectionErrorReason.ConnectionFailed,
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

    it('aborts when AbortController is aborted', async () => {
      (mockRefs.abortControllerRef.current as AbortController).abort();

      const { result } = setupHook();

      const ready = await result.current.ensureDeviceReady('device-123');

      expect(ready).toBe(false);
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
          reason: ConnectionErrorReason.Locked,
        }),
      );
    });
  });
});
