import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { getTrezorFeatures } from '../../../store/actions';
import { DeviceEvent, type HardwareWalletAdapterOptions } from '../types';
import * as webConnectionUtils from '../webConnectionUtils';
import { TrezorAdapter } from './TrezorAdapter';

jest.mock('../../../store/actions', () => ({
  getTrezorFeatures: jest.fn(),
}));

jest.mock('../webConnectionUtils', () => ({
  ...jest.requireActual('../webConnectionUtils'),
  getConnectedTrezorDevices: jest.fn(),
  isWebUsbAvailable: jest.fn(),
  subscribeToWebUsbEvents: jest.fn(),
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
const mockSubscribeToWebUsbEvents =
  webConnectionUtils.subscribeToWebUsbEvents as jest.MockedFunction<
    typeof webConnectionUtils.subscribeToWebUsbEvents
  >;

type TrezorFeaturesPayload = {
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
    session_id: 'session-id',
    model: 'T',
    initialized: true,
    capabilities: ['Capability_Bitcoin', 'Capability_Solana', 'Capability_Ethereum'],
    unlocked: true,
    ...payload,
  },
});

describe('TrezorAdapter', () => {
  let adapter: TrezorAdapter;
  let mockOptions: HardwareWalletAdapterOptions;
  let mockUnsubscribe: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let capturedOnConnect: ((device: USBDevice) => void) | null = null;
  let capturedOnDisconnect: ((device: USBDevice) => void) | null = null;

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
    mockUnsubscribe = jest.fn();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    capturedOnConnect = null;
    capturedOnDisconnect = null;

    mockSubscribeToWebUsbEvents.mockImplementation(
      (_walletType, onConnect, onDisconnect) => {
        capturedOnConnect = onConnect;
        capturedOnDisconnect = onDisconnect;
        return mockUnsubscribe;
      },
    );

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
    it('subscribes to WebUSB events', () => {
      expect(mockSubscribeToWebUsbEvents).toHaveBeenCalledWith(
        'trezor',
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('emits Disconnected event when unplugged while connected', async () => {
      await adapter.connect();
      (mockOptions.onDeviceEvent as jest.Mock).mockClear();

      capturedOnDisconnect?.({} as USBDevice);

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith({
        event: DeviceEvent.Disconnected,
      });
      expect(adapter.isConnected()).toBe(false);
    });

    it('does not emit unplug event when not connected', () => {
      capturedOnDisconnect?.({} as USBDevice);
      expect(mockOptions.onDeviceEvent).not.toHaveBeenCalled();
    });

    it('keeps onConnect callback as no-op', () => {
      capturedOnConnect?.({} as USBDevice);
      expect(adapter.isConnected()).toBe(false);
      expect(mockOptions.onDeviceEvent).not.toHaveBeenCalled();
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
          error: expect.objectContaining({ code: ErrorCode.DeviceDisconnected }),
        }),
      );
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

    it('unsubscribes from WebUSB events on destroy', () => {
      adapter.destroy();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
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

      const connectionClosedError = new HardwareWalletError('Connection closed', {
        code: ErrorCode.ConnectionClosed,
      });
      mockGetTrezorFeatures.mockRejectedValue(connectionClosedError);

      await expect(adapter.ensureDeviceReady()).rejects.toBe(connectionClosedError);

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith({
        event: DeviceEvent.Disconnected,
        error: connectionClosedError,
      });
      expect(adapter.isConnected()).toBe(false);
    });

    it('wraps unknown errors as HardwareWalletError', async () => {
      mockGetTrezorFeatures.mockRejectedValue(new Error('feature fetch failed'));

      await expect(adapter.ensureDeviceReady()).rejects.toThrow(HardwareWalletError);
      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: DeviceEvent.Disconnected,
          error: expect.any(HardwareWalletError),
        }),
      );
    });
  });
});
