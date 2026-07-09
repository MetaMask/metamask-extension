import React, { useEffect } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { URDecoder } from '@ngraveio/bc-ur';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import WebcamUtils from '../../../../helpers/utils/webcam-utils';
import {
  getChromiumExtensionCameraSiteSettingsUrl,
  getMozExtensionOriginForDisplay,
  isFirefoxBrowser,
} from '../../../../../shared/lib/browser-runtime.utils';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../../shared/constants/app';
import {
  MetaMetricsEventName,
  MetaMetricsHardwareWalletDeviceType,
} from '../../../../../shared/constants/metametrics';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import { CameraPermissionState } from '../../../../contexts/hardware-wallets/constants';
import EnhancedQrReader from '../enhanced-qr-reader';
import { QrErrorFlowContext } from '../qr-error-content';
import {
  QrMismatchedTransactionError,
  ScanErrorCategory,
} from '../qr-utils/qr-utils';
import {
  DOMExceptionName,
  PAIRING_EXPECTED_UR_TYPES,
  SIGNING_EXPECTED_UR_TYPES,
  UrType,
  WebcamErrorType,
  type BaseQrReaderProps,
} from './base-qr-reader.types';
import BaseQrReader from './base-qr-reader';

const mockTrackEvent = jest.fn();

jest.mock('../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../../../shared/lib/browser-runtime.utils', () => ({
  ...jest.requireActual('../../../../../shared/lib/browser-runtime.utils'),
  getChromiumExtensionCameraSiteSettingsUrl: jest.fn(
    () =>
      'chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2Fmock%2F',
  ),
  isFirefoxBrowser: jest.fn(() => false),
  getMozExtensionOriginForDisplay: jest.fn(
    () => 'moz-extension://ab5f75ae…d4aa03',
  ),
}));

jest.mock('../../../../helpers/utils/webcam-utils');

jest.mock('../enhanced-qr-reader');

jest.mock('@ngraveio/bc-ur', () => ({
  ...jest.requireActual('@ngraveio/bc-ur'),
  // The real delegation is (re)installed in `beforeEach` so that per-test
  // overrides do not leak between tests.
  URDecoder: jest.fn(),
}));

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);
const mockGetChromiumExtensionCameraSiteSettingsUrl = jest.mocked(
  getChromiumExtensionCameraSiteSettingsUrl,
);
const mockIsFirefoxBrowser = jest.mocked(isFirefoxBrowser);
const mockGetMozExtensionOriginForDisplay = jest.mocked(
  getMozExtensionOriginForDisplay,
);
const mockEnhancedQrReader = jest.mocked(EnhancedQrReader);
const mockURDecoder = jest.mocked(URDecoder);

const mockCheckStatus = jest.mocked(WebcamUtils.checkStatus);
const mockQueryCameraPermission = jest.mocked(
  WebcamUtils.queryCameraPermission,
);
const mockRequestVideoStream = jest.mocked(WebcamUtils.requestVideoStream);
const mockStopVideoStream = jest.mocked(WebcamUtils.stopVideoStream);

const mockStream = {
  getTracks: () => [{ stop: jest.fn() }],
};

/**
 * Sets up `WebcamUtils` mocks for the success path with fullscreen, prompt
 * permission, and a working video stream.
 */
function setupWebcamUtilsSuccess() {
  mockCheckStatus.mockResolvedValue({
    permissions: true,
    environmentReady: true,
  });
  mockQueryCameraPermission.mockResolvedValue({
    state: CameraPermissionState.Prompt,
    permissionStatus: null,
  });
  mockRequestVideoStream.mockResolvedValue(
    mockStream as unknown as MediaStream,
  );
  mockStopVideoStream.mockImplementation(() => undefined);
}

