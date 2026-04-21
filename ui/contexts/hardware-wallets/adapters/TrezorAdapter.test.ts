import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';
import { getTrezorFeatures } from '../../../store/actions';
import { DeviceEvent, type HardwareWalletAdapterOptions } from '../types';
import * as webConnectionUtils from '../webConnectionUtils';
import {
  getMissingCapabilities,
  isTrezorModelOne,
  isTrezorModelUsingTrezorSuite,
} from './trezorUtils';
import { TrezorAdapter } from './TrezorAdapter';

jest.mock('../../../store/actions', () => ({
  getTrezorFeatures: jest.fn(),
}));

jest.mock('../webConnectionUtils', () => ({
  ...jest.requireActual('../webConnectionUtils'),
  getConnectedTrezorDevices: jest.fn(),
  isWebUsbAvailable: jest.fn(),
}));

const mockGetTrezorFeatures = getTrezorFeatures as jest.MockedFunction<
  typeof getTrezorFeatures
>;
const mockGetConnectedTrezorDevices =
  webConnectionUtils.getConnectedTrezorDevices as jest.MockedFunction<
    typeof webConnectionUtils.getConnectedTrezorDevices
  >;
const mockIsWebUsbAvailable =
  webConnectionUtils.isWebUsbAvailable as jest.MockedFunction<
    typeof webConnectionUtils.isWebUsbAvailable
  >;

type TrezorFeaturesPayload = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  session_id: string | null;
  model: string;
  initialized: boolean;
  capabilities: string[];
  unlocked: boolean;
};

const createMockFeaturesResponse = (
  payload: Partial<TrezorFeaturesPayload> = {},
) => ({
  payload: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    session_id: 'session-id',
    model: 'T',
    initialized: true,
    capabilities: [
      'Capability_Bitcoin',
      'Capability_Solana',
      'Capability_Ethereum',
    ],
    unlocked: true,
    ...payload,
  },
});

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
    mockGetTrezorFeatures.mockResolvedValue(createMockFeaturesResponse());

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
      expect(mockGetTrezorFeatures).toHaveBeenCalled();
    });

    it('allows null session for models that use Trezor Suite', async () => {
      mockGetTrezorFeatures.mockResolvedValue(
        createMockFeaturesResponse({
          model: 'safe 7',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          session_id: null,
        }),
      );

      await expect(adapter.ensureDeviceReady()).resolves.toBe(true);
    });

    it('throws AuthenticationDeviceLocked when device is locked', async () => {
      mockGetTrezorFeatures.mockResolvedValue(
        createMockFeaturesResponse({
          unlocked: false,
        }),
      );

      await expect(adapter.ensureDeviceReady()).rejects.toMatchObject({
        code: ErrorCode.AuthenticationDeviceLocked,
      });

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.DeviceLocked,
          error: expect.objectContaining({
            code: ErrorCode.AuthenticationDeviceLocked,
          }),
        }),
      );
    });

    it('throws DeviceNotReady when device is not initialized', async () => {
      mockGetTrezorFeatures.mockResolvedValue(
        createMockFeaturesResponse({
          initialized: false,
        }),
      );

      await expect(adapter.ensureDeviceReady()).rejects.toMatchObject({
        code: ErrorCode.DeviceNotReady,
      });

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.Disconnected,
          error: expect.objectContaining({ code: ErrorCode.DeviceNotReady }),
        }),
      );
      expect(adapter.isConnected()).toBe(false);
    });

    it('throws ConnectionClosed when session is missing for legacy models', async () => {
      mockGetTrezorFeatures.mockResolvedValue(
        createMockFeaturesResponse({
          model: 'T',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          session_id: null,
        }),
      );

      await expect(adapter.ensureDeviceReady()).rejects.toMatchObject({
        code: ErrorCode.ConnectionClosed,
      });
      expect(adapter.isConnected()).toBe(false);
    });

    it('throws DeviceMissingCapability when required capability is missing', async () => {
      mockGetTrezorFeatures.mockResolvedValue(
        createMockFeaturesResponse({
          capabilities: ['Capability_Bitcoin', 'Capability_Ethereum'],
        }),
      );

      await expect(adapter.ensureDeviceReady()).rejects.toMatchObject({
        code: ErrorCode.DeviceMissingCapability,
      });
    });

    it('rejects oversized messages on Model One preflight', async () => {
      mockGetTrezorFeatures.mockResolvedValue(
        createMockFeaturesResponse({
          model: '1',
        }),
      );

      await expect(
        adapter.ensureDeviceReady({ preflightMessageBytes: 1025 }),
      ).rejects.toMatchObject({
        code: ErrorCode.DeviceMissingCapability,
      });
    });

    it('emits Disconnected and resets state for ConnectionClosed errors', async () => {
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);

      const connectionClosedError = new HardwareWalletError(
        'Connection closed',
        {
          code: ErrorCode.ConnectionClosed,
          severity: Severity.Err,
          category: Category.Connection,
          userMessage: 'Connection closed',
        },
      );
      mockGetTrezorFeatures.mockRejectedValue(connectionClosedError);

      await expect(adapter.ensureDeviceReady()).rejects.toBe(
        connectionClosedError,
      );

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith({
        event: DeviceEvent.Disconnected,
        error: connectionClosedError,
      });
      expect(adapter.isConnected()).toBe(false);
    });

    it('wraps unknown errors as HardwareWalletError', async () => {
      mockGetTrezorFeatures.mockRejectedValue(
        new Error('feature fetch failed'),
      );

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(
        HardwareWalletError,
      );
      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.Disconnected,
          error: expect.any(HardwareWalletError),
        }),
      );
    });
  });
});

describe('trezorUtils', () => {
  describe('isTrezorModelUsingTrezorSuite', () => {
    it('returns true for safe 7', () => {
      expect(isTrezorModelUsingTrezorSuite('safe 7')).toBe(true);
    });

    it('returns true for Safe 7 (case insensitive)', () => {
      expect(isTrezorModelUsingTrezorSuite('Safe 7')).toBe(true);
    });

    it('returns false for other models', () => {
      expect(isTrezorModelUsingTrezorSuite('T')).toBe(false);
      expect(isTrezorModelUsingTrezorSuite('1')).toBe(false);
    });
  });

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
