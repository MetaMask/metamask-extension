import {
  ErrorCode,
  HardwareWalletError,
  Severity,
  Category,
} from '@metamask/hw-wallet-sdk';
import {
  attemptLedgerTransportCreation,
  getAppNameAndVersion,
  getHdPathForLedgerKeyring,
  getLedgerAppConfiguration,
  getLedgerPublicKey,
} from '../../../store/actions';
import { DeviceEvent, type HardwareWalletAdapterOptions } from '../types';
import * as webConnectionUtils from '../webConnectionUtils';
import { LedgerAdapter } from './LedgerAdapter';

jest.mock('../../../store/actions', () => ({
  attemptLedgerTransportCreation: jest.fn(),
  getAppNameAndVersion: jest.fn(),
  getHdPathForLedgerKeyring: jest.fn(),
  getLedgerAppConfiguration: jest.fn(),
  getLedgerPublicKey: jest.fn(),
}));

jest.mock('../webConnectionUtils', () => ({
  ...jest.requireActual('../webConnectionUtils'),
  subscribeToWebHidEvents: jest.fn(),
}));

const mockAttemptLedgerTransportCreation =
  attemptLedgerTransportCreation as jest.MockedFunction<
    typeof attemptLedgerTransportCreation
  >;
const mockGetAppNameAndVersion = getAppNameAndVersion as jest.MockedFunction<
  typeof getAppNameAndVersion
>;
const mockgetHdPathForLedgerKeyring =
  getHdPathForLedgerKeyring as jest.MockedFunction<
    typeof getHdPathForLedgerKeyring
  >;
const mockGetLedgerAppConfiguration =
  getLedgerAppConfiguration as jest.MockedFunction<
    typeof getLedgerAppConfiguration
  >;
const mockGetLedgerPublicKey = getLedgerPublicKey as jest.MockedFunction<
  typeof getLedgerPublicKey
>;

const mockSubscribeToWebHidEvents =
  webConnectionUtils.subscribeToWebHidEvents as jest.MockedFunction<
    typeof webConnectionUtils.subscribeToWebHidEvents
  >;

