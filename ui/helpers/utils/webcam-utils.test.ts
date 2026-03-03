// eslint-disable-next-line import/no-restricted-paths -- Required to mock background utility used by webcam-utils
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
  ENVIRONMENT_TYPE_FULLSCREEN,
  PLATFORM_FIREFOX,
  PLATFORM_CHROME,
} from '../../../shared/constants/app';
import { getBrowserName } from '../../../shared/modules/browser-runtime.utils';
import WebcamUtils from './webcam-utils';

jest.mock('../../../app/scripts/lib/util', () => ({
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../shared/modules/browser-runtime.utils', () => ({
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
});
