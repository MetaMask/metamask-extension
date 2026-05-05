import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { DeviceEvent, type HardwareWalletAdapterOptions } from '../types';
import * as webConnectionUtils from '../webConnectionUtils';
import { getMissingCapabilities, isTrezorModelOne } from './trezorUtils';
import { TrezorAdapter } from './TrezorAdapter';

jest.mock('../webConnectionUtils', () => ({
  ...jest.requireActual('../webConnectionUtils'),
  getConnectedTrezorDevices: jest.fn(),
  isWebUsbAvailable: jest.fn(),
}));

const mockGetConnectedTrezorDevices =
  webConnectionUtils.getConnectedTrezorDevices as jest.MockedFunction<
    typeof webConnectionUtils.getConnectedTrezorDevices
  >;
const mockIsWebUsbAvailable =
  webConnectionUtils.isWebUsbAvailable as jest.MockedFunction<
    typeof webConnectionUtils.isWebUsbAvailable
  >;

describe('TrezorAdapter', () => {
  let adapter: TrezorAdapter;
  let mockOptions: HardwareWalletAdapterOptions;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  const createMockOptions = (): HardwareWalletAdapterOptions => ({
    onDisconnect: jest.fn(),
    onAwaitingConfirmation: jest.fn(),
    onDeviceLocked: jest.fn(),
    onAppNotOpen: jest.fn(),
    onDeviceEvent: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockOptions = createMockOptions();
    consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockIsWebUsbAvailable.mockReturnValue(true);
    mockGetConnectedTrezorDevices.mockResolvedValue([{} as USBDevice]);

    adapter = new TrezorAdapter(mockOptions);
  });

  afterEach(() => {
    adapter.destroy();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.resetAllMocks();
  });

  describe('constructor and events', () => {
    it('initializes disconnected state', () => {
      expect(adapter.isConnected()).toBe(false);
    });

    it('does not subscribe to WebUSB events in the adapter', () => {
      const originalUsb = navigator.usb;
      const addEventListener = jest.fn();
      const removeEventListener = jest.fn();

      Object.defineProperty(navigator, 'usb', {
        configurable: true,
        value: {
          ...originalUsb,
          addEventListener,
          removeEventListener,
        },
      });

      const testAdapter = new TrezorAdapter(mockOptions);

      expect(addEventListener).not.toHaveBeenCalled();

      testAdapter.destroy();
      Object.defineProperty(navigator, 'usb', {
        configurable: true,
        value: originalUsb,
      });
    });
  });

  describe('connect', () => {
    it('connects when WebUSB is available and device is present', async () => {
      await adapter.connect();

      expect(mockIsWebUsbAvailable).toHaveBeenCalled();
      expect(mockGetConnectedTrezorDevices).toHaveBeenCalled();
      expect(adapter.isConnected()).toBe(true);
    });

    it('throws ConnectionTransportMissing when WebUSB is unavailable', async () => {
      mockIsWebUsbAvailable.mockReturnValue(false);

      await expect(adapter.connect()).rejects.toThrow(HardwareWalletError);
      await expect(adapter.connect()).rejects.toMatchObject({
        code: ErrorCode.ConnectionTransportMissing,
      });

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.ConnectionFailed,
          error: expect.objectContaining({
            code: ErrorCode.ConnectionTransportMissing,
          }),
        }),
      );
      expect(adapter.isConnected()).toBe(false);
    });

    it('throws DeviceDisconnected when no device is detected', async () => {
      mockGetConnectedTrezorDevices.mockResolvedValue([]);

      await expect(adapter.connect()).rejects.toMatchObject({
        code: ErrorCode.DeviceDisconnected,
      });

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.Disconnected,
          error: expect.objectContaining({
            code: ErrorCode.DeviceDisconnected,
          }),
        }),
      );
      expect(adapter.isConnected()).toBe(false);
    });

    it('converts unexpected errors during device check', async () => {
      mockGetConnectedTrezorDevices.mockRejectedValue(
        new Error('USB access denied'),
      );

      await expect(adapter.connect()).rejects.toThrow(HardwareWalletError);
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('disconnect and destroy', () => {
    it('disconnects and emits Disconnected event', async () => {
      await adapter.connect();
      (mockOptions.onDeviceEvent as jest.Mock).mockClear();

      await adapter.disconnect();

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith({
        event: DeviceEvent.Disconnected,
      });
      expect(adapter.isConnected()).toBe(false);
    });

    it('resets connected state on destroy', () => {
      adapter.destroy();
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('ensureDeviceReady', () => {
    it('connects first when not connected and returns true when ready', async () => {
      const result = await adapter.ensureDeviceReady();

      expect(result).toBe(true);
      expect(adapter.isConnected()).toBe(true);
      expect(mockGetConnectedTrezorDevices).toHaveBeenCalled();
    });

    it('returns true without reconnecting when already connected', async () => {
      await adapter.connect();
      mockGetConnectedTrezorDevices.mockClear();

      const result = await adapter.ensureDeviceReady();

      expect(result).toBe(true);
      expect(mockGetConnectedTrezorDevices).not.toHaveBeenCalled();
    });
  });

  describe('validateCapabilities', () => {
    it('throws DeviceMissingCapability when a required capability is missing', () => {
      expect(() =>
        adapter.validateCapabilities(
          ['Capability_Bitcoin', 'Capability_Ethereum'],
          'T',
        ),
      ).toThrow(HardwareWalletError);

      expect(() =>
        adapter.validateCapabilities(
          ['Capability_Bitcoin', 'Capability_Ethereum'],
          'T',
        ),
      ).toThrow(
        expect.objectContaining({
          code: ErrorCode.DeviceMissingCapability,
          metadata: expect.objectContaining({
            missingCapabilities: ['Capability_Solana'],
          }),
        }),
      );
    });

    it('allows Model One when only Solana capability is missing', () => {
      expect(() =>
        adapter.validateCapabilities(
          ['Capability_Bitcoin', 'Capability_Ethereum'],
          'Trezor Model One',
        ),
      ).not.toThrow();
    });

    it('throws DeviceMissingCapability when Model One is missing a supported capability', () => {
      expect(() =>
        adapter.validateCapabilities(['Capability_Bitcoin'], 'T1B1'),
      ).toThrow(
        expect.objectContaining({
          code: ErrorCode.DeviceMissingCapability,
          metadata: expect.objectContaining({
            missingCapabilities: ['Capability_Ethereum'],
          }),
        }),
      );
    });

    it('includes the raw capabilities in missing capability error metadata', () => {
      expect(() =>
        adapter.validateCapabilities('Capability_Bitcoin', 'T'),
      ).toThrow(
        expect.objectContaining({
          metadata: expect.objectContaining({
            capabilities: 'Capability_Bitcoin',
          }),
        }),
      );
    });

    it('does not throw when all required capabilities are present', () => {
      expect(() =>
        adapter.validateCapabilities(
          ['Capability_Bitcoin', 'Capability_Solana', 'Capability_Ethereum'],
          'T',
        ),
      ).not.toThrow();
    });
  });
});

describe('trezorUtils', () => {
  describe('getMissingCapabilities', () => {
    it('returns empty array when all capabilities are present', () => {
      expect(
        getMissingCapabilities([
          'Capability_Bitcoin',
          'Capability_Solana',
          'Capability_Ethereum',
        ]),
      ).toEqual([]);
    });

    it('returns missing capabilities', () => {
      expect(getMissingCapabilities(['Capability_Bitcoin'])).toEqual([
        'Capability_Solana',
        'Capability_Ethereum',
      ]);
    });

    it('returns all capabilities when input is empty', () => {
      expect(getMissingCapabilities([])).toEqual([
        'Capability_Bitcoin',
        'Capability_Solana',
        'Capability_Ethereum',
      ]);
    });

    it('handles non-array input', () => {
      expect(getMissingCapabilities(null)).toEqual([
        'Capability_Bitcoin',
        'Capability_Solana',
        'Capability_Ethereum',
      ]);
    });

    it('filters out non-string entries', () => {
      expect(
        getMissingCapabilities([
          'Capability_Bitcoin',
          123,
          'Capability_Ethereum',
        ]),
      ).toEqual(['Capability_Solana']);
    });
  });

  describe('isTrezorModelOne', () => {
    it('returns true for model "1"', () => {
      expect(isTrezorModelOne('1')).toBe(true);
    });

    it('returns true for model "T1B1"', () => {
      expect(isTrezorModelOne('T1B1')).toBe(true);
    });

    it('returns true for model containing "model one"', () => {
      expect(isTrezorModelOne('Trezor Model One')).toBe(true);
    });

    it('returns false for other models', () => {
      expect(isTrezorModelOne('T')).toBe(false);
      expect(isTrezorModelOne('safe 7')).toBe(false);
    });

    it('returns false for non-string input', () => {
      expect(isTrezorModelOne(123)).toBe(false);
      expect(isTrezorModelOne(null)).toBe(false);
      expect(isTrezorModelOne(undefined)).toBe(false);
    });
  });
});
