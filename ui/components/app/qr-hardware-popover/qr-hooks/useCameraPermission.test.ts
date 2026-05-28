import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import WebcamUtils from '../../../../helpers/utils/webcam-utils';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import { isFirefoxBrowser } from '../../../../../shared/lib/browser-runtime.utils';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../../shared/constants/app';
import { CameraPermissionState } from '../../../../contexts/hardware-wallets/constants';
import { DOMExceptionName } from '../base-reader.types';
import { useCameraPermission } from './useCameraPermission';

jest.mock('../../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../../../shared/lib/browser-runtime.utils', () => ({
  ...jest.requireActual('../../../../../shared/lib/browser-runtime.utils'),
  isFirefoxBrowser: jest.fn(() => false),
}));

jest.mock('../../../../helpers/utils/webcam-utils');

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);
const mockIsFirefoxBrowser = jest.mocked(isFirefoxBrowser);
const mockCheckStatus = jest.mocked(WebcamUtils.checkStatus);
const mockQueryCameraPermission = jest.mocked(
  WebcamUtils.queryCameraPermission,
);
const mockRequestVideoStream = jest.mocked(WebcamUtils.requestVideoStream);
const mockStopVideoStream = jest.mocked(WebcamUtils.stopVideoStream);

const mockStream = {
  getTracks: () => [{ stop: jest.fn() }],
} as unknown as MediaStream;

