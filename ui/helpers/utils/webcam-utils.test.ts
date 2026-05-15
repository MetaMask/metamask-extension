import { getEnvironmentType } from '../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
  ENVIRONMENT_TYPE_FULLSCREEN,
  PLATFORM_CHROME,
  PLATFORM_FIREFOX,
} from '../../../shared/constants/app';
import { getBrowserName } from '../../../shared/lib/browser-runtime.utils';
import WebcamUtils from './webcam-utils';

jest.mock('../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../shared/lib/browser-runtime.utils', () => ({
  getBrowserName: jest.fn(),
}));

const mockGetEnvironmentType = getEnvironmentType as jest.MockedFunction<
  typeof getEnvironmentType
>;
const mockGetBrowserName = getBrowserName as jest.MockedFunction<
  typeof getBrowserName
>;

describe('WebcamUtils', () => {
  const mockEnumerateDevices = jest.fn();
  let originalNavigator: Navigator;

  beforeEach(() => {
    jest.clearAllMocks();

    // Store original navigator
    originalNavigator = window.navigator;

    // Mock navigator.mediaDevices
    Object.defineProperty(window, 'navigator', {
      value: {
        ...originalNavigator,
        mediaDevices: {
          enumerateDevices: mockEnumerateDevices,
        },
      },
      writable: true,
      configurable: true,
    });

    mockGetBrowserName.mockReturnValue(PLATFORM_CHROME);
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  describe('checkStatus', () => {
    describe('when no webcam is found', () => {
      it('throws NO_WEBCAM_FOUND error', async () => {
        mockEnumerateDevices.mockResolvedValue([]);
        mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);

        await expect(WebcamUtils.checkStatus()).rejects.toMatchObject({
          message: 'No webcam found',
          type: 'NO_WEBCAM_FOUND',
        });
      });
    });

    describe('when webcam is found', () => {
      const webcamWithPermission = {
        kind: 'videoinput',
        label: 'FaceTime HD Camera',
      };
      const webcamWithoutPermission = {
        kind: 'videoinput',
        label: '',
      };

      describe('in fullscreen mode', () => {
        beforeEach(() => {
          mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
        });

        it('returns environmentReady true with permissions', async () => {
          mockEnumerateDevices.mockResolvedValue([webcamWithPermission]);

          const result = await WebcamUtils.checkStatus();

          expect(result).toStrictEqual({
            permissions: true,
            environmentReady: true,
          });
        });

        it('returns environmentReady true without permissions', async () => {
          mockEnumerateDevices.mockResolvedValue([webcamWithoutPermission]);

          const result = await WebcamUtils.checkStatus();

          expect(result).toStrictEqual({
            permissions: false,
            environmentReady: true,
          });
        });
      });

      describe('in popup mode', () => {
        beforeEach(() => {
          mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
        });

        it('returns environmentReady true when permissions are granted', async () => {
          mockEnumerateDevices.mockResolvedValue([webcamWithPermission]);

          const result = await WebcamUtils.checkStatus();

          expect(result).toStrictEqual({
            permissions: true,
            environmentReady: true,
          });
        });

        it('returns environmentReady false when permissions are not granted', async () => {
          mockEnumerateDevices.mockResolvedValue([webcamWithoutPermission]);

          const result = await WebcamUtils.checkStatus();

          expect(result).toStrictEqual({
            permissions: false,
            environmentReady: false,
          });
        });

        it('returns environmentReady false in Firefox even with permissions', async () => {
          mockGetBrowserName.mockReturnValue(PLATFORM_FIREFOX);
          mockEnumerateDevices.mockResolvedValue([webcamWithPermission]);

          const result = await WebcamUtils.checkStatus();

          expect(result).toStrictEqual({
            permissions: true,
            environmentReady: false,
          });
        });
      });

      describe('in sidepanel mode', () => {
        beforeEach(() => {
          mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
        });

        it('returns environmentReady true when permissions are granted', async () => {
          mockEnumerateDevices.mockResolvedValue([webcamWithPermission]);

          const result = await WebcamUtils.checkStatus();

          expect(result).toStrictEqual({
            permissions: true,
            environmentReady: true,
          });
        });

        it('returns environmentReady false when permissions are not granted', async () => {
          mockEnumerateDevices.mockResolvedValue([webcamWithoutPermission]);

          const result = await WebcamUtils.checkStatus();

          expect(result).toStrictEqual({
            permissions: false,
            environmentReady: false,
          });
        });

        it('returns environmentReady false in Firefox even with permissions', async () => {
          mockGetBrowserName.mockReturnValue(PLATFORM_FIREFOX);
          mockEnumerateDevices.mockResolvedValue([webcamWithPermission]);

          const result = await WebcamUtils.checkStatus();

          expect(result).toStrictEqual({
            permissions: true,
            environmentReady: false,
          });
        });
      });
    });
  });

  describe('queryCameraPermission', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          mediaDevices: {
            enumerateDevices: mockEnumerateDevices,
          },
          permissions: {
            query: jest.fn(),
          },
        },
        writable: true,
        configurable: true,
      });
    });

    it('returns state and permissionStatus when supported', async () => {
      const permissionStatus = {
        state: 'denied',
      } as PermissionStatus;
      (
        window.navigator.permissions.query as jest.MockedFunction<
          typeof window.navigator.permissions.query
        >
      ).mockResolvedValue(permissionStatus);

      await expect(WebcamUtils.queryCameraPermission()).resolves.toStrictEqual({
        state: 'denied',
        permissionStatus,
      });
    });

    it('falls back to prompt when query throws', async () => {
      (
        window.navigator.permissions.query as jest.MockedFunction<
          typeof window.navigator.permissions.query
        >
      ).mockRejectedValue(new Error('unsupported'));

      await expect(WebcamUtils.queryCameraPermission()).resolves.toStrictEqual({
        state: 'prompt',
        permissionStatus: null,
      });
    });
  });

  describe('stopVideoStream', () => {
    it('stops all tracks', () => {
      const stop = jest.fn();
      WebcamUtils.stopVideoStream({
        getTracks: () => [{ stop }],
      } as unknown as MediaStream);
      expect(stop).toHaveBeenCalledTimes(1);
    });
  });
});
