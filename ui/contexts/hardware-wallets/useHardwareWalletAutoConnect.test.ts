import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useHardwareWalletAutoConnect } from './useHardwareWalletAutoConnect';
import {
  HardwareWalletType,
  HardwareConnectionPermissionState,
  ConnectionStatus,
} from './types';
import {
  type HardwareWalletState,
  type HardwareWalletRefs,
} from './HardwareWalletStateManager';
import * as webConnectionUtils from './webConnectionUtils';

jest.mock('./webConnectionUtils');

const createMockState = (
  overrides: Partial<HardwareWalletState> = {},
): HardwareWalletState => ({
  hardwareConnectionPermissionState: HardwareConnectionPermissionState.Granted,
  connectionState: { status: ConnectionStatus.Disconnected },
  walletType: HardwareWalletType.Ledger,
  isHardwareWalletAccount: true,
  accountAddress: '0x123',
  ...overrides,
});

const createMockRefs = (
  overrides: Partial<HardwareWalletRefs> = {},
): HardwareWalletRefs => ({
  abortControllerRef: {
    current: overrides.abortControllerRef?.current ?? new AbortController(),
  },
  adapterRef: { current: null },
  connectingPromiseRef: { current: null },
  ensureDeviceReadyPromiseRef: { current: null },
  isConnectingRef: { current: false },
  hasAutoConnectedRef: { current: false },
  lastConnectedAccountRef: { current: null },
  currentConnectionIdRef: { current: null },
  connectRef: { current: null },
  walletTypeRef: { current: null },
  previousWalletTypeRef: { current: null },
  ...overrides,
});

