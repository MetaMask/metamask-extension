import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { isFirefoxBrowser } from '../../../../shared/lib/browser-runtime.utils';
import { CameraPermissionState } from '../constants';
import { DeviceEvent, type HardwareWalletAdapterOptions } from '../types';
import * as webConnectionUtils from '../webConnectionUtils';
import { QrAdapter } from './QrAdapter';

jest.mock('../../../../shared/lib/browser-runtime.utils', () => ({
  ...jest.requireActual<
    typeof import('../../../../shared/lib/browser-runtime.utils')
  >('../../../../shared/lib/browser-runtime.utils'),
  isFirefoxBrowser: jest.fn(() => false),
}));

jest.mock('../webConnectionUtils', () => ({
  ...jest.requireActual('../webConnectionUtils'),
  checkCameraPermission: jest.fn(),
  openCameraVideoStream: jest.fn(),
  stopMediaStreamTracks: jest.fn(),
}));

const mockCheckCameraPermission =
  webConnectionUtils.checkCameraPermission as jest.MockedFunction<
    typeof webConnectionUtils.checkCameraPermission
  >;
const mockOpenCameraVideoStream =
  webConnectionUtils.openCameraVideoStream as jest.MockedFunction<
    typeof webConnectionUtils.openCameraVideoStream
  >;
const mockStopMediaStreamTracks =
  webConnectionUtils.stopMediaStreamTracks as jest.MockedFunction<
    typeof webConnectionUtils.stopMediaStreamTracks
  >;

const mockIsFirefoxBrowser = jest.mocked(isFirefoxBrowser);

