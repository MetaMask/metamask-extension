import React, { useEffect } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import WebcamUtils from '../../../helpers/utils/webcam-utils';
import {
  getChromiumExtensionCameraSiteSettingsUrl,
  getMozExtensionOriginForDisplay,
  isFirefoxBrowser,
} from '../../../../shared/lib/browser-runtime.utils';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../shared/constants/app';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { CameraPermissionState } from '../../../contexts/hardware-wallets/constants';
import {
  DOMExceptionName,
  WebcamErrorType,
  type BaseReaderProps,
} from './base-reader.types';
import BaseReader from './base-reader';
import EnhancedReader from './enhanced-reader';

jest.mock('../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../../shared/lib/browser-runtime.utils', () => ({
  ...jest.requireActual('../../../../shared/lib/browser-runtime.utils'),
  getChromiumExtensionCameraSiteSettingsUrl: jest.fn(
    () =>
      'chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2Fmock%2F',
  ),
  isFirefoxBrowser: jest.fn(() => false),
  getMozExtensionOriginForDisplay: jest.fn(
    () => 'moz-extension://ab5f75ae…d4aa03',
  ),
}));

jest.mock('../../../helpers/utils/webcam-utils');

jest.mock('./enhanced-reader');

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);
const mockGetChromiumExtensionCameraSiteSettingsUrl = jest.mocked(
  getChromiumExtensionCameraSiteSettingsUrl,
);
const mockIsFirefoxBrowser = jest.mocked(isFirefoxBrowser);
const mockGetMozExtensionOriginForDisplay = jest.mocked(
  getMozExtensionOriginForDisplay,
);
const mockEnhancedReader = jest.mocked(EnhancedReader);

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
 * Sets up `WebcamUtils` mocks for the happy path: fullscreen, prompt permission, stream OK.
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