describe('useHardwareWalletAutoConnect', () => {
  let mockSetHardwareConnectionPermissionState: jest.Mock;
  let mockUpdateConnectionState: jest.Mock;
  let mockHandleDisconnect: jest.Mock;
  let mockConnectRef: jest.Mock;
  let mockResetAutoConnectState: jest.Mock;
  let mockSetAutoConnected: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSetHardwareConnectionPermissionState = jest.fn();
    mockUpdateConnectionState = jest.fn();
    mockHandleDisconnect = jest.fn();
    mockConnectRef = jest.fn();
    mockResetAutoConnectState = jest.fn();
    mockSetAutoConnected = jest.fn();
  });

  const setupHook = (
    stateOverrides: Partial<HardwareWalletState> = {},
    refsOverrides: Partial<HardwareWalletRefs> = {},
  ) => {
    return renderHook(() =>
      useHardwareWalletAutoConnect({
        state: createMockState(stateOverrides),
        refs: createMockRefs(refsOverrides),
        setHardwareConnectionPermissionState:
          mockSetHardwareConnectionPermissionState,
        updateConnectionState: mockUpdateConnectionState,
        hardwareConnectionPermissionState:
          HardwareConnectionPermissionState.Granted,
        isWebHidAvailable: true,
        isWebUsbAvailable: false,
        handleDisconnect: mockHandleDisconnect,
        resetAutoConnectState: mockResetAutoConnectState,
        setAutoConnected: mockSetAutoConnected,
      }),
    );
  };

  describe('native device connect/disconnect subscriptions', () => {
    it('subscribes to WebHID events for Ledger wallet with granted permissions', () => {
      setupHook();

      expect(webConnectionUtils.subscribeToWebHidEvents).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
        expect.any(Function),
        expect.any(Function),
      );
      expect(webConnectionUtils.subscribeToWebUsbEvents).not.toHaveBeenCalled();
    });

    it('subscribes to WebUSB events for Trezor wallet with granted permissions', () => {
      renderHook(() =>
        useHardwareWalletAutoConnect({
          state: createMockState({ walletType: HardwareWalletType.Trezor }),
          refs: createMockRefs(),
          setHardwareConnectionPermissionState:
            mockSetHardwareConnectionPermissionState,
          updateConnectionState: mockUpdateConnectionState,
          hardwareConnectionPermissionState:
            HardwareConnectionPermissionState.Granted,
          isWebHidAvailable: false,
          isWebUsbAvailable: true,
          handleDisconnect: mockHandleDisconnect,
          resetAutoConnectState: mockResetAutoConnectState,
          setAutoConnected: mockSetAutoConnected,
        }),
      );

      expect(webConnectionUtils.subscribeToWebUsbEvents).toHaveBeenCalledWith(
        HardwareWalletType.Trezor,
        expect.any(Function),
        expect.any(Function),
      );
      expect(webConnectionUtils.subscribeToWebHidEvents).not.toHaveBeenCalled();
    });

    it('does not subscribe when not a hardware wallet account', () => {
      setupHook({ isHardwareWalletAccount: false });

      expect(webConnectionUtils.subscribeToWebHidEvents).not.toHaveBeenCalled();
      expect(webConnectionUtils.subscribeToWebUsbEvents).not.toHaveBeenCalled();
    });

    it('does not subscribe when permissions are not granted', () => {
      renderHook(() =>
        useHardwareWalletAutoConnect({
          state: createMockState(),
          refs: createMockRefs(),
          setHardwareConnectionPermissionState:
            mockSetHardwareConnectionPermissionState,
          updateConnectionState: mockUpdateConnectionState,
          hardwareConnectionPermissionState:
            HardwareConnectionPermissionState.Denied,
          isWebHidAvailable: true,
          isWebUsbAvailable: false,
          handleDisconnect: mockHandleDisconnect,
          resetAutoConnectState: mockResetAutoConnectState,
          setAutoConnected: mockSetAutoConnected,
        }),
      );

      expect(webConnectionUtils.subscribeToWebHidEvents).not.toHaveBeenCalled();
    });

    it('does not subscribe when WebHID is not available for Ledger', () => {
      renderHook(() =>
        useHardwareWalletAutoConnect({
          state: createMockState(),
          refs: createMockRefs(),
          setHardwareConnectionPermissionState:
            mockSetHardwareConnectionPermissionState,
          updateConnectionState: mockUpdateConnectionState,
          hardwareConnectionPermissionState:
            HardwareConnectionPermissionState.Granted,
          isWebHidAvailable: false,
          isWebUsbAvailable: false,
          handleDisconnect: mockHandleDisconnect,
          resetAutoConnectState: mockResetAutoConnectState,
          setAutoConnected: mockSetAutoConnected,
        }),
      );

      expect(webConnectionUtils.subscribeToWebHidEvents).not.toHaveBeenCalled();
    });

    it('handles native device connect event', async () => {
      const mockAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: jest.fn().mockReturnValue(false),
        destroy: jest.fn(),
      };

      setupHook(
        {},
        {
          adapterRef: { current: mockAdapter },
          connectRef: { current: mockConnectRef },
        },
      );

      // Get the connect callback from the subscription (index 1 since index 0 is walletType)
      const subscribeCall = (
        webConnectionUtils.subscribeToWebHidEvents as jest.Mock
      ).mock.calls[0];
      const connectCallback = subscribeCall[1];

      const mockDevice = { productId: 123 } as HIDDevice;

      await connectCallback(mockDevice);

      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).toHaveBeenCalledWith(HardwareWalletType.Ledger);
      expect(mockConnectRef).toHaveBeenCalled();
      expect(mockSetAutoConnected).toHaveBeenCalledWith('0x123');
    });

    it('handles native device connect event when connect function throws', async () => {
      const mockAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: jest.fn().mockReturnValue(false),
        destroy: jest.fn(),
      };

      const mockConnectRefWithError = jest
        .fn()
        .mockRejectedValue(new Error('Connection failed'));

      setupHook(
        {},
        {
          adapterRef: { current: mockAdapter },
          connectRef: { current: mockConnectRefWithError },
        },
      );

      // Get the connect callback from the subscription (index 1 since index 0 is walletType)
      const subscribeCall = (
        webConnectionUtils.subscribeToWebHidEvents as jest.Mock
      ).mock.calls[0];
      const connectCallback = subscribeCall[1];

      const mockDevice = { productId: 123 } as HIDDevice;

      // Should not throw - error should be handled gracefully
      await expect(connectCallback(mockDevice)).resolves.not.toThrow();

      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).toHaveBeenCalledWith(HardwareWalletType.Ledger);
      expect(mockConnectRefWithError).toHaveBeenCalled();
      expect(mockSetAutoConnected).not.toHaveBeenCalled();
    });

    it('handles native device disconnect event', async () => {
      const mockAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: jest.fn().mockReturnValue(true),
        destroy: jest.fn(),
      };

      setupHook({}, { adapterRef: { current: mockAdapter } });

      // Get the disconnect callback from the subscription (index 2 since index 0 is walletType)
      const subscribeCall = (
        webConnectionUtils.subscribeToWebHidEvents as jest.Mock
      ).mock.calls[0];
      const disconnectCallback = subscribeCall[2];

      const mockDevice = { productId: 123 } as HIDDevice;

      await disconnectCallback(mockDevice);

      expect(mockHandleDisconnect).toHaveBeenCalled();
      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).toHaveBeenCalledWith(HardwareWalletType.Ledger);
    });

    it('ignores disconnect when not connected', async () => {
      const mockAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: jest.fn().mockReturnValue(false),
        destroy: jest.fn(),
      };

      setupHook({}, { adapterRef: { current: mockAdapter } });

      const subscribeCall = (
        webConnectionUtils.subscribeToWebHidEvents as jest.Mock
      ).mock.calls[0];
      const disconnectCallback = subscribeCall[2];

      const mockDevice = { productId: 123 } as HIDDevice;

      await disconnectCallback(mockDevice);

      expect(mockHandleDisconnect).not.toHaveBeenCalled();
    });

    it('unsubscribes from events on cleanup', () => {
      const mockUnsubscribe = jest.fn();
      (webConnectionUtils.subscribeToWebHidEvents as jest.Mock).mockReturnValue(
        mockUnsubscribe,
      );

      const { unmount } = setupHook();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('auto-connection effect', () => {
    const setupAutoConnectHook = (
      stateOverrides: Partial<HardwareWalletState> = {},
      refsOverrides: Partial<HardwareWalletRefs> = {},
    ) => {
      const refs = createMockRefs({
        connectRef: { current: mockConnectRef },
        ...refsOverrides,
      });
      const hook = renderHook(() =>
        useHardwareWalletAutoConnect({
          state: createMockState(stateOverrides),
          refs,
          setHardwareConnectionPermissionState:
            mockSetHardwareConnectionPermissionState,
          updateConnectionState: mockUpdateConnectionState,
          hardwareConnectionPermissionState:
            HardwareConnectionPermissionState.Granted,
          isWebHidAvailable: true,
          isWebUsbAvailable: false,
          handleDisconnect: mockHandleDisconnect,
          resetAutoConnectState: mockResetAutoConnectState,
          setAutoConnected: mockSetAutoConnected,
        }),
      );
      return { hook, refs };
    };

    it('auto-connects when hardware wallet account detected with permissions', async () => {
      (webConnectionUtils.getConnectedDevices as jest.Mock).mockResolvedValue([
        { productId: 123 },
      ]);

      mockConnectRef.mockResolvedValue(undefined);

      setupAutoConnectHook();

      await waitFor(() => {
        expect(mockSetAutoConnected).toHaveBeenCalledWith('0x123');
      });

      expect(webConnectionUtils.getConnectedDevices).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
      );
      expect(mockConnectRef).toHaveBeenCalled();
    });

    it('does not auto-connect when permissions are not granted', () => {
      renderHook(() =>
        useHardwareWalletAutoConnect({
          state: createMockState(),
          refs: createMockRefs(),
          setHardwareConnectionPermissionState:
            mockSetHardwareConnectionPermissionState,
          updateConnectionState: mockUpdateConnectionState,
          hardwareConnectionPermissionState:
            HardwareConnectionPermissionState.Denied,
          isWebHidAvailable: true,
          isWebUsbAvailable: false,
          handleDisconnect: mockHandleDisconnect,
          resetAutoConnectState: mockResetAutoConnectState,
          setAutoConnected: mockSetAutoConnected,
        }),
      );

      expect(mockConnectRef).not.toHaveBeenCalled();
    });

    it('does not auto-connect for non-hardware wallet accounts', () => {
      setupAutoConnectHook({ isHardwareWalletAccount: false });

      expect(mockConnectRef).not.toHaveBeenCalled();
    });

    it('skips auto-connect if already auto-connected for same account', () => {
      setupAutoConnectHook(
        {},
        {
          hasAutoConnectedRef: { current: true },
          lastConnectedAccountRef: { current: '0x123' },
        },
      );

      expect(mockConnectRef).not.toHaveBeenCalled();
    });

    it('auto-connects when account changes', async () => {
      (webConnectionUtils.getConnectedDevices as jest.Mock).mockResolvedValue([
        { productId: 123 },
      ]);

      setupAutoConnectHook(
        {},
        {
          lastConnectedAccountRef: { current: '0x456' }, // Different account
        },
      );

      await waitFor(() => {
        expect(mockSetAutoConnected).toHaveBeenCalledWith('0x123');
      });

      expect(mockConnectRef).toHaveBeenCalled();
    });

    it('does not auto-connect when already connected', async () => {
      const mockAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: jest.fn().mockReturnValue(true),
        destroy: jest.fn(),
      };

      (webConnectionUtils.getConnectedDevices as jest.Mock).mockResolvedValue([
        { productId: 123 },
      ]);

      setupAutoConnectHook(
        {},
        {
          adapterRef: { current: mockAdapter },
        },
      );

      expect(mockConnectRef).not.toHaveBeenCalled();
      expect(mockSetAutoConnected).not.toHaveBeenCalled();
    });

    it('does not auto-connect when currently connecting', async () => {
      (webConnectionUtils.getConnectedDevices as jest.Mock).mockResolvedValue([
        { productId: 123 },
      ]);

      setupAutoConnectHook(
        {},
        {
          isConnectingRef: { current: true },
        },
      );

      expect(mockConnectRef).not.toHaveBeenCalled();
      expect(mockSetAutoConnected).not.toHaveBeenCalled();
    });

    it('handles device discovery failure gracefully', async () => {
      (webConnectionUtils.getConnectedDevices as jest.Mock).mockRejectedValue(
        new Error('Discovery failed'),
      );

      setupHook();

      // Should not throw, just log error
      await waitFor(() => {
        expect(webConnectionUtils.getConnectedDevices).toHaveBeenCalled();
      });

      expect(mockConnectRef).not.toHaveBeenCalled();
    });

    it('cancels pending auto-connect on unmount', async () => {
      let resolveDevices: (devices: HIDDevice[]) => void = () => undefined;
      const devicesPromise = new Promise<HIDDevice[]>((resolve) => {
        resolveDevices = resolve;
      });

      (webConnectionUtils.getConnectedDevices as jest.Mock).mockReturnValue(
        devicesPromise,
      );

      mockConnectRef.mockResolvedValue(undefined);

      const { hook } = setupAutoConnectHook();

      // Unmount before the promise resolves
      hook.unmount();

      // Now resolve the promise
      resolveDevices([{ productId: 123 } as HIDDevice]);

      // Wait a tick to ensure the promise resolution is processed
      await waitFor(() => {
        expect(webConnectionUtils.getConnectedDevices).toHaveBeenCalled();
      });

      // Since we unmounted before resolution, connect should not be called
      expect(mockConnectRef).not.toHaveBeenCalled();
      expect(mockSetAutoConnected).not.toHaveBeenCalled();
    });

    it('does not mark as auto-connected when connection fails', async () => {
      (webConnectionUtils.getConnectedDevices as jest.Mock).mockResolvedValue([
        { productId: 123 },
      ]);

      mockConnectRef.mockRejectedValue(new Error('Connection failed'));

      setupAutoConnectHook();

      await waitFor(() => {
        expect(mockConnectRef).toHaveBeenCalled();
      });

      expect(webConnectionUtils.getConnectedDevices).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
      );
      expect(mockSetAutoConnected).not.toHaveBeenCalled();
    });

    it('does not auto-connect when connectRef.current is null', async () => {
      (webConnectionUtils.getConnectedDevices as jest.Mock).mockResolvedValue([
        { productId: 123 },
      ]);

      setupAutoConnectHook(
        {},
        {
          connectRef: { current: null },
        },
      );

      // Wait for potential auto-connect to complete
      await waitFor(() => {
        expect(webConnectionUtils.getConnectedDevices).toHaveBeenCalledWith(
          HardwareWalletType.Ledger,
        );
      });

      // Verify no connection attempt was made and no auto-connected state was set
      expect(mockConnectRef).not.toHaveBeenCalled();
      expect(mockSetAutoConnected).not.toHaveBeenCalled();
    });
  });
});
