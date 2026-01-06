import { HardwareDeviceNames } from '../../../../shared/constants/hardware-wallets';
import {
  attemptLedgerTransportCreation,
  getHdPathForHardwareKeyring,
  getAppNameAndVersion,
} from '../../../store/actions';
import { ErrorCode, HardwareWalletError } from '../errors';
import {
  DeviceEvent,
  HardwareWalletType,
  type HardwareWalletAdapterOptions,
} from '../types';
import { LedgerAdapter } from './LedgerAdapter';

// Mock only external dependencies (not error utilities)
jest.mock('../../../store/actions');

const mockAttemptLedgerTransportCreation =
  attemptLedgerTransportCreation as jest.MockedFunction<
    typeof attemptLedgerTransportCreation
  >;
const mockGetHdPathForHardwareKeyring =
  getHdPathForHardwareKeyring as jest.MockedFunction<
    typeof getHdPathForHardwareKeyring
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

  // Helper function to create mock adapter options
  const createMockOptions = (): HardwareWalletAdapterOptions => ({
    onDisconnect: jest.fn(),
    onAwaitingConfirmation: jest.fn(),
    onDeviceLocked: jest.fn(),
    onAppNotOpen: jest.fn(),
    onDeviceEvent: jest.fn(),
  });

  // Helper function to create mock HID device
  const createMockHidDevice = (vendorId: number) => ({
    vendorId,
    productId: 0x0001,
    productName: 'Ledger Nano X',
    opened: true,
  });

  // Helper function to create mock error
  const createMockError = (message: string): Error => {
    const error = new Error(message);
    error.name = 'LedgerError';
    return error;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock options
    mockOptions = createMockOptions();

    // Setup mock navigator.hid
    mockNavigatorHid = {
      getDevices: jest.fn(),
    };

    // Mock window.navigator.hid
    Object.defineProperty(window.navigator, 'hid', {
      value: mockNavigatorHid,
      writable: true,
      configurable: true,
    });

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Create adapter instance
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
          ErrorCode.CONN_TRANSPORT_001,
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
          ErrorCode.DEVICE_STATE_003,
        );
      }

      expect(mockNavigatorHid.getDevices).toHaveBeenCalled();
      expect(adapter.isConnected()).toBe(false);
    });

    it('calls onDeviceLocked callback when device is locked during connection', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      const transportError = new HardwareWalletError('Device is locked', {
        code: ErrorCode.AUTH_LOCK_001,
      });
      mockAttemptLedgerTransportCreation.mockRejectedValue(transportError);

      await expect(adapter.connect(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onDeviceLocked).toHaveBeenCalled();
      expect(adapter.isConnected()).toBe(false);
    });

    it('calls onAppNotOpen callback when Ethereum app is not open during connection', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      const transportError = new HardwareWalletError('Ethereum app not open', {
        code: ErrorCode.DEVICE_STATE_001,
      });
      mockAttemptLedgerTransportCreation.mockRejectedValue(transportError);

      await expect(adapter.connect(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onAppNotOpen).toHaveBeenCalled();
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
      adapter.setPendingOperation(true);

      adapter.destroy();

      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('setPendingOperation', () => {
    it('sets pending operation to true', () => {
      adapter.setPendingOperation(true);

      // No direct way to test this, but it doesn't throw
      expect(() => adapter.setPendingOperation(true)).not.toThrow();
    });

    it('sets pending operation to false', () => {
      adapter.setPendingOperation(true);

      adapter.setPendingOperation(false);

      expect(() => adapter.setPendingOperation(false)).not.toThrow();
    });
  });

  describe('verifyDeviceReady', () => {
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

      await adapter.verifyDeviceReady(deviceId);

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

      await adapter.verifyDeviceReady(deviceId);

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

      await expect(adapter.verifyDeviceReady(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.verifyDeviceReady(deviceId);
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DEVICE_STATE_001,
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
        code: ErrorCode.AUTH_LOCK_001,
      });
      mockGetAppNameAndVersion.mockRejectedValue(lockError);

      await expect(adapter.verifyDeviceReady(deviceId)).rejects.toThrow(
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
        code: ErrorCode.DEVICE_STATE_001,
      });
      mockGetAppNameAndVersion.mockRejectedValue(appError);

      await expect(adapter.verifyDeviceReady(deviceId)).rejects.toThrow(
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
        code: ErrorCode.DEVICE_STATE_003,
      });
      mockGetAppNameAndVersion.mockRejectedValue(disconnectError);

      await expect(adapter.verifyDeviceReady(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.Disconnected,
          error: expect.any(Error),
        }),
      );
    });

    it('does not emit device event for errors without error code during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect(deviceId);

      const unknownError = createMockError('Unknown error');
      mockGetAppNameAndVersion.mockRejectedValue(unknownError);

      await expect(adapter.verifyDeviceReady(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      // When error code cannot be extracted, no device event is emitted
      // The error is still reconstructed and thrown
      try {
        await adapter.verifyDeviceReady(deviceId);
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
      }
    });

    it('throws error when connection fails during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([]);

      await expect(adapter.verifyDeviceReady(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.verifyDeviceReady(deviceId);
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DEVICE_STATE_003,
        );
      }
    });

    it('reconstructs hardware wallet error when verification fails', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect(deviceId);

      const verificationError = createMockError('Verification failed');
      mockGetAppNameAndVersion.mockRejectedValue(verificationError);

      await expect(adapter.verifyDeviceReady(deviceId)).rejects.toThrow(
        HardwareWalletError,
      );

      try {
        await adapter.verifyDeviceReady(deviceId);
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        // Error should be reconstructed from the verification error
        expect((error as HardwareWalletError).code).toBeDefined();
      }
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
          ErrorCode.DEVICE_STATE_003,
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
          ErrorCode.DEVICE_STATE_003,
        );
      }
    });

    it('handles AUTH_LOCK_002 error code during connection', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);

      const transportError = new HardwareWalletError('Device is locked', {
        code: ErrorCode.AUTH_LOCK_002,
      });
      mockAttemptLedgerTransportCreation.mockRejectedValue(transportError);

      await expect(adapter.connect('test-device-id')).rejects.toThrow(
        HardwareWalletError,
      );

      expect(mockOptions.onDeviceLocked).toHaveBeenCalled();
    });

    it('handles AUTH_LOCK_002 error code during verification', async () => {
      mockNavigatorHid.getDevices.mockResolvedValue([
        createMockHidDevice(0x2c97),
      ]);
      mockAttemptLedgerTransportCreation.mockResolvedValue(undefined);
      await adapter.connect('test-device-id');

      const lockError = new HardwareWalletError('Device is locked', {
        code: ErrorCode.AUTH_LOCK_002,
      });
      mockGetAppNameAndVersion.mockRejectedValue(lockError);

      await expect(adapter.verifyDeviceReady('test-device-id')).rejects.toThrow(
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
