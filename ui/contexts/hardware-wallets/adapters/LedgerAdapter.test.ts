import {
  ErrorCode,
  HardwareWalletError,
  Severity,
  Category,
} from '@metamask/hw-wallet-sdk';
import {
  attemptLedgerTransportCreation,
  getAppNameAndVersion,
} from '../../../store/actions';
import { DeviceEvent, type HardwareWalletAdapterOptions } from '../types';
import { LedgerAdapter } from './LedgerAdapter';

jest.mock('../../../store/actions', () => ({
  attemptLedgerTransportCreation: jest.fn(),
  getAppNameAndVersion: jest.fn(),
}));

const mockAttemptLedgerTransportCreation =
  attemptLedgerTransportCreation as jest.MockedFunction<
    typeof attemptLedgerTransportCreation
  >;
const mockGetAppNameAndVersion = getAppNameAndVersion as jest.MockedFunction<
  typeof getAppNameAndVersion
>;

describe('LedgerAdapter', () => {
  let adapter: LedgerAdapter;
  let mockOptions: HardwareWalletAdapterOptions;
  let mockNavigatorHid: {
    getDevices: jest.Mock;
  };

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
    productName: 'Ledger Nano X',
    opened: true,
  });

  const createMockError = (message: string): Error => {
    const error = new Error(message);
    error.name = 'LedgerError';
    return error;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockOptions = createMockOptions();
    mockNavigatorHid = {
      getDevices: jest.fn(),
    };

    Object.defineProperty(window.navigator, 'hid', {
      value: mockNavigatorHid,
      writable: true,
      configurable: true,
    });

    adapter = new LedgerAdapter(mockOptions);
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
    });
  });

  describe('connect', () => {
    const deviceId = 'test-device-id';

    it('connects to device when WebHID is available and device is present', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);

      await adapter.connect(deviceId);

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

      await expect(newAdapter.connect(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await newAdapter.connect(deviceId);
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

      await expect(adapter.connect(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.connect(deviceId);
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DeviceDisconnected,
        );
      }

      expect(mockNavigatorHid.getDevices).toHaveBeenCalled();
      expect(adapter.isConnected()).toBe(false);
    });

    it('emits DEVICE_LOCKED event when device is locked during connection', async () => {
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

      await expect(adapter.connect(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

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

      await expect(adapter.connect(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

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

      await expect(adapter.connect(deviceId)).rejects.toThrow();

      expect(adapter.isConnected()).toBe(false);
    });

    it('reconstructs hardware wallet error when connection fails', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      const transportError = createMockError('Unknown error');
      mockAttemptLedgerTransportCreation.mockRejectedValue(transportError);

      await expect(adapter.connect(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.connect(deviceId);
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

      await adapter.connect(deviceId);
      expect(adapter.isConnected()).toBe(true);

      // Second call should return immediately without calling transport creation again
      await adapter.connect(deviceId);

      expect(mockAttemptLedgerTransportCreation).toHaveBeenCalledTimes(1);
    });

    it('skips connection when connection is already in progress', async () => {
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
      const firstConnect = adapter.connect(deviceId);

      // Start second connection while first is still in progress
      const secondConnect = adapter.connect(deviceId);

      // Resolve the transport
      resolveTransport();

      await firstConnect;
      await secondConnect;

      // Transport creation should only be called once
      expect(mockAttemptLedgerTransportCreation).toHaveBeenCalledTimes(1);
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

      await adapter.connect('test-device-id');

      const result = adapter.isConnected();

      expect(result).toBe(true);
    });

    it('returns false after disconnect', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect('test-device-id');

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
      await adapter.connect('test-device-id');

      adapter.destroy();

      expect(adapter.isConnected()).toBe(false);
    });

    it('resets connection state when called', () => {
      adapter.destroy();

      expect(adapter.isConnected()).toBe(false);
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
      const connectPromise = adapter.connect('test-device-id');

      // Destroy while connecting
      adapter.destroy();

      // Resolve the pending transport to avoid hanging test
      resolveTransport();
      await connectPromise;

      // Reset mock and try new connection - should work
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect('test-device-id');

      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('ensureDeviceReady', () => {
    const deviceId = 'test-device-id';

    it('connects to device when not already connected', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      mockGetAppNameAndVersion.mockResolvedValue({
        appName: 'Ethereum',
        version: '1.0.0',
      });

      await adapter.ensureDeviceReady(deviceId);

      expect(mockNavigatorHid.getDevices).toHaveBeenCalled();
      expect(mockAttemptLedgerTransportCreation).toHaveBeenCalled();
      expect(mockGetAppNameAndVersion).toHaveBeenCalled();
    });

    it('verifies Ethereum app is open when device is connected', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect(deviceId);

      mockGetAppNameAndVersion.mockResolvedValue({
        appName: 'Ethereum',
        version: '1.0.0',
      });

      await adapter.ensureDeviceReady(deviceId);

      expect(mockGetAppNameAndVersion).toHaveBeenCalled();
    });

    it('throws error when wrong app is open on device', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect(deviceId);

      mockGetAppNameAndVersion.mockResolvedValue({
        appName: 'Bitcoin',
        version: '1.0.0',
      });

      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.ensureDeviceReady(deviceId);
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DeviceStateEthAppClosed,
        );
      }
    });

    it('emits DEVICE_LOCKED event when device is locked during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect(deviceId);

      const lockError = new HardwareWalletError('Device is locked', {
        code: ErrorCode.AuthenticationDeviceLocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Device is locked',
      });
      mockGetAppNameAndVersion.mockRejectedValue(lockError);

      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
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
      await adapter.connect(deviceId);

      const appError = new HardwareWalletError('Ethereum app not open', {
        code: ErrorCode.DeviceStateEthAppClosed,
        severity: Severity.Err,
        category: Category.DeviceState,
        userMessage: 'Ethereum app not open',
      });
      mockGetAppNameAndVersion.mockRejectedValue(appError);

      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
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
      await adapter.connect(deviceId);

      const disconnectError = new HardwareWalletError('Device disconnected', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.DeviceState,
        userMessage: 'Device disconnected',
      });
      mockGetAppNameAndVersion.mockRejectedValue(disconnectError);

      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
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
      await adapter.connect(deviceId);

      // Verify adapter is initially connected
      expect(adapter.isConnected()).toBe(true);

      const disconnectError = new HardwareWalletError('Device disconnected', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.DeviceState,
        userMessage: 'Device disconnected',
      });
      mockGetAppNameAndVersion.mockRejectedValue(disconnectError);

      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
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
      await adapter.connect(deviceId);

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

      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
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
      await adapter.connect(deviceId);

      const unknownError = createMockError('Unknown error');
      mockGetAppNameAndVersion.mockRejectedValue(unknownError);

      // When error code cannot be extracted, no device event is emitted
      // and the original error is re-thrown
      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
        'Unknown error',
      );

      // No device event should be emitted for errors without code
      const deviceEventCalls = (mockOptions.onDeviceEvent as jest.Mock).mock
        .calls;
      // Filter out any calls that don't have an error (like successful events)
      const errorEventCalls = deviceEventCalls.filter((call) => call[0]?.error);
      expect(errorEventCalls.length).toBe(0);
    });

    it('emits DISCONNECTED event and resets state for unknown HardwareWalletError codes during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect(deviceId);

      // Verify adapter is initially connected
      expect(adapter.isConnected()).toBe(true);

      const unknownHwError = new HardwareWalletError('Unknown hardware error', {
        code: ErrorCode.Unknown,
        severity: Severity.Err,
        category: Category.DeviceState,
        userMessage: 'Unknown hardware error',
      });
      mockGetAppNameAndVersion.mockRejectedValue(unknownHwError);

      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
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

      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.ensureDeviceReady(deviceId);
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DeviceDisconnected,
        );
      }
    });

    it('re-throws original error when verification fails with generic error', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect(deviceId);

      const verificationError = createMockError('Verification failed');
      mockGetAppNameAndVersion.mockRejectedValue(verificationError);

      // Original error is re-thrown without modification
      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
        'Verification failed',
      );

      try {
        await adapter.ensureDeviceReady(deviceId);
      } catch (error) {
        // Original error is re-thrown, not a HardwareWalletError
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Verification failed');
      }
    });

    it('preserves ConnectionTransportMissing error from connect() failure', async () => {
      delete (window.navigator as { hid?: unknown }).hid;

      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.ensureDeviceReady(deviceId);
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

      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.ensureDeviceReady(deviceId);
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

      await expect(adapter.ensureDeviceReady(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.ensureDeviceReady(deviceId);
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

      await expect(adapter.connect('test-device-id')).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.connect('test-device-id');
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
      await expect(adapter.connect('test-device-id')).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.connect('test-device-id');
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DeviceDisconnected,
        );
      }
    });

    it('emits DEVICE_LOCKED event for AuthenticationDeviceBlocked error during connection', async () => {
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

      await expect(adapter.connect('test-device-id')).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.DeviceLocked,
          error: expect.any(Error),
        }),
      );
    });

    it('emits DEVICE_LOCKED event for AuthenticationDeviceBlocked error during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect('test-device-id');

      const lockError = new HardwareWalletError('Device is blocked', {
        code: ErrorCode.AuthenticationDeviceBlocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'Device is blocked',
      });
      mockGetAppNameAndVersion.mockRejectedValue(lockError);

      await expect(adapter.ensureDeviceReady('test-device-id')).rejects.toThrow(
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
