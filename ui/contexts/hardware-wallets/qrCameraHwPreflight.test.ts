import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import {
  CameraPermissionState,
  QrCameraHwPreflightStatus,
} from './constants';
import { HardwareWalletType } from './types';
import {
  checkCameraPermission,
  redirectToFullscreen,
} from './webConnectionUtils';
import {
  ensureQrCameraReadyForHwFlow,
  isSidePanelCameraPreflightEnvironment,
} from './qrCameraHwPreflight';

jest.mock('../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

jest.mock('./webConnectionUtils', () => ({
  checkCameraPermission: jest.fn(),
  redirectToFullscreen: jest.fn(),
}));

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);
const mockCheckCameraPermission = jest.mocked(checkCameraPermission);
const mockRedirectToFullscreen = jest.mocked(redirectToFullscreen);

describe('isSidePanelCameraPreflightEnvironment', () => {
  it('returns true only for the side panel', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    expect(isSidePanelCameraPreflightEnvironment()).toBe(true);

    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    expect(isSidePanelCameraPreflightEnvironment()).toBe(false);

    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    expect(isSidePanelCameraPreflightEnvironment()).toBe(false);
  });
});

describe('ensureQrCameraReadyForHwFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    mockCheckCameraPermission.mockResolvedValue(
      CameraPermissionState.Granted as PermissionState,
    );
  });

  it('returns ready for non-QR wallets without checking camera', async () => {
    const status = await ensureQrCameraReadyForHwFlow({
      walletType: HardwareWalletType.Ledger,
      targetRoute: '/confirmation/1',
    });

    expect(status).toBe(QrCameraHwPreflightStatus.Ready);
    expect(mockCheckCameraPermission).not.toHaveBeenCalled();
    expect(mockRedirectToFullscreen).not.toHaveBeenCalled();
  });

  it('returns ready in popup without checking camera', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);

    const status = await ensureQrCameraReadyForHwFlow({
      walletType: HardwareWalletType.Qr,
      targetRoute: '/cross-chain/swaps/prepare-bridge-page',
    });

    expect(status).toBe(QrCameraHwPreflightStatus.Ready);
    expect(mockCheckCameraPermission).not.toHaveBeenCalled();
    expect(mockRedirectToFullscreen).not.toHaveBeenCalled();
  });

  it('returns ready in fullscreen without checking camera', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);

    const status = await ensureQrCameraReadyForHwFlow({
      walletType: HardwareWalletType.Qr,
      targetRoute: '/confirmation/1',
    });

    expect(status).toBe(QrCameraHwPreflightStatus.Ready);
    expect(mockCheckCameraPermission).not.toHaveBeenCalled();
    expect(mockRedirectToFullscreen).not.toHaveBeenCalled();
  });

  it('returns ready when camera permission is already granted in the side panel', async () => {
    const status = await ensureQrCameraReadyForHwFlow({
      walletType: HardwareWalletType.Qr,
      targetRoute: '/confirmation/1',
    });

    expect(status).toBe(QrCameraHwPreflightStatus.Ready);
    expect(mockRedirectToFullscreen).not.toHaveBeenCalled();
  });

  it('opens fullscreen and returns redirected when side-panel permission is prompt', async () => {
    mockCheckCameraPermission.mockResolvedValue(
      CameraPermissionState.Prompt as PermissionState,
    );

    const status = await ensureQrCameraReadyForHwFlow({
      walletType: HardwareWalletType.Qr,
      targetRoute: '/cross-chain/swaps/prepare-bridge-page',
      queryString: 'from=eip155%3A1%2Fslip44%3A60',
    });

    expect(status).toBe(QrCameraHwPreflightStatus.Redirected);
    expect(mockRedirectToFullscreen).toHaveBeenCalledWith({
      targetRoute: '/cross-chain/swaps/prepare-bridge-page',
      queryString: 'from=eip155%3A1%2Fslip44%3A60',
    });
  });

  it('opens fullscreen and returns redirected when side-panel permission is denied', async () => {
    mockCheckCameraPermission.mockResolvedValue(
      CameraPermissionState.Denied as PermissionState,
    );

    const status = await ensureQrCameraReadyForHwFlow({
      walletType: HardwareWalletType.Qr,
      targetRoute: '/confirmation/tx-1',
    });

    expect(status).toBe(QrCameraHwPreflightStatus.Redirected);
    expect(mockRedirectToFullscreen).toHaveBeenCalledWith({
      targetRoute: '/confirmation/tx-1',
      queryString: undefined,
    });
  });

  it('opens fullscreen when the side-panel permission probe throws', async () => {
    mockCheckCameraPermission.mockRejectedValue(new Error('unsupported'));

    const status = await ensureQrCameraReadyForHwFlow({
      walletType: HardwareWalletType.Qr,
      targetRoute: '/confirmation/tx-1',
      queryString: null,
    });

    expect(status).toBe(QrCameraHwPreflightStatus.Redirected);
    expect(mockRedirectToFullscreen).toHaveBeenCalledWith({
      targetRoute: '/confirmation/tx-1',
      queryString: null,
    });
  });
});