describe('BaseQrReader', () => {
  const defaultProps: BaseQrReaderProps = {
    isReadingWallet: true,
    expectedUrTypes: PAIRING_EXPECTED_UR_TYPES,
    handleCancel: jest.fn(),
    handleSuccess: jest.fn(),
    setErrorTitle: jest.fn(),
    setErrorActive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockURDecoder.mockImplementation(
      (...args: ConstructorParameters<typeof URDecoder>) =>
        new (
          jest.requireActual(
            '@ngraveio/bc-ur',
          ) as typeof import('@ngraveio/bc-ur')
        ).URDecoder(...args),
    );
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    // @ts-expect-error mocking platform
    global.platform = {
      openTab: jest.fn(),
      openExtensionInBrowser: jest.fn(),
    };
    mockGetChromiumExtensionCameraSiteSettingsUrl.mockReturnValue(
      'chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2Fmock%2F',
    );
    mockIsFirefoxBrowser.mockReturnValue(false);
    mockGetMozExtensionOriginForDisplay.mockReturnValue(
      'moz-extension://ab5f75ae…d4aa03',
    );
  });

  // ---- Happy-path scanning ------------------------------------------------

  it('renders progress bar when scan produces partial data', async () => {
    setupWebcamUtilsSuccess();
    mockEnhancedQrReader.mockImplementation((({
      onFrame,
    }: {
      onFrame: (data: string) => void;
    }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        onFrame(
          'UR:CRYPTO-HDKEY/24-2/LPCSCSAOCSNYCYNLAMSKJPHDGTEHOEADCSFNAOAEAMTAADDYOTADLNCSDWYKCSFNYKAEYKAOCYJKSKTNBKAXAXATTAADDYOEADLRAEWKLAWKAXAEAYCYTEDMFEAYASISGRIHKKJKJYJLJTIHBKJOHSIAIAJLKPJTJYDMJKJYHSJTIEHSJPIEHTSTGSAO',
        );
      }, [onFrame]);
      return null;
    }) as unknown as typeof EnhancedQrReader);
    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });

    expect(
      await screen.findByTestId('qr-reader-progress-bar'),
    ).toBeInTheDocument();
  });

  // ---- Environment check --------------------------------------------------

  it('redirects to fullscreen when environment is not ready in popup', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: false,
    });

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });

    await waitFor(() => {
      expect(global.platform.openExtensionInBrowser).toHaveBeenCalled();
    });
    expect(mockQueryCameraPermission).not.toHaveBeenCalled();
  });

  // ---- Permission: already granted (fast path) ---------------------------

  it('skips requestVideoStream when permission is already granted', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: true,
      environmentReady: true,
    });
    mockQueryCameraPermission.mockResolvedValue({
      state: CameraPermissionState.Granted,
      permissionStatus: null,
    });

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });

    expect(
      screen.getByText(messages.QRHardwareScanInstructions.message),
    ).toBeInTheDocument();
    expect(mockRequestVideoStream).not.toHaveBeenCalled();
  });

  // ---- Permission: blocked -----------------------------------------------

  it('shows camera-access-blocked when permission is denied', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: true,
    });
    mockQueryCameraPermission.mockResolvedValue({
      state: CameraPermissionState.Denied,
      permissionStatus: {
        state: CameraPermissionState.Denied,
        addEventListener: jest.fn(),
      } as unknown as PermissionStatus,
    });

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });

    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();
    expect(mockRequestVideoStream).not.toHaveBeenCalled();
  });

  it('does not poll when permission is denied', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: true,
    });
    mockQueryCameraPermission.mockResolvedValue({
      state: CameraPermissionState.Denied,
      permissionStatus: {
        state: CameraPermissionState.Denied,
        addEventListener: jest.fn(),
      } as unknown as PermissionStatus,
    });

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });

    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();
    expect(mockRequestVideoStream).not.toHaveBeenCalled();
    expect(mockQueryCameraPermission).toHaveBeenCalledTimes(1);
  });

  // ---- Permission change listener: auto-recovery --------------------------

  it('stays on blocked UI when permission change fires but requestVideoStream fails', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: true,
    });

    let capturedChangeHandler: (() => void) | null = null;
    const mockPermissionStatus = {
      state: CameraPermissionState.Denied as PermissionState,
      addEventListener: jest.fn((_event: string, handler: () => void) => {
        capturedChangeHandler = handler;
      }),
    } as unknown as PermissionStatus;

    mockQueryCameraPermission.mockResolvedValue({
      state: CameraPermissionState.Denied,
      permissionStatus: mockPermissionStatus,
    });

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });
    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();

    (mockPermissionStatus as { state: PermissionState }).state = 'granted';
    mockRequestVideoStream.mockRejectedValueOnce(
      new Error('Camera hardware error'),
    );

    expect(capturedChangeHandler).not.toBeNull();
    await act(async () => {
      (capturedChangeHandler as () => void)();
    });

    expect(mockRequestVideoStream).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();
  });

  it('transitions to Ready when PermissionStatus change event fires with granted', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: true,
    });

    let capturedChangeHandler: (() => void) | null = null;
    const mockPermissionStatus = {
      state: CameraPermissionState.Denied as PermissionState,
      addEventListener: jest.fn((_event: string, handler: () => void) => {
        capturedChangeHandler = handler;
      }),
    } as unknown as PermissionStatus;

    mockQueryCameraPermission.mockResolvedValue({
      state: CameraPermissionState.Denied,
      permissionStatus: mockPermissionStatus,
    });

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });
    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();

    (mockPermissionStatus as { state: PermissionState }).state = 'granted';
    mockRequestVideoStream.mockResolvedValueOnce(
      mockStream as unknown as MediaStream,
    );

    expect(capturedChangeHandler).not.toBeNull();
    await act(async () => {
      (capturedChangeHandler as () => void)();
    });

    expect(
      screen.getByText(messages.QRHardwareScanInstructions.message),
    ).toBeInTheDocument();
    expect(mockRequestVideoStream).toHaveBeenCalledTimes(1);
    expect(mockStopVideoStream).toHaveBeenCalledWith(mockStream);
  });

  // ---- Chromium "Open settings" button ------------------------------------

  it('opens Chromium camera settings when Open settings is clicked', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: true,
    });
    mockQueryCameraPermission.mockResolvedValue({
      state: CameraPermissionState.Denied,
      permissionStatus: {
        state: CameraPermissionState.Denied,
        addEventListener: jest.fn(),
      } as unknown as PermissionStatus,
    });

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });
    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('qr-camera-open-settings'));

    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2Fmock%2F',
    });
  });

  // ---- Firefox-specific UI ------------------------------------------------

  it('shows Firefox instructions when blocked in Firefox', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: true,
    });
    mockIsFirefoxBrowser.mockReturnValue(true);
    mockQueryCameraPermission.mockResolvedValue({
      state: CameraPermissionState.Denied,
      permissionStatus: {
        state: CameraPermissionState.Denied,
        addEventListener: jest.fn(),
      } as unknown as PermissionStatus,
    });

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });

    expect(
      screen.getByTestId('qr-camera-firefox-instructions'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('qr-camera-open-settings')).toBeNull();
  });

  // ---- promptForCameraAccess ----------------------------------------------

  describe('promptForCameraAccess', () => {
    it('transitions to Ready when getUserMedia succeeds', async () => {
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Prompt,
        permissionStatus: null,
      });
      mockRequestVideoStream.mockResolvedValue(
        mockStream as unknown as MediaStream,
      );

      await act(async () => {
        renderWithProvider(<BaseQrReader {...defaultProps} />);
      });

      expect(
        screen.getByText(messages.QRHardwareScanInstructions.message),
      ).toBeInTheDocument();
      expect(mockRequestVideoStream).toHaveBeenCalledTimes(1);
      expect(mockStopVideoStream).toHaveBeenCalledWith(mockStream);
    });

    it('delegates to handleNotAllowedError on NotAllowedError', async () => {
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Prompt,
        permissionStatus: {
          state: CameraPermissionState.Prompt,
          addEventListener: jest.fn(),
        } as unknown as PermissionStatus,
      });
      const notAllowed = new Error('denied');
      notAllowed.name = DOMExceptionName.NotAllowed;
      mockRequestVideoStream.mockRejectedValueOnce(notAllowed);

      await act(async () => {
        renderWithProvider(<BaseQrReader {...defaultProps} />);
      });

      expect(screen.getByTestId('qr-camera-access-needed')).toBeInTheDocument();
      expect(mockQueryCameraPermission).toHaveBeenCalledTimes(2);
    });

    it('sets generic error for non-NotAllowedError camera failures', async () => {
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Prompt,
        permissionStatus: null,
      });
      const notReadable = new Error('Could not start video source');
      notReadable.name = 'NotReadableError';
      mockRequestVideoStream.mockRejectedValueOnce(notReadable);

      await act(async () => {
        renderWithProvider(<BaseQrReader {...defaultProps} />);
      });

      expect(
        screen.getByText(messages.generalCameraError.message),
      ).toBeInTheDocument();
      expect(mockQueryCameraPermission).toHaveBeenCalledTimes(1);
    });
  });

  // ---- handleNotAllowedError ----------------------------------------------

  describe('handleNotAllowedError', () => {
    it('shows camera-access-needed when re-queried permission is prompt on Chromium', async () => {
      mockIsFirefoxBrowser.mockReturnValue(false);
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Prompt,
        permissionStatus: {
          state: CameraPermissionState.Prompt,
          addEventListener: jest.fn(),
        } as unknown as PermissionStatus,
      });
      const notAllowed = new Error('denied');
      notAllowed.name = DOMExceptionName.NotAllowed;
      mockRequestVideoStream.mockRejectedValueOnce(notAllowed);

      await act(async () => {
        renderWithProvider(<BaseQrReader {...defaultProps} />);
      });

      expect(screen.getByTestId('qr-camera-access-needed')).toBeInTheDocument();
      expect(
        screen.queryByTestId('qr-camera-access-blocked'),
      ).not.toBeInTheDocument();
    });

    it('shows camera-access-blocked when re-queried permission is denied', async () => {
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      // First call returns prompt (entering promptForCameraAccess),
      // second call (from reconcileNotAllowedPermission) returns denied
      mockQueryCameraPermission
        .mockResolvedValueOnce({
          state: CameraPermissionState.Prompt,
          permissionStatus: null,
        })
        .mockResolvedValueOnce({
          state: CameraPermissionState.Denied,
          permissionStatus: {
            state: CameraPermissionState.Denied,
            addEventListener: jest.fn(),
          } as unknown as PermissionStatus,
        });
      const notAllowed = new Error('denied');
      notAllowed.name = DOMExceptionName.NotAllowed;
      mockRequestVideoStream.mockRejectedValueOnce(notAllowed);

      await act(async () => {
        renderWithProvider(<BaseQrReader {...defaultProps} />);
      });

      expect(
        screen.getByTestId('qr-camera-access-blocked'),
      ).toBeInTheDocument();
    });

    it('shows camera-access-blocked on Firefox when re-queried permission is prompt', async () => {
      mockIsFirefoxBrowser.mockReturnValue(true);
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Prompt,
        permissionStatus: {
          state: CameraPermissionState.Prompt,
          addEventListener: jest.fn(),
        } as unknown as PermissionStatus,
      });
      const notAllowed = new Error('denied');
      notAllowed.name = DOMExceptionName.NotAllowed;
      mockRequestVideoStream.mockRejectedValueOnce(notAllowed);

      await act(async () => {
        renderWithProvider(<BaseQrReader {...defaultProps} />);
      });

      expect(
        screen.getByTestId('qr-camera-access-blocked'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('qr-camera-access-needed'),
      ).not.toBeInTheDocument();
    });
  });

  // ---- "Continue" on needed UI (handleCameraAccessNeededContinue) ----------

  it('transitions to Ready when Continue is clicked on needed UI and getUserMedia succeeds', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: true,
    });
    mockQueryCameraPermission.mockResolvedValue({
      state: CameraPermissionState.Prompt,
      permissionStatus: {
        state: CameraPermissionState.Prompt,
        addEventListener: jest.fn(),
      } as unknown as PermissionStatus,
    });
    const notAllowed = new Error('denied');
    notAllowed.name = DOMExceptionName.NotAllowed;
    mockRequestVideoStream.mockRejectedValueOnce(notAllowed);

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });
    expect(screen.getByTestId('qr-camera-access-needed')).toBeInTheDocument();

    mockRequestVideoStream.mockResolvedValueOnce(
      mockStream as unknown as MediaStream,
    );
    await act(async () => {
      await userEvent.click(
        screen.getByTestId('qr-camera-access-needed-continue'),
      );
    });

    expect(
      screen.getByText(messages.QRHardwareScanInstructions.message),
    ).toBeInTheDocument();
  });

  it('transitions to blocked when Continue on needed UI results in NotAllowedError with denied state', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: true,
    });
    mockQueryCameraPermission.mockResolvedValue({
      state: CameraPermissionState.Prompt,
      permissionStatus: {
        state: CameraPermissionState.Prompt,
        addEventListener: jest.fn(),
      } as unknown as PermissionStatus,
    });
    const notAllowed = new Error('denied');
    notAllowed.name = DOMExceptionName.NotAllowed;
    mockRequestVideoStream.mockRejectedValueOnce(notAllowed);

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });
    expect(screen.getByTestId('qr-camera-access-needed')).toBeInTheDocument();

    mockRequestVideoStream.mockRejectedValueOnce(notAllowed);
    mockQueryCameraPermission.mockResolvedValueOnce({
      state: CameraPermissionState.Denied,
      permissionStatus: {
        state: CameraPermissionState.Denied,
        addEventListener: jest.fn(),
      } as unknown as PermissionStatus,
    });
    await act(async () => {
      await userEvent.click(
        screen.getByTestId('qr-camera-access-needed-continue'),
      );
    });

    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();
  });

  // ---- "Continue" on blocked UI (handleCameraAccessBlockedContinue) ------

  it('transitions to Ready when Continue on blocked UI finds permission no longer denied', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: true,
    });
    mockQueryCameraPermission.mockResolvedValue({
      state: CameraPermissionState.Denied,
      permissionStatus: {
        state: CameraPermissionState.Denied,
        addEventListener: jest.fn(),
      } as unknown as PermissionStatus,
    });

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });
    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();

    mockQueryCameraPermission.mockResolvedValueOnce({
      state: CameraPermissionState.Granted,
      permissionStatus: null,
    });
    mockRequestVideoStream.mockResolvedValueOnce(
      mockStream as unknown as MediaStream,
    );
    await act(async () => {
      await userEvent.click(screen.getByTestId('qr-camera-blocked-continue'));
    });

    expect(
      screen.getByText(messages.QRHardwareScanInstructions.message),
    ).toBeInTheDocument();
  });

  it('stays on blocked UI when Continue on blocked UI finds permission still denied', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: true,
    });
    mockQueryCameraPermission.mockResolvedValue({
      state: CameraPermissionState.Denied,
      permissionStatus: {
        state: CameraPermissionState.Denied,
        addEventListener: jest.fn(),
      } as unknown as PermissionStatus,
    });

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });
    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByTestId('qr-camera-blocked-continue'));
    });

    expect(mockQueryCameraPermission).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();
  });

  // ---- Error rendering ----------------------------------------------------

  it('renders error state when WebcamUtils.checkStatus rejects with NO_WEBCAM_FOUND', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    const webcamError = new Error('No webcam found') as Error & {
      type?: string;
    };
    webcamError.type = WebcamErrorType.NoWebcamFound;
    mockCheckStatus.mockRejectedValue(webcamError);

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });

    expect(
      screen.getByText(messages.noWebcamFound.message),
    ).toBeInTheDocument();
  });

  it('renders QrErrorContent when scan throws during wallet read', async () => {
    setupWebcamUtilsSuccess();
    mockEnhancedQrReader.mockImplementation((({
      onFrame,
    }: {
      onFrame: (data: string) => void;
    }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        onFrame('not-a-valid-ur-payload');
      }, [onFrame]);
      return null;
    }) as unknown as typeof EnhancedQrReader);

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} isReadingWallet />);
    });

    expect(
      screen.getByTestId('qr-error-nonUrQrCode-pairing'),
    ).toBeInTheDocument();
  });

  it('renders QrErrorContent for signing flow when scan throws', async () => {
    setupWebcamUtilsSuccess();
    mockEnhancedQrReader.mockImplementation((({
      onFrame,
    }: {
      onFrame: (data: string) => void;
    }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        onFrame('not-a-valid-ur-payload');
      }, [onFrame]);
      return null;
    }) as unknown as typeof EnhancedQrReader);

    await act(async () => {
      renderWithProvider(
        <BaseQrReader {...defaultProps} isReadingWallet={false} />,
      );
    });

    expect(
      screen.getByTestId('qr-error-nonUrQrCode-signing'),
    ).toBeInTheDocument();
  });

  it('renders QrErrorContent when handleSuccess rejects with mismatched transaction', async () => {
    setupWebcamUtilsSuccess();
    const mockInstance = {
      isComplete: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true),
      isError: jest.fn().mockReturnValue(false),
      receivePart: jest.fn(),
      estimatedPercentComplete: jest.fn().mockReturnValue(1),
      resultUR: jest.fn().mockReturnValue({ type: UrType.EthSignature }),
    };
    mockURDecoder.mockImplementation(
      () => mockInstance as unknown as URDecoder,
    );

    mockEnhancedQrReader.mockImplementation((({
      onFrame,
    }: {
      onFrame: (data: string) => void;
    }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        onFrame(`ur:${UrType.EthSignature}/mock-frame`);
      }, [onFrame]);
      return null;
    }) as unknown as typeof EnhancedQrReader);

    const handleSuccess = jest
      .fn()
      .mockRejectedValue(new QrMismatchedTransactionError());

    mockTrackEvent.mockClear();

    await act(async () => {
      renderWithProvider(
        <BaseQrReader
          {...defaultProps}
          isReadingWallet={false}
          expectedUrTypes={SIGNING_EXPECTED_UR_TYPES}
          handleSuccess={handleSuccess}
        />,
        undefined,
        '/',
        render,
      );
    });

    await waitFor(() => {
      expect(
        screen.getByTestId('qr-error-mismatchedTransaction-signing'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(messages.qrErrorMismatchedTransactionTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.qrErrorMismatchedTransactionBody.message),
    ).toBeInTheDocument();
    expect(defaultProps.setErrorActive).toHaveBeenCalledWith(true);

    const scanFailed = mockTrackEvent.mock.calls.filter(
      (call: unknown[]) =>
        (call[0] as { name: string }).name ===
        MetaMetricsEventName.QrHardwareScanFailed,
    );
    expect(scanFailed).toHaveLength(1);
    expect(scanFailed[0][0].properties).toStrictEqual({
      category: 'Accounts',
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment analytics payload keys use snake_case
      device_type: MetaMetricsHardwareWalletDeviceType.QrHardware,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment analytics payload keys use snake_case
      error_category: ScanErrorCategory.MismatchedSignId,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment analytics payload keys use snake_case
      is_ur_format: true,
      flow: QrErrorFlowContext.Signing,
    });
  });

  // ---- Cancel & Try Again on error UI ------------------------------------

  it('calls handleCancel when Cancel is clicked on error UI', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    const webcamError = new Error('No webcam found') as Error & {
      type?: string;
    };
    webcamError.type = WebcamErrorType.NoWebcamFound;
    mockCheckStatus.mockRejectedValue(webcamError);

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });
    expect(
      screen.getByText(messages.noWebcamFound.message),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('page-container-footer-cancel'));

    expect(defaultProps.handleCancel).toHaveBeenCalledTimes(1);
    expect(defaultProps.setErrorTitle).toHaveBeenCalledWith('');
  });

  it('resets state and re-enters environment check when Try Again is clicked', async () => {
    mockEnhancedQrReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    const webcamError = new Error('No webcam found') as Error & {
      type?: string;
    };
    webcamError.type = WebcamErrorType.NoWebcamFound;
    mockCheckStatus.mockRejectedValueOnce(webcamError);

    await act(async () => {
      renderWithProvider(<BaseQrReader {...defaultProps} />);
    });
    expect(
      screen.getByText(messages.noWebcamFound.message),
    ).toBeInTheDocument();

    setupWebcamUtilsSuccess();

    await act(async () => {
      await userEvent.click(screen.getByTestId('page-container-footer-next'));
    });

    expect(
      screen.getByText(messages.QRHardwareScanInstructions.message),
    ).toBeInTheDocument();
    expect(mockCheckStatus).toHaveBeenCalledTimes(2);
  });

  // ---- MetaMetrics tracking -----------------------------------------------

  describe('MetaMetrics tracking', () => {
    function renderWithMetrics(ui: React.ReactElement) {
      return renderWithProvider(ui, undefined, '/', render);
    }

    beforeEach(() => {
      mockTrackEvent.mockClear();
    });

    it('fires ModalViewed when entering blocked state', async () => {
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: false,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Denied,
        permissionStatus: {
          state: CameraPermissionState.Denied,
          addEventListener: jest.fn(),
        } as unknown as PermissionStatus,
      });

      await act(async () => {
        renderWithMetrics(<BaseQrReader {...defaultProps} />);
      });

      const modalViewed = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { name: string }).name ===
          MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
      );
      expect(modalViewed).toHaveLength(1);
      expect(modalViewed[0][0].properties.error_type_view_count).toBe(1);
    });

    it('fires ModalViewed when entering needed state', async () => {
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Prompt,
        permissionStatus: {
          state: CameraPermissionState.Prompt,
          addEventListener: jest.fn(),
        } as unknown as PermissionStatus,
      });
      const notAllowed = new Error('denied');
      notAllowed.name = DOMExceptionName.NotAllowed;
      mockRequestVideoStream.mockRejectedValueOnce(notAllowed);

      await act(async () => {
        renderWithMetrics(<BaseQrReader {...defaultProps} />);
      });

      const modalViewed = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { name: string }).name ===
          MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
      );
      expect(modalViewed).toHaveLength(1);
      expect(modalViewed[0][0].properties.error_type_view_count).toBe(1);
    });

    it('fires CtaClicked when Continue is clicked on blocked UI', async () => {
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: false,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Denied,
        permissionStatus: {
          state: CameraPermissionState.Denied,
          addEventListener: jest.fn(),
        } as unknown as PermissionStatus,
      });

      await act(async () => {
        renderWithMetrics(<BaseQrReader {...defaultProps} />);
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('qr-camera-blocked-continue'));
      });

      const ctaClicked = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { name: string }).name ===
          MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
      );
      expect(ctaClicked).toHaveLength(1);
    });

    it('fires CtaClicked when Continue is clicked on needed UI', async () => {
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Prompt,
        permissionStatus: {
          state: CameraPermissionState.Prompt,
          addEventListener: jest.fn(),
        } as unknown as PermissionStatus,
      });
      const notAllowed = new Error('denied');
      notAllowed.name = DOMExceptionName.NotAllowed;
      mockRequestVideoStream.mockRejectedValueOnce(notAllowed);

      await act(async () => {
        renderWithMetrics(<BaseQrReader {...defaultProps} />);
      });

      mockRequestVideoStream.mockRejectedValueOnce(notAllowed);
      await act(async () => {
        await userEvent.click(
          screen.getByTestId('qr-camera-access-needed-continue'),
        );
      });

      const ctaClicked = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { name: string }).name ===
          MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
      );
      expect(ctaClicked).toHaveLength(1);
    });

    it('fires SuccessModalViewed when camera recovers from an error state', async () => {
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: false,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Denied,
        permissionStatus: {
          state: CameraPermissionState.Denied,
          addEventListener: jest.fn(),
        } as unknown as PermissionStatus,
      });

      await act(async () => {
        renderWithMetrics(<BaseQrReader {...defaultProps} />);
      });

      mockQueryCameraPermission.mockResolvedValueOnce({
        state: CameraPermissionState.Granted,
        permissionStatus: null,
      });
      mockRequestVideoStream.mockResolvedValueOnce(
        mockStream as unknown as MediaStream,
      );
      await act(async () => {
        await userEvent.click(screen.getByTestId('qr-camera-blocked-continue'));
      });

      await waitFor(() => {
        expect(
          screen.getByText(messages.QRHardwareScanInstructions.message),
        ).toBeInTheDocument();
      });

      const successViewed = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { name: string }).name ===
          MetaMetricsEventName.HardwareWalletRecoverySuccessModalViewed,
      );
      expect(successViewed).toHaveLength(1);
    });

    it('increments error_type_view_count when error state transitions', async () => {
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Prompt,
        permissionStatus: {
          state: CameraPermissionState.Prompt,
          addEventListener: jest.fn(),
        } as unknown as PermissionStatus,
      });
      const notAllowed = new Error('denied');
      notAllowed.name = DOMExceptionName.NotAllowed;
      mockRequestVideoStream.mockRejectedValueOnce(notAllowed);

      await act(async () => {
        renderWithMetrics(<BaseQrReader {...defaultProps} />);
      });

      mockRequestVideoStream.mockRejectedValueOnce(notAllowed);
      mockQueryCameraPermission.mockResolvedValueOnce({
        state: CameraPermissionState.Denied,
        permissionStatus: {
          state: CameraPermissionState.Denied,
          addEventListener: jest.fn(),
        } as unknown as PermissionStatus,
      });
      await act(async () => {
        await userEvent.click(
          screen.getByTestId('qr-camera-access-needed-continue'),
        );
      });

      await screen.findByTestId('qr-camera-access-blocked');

      const modalViewed = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { name: string }).name ===
          MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
      );
      expect(modalViewed).toHaveLength(2);
      expect(modalViewed[0][0].properties.error_type_view_count).toBe(1);
      expect(modalViewed[1][0].properties.error_type_view_count).toBe(2);
    });

    it('does not fire tracking events when permission is already granted', async () => {
      mockEnhancedQrReader.mockImplementation(
        () => null as unknown as React.ReactElement,
      );
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Granted,
        permissionStatus: null,
      });

      await act(async () => {
        renderWithMetrics(<BaseQrReader {...defaultProps} />);
      });

      expect(
        screen.getByText(messages.QRHardwareScanInstructions.message),
      ).toBeInTheDocument();
      expect(mockTrackEvent).not.toHaveBeenCalled();
    });

    // ---- QR scan-failed tracking ------------------------------------------

    it('fires QrHardwareScanFailed with non_ur_qr_scanned for pairing flow', async () => {
      setupWebcamUtilsSuccess();
      mockEnhancedQrReader.mockImplementation((({
        onFrame,
      }: {
        onFrame: (data: string) => void;
      }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          onFrame('not-a-valid-ur-payload');
        }, [onFrame]);
        return null;
      }) as unknown as typeof EnhancedQrReader);

      await act(async () => {
        renderWithMetrics(<BaseQrReader {...defaultProps} isReadingWallet />);
      });

      const scanFailed = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { name: string }).name ===
          MetaMetricsEventName.QrHardwareScanFailed,
      );
      expect(scanFailed).toHaveLength(1);
      expect(scanFailed[0][0].properties).toStrictEqual({
        category: 'Accounts',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment analytics payload keys use snake_case
        device_type: 'QR Hardware',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment analytics payload keys use snake_case
        error_category: 'non_ur_qr_scanned',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment analytics payload keys use snake_case
        is_ur_format: false,
        flow: 'pairing',
      });
    });

    it('fires QrHardwareScanFailed with non_ur_qr_scanned for signing flow', async () => {
      setupWebcamUtilsSuccess();
      mockEnhancedQrReader.mockImplementation((({
        onFrame,
      }: {
        onFrame: (data: string) => void;
      }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          onFrame('not-a-valid-ur-payload');
        }, [onFrame]);
        return null;
      }) as unknown as typeof EnhancedQrReader);

      await act(async () => {
        renderWithMetrics(
          <BaseQrReader {...defaultProps} isReadingWallet={false} />,
        );
      });

      const scanFailed = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { name: string }).name ===
          MetaMetricsEventName.QrHardwareScanFailed,
      );
      expect(scanFailed).toHaveLength(1);
      expect(scanFailed[0][0].properties.flow).toBe('signing');
    });
  });
});