describe('LedgerAdapter', () => {
  let adapter: LedgerAdapter;
  let mockOptions: HardwareWalletAdapterOptions;
  let mockNavigatorHid: {
    getDevices: jest.Mock;
  };
  let mockUnsubscribe: jest.Mock;
  let capturedOnConnect: ((device: HIDDevice) => void) | null = null;
  let capturedOnDisconnect: ((device: HIDDevice) => void) | null = null;

  const createMockOptions = (): HardwareWalletAdapterOptions => ({
    onDisconnect: jest.fn(),
    onAwaitingConfirmation: jest.fn(),
    onDeviceLocked: jest.fn(),
    onAppNotOpen: jest.fn(),
    onDeviceEvent: jest.fn(),
  });

  const createMockHidDevice = (vendorId: number) => ({
    vendorId,
    productId: 0x0001,
    productName: 'Nano X',
    opened: true,
  });

  const createMockError = (message: string): Error => {
    const error = new Error(message);
    error.name = 'LedgerError';
    return error;
  };

  const DEFAULT_LEDGER_APP_CONFIGURATION = {
    arbitraryDataEnabled: 1,
    erc20ProvisioningNecessary: 0,
    starkEnabled: 0,
    starkv2Supported: 0,
    version: '1.0.0',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockOptions = createMockOptions();
    mockNavigatorHid = {
      getDevices: jest.fn(),
    };
    mockUnsubscribe = jest.fn();
    capturedOnConnect = null;
    capturedOnDisconnect = null;

    // Set up mock for subscribeToWebHidEvents to capture callbacks
    mockSubscribeToWebHidEvents.mockImplementation(
      (_walletType, onConnect, onDisconnect) => {
        capturedOnConnect = onConnect;
        capturedOnDisconnect = onDisconnect;
        return mockUnsubscribe;
      },
    );

    Object.defineProperty(window.navigator, 'hid', {
      value: mockNavigatorHid,
      writable: true,
      configurable: true,
    });

    mockgetHdPathForLedgerKeyring.mockResolvedValue("m/44'/60'/0'/0");
    mockGetLedgerPublicKey.mockResolvedValue({
      publicKey: '0x',
      address: '0x',
      chainCode: '0x',
    });

    adapter = new LedgerAdapter(mockOptions);
    mockGetLedgerAppConfiguration.mockResolvedValue(
      DEFAULT_LEDGER_APP_CONFIGURATION,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    adapter.destroy();
  });

  describe('constructor', () => {
    it('initializes adapter with provided options', () => {
      const newOptions = createMockOptions();

      const newAdapter = new LedgerAdapter(newOptions);

      expect(newAdapter).toBeInstanceOf(LedgerAdapter);
      expect(newAdapter.isConnected()).toBe(false);
      newAdapter.destroy();
    });

    it('sets up WebHID event listeners on construction', () => {
      expect(mockSubscribeToWebHidEvents).toHaveBeenCalledWith(
        'ledger',
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  describe('WebHID event listeners', () => {
    const mockHidDevice = { vendorId: 0x2c97 } as HIDDevice;

    it('emits Disconnected event when device is unplugged while connected', async () => {
      // First, connect the device
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);

      // Clear previous event calls from connection
      (mockOptions.onDeviceEvent as jest.Mock).mockClear();

      // Simulate device unplug via WebHID event
      capturedOnDisconnect?.(mockHidDevice);

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith({
        event: DeviceEvent.Disconnected,
      });
      expect(adapter.isConnected()).toBe(false);
    });

    it('does not emit Disconnected event when device unplugged but was not connected', () => {
      // Adapter is not connected (default state)
      expect(adapter.isConnected()).toBe(false);

      // Simulate device unplug via WebHID event
      capturedOnDisconnect?.(mockHidDevice);

      // Should not emit event since we weren't tracking a connection
      expect(mockOptions.onDeviceEvent).not.toHaveBeenCalled();
    });

    it('resets connection state when device is unplugged', async () => {
      // First, connect the device
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);

      // Simulate device unplug
      capturedOnDisconnect?.(mockHidDevice);

      expect(adapter.isConnected()).toBe(false);
    });

    it('onConnect callback is a no-op (does not change state)', async () => {
      // Adapter is not connected
      expect(adapter.isConnected()).toBe(false);

      // Simulate device plug in via WebHID event
      capturedOnConnect?.(mockHidDevice);

      // Should not auto-connect or change any state
      expect(adapter.isConnected()).toBe(false);
      expect(mockOptions.onDeviceEvent).not.toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('connects to device when WebHID is available and device is present', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);

      await adapter.connect();

      expect(mockgetHdPathForLedgerKeyring).toHaveBeenCalled();
      expect(mockGetLedgerPublicKey).toHaveBeenCalledWith("m/44'/60'/0'/0");
      expect(mockNavigatorHid.getDevices).toHaveBeenCalled();
      expect(mockAttemptLedgerTransportCreation).toHaveBeenCalled();
      expect(adapter.isConnected()).toBe(true);
    });

    it('throws error when WebHID is not available', async () => {
      // Create a new adapter with a navigator that doesn't have hid
      const navigatorWithoutHid = {} as Navigator;
      Object.defineProperty(window, 'navigator', {
        value: navigatorWithoutHid,
        writable: true,
        configurable: true,
      });

      const newAdapter = new LedgerAdapter(mockOptions);

      await expect(newAdapter.connect()).rejects.toThrow(HardwareWalletError);

      try {
        await newAdapter.connect();
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.ConnectionTransportMissing,
        );
      }

      expect(newAdapter.isConnected()).toBe(false);

      // Restore navigator
      Object.defineProperty(window, 'navigator', {
        value: { hid: mockNavigatorHid },
        writable: true,
        configurable: true,
      });
    });

    it('throws error when device is not physically connected', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([]);

      await expect(adapter.connect()).rejects.toThrow(HardwareWalletError);

      try {
        await adapter.connect();
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DeviceDisconnected,
        );
      }

      expect(mockNavigatorHid.getDevices).toHaveBeenCalled();
      expect(adapter.isConnected()).toBe(false);
    });

    it('throws error when device is locked before connection', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      const lockError = new HardwareWalletError('Device is locked', {
        code: ErrorCode.AuthenticationDeviceLocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Device is locked',
      });
      mockGetLedgerPublicKey.mockRejectedValue(lockError);

      await expect(adapter.connect()).rejects.toThrow(HardwareWalletError);

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.DeviceLocked,
          error: expect.any(Error),
        }),
      );
      expect(adapter.isConnected()).toBe(false);
      expect(mockAttemptLedgerTransportCreation).not.toHaveBeenCalled();
    });

    it('emits DeviceLocked event when device is locked during connection', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      const transportError = new HardwareWalletError('Device is locked', {
        code: ErrorCode.AuthenticationDeviceLocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Device is locked',
      });
      mockAttemptLedgerTransportCreation.mockRejectedValue(transportError);

      await expect(adapter.connect()).rejects.toThrow(HardwareWalletError);

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.DeviceLocked,
          error: expect.any(Error),
        }),
      );
      expect(adapter.isConnected()).toBe(false);
    });

    it('emits APP_NOT_OPEN event when Ethereum app is not open during connection', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      const transportError = new HardwareWalletError('Ethereum app not open', {
        code: ErrorCode.DeviceStateEthAppClosed,
        severity: Severity.Err,
        category: Category.DeviceState,
        userMessage: 'Ethereum app not open',
      });
      mockAttemptLedgerTransportCreation.mockRejectedValue(transportError);

      await expect(adapter.connect()).rejects.toThrow(HardwareWalletError);

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.AppNotOpen,
          error: expect.any(Error),
        }),
      );
      expect(adapter.isConnected()).toBe(false);
    });

    it('cleans up state when connection fails', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      const transportError = createMockError('Connection failed');
      mockAttemptLedgerTransportCreation.mockRejectedValue(transportError);

      await expect(adapter.connect()).rejects.toThrow();

      expect(adapter.isConnected()).toBe(false);
    });

    it('reconstructs hardware wallet error when connection fails', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      const transportError = createMockError('Unknown error');
      mockAttemptLedgerTransportCreation.mockRejectedValue(transportError);

      await expect(adapter.connect()).rejects.toThrow(HardwareWalletError);

      try {
        await adapter.connect();
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        // Error should be reconstructed from the transport error
        expect((error as HardwareWalletError).code).toBeDefined();
      }
    });

    it('skips connection when already connected', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);

      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);

      // Second call should return immediately without calling transport creation again
      await adapter.connect();

      expect(mockAttemptLedgerTransportCreation).toHaveBeenCalledTimes(1);
    });

    it('waits for pending connection before reconnecting', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      // Simulate slow connection
      let resolveTransport: () => void = () => {
        // no-op
      };
      const slowTransportPromise = new Promise<void>((resolve) => {
        resolveTransport = resolve;
      });
      mockAttemptLedgerTransportCreation.mockReturnValue(slowTransportPromise);

      // Start first connection (will be pending)
      const firstConnect = adapter.connect();

      // Start second connection while first is still in progress (same device)
      const secondConnect = adapter.connect();

      // Resolve the transport
      resolveTransport();

      await firstConnect;
      await secondConnect;

      // Transport creation should be called twice (first connect, then reconnect)
      expect(mockAttemptLedgerTransportCreation).toHaveBeenCalledTimes(2);
    });

    it('waits for pending connection then reconnects', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      // Simulate slow connection
      let resolveTransport: () => void = () => {
        // no-op
      };
      const slowTransportPromise = new Promise<void>((resolve) => {
        resolveTransport = resolve;
      });
      mockAttemptLedgerTransportCreation.mockReturnValueOnce(
        slowTransportPromise,
      );
      mockAttemptLedgerTransportCreation.mockResolvedValueOnce(undefined);

      // Start first connection (will be pending)
      const firstConnect = adapter.connect();

      // Start second connection while first is in progress
      const secondConnect = adapter.connect();

      // Resolve the first transport
      resolveTransport();

      await firstConnect;
      await secondConnect;

      // Transport creation should be called twice (once for each connection attempt)
      expect(mockAttemptLedgerTransportCreation).toHaveBeenCalledTimes(2);
      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('disconnects from device and emits disconnected event', async () => {
      await adapter.disconnect();

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith({
        event: DeviceEvent.Disconnected,
      });
      expect(adapter.isConnected()).toBe(false);
    });

    it('calls onDisconnect callback when disconnect encounters error', async () => {
      // Force an error by making onDeviceEvent throw
      const mockError = createMockError('Disconnect error');
      mockOptions.onDeviceEvent = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      adapter = new LedgerAdapter(mockOptions);

      await adapter.disconnect();

      expect(mockOptions.onDisconnect).toHaveBeenCalledWith(mockError);
    });
  });

  describe('isConnected', () => {
    it('returns false when adapter is not connected', () => {
      const result = adapter.isConnected();

      expect(result).toBe(false);
    });

    it('returns true when adapter is connected', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);

      await adapter.connect();

      const result = adapter.isConnected();

      expect(result).toBe(true);
    });

    it('returns false after disconnect', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      await adapter.disconnect();

      const result = adapter.isConnected();

      expect(result).toBe(false);
    });
  });

  describe('destroy', () => {
    it('cleans up adapter resources', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      adapter.destroy();

      expect(adapter.isConnected()).toBe(false);
    });

    it('resets connection state when called', () => {
      adapter.destroy();

      expect(adapter.isConnected()).toBe(false);
    });

    it('unsubscribes from WebHID events when destroyed', () => {
      adapter.destroy();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('does not emit disconnect events after destroy', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      // Clear previous calls
      (mockOptions.onDeviceEvent as jest.Mock).mockClear();

      // Destroy the adapter
      adapter.destroy();

      // Simulate device unplug after destroy by calling the captured disconnect callback
      capturedOnDisconnect?.(createMockHidDevice(0x2c97) as HIDDevice);

      // Verify no disconnect event was emitted after destroy
      expect(mockOptions.onDeviceEvent).not.toHaveBeenCalled();

      // Also verify unsubscribe was called
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('resets isConnecting state allowing new connections after destroy', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      // Simulate a connection that never completes
      let resolveTransport: () => void = () => {
        // no-op
      };
      const slowTransportPromise = new Promise<void>((resolve) => {
        resolveTransport = resolve;
      });
      mockAttemptLedgerTransportCreation.mockReturnValue(slowTransportPromise);

      // Start connection (will be pending)
      const connectPromise = adapter.connect();

      // Destroy while connecting
      adapter.destroy();

      // Resolve the pending transport to avoid hanging test
      resolveTransport();
      await connectPromise;

      // Reset mock and try new connection - should work
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      expect(adapter.isConnected()).toBe(true);
    });

    it('pendingConnection to null to prevent old finally block from corrupting new connection state', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      // Simulate a slow connection that will be pending
      let resolveFirstTransport: () => void = () => {
        // no-op
      };
      const slowTransportPromise = new Promise<void>((resolve) => {
        resolveFirstTransport = resolve;
      });
      mockAttemptLedgerTransportCreation.mockReturnValueOnce(
        slowTransportPromise,
      );

      // Start first connection (will be pending)
      const firstConnectPromise = adapter.connect();

      // Destroy while first connection is still pending
      // This should nullify pendingConnection to prevent the old Promise's
      // finally block from corrupting state when it eventually settles
      adapter.destroy();

      // Set up second transport that resolves immediately
      mockAttemptLedgerTransportCreation.mockResolvedValueOnce(undefined);

      // Start a new connection before the first one settles
      const secondConnectPromise = adapter.connect();

      // Now resolve the first transport - its finally block should NOT
      // corrupt the second connection's state because destroy() nullified pendingConnection
      resolveFirstTransport();

      // Wait for both connections to settle
      await firstConnectPromise;
      await secondConnectPromise;

      // The second connection should be in a valid connected state
      // If pendingConnection wasn't nullified in destroy(), the first Promise's
      // finally block would have set isConnecting=false and pendingConnection=null,
      // potentially corrupting the second connection's state
      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('ensureDeviceReady', () => {
    it('connects to device when not already connected', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      mockGetAppNameAndVersion.mockResolvedValue({
        appName: 'Ethereum',
        version: '1.0.0',
      });

      await adapter.ensureDeviceReady();

      expect(mockNavigatorHid.getDevices).toHaveBeenCalled();
      expect(mockAttemptLedgerTransportCreation).toHaveBeenCalled();
      expect(mockGetAppNameAndVersion).toHaveBeenCalled();
    });

    it('verifies Ethereum app is open when device is connected', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      mockGetAppNameAndVersion.mockResolvedValue({
        appName: 'Ethereum',
        version: '1.0.0',
      });

      await adapter.ensureDeviceReady();

      expect(mockGetAppNameAndVersion).toHaveBeenCalled();
      expect(mockGetLedgerAppConfiguration).toHaveBeenCalled();
    });

    it('throws error when wrong app is open on device', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      mockGetAppNameAndVersion.mockResolvedValue({
        appName: 'Bitcoin',
        version: '1.0.0',
      });

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.ensureDeviceReady();
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DeviceStateEthAppClosed,
        );
      }
    });

    it('throws error when blind signing is disabled', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      mockGetAppNameAndVersion.mockResolvedValue({
        appName: 'Ethereum',
        version: '1.0.0',
      });
      mockGetLedgerAppConfiguration.mockResolvedValue({
        ...DEFAULT_LEDGER_APP_CONFIGURATION,
        arbitraryDataEnabled: 0,
      });

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.Disconnected,
          error: expect.any(Error),
        }),
      );
    });

    it('emits DeviceLocked event when device is locked during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      const lockError = new HardwareWalletError('Device is locked', {
        code: ErrorCode.AuthenticationDeviceLocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Device is locked',
      });
      mockGetAppNameAndVersion.mockRejectedValue(lockError);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.DeviceLocked,
          error: expect.any(Error),
        }),
      );
    });

    it('emits APP_NOT_OPEN event when Ethereum app is not open during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      const appError = new HardwareWalletError('Ethereum app not open', {
        code: ErrorCode.DeviceStateEthAppClosed,
        severity: Severity.Err,
        category: Category.DeviceState,
        userMessage: 'Ethereum app not open',
      });
      mockGetAppNameAndVersion.mockRejectedValue(appError);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.AppNotOpen,
          error: expect.any(Error),
        }),
      );
    });

    it('emits DISCONNECTED event when device is disconnected during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      const disconnectError = new HardwareWalletError('Device disconnected', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.DeviceState,
        userMessage: 'Device disconnected',
      });
      mockGetAppNameAndVersion.mockRejectedValue(disconnectError);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.Disconnected,
          error: expect.any(Error),
        }),
      );
    });

    it('resets connected state when device is disconnected during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      // Verify adapter is initially connected
      expect(adapter.isConnected()).toBe(true);

      const disconnectError = new HardwareWalletError('Device disconnected', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.DeviceState,
        userMessage: 'Device disconnected',
      });
      mockGetAppNameAndVersion.mockRejectedValue(disconnectError);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      // Verify connection state is reset after disconnect error
      expect(adapter.isConnected()).toBe(false);
    });

    it('resets connected state when connection is closed during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      // Verify adapter is initially connected
      expect(adapter.isConnected()).toBe(true);

      const connectionClosedError = new HardwareWalletError(
        'Connection closed',
        {
          code: ErrorCode.ConnectionClosed,
          severity: Severity.Err,
          category: Category.DeviceState,
          userMessage: 'Connection closed',
        },
      );
      mockGetAppNameAndVersion.mockRejectedValue(connectionClosedError);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      // Verify connection state is reset after connection closed error
      expect(adapter.isConnected()).toBe(false);
    });

    it('does not emit device event for errors without error code during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      const unknownError = createMockError('Unknown error');
      mockGetAppNameAndVersion.mockRejectedValue(unknownError);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.Disconnected,
          error: expect.any(Error),
        }),
      );
    });

    it('emits DISCONNECTED event and resets state for unknown HardwareWalletError codes during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      // Verify adapter is initially connected
      expect(adapter.isConnected()).toBe(true);

      const unknownHwError = new HardwareWalletError('Unknown hardware error', {
        code: ErrorCode.Unknown,
        severity: Severity.Err,
        category: Category.DeviceState,
        userMessage: 'Unknown hardware error',
      });
      mockGetAppNameAndVersion.mockRejectedValue(unknownHwError);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.Disconnected,
          error: expect.any(Error),
        }),
      );

      // Verify connection state is reset after unknown error
      expect(adapter.isConnected()).toBe(false);
    });

    it('throws error when connection fails during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([]);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.ensureDeviceReady();
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DeviceDisconnected,
        );
      }
    });

    it('wraps generic errors as HardwareWalletError during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      const verificationError = createMockError('Verification failed');
      mockGetAppNameAndVersion.mockRejectedValue(verificationError);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.ensureDeviceReady();
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(ErrorCode.Unknown);
      }
    });

    it('preserves ConnectionTransportMissing error from connect() failure', async () => {
      delete (window.navigator as { hid?: unknown }).hid;

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.ensureDeviceReady();
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.ConnectionTransportMissing,
        );
      }
    });

    it('preserves AuthenticationDeviceLocked error from connect() failure', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      const lockError = new HardwareWalletError('Device is locked', {
        code: ErrorCode.AuthenticationDeviceLocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Device is locked',
      });
      mockAttemptLedgerTransportCreation.mockRejectedValue(lockError);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.ensureDeviceReady();
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.AuthenticationDeviceLocked,
        );
      }

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.DeviceLocked,
          error: expect.any(Error),
        }),
      );
    });

    it('preserves DeviceDisconnected error from connect() failure when device not found', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([]);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.ensureDeviceReady();
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DeviceDisconnected,
        );
      }

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.Disconnected,
          error: expect.any(Error),
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('handles getDevices returning devices without Ledger vendor ID', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x1234), // Wrong vendor ID
      ]);

      await expect(adapter.connect()).rejects.toThrow(HardwareWalletError);

      try {
        await adapter.connect();
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DeviceDisconnected,
        );
      }
    });

    it('handles getDevices throwing error', async () => {
      const hidError = createMockError('HID access error');
      mockNavigatorHid.getDevices.mockRejectedValue(hidError);

      // When getDevices throws, checkDeviceConnected catches it and returns false
      // This leads to the device not found error
      await expect(adapter.connect()).rejects.toThrow(HardwareWalletError);

      try {
        await adapter.connect();
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DeviceDisconnected,
        );
      }
    });

    it('emits DeviceLocked event for AuthenticationDeviceBlocked error during connection', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      const transportError = new HardwareWalletError('Device is blocked', {
        code: ErrorCode.AuthenticationDeviceBlocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Device is blocked',
      });
      mockAttemptLedgerTransportCreation.mockRejectedValue(transportError);

      await expect(adapter.connect()).rejects.toThrow(HardwareWalletError);

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.DeviceLocked,
          error: expect.any(Error),
        }),
      );
    });

    it('emits DeviceLocked event for AuthenticationDeviceBlocked error during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect();

      const lockError = new HardwareWalletError('Device is blocked', {
        code: ErrorCode.AuthenticationDeviceBlocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Device is blocked',
      });
      mockGetAppNameAndVersion.mockRejectedValue(lockError);

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.DeviceLocked,
          error: expect.any(Error),
        }),
      );
    });
  });
});