describe('useCameraPermission', () => {
  const mockSetReady = jest.fn();
  const mockSetBlocked = jest.fn();
  const mockSetNeeded = jest.fn();
  const mockSetError = jest.fn();
  const mockSetPermissionActionLoading = jest.fn();
  const mockTrackCameraRecoveryCtaClicked = jest.fn();

  const defaultDispatchers = {
    setReady: mockSetReady,
    setBlocked: mockSetBlocked,
    setNeeded: mockSetNeeded,
    setError: mockSetError,
    setPermissionActionLoading: mockSetPermissionActionLoading,
  };

  const defaultTracking = {
    trackCameraRecoveryCtaClicked: mockTrackCameraRecoveryCtaClicked,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    mockIsFirefoxBrowser.mockReturnValue(false);
    mockStopVideoStream.mockImplementation(() => undefined);
    // @ts-expect-error mocking platform
    global.platform = {
      openTab: jest.fn(),
      openExtensionInBrowser: jest.fn(),
    };
  });

  function renderCameraHook(
    dispatchers = defaultDispatchers,
    tracking = defaultTracking,
  ) {
    return renderHook(() => useCameraPermission(dispatchers, tracking));
  }

  describe('environment check', () => {
    it('redirects to fullscreen when environment is not ready in popup', async () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
      mockCheckStatus.mockResolvedValue({
        permissions: false,
        environmentReady: false,
      });

      renderCameraHook();

      await waitFor(() => {
        expect(global.platform.openExtensionInBrowser).toHaveBeenCalled();
      });
      expect(mockQueryCameraPermission).not.toHaveBeenCalled();
    });

    it('does not redirect when already in fullscreen even if environment is not ready', async () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
      mockCheckStatus.mockResolvedValue({
        permissions: false,
        environmentReady: false,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Granted,
        permissionStatus: null,
      });

      renderCameraHook();

      await waitFor(() => {
        expect(mockSetReady).toHaveBeenCalled();
      });
      expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    });

    it('calls setError when checkStatus throws', async () => {
      const envError = new Error('checkStatus failed');
      mockCheckStatus.mockRejectedValue(envError);

      renderCameraHook();

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith(envError);
      });
    });

    it('queries camera permission after environment passes', async () => {
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Granted,
        permissionStatus: null,
      });

      renderCameraHook();

      await waitFor(() => {
        expect(mockQueryCameraPermission).toHaveBeenCalled();
      });
    });
  });

  describe('permission flow', () => {
    it('calls setReady when permission is already granted', async () => {
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Granted,
        permissionStatus: null,
      });

      renderCameraHook();

      await waitFor(() => {
        expect(mockSetReady).toHaveBeenCalled();
      });
      expect(mockRequestVideoStream).not.toHaveBeenCalled();
    });

    it('calls setBlocked when permission is denied', async () => {
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

      renderCameraHook();

      await waitFor(() => {
        expect(mockSetBlocked).toHaveBeenCalled();
      });
    });

    it('calls setReady on successful getUserMedia from prompt state', async () => {
      mockCheckStatus.mockResolvedValue({
        permissions: true,
        environmentReady: true,
      });
      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Prompt,
        permissionStatus: null,
      });
      mockRequestVideoStream.mockResolvedValue(mockStream);

      renderCameraHook();

      await waitFor(() => {
        expect(mockSetReady).toHaveBeenCalled();
      });
      expect(mockStopVideoStream).toHaveBeenCalledWith(mockStream);
    });

    it('calls setNeeded on NotAllowedError when re-queried permission is prompt on Chromium', async () => {
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
      mockRequestVideoStream.mockRejectedValue(notAllowed);
      mockIsFirefoxBrowser.mockReturnValue(false);

      renderCameraHook();

      await waitFor(() => {
        expect(mockSetNeeded).toHaveBeenCalled();
      });
    });

    it('calls setBlocked on NotAllowedError when re-queried is prompt on Firefox', async () => {
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
      mockRequestVideoStream.mockRejectedValue(notAllowed);
      mockIsFirefoxBrowser.mockReturnValue(true);

      renderCameraHook();

      await waitFor(() => {
        expect(mockSetBlocked).toHaveBeenCalled();
      });
    });

    it('calls setError on non-NotAllowedError camera failures', async () => {
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
      mockRequestVideoStream.mockRejectedValue(notReadable);

      renderCameraHook();

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith(notReadable);
      });
    });
  });

  describe('handleCameraAccessNeededContinue', () => {
    it('tracks CTA click and calls setReady on successful getUserMedia', async () => {
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

      const { result } = renderCameraHook();

      await waitFor(() => {
        expect(mockSetNeeded).toHaveBeenCalled();
      });

      mockRequestVideoStream.mockResolvedValueOnce(mockStream);

      await act(async () => {
        await result.current.handleCameraAccessNeededContinue();
      });

      expect(mockTrackCameraRecoveryCtaClicked).toHaveBeenCalled();
      expect(mockSetPermissionActionLoading).toHaveBeenCalledWith(true);
      expect(mockSetReady).toHaveBeenCalled();
      expect(mockSetPermissionActionLoading).toHaveBeenCalledWith(false);
    });

    it('transitions to blocked when retry still results in NotAllowedError with denied state', async () => {
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
      mockRequestVideoStream.mockRejectedValue(notAllowed);
      mockIsFirefoxBrowser.mockReturnValue(false);

      const { result } = renderCameraHook();

      await waitFor(() => {
        expect(mockSetNeeded).toHaveBeenCalled();
      });

      mockQueryCameraPermission.mockResolvedValueOnce({
        state: CameraPermissionState.Denied,
        permissionStatus: {
          state: CameraPermissionState.Denied,
          addEventListener: jest.fn(),
        } as unknown as PermissionStatus,
      });

      await act(async () => {
        await result.current.handleCameraAccessNeededContinue();
      });

      expect(mockSetBlocked).toHaveBeenCalled();
      expect(mockSetPermissionActionLoading).toHaveBeenCalledWith(false);
    });

    it('calls setError on non-NotAllowed camera failure', async () => {
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

      const { result } = renderCameraHook();

      await waitFor(() => {
        expect(mockSetNeeded).toHaveBeenCalled();
      });

      const hardwareError = new Error('Camera hardware failure');
      hardwareError.name = 'NotReadableError';
      mockRequestVideoStream.mockRejectedValueOnce(hardwareError);

      await act(async () => {
        await result.current.handleCameraAccessNeededContinue();
      });

      expect(mockSetError).toHaveBeenCalledWith(hardwareError);
      expect(mockSetPermissionActionLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('handleCameraAccessBlockedContinue', () => {
    it('tracks CTA click and calls setReady when permission is no longer denied', async () => {
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

      const { result } = renderCameraHook();

      await waitFor(() => {
        expect(mockSetBlocked).toHaveBeenCalled();
      });

      mockQueryCameraPermission.mockResolvedValueOnce({
        state: CameraPermissionState.Granted,
        permissionStatus: null,
      });
      mockRequestVideoStream.mockResolvedValueOnce(mockStream);

      await act(async () => {
        await result.current.handleCameraAccessBlockedContinue();
      });

      expect(mockTrackCameraRecoveryCtaClicked).toHaveBeenCalled();
      expect(mockSetReady).toHaveBeenCalled();
      expect(mockSetPermissionActionLoading).toHaveBeenCalledWith(false);
    });

    it('does not transition when permission is still denied', async () => {
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

      const { result } = renderCameraHook();

      await waitFor(() => {
        expect(mockSetBlocked).toHaveBeenCalled();
      });

      mockSetReady.mockClear();

      await act(async () => {
        await result.current.handleCameraAccessBlockedContinue();
      });

      expect(mockSetReady).not.toHaveBeenCalled();
      expect(mockSetPermissionActionLoading).toHaveBeenCalledWith(false);
    });

    it('calls setError on non-NotAllowed camera failure after permission changes', async () => {
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

      const { result } = renderCameraHook();

      await waitFor(() => {
        expect(mockSetBlocked).toHaveBeenCalled();
      });

      mockQueryCameraPermission.mockResolvedValueOnce({
        state: CameraPermissionState.Granted,
        permissionStatus: null,
      });
      const hardwareError = new Error('Camera hardware failure');
      hardwareError.name = 'NotReadableError';
      mockRequestVideoStream.mockRejectedValueOnce(hardwareError);

      await act(async () => {
        await result.current.handleCameraAccessBlockedContinue();
      });

      expect(mockSetError).toHaveBeenCalledWith(hardwareError);
      expect(mockSetPermissionActionLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('permission change listener', () => {
    it('auto-recovers when PermissionStatus fires change with granted', async () => {
      mockCheckStatus.mockResolvedValue({
        permissions: false,
        environmentReady: true,
      });

      let capturedHandler: (() => void) | null = null;
      const mockPermissionStatus = {
        state: CameraPermissionState.Denied as PermissionState,
        addEventListener: jest.fn((_event: string, handler: () => void) => {
          capturedHandler = handler;
        }),
      } as unknown as PermissionStatus;

      mockQueryCameraPermission.mockResolvedValue({
        state: CameraPermissionState.Denied,
        permissionStatus: mockPermissionStatus,
      });

      renderCameraHook();

      await waitFor(() => {
        expect(mockSetBlocked).toHaveBeenCalled();
      });

      (mockPermissionStatus as { state: PermissionState }).state =
        CameraPermissionState.Granted;
      mockRequestVideoStream.mockResolvedValueOnce(mockStream);

      expect(capturedHandler).not.toBeNull();
      await act(async () => {
        (capturedHandler as () => void)();
      });

      expect(mockSetReady).toHaveBeenCalled();
    });
  });
});
