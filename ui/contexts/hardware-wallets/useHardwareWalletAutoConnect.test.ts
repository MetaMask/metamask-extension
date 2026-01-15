import { renderHook } from '@testing-library/react-hooks';
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
  deviceId: 'test-device-id',
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
  isConnectingRef: { current: false },
  hasAutoConnectedRef: { current: false },
  lastConnectedAccountRef: { current: null },
  currentConnectionIdRef: { current: null },
  connectRef: { current: null },
  deviceIdRef: { current: null },
  walletTypeRef: { current: null },
  previousWalletTypeRef: { current: null },
  ...overrides,
});

describe('useHardwareWalletAutoConnect', () => {
  let mockSetDeviceId: jest.Mock;
  let mockSetHardwareConnectionPermissionState: jest.Mock;
  let mockHandleDisconnect: jest.Mock;
  let mockConnectRef: jest.Mock;
  let mockResetAutoConnectState: jest.Mock;
  let mockSetAutoConnected: jest.Mock;
  let mockSetDeviceIdRef: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSetDeviceId = jest.fn();
    mockSetHardwareConnectionPermissionState = jest.fn();
    mockHandleDisconnect = jest.fn();
    mockConnectRef = jest.fn();
    mockResetAutoConnectState = jest.fn();
    mockSetAutoConnected = jest.fn();
    mockSetDeviceIdRef = jest.fn();
  });

  const setupHook = (
    stateOverrides: Partial<HardwareWalletState> = {},
    refsOverrides: Partial<HardwareWalletRefs> = {},
  ) => {
    return renderHook(() =>
      useHardwareWalletAutoConnect({
        state: createMockState(stateOverrides),
        refs: createMockRefs(refsOverrides),
        setDeviceId: mockSetDeviceId,
        setHardwareConnectionPermissionState:
          mockSetHardwareConnectionPermissionState,
        hardwareConnectionPermissionState:
          HardwareConnectionPermissionState.Granted,
        isWebHidAvailable: true,
        isWebUsbAvailable: false,
        handleDisconnect: mockHandleDisconnect,
        resetAutoConnectState: mockResetAutoConnectState,
        setAutoConnected: mockSetAutoConnected,
        setDeviceIdRef: mockSetDeviceIdRef,
      }),
    );
  };

  describe('native device connect/disconnect subscriptions', () => {
    it('subscribes to WebHID events for Ledger wallet with granted permissions', () => {
      setupHook();

      expect(webConnectionUtils.subscribeToWebHIDEvents).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
      );
      expect(webConnectionUtils.subscribeToWebUSBEvents).not.toHaveBeenCalled();
    });

    it('subscribes to WebUSB events for Trezor wallet with granted permissions', () => {
      renderHook(() =>
        useHardwareWalletAutoConnect({
          state: createMockState({ walletType: HardwareWalletType.Trezor }),
          refs: createMockRefs(),
          setDeviceId: mockSetDeviceId,
          setHardwareConnectionPermissionState:
            mockSetHardwareConnectionPermissionState,
          hardwareConnectionPermissionState:
            HardwareConnectionPermissionState.Granted,
          isWebHidAvailable: false,
          isWebUsbAvailable: true,
          handleDisconnect: mockHandleDisconnect,
          resetAutoConnectState: mockResetAutoConnectState,
          setAutoConnected: mockSetAutoConnected,
          setDeviceIdRef: mockSetDeviceIdRef,
        }),
      );

      expect(webConnectionUtils.subscribeToWebUSBEvents).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
      );
      expect(webConnectionUtils.subscribeToWebHIDEvents).not.toHaveBeenCalled();
    });

    it('does not subscribe when not a hardware wallet account', () => {
      setupHook({ isHardwareWalletAccount: false });

      expect(webConnectionUtils.subscribeToWebHIDEvents).not.toHaveBeenCalled();
      expect(webConnectionUtils.subscribeToWebUSBEvents).not.toHaveBeenCalled();
    });

    it('does not subscribe when permissions are not granted', () => {
      renderHook(() =>
        useHardwareWalletAutoConnect({
          state: createMockState(),
          refs: createMockRefs(),
          setDeviceId: mockSetDeviceId,
          setHardwareConnectionPermissionState:
            mockSetHardwareConnectionPermissionState,
          hardwareConnectionPermissionState:
            HardwareConnectionPermissionState.Denied,
          isWebHidAvailable: true,
          isWebUsbAvailable: false,
          handleDisconnect: mockHandleDisconnect,
          resetAutoConnectState: mockResetAutoConnectState,
          setAutoConnected: mockSetAutoConnected,
          setDeviceIdRef: mockSetDeviceIdRef,
        }),
      );

      expect(webConnectionUtils.subscribeToWebHIDEvents).not.toHaveBeenCalled();
    });

    it('does not subscribe when WebHID is not available for Ledger', () => {
      renderHook(() =>
        useHardwareWalletAutoConnect({
          state: createMockState(),
          refs: createMockRefs(),
          setDeviceId: mockSetDeviceId,
          setHardwareConnectionPermissionState:
            mockSetHardwareConnectionPermissionState,
          hardwareConnectionPermissionState:
            HardwareConnectionPermissionState.Granted,
          isWebHidAvailable: false,
          isWebUsbAvailable: false,
          handleDisconnect: mockHandleDisconnect,
          resetAutoConnectState: mockResetAutoConnectState,
          setAutoConnected: mockSetAutoConnected,
          setDeviceIdRef: mockSetDeviceIdRef,
        }),
      );

      expect(webConnectionUtils.subscribeToWebHIDEvents).not.toHaveBeenCalled();
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

      // Get the connect callback from the subscription
      const subscribeCall = (
        webConnectionUtils.subscribeToWebHIDEvents as jest.Mock
      ).mock.calls[0];
      const connectCallback = subscribeCall[0];

      const mockDevice = { productId: 123 } as HIDDevice;

      await connectCallback(mockDevice);

      expect(mockSetDeviceId).toHaveBeenCalledWith(expect.any(Function));
      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).toHaveBeenCalledWith(HardwareWalletType.Ledger);
      expect(mockConnectRef).toHaveBeenCalled();
    });

    it('handles native device disconnect event', async () => {
      setupHook({}, { deviceIdRef: { current: '123' } });

      // Get the disconnect callback from the subscription
      const subscribeCall = (
        webConnectionUtils.subscribeToWebHIDEvents as jest.Mock
      ).mock.calls[0];
      const disconnectCallback = subscribeCall[1];

      const mockDevice = { productId: 123 } as HIDDevice;

      await disconnectCallback(mockDevice);

      expect(mockHandleDisconnect).toHaveBeenCalled();
      expect(
        webConnectionUtils.checkHardwareWalletPermission,
      ).toHaveBeenCalledWith(HardwareWalletType.Ledger);
    });

    it('ignores disconnect for unrelated devices', async () => {
      setupHook({}, { deviceIdRef: { current: '999' } }); // Different device ID

      const subscribeCall = (
        webConnectionUtils.subscribeToWebHIDEvents as jest.Mock
      ).mock.calls[0];
      const disconnectCallback = subscribeCall[1];

      const mockDevice = { productId: 123 } as HIDDevice;

      await disconnectCallback(mockDevice);

      expect(mockHandleDisconnect).not.toHaveBeenCalled();
    });

    it('aborts when AbortController is aborted', async () => {
      const abortController = new AbortController();
      abortController.abort();

      setupHook({}, { abortControllerRef: { current: abortController } });

      const subscribeCall = (
        webConnectionUtils.subscribeToWebHIDEvents as jest.Mock
      ).mock.calls[0];
      const connectCallback = subscribeCall[0];

      const mockDevice = { productId: 123 } as HIDDevice;

      await connectCallback(mockDevice);

      expect(mockSetDeviceId).not.toHaveBeenCalled();
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
          setDeviceId: mockSetDeviceId,
          setHardwareConnectionPermissionState:
            mockSetHardwareConnectionPermissionState,
          hardwareConnectionPermissionState:
            HardwareConnectionPermissionState.Granted,
          isWebHidAvailable: true,
          isWebUsbAvailable: false,
          handleDisconnect: mockHandleDisconnect,
          resetAutoConnectState: mockResetAutoConnectState,
          setAutoConnected: mockSetAutoConnected,
          setDeviceIdRef: mockSetDeviceIdRef,
        }),
      );
      return { hook, refs };
    };

    it('auto-connects when hardware wallet account detected with permissions', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');

      mockConnectRef.mockResolvedValue(undefined);

      setupAutoConnectHook();

      // Wait for useEffect to run
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(webConnectionUtils.getHardwareWalletDeviceId).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
      );
      expect(mockSetDeviceId).toHaveBeenCalledWith(expect.any(Function));
      expect(mockConnectRef).toHaveBeenCalled();
      expect(mockSetAutoConnected).toHaveBeenCalledWith('0x123', 'device-123');
    });

    it('does not auto-connect when permissions are not granted', () => {
      renderHook(() =>
        useHardwareWalletAutoConnect({
          state: createMockState(),
          refs: createMockRefs(),
          setDeviceId: mockSetDeviceId,
          setHardwareConnectionPermissionState:
            mockSetHardwareConnectionPermissionState,
          hardwareConnectionPermissionState:
            HardwareConnectionPermissionState.Denied,
          isWebHidAvailable: true,
          isWebUsbAvailable: false,
          handleDisconnect: mockHandleDisconnect,
          resetAutoConnectState: mockResetAutoConnectState,
          setAutoConnected: mockSetAutoConnected,
          setDeviceIdRef: mockSetDeviceIdRef,
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
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');

      setupAutoConnectHook(
        {},
        {
          lastConnectedAccountRef: { current: '0x456' }, // Different account
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockConnectRef).toHaveBeenCalled();
      expect(mockSetAutoConnected).toHaveBeenCalledWith('0x123', 'device-123');
    });

    it('does not auto-connect when already connected', async () => {
      const mockAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: jest.fn().mockReturnValue(true),
        destroy: jest.fn(),
      };

      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');

      setupAutoConnectHook(
        {},
        {
          adapterRef: { current: mockAdapter },
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockConnectRef).not.toHaveBeenCalled();
    });

    it('does not auto-connect when currently connecting', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');

      setupAutoConnectHook(
        {},
        {
          isConnectingRef: { current: true },
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockConnectRef).not.toHaveBeenCalled();
    });

    it('handles device discovery failure gracefully', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockRejectedValue(new Error('Discovery failed'));

      setupHook();

      // Should not throw, just log error
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockConnectRef).not.toHaveBeenCalled();
    });

    it('aborts auto-connect when AbortController is aborted', async () => {
      const abortController = new AbortController();
      abortController.abort();

      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');

      setupAutoConnectHook(
        {},
        {
          abortControllerRef: { current: abortController },
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockConnectRef).not.toHaveBeenCalled();
    });

    it('does not mark as auto-connected when connection fails', async () => {
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValue('device-123');

      mockConnectRef.mockRejectedValue(new Error('Connection failed'));

      setupAutoConnectHook();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(webConnectionUtils.getHardwareWalletDeviceId).toHaveBeenCalledWith(
        HardwareWalletType.Ledger,
      );
      expect(mockSetDeviceId).toHaveBeenCalledWith(expect.any(Function));
      expect(mockConnectRef).toHaveBeenCalled();
      expect(mockSetAutoConnected).not.toHaveBeenCalled();
    });

    it('cancels stale auto-connect when account changes rapidly', async () => {
      let resolveFirstDeviceId: (id: string) => void = (_id: string) =>
        undefined;
      const firstDeviceIdPromise = new Promise<string>((resolve) => {
        resolveFirstDeviceId = resolve;
      });

      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockReturnValueOnce(firstDeviceIdPromise);

      mockConnectRef.mockResolvedValue(undefined);

      const refs = createMockRefs({
        connectRef: { current: mockConnectRef },
      });

      const { rerender } = renderHook(
        (props: { accountAddress: string }) =>
          useHardwareWalletAutoConnect({
            state: createMockState({ accountAddress: props.accountAddress }),
            refs,
            setDeviceId: mockSetDeviceId,
            setHardwareConnectionPermissionState:
              mockSetHardwareConnectionPermissionState,
            hardwareConnectionPermissionState:
              HardwareConnectionPermissionState.Granted,
            isWebHidAvailable: true,
            isWebUsbAvailable: false,
            handleDisconnect: mockHandleDisconnect,
            resetAutoConnectState: mockResetAutoConnectState,
            setAutoConnected: mockSetAutoConnected,
            setDeviceIdRef: mockSetDeviceIdRef,
          }),
        { initialProps: { accountAddress: '0x111' } },
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      mockSetAutoConnected.mockClear();
      mockConnectRef.mockClear();

      // Immediately switch to second account (0x222) before first resolves
      // The second device discovery resolves immediately
      (
        webConnectionUtils.getHardwareWalletDeviceId as jest.Mock
      ).mockResolvedValueOnce('device-222');

      rerender({ accountAddress: '0x222' });

      // Allow second effect to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Second account should auto-connect
      expect(mockSetAutoConnected).toHaveBeenCalledWith('0x222', 'device-222');
      mockSetAutoConnected.mockClear();
      mockConnectRef.mockClear();

      resolveFirstDeviceId('device-111');

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockSetAutoConnected).not.toHaveBeenCalled();
    });
  });
});
