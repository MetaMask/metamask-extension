import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import WebcamUtils from '../../helpers/utils/webcam-utils';
import { QrCameraHwPreflightStatus } from './constants';
import { HardwareWalletType } from './types';
import { redirectToFullscreen } from './webConnectionUtils';
import {
  ensureQrCameraReadyForHwFlow,
  isSidePanelCameraPreflightEnvironment,
} from './qrCameraHwPreflight';

jest.mock('../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../helpers/utils/webcam-utils', () => ({
  __esModule: true,
  default: {
    checkStatus: jest.fn(),
  },
}));

jest.mock('./webConnectionUtils', () => ({
  isRestrictedCameraEnvironment: jest.fn(),
  redirectToFullscreen: jest.fn(),
}));

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);
const mockCheckStatus = jest.mocked(WebcamUtils.checkStatus);
const mockRedirectToFullscreen = jest.mocked(redirectToFullscreen);

// isSidePanelCameraPreflightEnvironment delegates to isRestrictedCameraEnvironment
// which we need to behave like the real implementation for these unit tests.
const {
  isRestrictedCameraEnvironment: mockIsRestrictedCameraEnvironment,
} = jest.requireMock('./webConnectionUtils') as {
  isRestrictedCameraEnvironment: jest.Mock;
};

describe('isSidePanelCameraPreflightEnvironment', () => {
  beforeEach(() => {
    mockIsRestrictedCameraEnvironment.mockImplementation(() => {
      const environmentType = mockGetEnvironmentType();
      return (
        environmentType === ENVIRONMENT_TYPE_SIDEPANEL ||
        environmentType === ENVIRONMENT_TYPE_POPUP
      );
    });
  });

  it('returns true for popup and side panel', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    expect(isSidePanelCameraPreflightEnvironment()).toBe(true);

    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    expect(isSidePanelCameraPreflightEnvironment()).toBe(true);

    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    expect(isSidePanelCameraPreflightEnvironment()).toBe(false);
  });
});

describe('ensureQrCameraReadyForHwFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    mockCheckStatus.mockResolvedValue({
      environmentReady: true,
      permissions: true,
    });
  });

  it('returns ready for non-QR wallets without checking camera', async () => {
    const status = await ensureQrCameraReadyForHwFlow({
      walletType: HardwareWalletType.Ledger,
      targetRoute: '/confirmation/1',
    });

    expect(status).toBe(QrCameraHwPreflightStatus.Ready);
    expect(mockCheckStatus).not.toHaveBeenCalled();
    expect(mockRedirectToFullscreen).not.toHaveBeenCalled();
  });

  it('returns ready in fullscreen without checking camera', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);

    const status = await ensureQrCameraReadyForHwFlow({
      walletType: HardwareWalletType.Qr,
      targetRoute: '/confirmation/1',
    });

    expect(status).toBe(QrCameraHwPreflightStatus.Ready);
    expect(mockCheckStatus).not.toHaveBeenCalled();
    expect(mockRedirectToFullscreen).not.toHaveBeenCalled();
  });

  it('returns ready when camera permission is already granted in the side panel', async () => {
    const status = await ensureQrCameraReadyForHwFlow({
      walletType: HardwareWalletType.Qr,
      targetRoute: '/confirmation/1',
    });

    expect(status).toBe(QrCameraHwPreflightStatus.Ready);
    expect(mockCheckStatus).toHaveBeenCalledTimes(1);
    expect(mockRedirectToFullscreen).not.toHaveBeenCalled();
  });

  it('opens fullscreen when popup lacks camera permission', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    mockCheckStatus.mockResolvedValue({
      environmentReady: false,
      permissions: false,
    });

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

  it('opens fullscreen and returns redirected when side-panel permission is missing', async () => {
    mockCheckStatus.mockResolvedValue({
      environmentReady: false,
      permissions: false,
    });

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

  it('opens fullscreen when WebcamUtils.checkStatus throws', async () => {
    mockCheckStatus.mockRejectedValue(
      Object.assign(new Error('No webcam found'), { type: 'NO_WEBCAM_FOUND' }),
    );

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
