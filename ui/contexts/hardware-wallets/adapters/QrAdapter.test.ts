import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { CameraPermissionState } from '../constants';
import { DeviceEvent, type HardwareWalletAdapterOptions } from '../types';
import * as webConnectionUtils from '../webConnectionUtils';
import { QrAdapter } from './QrAdapter';

jest.mock('../webConnectionUtils', () => ({
  ...jest.requireActual('../webConnectionUtils'),
  checkCameraPermission: jest.fn(),
}));

const mockCheckCameraPermission =
  webConnectionUtils.checkCameraPermission as jest.MockedFunction<
    typeof webConnectionUtils.checkCameraPermission
  >;

describe('QrAdapter', () => {
  let adapter: QrAdapter;
  let mockOptions: HardwareWalletAdapterOptions;

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
    adapter = new QrAdapter(mockOptions);
  });

  afterEach(() => {
    jest.resetAllMocks();
    adapter.destroy();
  });

  it('connect marks adapter as connected', async () => {
    await adapter.connect();
    expect(adapter.isConnected()).toBe(true);
  });

  it('disconnect emits disconnected event', async () => {
    await adapter.connect();
    await adapter.disconnect();

    expect(adapter.isConnected()).toBe(false);
    expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith({
      event: DeviceEvent.Disconnected,
    });
  });

  it('disconnect calls onDisconnect when onDeviceEvent throws', async () => {
    await adapter.connect();
    const handlerError = new Error('onDeviceEvent failed');
    jest.mocked(mockOptions.onDeviceEvent).mockImplementation(() => {
      throw handlerError;
    });

    await adapter.disconnect();

    expect(mockOptions.onDisconnect).toHaveBeenCalledWith(handlerError);
  });

  it('ensureDeviceReady returns true when camera permission is granted', async () => {
    mockCheckCameraPermission.mockResolvedValue(CameraPermissionState.Granted);
    await expect(adapter.ensureDeviceReady()).resolves.toBe(true);
  });

  it('ensureDeviceReady does not call connect again when already connected', async () => {
    mockCheckCameraPermission.mockResolvedValue(CameraPermissionState.Granted);
    await adapter.connect();
    const connectSpy = jest.spyOn(adapter, 'connect');

    await expect(adapter.ensureDeviceReady()).resolves.toBe(true);

    expect(connectSpy).not.toHaveBeenCalled();
    connectSpy.mockRestore();
  });

  it('ensureDeviceReady throws PermissionCameraDenied when camera permission is denied', async () => {
    mockCheckCameraPermission.mockResolvedValue(CameraPermissionState.Denied);

    await expect(adapter.ensureDeviceReady()).rejects.toThrow(
      HardwareWalletError,
    );

    expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: DeviceEvent.ConnectionFailed,
        error: expect.objectContaining({
          code: ErrorCode.PermissionCameraDenied,
        }),
      }),
    );
  });

  it('ensureDeviceReady throws PermissionCameraPromptDismissed when camera permission is prompt', async () => {
    mockCheckCameraPermission.mockResolvedValue(CameraPermissionState.Prompt);

    await expect(adapter.ensureDeviceReady()).rejects.toThrow(
      HardwareWalletError,
    );

    expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: DeviceEvent.ConnectionFailed,
        error: expect.objectContaining({
          code: ErrorCode.PermissionCameraPromptDismissed,
        }),
      }),
    );
  });

  it('maps unexpected errors to hardware wallet errors and emits device event', async () => {
    mockCheckCameraPermission.mockRejectedValue(
      new Error('Unable to read camera permission'),
    );

    await expect(adapter.ensureDeviceReady()).rejects.toThrow(
      HardwareWalletError,
    );

    expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: DeviceEvent.ConnectionFailed,
        error: expect.objectContaining({
          code: ErrorCode.Unknown,
        }),
      }),
    );
  });
});
