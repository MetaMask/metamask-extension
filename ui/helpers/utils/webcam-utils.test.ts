import { getEnvironmentType } from '../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
  ENVIRONMENT_TYPE_FULLSCREEN,
} from '../../../shared/constants/app';
import WebcamUtils from './webcam-utils';

jest.mock('../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

const mockGetEnvironmentType = getEnvironmentType as jest.MockedFunction<
  typeof getEnvironmentType
>;

describe('WebcamUtils', () => {
  const mockEnumerateDevices = jest.fn();
  const mockQueryPermission = jest.fn();
  let originalNavigator: Navigator;

  beforeEach(() => {
    jest.clearAllMocks();

    // Store original navigator
    originalNavigator = window.navigator;

    // Mock navigator.mediaDevices and navigator.permissions
    Object.defineProperty(window, 'navigator', {
      value: {
        ...originalNavigator,
        mediaDevices: {
          enumerateDevices: mockEnumerateDevices,
        },
        permissions: {
          query: mockQueryPermission,
        },
      },
      writable: true,
      configurable: true,
    });

    // Default: camera permission has been granted.
    mockQueryPermission.mockResolvedValue({ state: 'granted' });
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
    // Labels are intentionally blank: detection no longer relies on them.
    const webcam = { kind: 'videoinput', label: '' };

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
      beforeEach(() => {
        mockEnumerateDevices.mockResolvedValue([webcam]);
      });

      describe('in fullscreen mode', () => {
        beforeEach(() => {
          mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
        });

        it('returns environmentReady true with permissions', async () => {
          mockQueryPermission.mockResolvedValue({ state: 'granted' });

          const result = await WebcamUtils.checkStatus();

          expect(result).toStrictEqual({
            permissions: true,
            environmentReady: true,
          });
        });

        it('returns environmentReady true even without permissions', async () => {
          mockQueryPermission.mockResolvedValue({ state: 'prompt' });

          const result = await WebcamUtils.checkStatus();

          // Fullscreen can prompt in place, so it never needs a redirect.
          expect(result).toStrictEqual({
            permissions: false,
            environmentReady: true,
          });
        });
      });

      const restrictedEnvironments = [
        ['popup', ENVIRONMENT_TYPE_POPUP],
        ['sidepanel', ENVIRONMENT_TYPE_SIDEPANEL],
      ] as const;

      restrictedEnvironments.forEach(([name, environmentType]) => {
        describe(`in ${name} mode`, () => {
          beforeEach(() => {
            mockGetEnvironmentType.mockReturnValue(environmentType);
          });

          it('returns environmentReady true when permission is granted', async () => {
            mockQueryPermission.mockResolvedValue({ state: 'granted' });

            const result = await WebcamUtils.checkStatus();

            expect(result).toStrictEqual({
              permissions: true,
              environmentReady: true,
            });
          });

          it('returns environmentReady false when permission is not yet granted (prompt)', async () => {
            mockQueryPermission.mockResolvedValue({ state: 'prompt' });

            const result = await WebcamUtils.checkStatus();

            expect(result).toStrictEqual({
              permissions: false,
              environmentReady: false,
            });
          });

          it('returns environmentReady false when permission is denied', async () => {
            mockQueryPermission.mockResolvedValue({ state: 'denied' });

            const result = await WebcamUtils.checkStatus();

            expect(result).toStrictEqual({
              permissions: false,
              environmentReady: false,
            });
          });
        });
      });
    });
  });

  describe('queryCameraPermission', () => {
    it('returns state and permissionStatus when supported', async () => {
      const permissionStatus = {
        state: 'denied',
      } as PermissionStatus;
      mockQueryPermission.mockResolvedValue(permissionStatus);

      await expect(WebcamUtils.queryCameraPermission()).resolves.toStrictEqual({
        state: 'denied',
        permissionStatus,
      });
    });

    it('falls back to prompt when query throws', async () => {
      mockQueryPermission.mockRejectedValue(new Error('unsupported'));

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
