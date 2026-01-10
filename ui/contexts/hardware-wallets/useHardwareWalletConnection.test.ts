import { renderHook, act } from '@testing-library/react-hooks';
import { useHardwareWalletConnection } from './useHardwareWalletConnection';
import { HardwareWalletType, ConnectionStatus } from './types';
import { ConnectionState } from './connectionState';
import { createHardwareWalletError, ErrorCode } from './errors';
import * as webHIDUtils from './webHIDUtils';
import { createAdapterForHardwareWalletType } from './adapters/factory';

jest.mock('./webHIDUtils');
jest.mock('./adapters/factory');

type MockAdapter = {
  connect?: jest.Mock;
  disconnect?: jest.Mock;
  destroy?: jest.Mock;
  isConnected?: jest.Mock;
  verifyDeviceReady?: jest.Mock;
};

describe('useHardwareWalletConnection', () => {
  let mockRefs: {
    abortControllerRef: { current: AbortController | null };
    adapterRef: { current: MockAdapter | null };
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
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        'device-123',
      );
      const mockAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn(),
      };
      (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
        mockAdapter,
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(webHIDUtils.getHardwareWalletDeviceId).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
      );
      expect(createAdapterForHardwareWalletType).toHaveBeenCalled();
      expect(mockAdapter.connect).toHaveBeenCalledWith('device-123');
      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        ConnectionState.connected(),
      );
      expect(mockRefs.adapterRef.current).toBe(mockAdapter);
    });

    it('connects successfully with existing device ID', async () => {
      mockRefs.deviceIdRef.current = 'existing-device-123';
      const mockAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn(),
      };
      (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
        mockAdapter,
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(webHIDUtils.getHardwareWalletDeviceId).not.toHaveBeenCalled();
      expect(mockAdapter.connect).toHaveBeenCalledWith('existing-device-123');
    });

    it('handles device discovery failure', async () => {
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockRejectedValue(
        new Error('Discovery failed'),
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConnectionStatus.ErrorState,
          reason: 'connection_failed',
        }),
      );
    });

    it('handles device not found', async () => {
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        null,
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConnectionStatus.ErrorState,
          reason: 'connection_failed',
        }),
      );
    });

    it('handles adapter creation failure', async () => {
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        'device-123',
      );
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
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        'device-123',
      );
      const mockAdapter = {
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        destroy: jest.fn(),
      };
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
          reason: 'connection_failed',
        }),
      );
      expect(mockAdapter.destroy).toHaveBeenCalled();
    });

    it('aborts when AbortController is aborted', async () => {
      (mockRefs.abortControllerRef.current as AbortController).abort();
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        'device-123',
      );

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
          reason: 'connection_failed',
        }),
      );
    });

    it('destroys existing adapter before new connection', async () => {
      const existingAdapter = { destroy: jest.fn() };
      mockRefs.adapterRef.current = existingAdapter;
      mockRefs.isConnectingRef.current = true;

      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        'device-123',
      );

      const { result } = setupHook();

      await act(async () => {
        await result.current.connect();
      });

      expect(existingAdapter.destroy).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('disconnects successfully', async () => {
      const mockAdapter = {
        disconnect: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn(),
      };
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockAdapter.disconnect).toHaveBeenCalled();
      expect(mockAdapter.destroy).toHaveBeenCalled();
      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        ConnectionState.disconnected(),
      );
      expect(mockSetters.setDeviceId).toHaveBeenCalledWith(null);
      expect(mockRefs.adapterRef.current).toBeNull();
    });

    it('aborts when AbortController is aborted', async () => {
      (mockRefs.abortControllerRef.current as AbortController).abort();

      const { result } = setupHook();

      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockUpdateConnectionState).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('clears error when adapter is connected', () => {
      const mockAdapter = { isConnected: jest.fn().mockReturnValue(true) };
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      result.current.clearError();

      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        ConnectionState.connected(),
      );
    });

    it('clears error when adapter is not connected', () => {
      const mockAdapter = { isConnected: jest.fn().mockReturnValue(false) };
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
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        'device-123',
      );

      const mockAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        verifyDeviceReady: jest.fn().mockResolvedValue(true),
        destroy: jest.fn(),
      };
      (createAdapterForHardwareWalletType as jest.Mock).mockReturnValue(
        mockAdapter,
      );

      const { result } = setupHook();

      let ready: boolean | undefined;
      await act(async () => {
        ready = await result.current.ensureDeviceReady('device-123');
      });

      expect(ready).toBe(true);
      expect(mockAdapter.connect).toHaveBeenCalledWith('device-123');
      expect(mockAdapter.verifyDeviceReady).toHaveBeenCalledWith('device-123');
      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        ConnectionState.ready(),
      );
    });

    it('verifies device when already connected', async () => {
      const mockAdapter = {
        isConnected: jest.fn().mockReturnValue(true),
        verifyDeviceReady: jest.fn().mockResolvedValue(true),
      };
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      let ready: boolean | undefined;
      await act(async () => {
        ready = await result.current.ensureDeviceReady('device-123');
      });

      expect(ready).toBe(true);
      expect(mockAdapter.verifyDeviceReady).toHaveBeenCalledWith('device-123');
      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        ConnectionState.ready(),
      );
    });

    it('returns false when device verification fails', async () => {
      const mockAdapter = {
        isConnected: jest.fn().mockReturnValue(true),
        verifyDeviceReady: jest
          .fn()
          .mockRejectedValue(new Error('Verification failed')),
      };
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
          reason: 'connection_failed',
        }),
      );
    });

    it('uses existing device ID when none provided', async () => {
      mockRefs.deviceIdRef.current = 'existing-device-123';
      const mockAdapter = {
        isConnected: jest.fn().mockReturnValue(true),
        verifyDeviceReady: jest.fn().mockResolvedValue(true),
      };
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      await act(async () => {
        await result.current.ensureDeviceReady();
      });

      expect(mockAdapter.verifyDeviceReady).toHaveBeenCalledWith(
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
      (webHIDUtils.getHardwareWalletDeviceId as jest.Mock).mockResolvedValue(
        'device-123',
      );

      const mockAdapter = {
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        destroy: jest.fn(),
      };
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
      const mockAdapter = {
        isConnected: jest.fn().mockReturnValue(true),
        verifyDeviceReady: jest
          .fn()
          .mockRejectedValue(
            createHardwareWalletError(
              ErrorCode.DEVICE_STATE_001,
              HardwareWalletType.Ledger,
              'Device locked',
            ),
          ),
      };
      mockRefs.adapterRef.current = mockAdapter;

      const { result } = setupHook();

      let ready: boolean | undefined;
      await act(async () => {
        ready = await result.current.ensureDeviceReady('device-123');
      });

      expect(ready).toBe(false);
      expect(mockUpdateConnectionState).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConnectionStatus.AwaitingApp,
          reason: 'not_open',
        }),
      );
    });
  });
});