describe('QrAdapter', () => {
  let adapter: QrAdapter;
  let mockOptions: HardwareWalletAdapterOptions;

  const mockStream = {
    getTracks: () => [{ stop: jest.fn() }],
  };

  const createMockOptions = (): HardwareWalletAdapterOptions => ({
    onDisconnect: jest.fn(),
    onAwaitingConfirmation: jest.fn(),
    onDeviceLocked: jest.fn(),
    onAppNotOpen: jest.fn(),
    onDeviceEvent: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFirefoxBrowser.mockReturnValue(false);
    mockOptions = createMockOptions();
    adapter = new QrAdapter(mockOptions);
    mockOpenCameraVideoStream.mockResolvedValue(
      mockStream as unknown as MediaStream,
    );
    mockStopMediaStreamTracks.mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('destroy clears connected state', async () => {
    await adapter.connect();
    adapter.destroy();
    expect(adapter.isConnected()).toBe(false);
  });

  it('ensureDeviceReady returns true immediately when permission is already granted without opening getUserMedia', async () => {
    mockCheckCameraPermission.mockResolvedValue(CameraPermissionState.Granted);

    await expect(adapter.ensureDeviceReady()).resolves.toBe(true);

    expect(mockOpenCameraVideoStream).not.toHaveBeenCalled();
    expect(mockStopMediaStreamTracks).not.toHaveBeenCalled();
  });

  it('ensureDeviceReady does not call connect again when already connected', async () => {
    mockCheckCameraPermission.mockResolvedValue(CameraPermissionState.Granted);
    await adapter.connect();
    const connectSpy = jest.spyOn(adapter, 'connect');

    await expect(adapter.ensureDeviceReady()).resolves.toBe(true);

    expect(connectSpy).not.toHaveBeenCalled();
    connectSpy.mockRestore();
  });

  it('ensureDeviceReady throws PermissionCameraDenied when permission query is denied without calling getUserMedia', async () => {
    mockCheckCameraPermission.mockResolvedValue(CameraPermissionState.Denied);

    await expect(adapter.ensureDeviceReady()).rejects.toThrow(
      HardwareWalletError,
    );

    expect(mockOpenCameraVideoStream).not.toHaveBeenCalled();
    expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: DeviceEvent.ConnectionFailed,
        error: expect.objectContaining({
          code: ErrorCode.PermissionCameraDenied,
        }),
      }),
    );
  });

  it('ensureDeviceReady returns true when permission is prompt and getUserMedia succeeds', async () => {
    mockCheckCameraPermission.mockResolvedValue(CameraPermissionState.Prompt);

    await expect(adapter.ensureDeviceReady()).resolves.toBe(true);

    expect(mockOpenCameraVideoStream).toHaveBeenCalledTimes(1);
  });

  it('ensureDeviceReady throws PermissionCameraPromptDismissed when getUserMedia fails with NotAllowedError and permission stays prompt (Chromium)', async () => {
    mockCheckCameraPermission.mockResolvedValue(CameraPermissionState.Prompt);
    const notAllowed = new Error('denied');
    notAllowed.name = 'NotAllowedError';
    mockOpenCameraVideoStream.mockRejectedValueOnce(notAllowed);

    await expect(adapter.ensureDeviceReady()).rejects.toThrow(
      HardwareWalletError,
    );

    expect(mockCheckCameraPermission).toHaveBeenCalledTimes(2);
    expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.PermissionCameraPromptDismissed,
        }),
      }),
    );
  });

  it('ensureDeviceReady throws PermissionCameraPromptDismissed when getUserMedia fails with NotAllowedError and follow-up permission query throws', async () => {
    mockCheckCameraPermission
      .mockResolvedValueOnce(CameraPermissionState.Prompt)
      .mockRejectedValueOnce(new Error('permissions.query failed'));
    const notAllowed = new Error('denied');
    notAllowed.name = 'NotAllowedError';
    mockOpenCameraVideoStream.mockRejectedValueOnce(notAllowed);

    await expect(adapter.ensureDeviceReady()).rejects.toThrow(
      HardwareWalletError,
    );

    expect(mockCheckCameraPermission).toHaveBeenCalledTimes(2);
    expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.PermissionCameraPromptDismissed,
        }),
      }),
    );
  });

  it('ensureDeviceReady throws PermissionCameraPromptDismissed when getUserMedia fails with NotAllowedError and permission re-query is granted (Chromium)', async () => {
    mockCheckCameraPermission
      .mockResolvedValueOnce(CameraPermissionState.Prompt)
      .mockResolvedValueOnce(CameraPermissionState.Granted);
    const notAllowed = new Error('denied');
    notAllowed.name = 'NotAllowedError';
    mockOpenCameraVideoStream.mockRejectedValueOnce(notAllowed);

    await expect(adapter.ensureDeviceReady()).rejects.toThrow(
      HardwareWalletError,
    );

    expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.PermissionCameraPromptDismissed,
        }),
      }),
    );
  });

  it('ensureDeviceReady throws PermissionCameraDenied when getUserMedia fails with NotAllowedError and permission stays prompt on Firefox', async () => {
    mockIsFirefoxBrowser.mockReturnValue(true);
    mockCheckCameraPermission.mockResolvedValue(CameraPermissionState.Prompt);
    const notAllowed = new Error('denied');
    notAllowed.name = 'NotAllowedError';
    mockOpenCameraVideoStream.mockRejectedValueOnce(notAllowed);

    await expect(adapter.ensureDeviceReady()).rejects.toThrow(
      HardwareWalletError,
    );

    expect(mockCheckCameraPermission).toHaveBeenCalledTimes(2);
    expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.PermissionCameraDenied,
        }),
      }),
    );
  });

  it('ensureDeviceReady throws PermissionCameraDenied when getUserMedia fails with NotAllowedError and permission becomes denied', async () => {
    mockCheckCameraPermission
      .mockResolvedValueOnce(CameraPermissionState.Prompt)
      .mockResolvedValueOnce(CameraPermissionState.Denied);
    const notAllowed = new Error('denied');
    notAllowed.name = 'NotAllowedError';
    mockOpenCameraVideoStream.mockRejectedValueOnce(notAllowed);

    await expect(adapter.ensureDeviceReady()).rejects.toThrow(
      HardwareWalletError,
    );

    expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.PermissionCameraDenied,
        }),
      }),
    );
  });

  it('ensureDeviceReady maps non-NotAllowed errors from openCameraVideoStream to hardware wallet errors', async () => {
    mockCheckCameraPermission.mockResolvedValue(CameraPermissionState.Prompt);
    mockOpenCameraVideoStream.mockRejectedValueOnce(
      new Error('Camera hardware missing'),
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

  it('maps unexpected errors from checkCameraPermission to hardware wallet errors and emits device event', async () => {
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