describe('BaseReader', () => {
  const defaultProps: BaseReaderProps = {
    isReadingWallet: true,
    handleCancel: jest.fn(),
    handleSuccess: jest.fn(),
    setErrorTitle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
    mockEnhancedReader.mockImplementation((({
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
    }) as unknown as typeof EnhancedReader);
    renderWithProvider(<BaseReader {...defaultProps} />);

    expect(
      await screen.findByTestId('qr-reader-progress-bar'),
    ).toBeInTheDocument();
  });

  // ---- Environment check --------------------------------------------------

  it('redirects to fullscreen when environment is not ready in popup', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    mockEnhancedReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    mockCheckStatus.mockResolvedValue({
      permissions: false,
      environmentReady: false,
    });

    renderWithProvider(<BaseReader {...defaultProps} />);

    await waitFor(() => {
      expect(global.platform.openExtensionInBrowser).toHaveBeenCalled();
    });
    expect(mockQueryCameraPermission).not.toHaveBeenCalled();
  });

  // ---- Permission: already granted (fast path) ---------------------------

  it('skips requestVideoStream when permission is already granted', async () => {
    mockEnhancedReader.mockImplementation(
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

    renderWithProvider(<BaseReader {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText(messages.QRHardwareScanInstructions.message),
      ).toBeInTheDocument();
    });
    expect(mockRequestVideoStream).not.toHaveBeenCalled();
  });

  // ---- Permission: blocked -----------------------------------------------

  it('shows camera-access-blocked when permission is denied', async () => {
    mockEnhancedReader.mockImplementation(
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

    renderWithProvider(<BaseReader {...defaultProps} />);

    expect(
      await screen.findByTestId('qr-camera-access-blocked'),
    ).toBeInTheDocument();
    expect(mockRequestVideoStream).not.toHaveBeenCalled();
  });

  it('does not poll when permission is denied', async () => {
    mockEnhancedReader.mockImplementation(
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

    renderWithProvider(<BaseReader {...defaultProps} />);

    await screen.findByTestId('qr-camera-access-blocked');
    expect(mockRequestVideoStream).not.toHaveBeenCalled();
    expect(mockQueryCameraPermission).toHaveBeenCalledTimes(1);
  });

  // ---- Permission change listener: auto-recovery --------------------------

  it('stays on blocked UI when permission change fires but requestVideoStream fails', async () => {
    mockEnhancedReader.mockImplementation(
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

    renderWithProvider(<BaseReader {...defaultProps} />);
    await screen.findByTestId('qr-camera-access-blocked');

    (mockPermissionStatus as { state: PermissionState }).state = 'granted';
    mockRequestVideoStream.mockRejectedValueOnce(
      new Error('Camera hardware error'),
    );

    expect(capturedChangeHandler).not.toBeNull();
    await act(async () => {
      (capturedChangeHandler as () => void)();
    });

    expect(mockRequestVideoStream).toHaveBeenCalledTimes(1);
    // Should still show blocked UI since acquireCameraAndTransitionToReady caught the error
    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();
  });

  it('transitions to Ready when PermissionStatus change event fires with granted', async () => {
    mockEnhancedReader.mockImplementation(
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

    renderWithProvider(<BaseReader {...defaultProps} />);
    await screen.findByTestId('qr-camera-access-blocked');

    // Simulate the user granting permission in browser settings
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
    mockEnhancedReader.mockImplementation(
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

    renderWithProvider(<BaseReader {...defaultProps} />);
    await screen.findByTestId('qr-camera-access-blocked');

    await userEvent.click(screen.getByTestId('qr-camera-open-settings'));

    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2Fmock%2F',
    });
  });

  // ---- Firefox-specific UI ------------------------------------------------

  it('shows Firefox instructions when blocked in Firefox', async () => {
    mockEnhancedReader.mockImplementation(
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

    renderWithProvider(<BaseReader {...defaultProps} />);

    expect(
      await screen.findByTestId('qr-camera-firefox-instructions'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('qr-camera-open-settings')).toBeNull();
  });

  // ---- promptForCameraAccess ----------------------------------------------

  describe('promptForCameraAccess', () => {
    it('transitions to Ready when getUserMedia succeeds', async () => {
      mockEnhancedReader.mockImplementation(
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

      renderWithProvider(<BaseReader {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(messages.QRHardwareScanInstructions.message),
        ).toBeInTheDocument();
      });
      expect(mockRequestVideoStream).toHaveBeenCalledTimes(1);
      expect(mockStopVideoStream).toHaveBeenCalledWith(mockStream);
    });

    it('delegates to handleNotAllowedError on NotAllowedError', async () => {
      mockEnhancedReader.mockImplementation(
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

      renderWithProvider(<BaseReader {...defaultProps} />);

      expect(
        await screen.findByTestId('qr-camera-access-needed'),
      ).toBeInTheDocument();
      expect(mockQueryCameraPermission).toHaveBeenCalledTimes(2);
    });

    it('sets generic error for non-NotAllowedError camera failures', async () => {
      mockEnhancedReader.mockImplementation(
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

      renderWithProvider(<BaseReader {...defaultProps} />);

      expect(
        await screen.findByText(messages.generalCameraError.message),
      ).toBeInTheDocument();
      expect(mockQueryCameraPermission).toHaveBeenCalledTimes(1);
    });
  });

  // ---- handleNotAllowedError ----------------------------------------------

  describe('handleNotAllowedError', () => {
    it('shows camera-access-needed when re-queried permission is prompt on Chromium', async () => {
      mockIsFirefoxBrowser.mockReturnValue(false);
      mockEnhancedReader.mockImplementation(
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

      renderWithProvider(<BaseReader {...defaultProps} />);

      expect(
        await screen.findByTestId('qr-camera-access-needed'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('qr-camera-access-blocked'),
      ).not.toBeInTheDocument();
    });

    it('shows camera-access-blocked when re-queried permission is denied', async () => {
      mockEnhancedReader.mockImplementation(
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

      renderWithProvider(<BaseReader {...defaultProps} />);

      expect(
        await screen.findByTestId('qr-camera-access-blocked'),
      ).toBeInTheDocument();
    });

    it('shows camera-access-blocked on Firefox when re-queried permission is prompt', async () => {
      mockIsFirefoxBrowser.mockReturnValue(true);
      mockEnhancedReader.mockImplementation(
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

      renderWithProvider(<BaseReader {...defaultProps} />);

      expect(
        await screen.findByTestId('qr-camera-access-blocked'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('qr-camera-access-needed'),
      ).not.toBeInTheDocument();
    });
  });

  // ---- "Continue" on needed UI (handleCameraAccessNeededContinue) ----------

  it('transitions to Ready when Continue is clicked on needed UI and getUserMedia succeeds', async () => {
    mockEnhancedReader.mockImplementation(
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

    renderWithProvider(<BaseReader {...defaultProps} />);
    await screen.findByTestId('qr-camera-access-needed');

    mockRequestVideoStream.mockResolvedValueOnce(
      mockStream as unknown as MediaStream,
    );
    await userEvent.click(
      screen.getByTestId('qr-camera-access-needed-continue'),
    );

    await waitFor(() => {
      expect(
        screen.getByText(messages.QRHardwareScanInstructions.message),
      ).toBeInTheDocument();
    });
  });

  it('transitions to blocked when Continue on needed UI results in NotAllowedError with denied state', async () => {
    mockEnhancedReader.mockImplementation(
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

    renderWithProvider(<BaseReader {...defaultProps} />);
    await screen.findByTestId('qr-camera-access-needed');

    mockRequestVideoStream.mockRejectedValueOnce(notAllowed);
    mockQueryCameraPermission.mockResolvedValueOnce({
      state: CameraPermissionState.Denied,
      permissionStatus: {
        state: CameraPermissionState.Denied,
        addEventListener: jest.fn(),
      } as unknown as PermissionStatus,
    });
    await userEvent.click(
      screen.getByTestId('qr-camera-access-needed-continue'),
    );

    expect(
      await screen.findByTestId('qr-camera-access-blocked'),
    ).toBeInTheDocument();
  });

  // ---- "Continue" on blocked UI (handleCameraAccessBlockedContinue) ------

  it('transitions to Ready when Continue on blocked UI finds permission no longer denied', async () => {
    mockEnhancedReader.mockImplementation(
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

    renderWithProvider(<BaseReader {...defaultProps} />);
    await screen.findByTestId('qr-camera-access-blocked');

    mockQueryCameraPermission.mockResolvedValueOnce({
      state: CameraPermissionState.Granted,
      permissionStatus: null,
    });
    mockRequestVideoStream.mockResolvedValueOnce(
      mockStream as unknown as MediaStream,
    );
    await userEvent.click(screen.getByTestId('qr-camera-blocked-continue'));

    await waitFor(() => {
      expect(
        screen.getByText(messages.QRHardwareScanInstructions.message),
      ).toBeInTheDocument();
    });
  });

  it('stays on blocked UI when Continue on blocked UI finds permission still denied', async () => {
    mockEnhancedReader.mockImplementation(
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

    renderWithProvider(<BaseReader {...defaultProps} />);
    await screen.findByTestId('qr-camera-access-blocked');

    await userEvent.click(screen.getByTestId('qr-camera-blocked-continue'));

    await waitFor(() => {
      expect(mockQueryCameraPermission).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByTestId('qr-camera-access-blocked')).toBeInTheDocument();
  });

  // ---- Error rendering ----------------------------------------------------

  it('renders error state when WebcamUtils.checkStatus rejects with NO_WEBCAM_FOUND', async () => {
    mockEnhancedReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    const webcamError = new Error('No webcam found') as Error & {
      type?: string;
    };
    webcamError.type = WebcamErrorType.NoWebcamFound;
    mockCheckStatus.mockRejectedValue(webcamError);

    renderWithProvider(<BaseReader {...defaultProps} />);

    expect(
      await screen.findByText(messages.noWebcamFound.message),
    ).toBeInTheDocument();
  });

  it('renders QrErrorContent when scan throws during wallet read', async () => {
    setupWebcamUtilsSuccess();
    mockEnhancedReader.mockImplementation((({
      onFrame,
    }: {
      onFrame: (data: string) => void;
    }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        onFrame('not-a-valid-ur-payload');
      }, [onFrame]);
      return null;
    }) as unknown as typeof EnhancedReader);

    renderWithProvider(<BaseReader {...defaultProps} isReadingWallet />);

    expect(
      await screen.findByTestId('qr-error-nonUrQrCode-pairing'),
    ).toBeInTheDocument();
  });

  it('renders QrErrorContent for signing flow when scan throws', async () => {
    setupWebcamUtilsSuccess();
    mockEnhancedReader.mockImplementation((({
      onFrame,
    }: {
      onFrame: (data: string) => void;
    }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        onFrame('not-a-valid-ur-payload');
      }, [onFrame]);
      return null;
    }) as unknown as typeof EnhancedReader);

    renderWithProvider(
      <BaseReader {...defaultProps} isReadingWallet={false} />,
    );

    expect(
      await screen.findByTestId('qr-error-nonUrQrCode-signing'),
    ).toBeInTheDocument();
  });

  // ---- Cancel & Try Again on error UI ------------------------------------

  it('calls handleCancel when Cancel is clicked on error UI', async () => {
    mockEnhancedReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    const webcamError = new Error('No webcam found') as Error & {
      type?: string;
    };
    webcamError.type = WebcamErrorType.NoWebcamFound;
    mockCheckStatus.mockRejectedValue(webcamError);

    renderWithProvider(<BaseReader {...defaultProps} />);
    await screen.findByText(messages.noWebcamFound.message);

    await userEvent.click(screen.getByTestId('page-container-footer-cancel'));

    expect(defaultProps.handleCancel).toHaveBeenCalledTimes(1);
    expect(defaultProps.setErrorTitle).toHaveBeenCalledWith('');
  });

  it('resets state and re-enters environment check when Try Again is clicked', async () => {
    mockEnhancedReader.mockImplementation(
      () => null as unknown as React.ReactElement,
    );
    const webcamError = new Error('No webcam found') as Error & {
      type?: string;
    };
    webcamError.type = WebcamErrorType.NoWebcamFound;
    mockCheckStatus.mockRejectedValueOnce(webcamError);

    renderWithProvider(<BaseReader {...defaultProps} />);
    await screen.findByText(messages.noWebcamFound.message);

    // Set up success for the retry
    setupWebcamUtilsSuccess();

    await userEvent.click(screen.getByTestId('page-container-footer-next'));

    await waitFor(() => {
      expect(
        screen.getByText(messages.QRHardwareScanInstructions.message),
      ).toBeInTheDocument();
    });
    // checkStatus called twice: initial failure + retry
    expect(mockCheckStatus).toHaveBeenCalledTimes(2);
  });

  // ---- MetaMetrics tracking -----------------------------------------------

  describe('MetaMetrics tracking', () => {
    const mockTrackEvent = jest.fn().mockResolvedValue(undefined);

    function renderWithMetrics(ui: React.ReactElement) {
      return renderWithProvider(
        ui,
        undefined,
        '/',
        render,
        () => mockTrackEvent,
      );
    }

    beforeEach(() => {
      mockTrackEvent.mockClear();
    });

    it('fires ModalViewed when entering blocked state', async () => {
      mockEnhancedReader.mockImplementation(
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
        renderWithMetrics(<BaseReader {...defaultProps} />);
      });

      const modalViewed = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { event: string }).event ===
          MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
      );
      expect(modalViewed).toHaveLength(1);
      expect(modalViewed[0][0].properties.error_type_view_count).toBe(1);
    });

    it('fires ModalViewed when entering needed state', async () => {
      mockEnhancedReader.mockImplementation(
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
        renderWithMetrics(<BaseReader {...defaultProps} />);
      });

      const modalViewed = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { event: string }).event ===
          MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
      );
      expect(modalViewed).toHaveLength(1);
      expect(modalViewed[0][0].properties.error_type_view_count).toBe(1);
    });

    it('fires CtaClicked when Continue is clicked on blocked UI', async () => {
      mockEnhancedReader.mockImplementation(
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
        renderWithMetrics(<BaseReader {...defaultProps} />);
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('qr-camera-blocked-continue'));
      });

      const ctaClicked = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { event: string }).event ===
          MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
      );
      expect(ctaClicked).toHaveLength(1);
    });

    it('fires CtaClicked when Continue is clicked on needed UI', async () => {
      mockEnhancedReader.mockImplementation(
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
        renderWithMetrics(<BaseReader {...defaultProps} />);
      });

      mockRequestVideoStream.mockRejectedValueOnce(notAllowed);
      await act(async () => {
        await userEvent.click(
          screen.getByTestId('qr-camera-access-needed-continue'),
        );
      });

      const ctaClicked = mockTrackEvent.mock.calls.filter(
        (call: unknown[]) =>
          (call[0] as { event: string }).event ===
          MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
      );
      expect(ctaClicked).toHaveLength(1);
    });

    it('fires SuccessModalViewed when camera recovers from an error state', async () => {
      mockEnhancedReader.mockImplementation(
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
        renderWithMetrics(<BaseReader {...defaultProps} />);
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
          (call[0] as { event: string }).event ===
          MetaMetricsEventName.HardwareWalletRecoverySuccessModalViewed,
      );
      expect(successViewed).toHaveLength(1);
    });

    it('increments error_type_view_count when error state transitions', async () => {
      mockEnhancedReader.mockImplementation(
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
        renderWithMetrics(<BaseReader {...defaultProps} />);
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
          (call[0] as { event: string }).event ===
          MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
      );
      expect(modalViewed).toHaveLength(2);
      expect(modalViewed[0][0].properties.error_type_view_count).toBe(1);
      expect(modalViewed[1][0].properties.error_type_view_count).toBe(2);
    });

    it('does not fire tracking events when permission is already granted', async () => {
      mockEnhancedReader.mockImplementation(
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
        renderWithMetrics(<BaseReader {...defaultProps} />);
      });

      expect(
        screen.getByText(messages.QRHardwareScanInstructions.message),
      ).toBeInTheDocument();
      expect(mockTrackEvent).not.toHaveBeenCalled();
    });
  });
});
