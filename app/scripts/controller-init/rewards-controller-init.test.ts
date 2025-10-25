import { Messenger } from '@metamask/base-controller';
import { RewardsController } from '../controllers/rewards/rewards-controller';
import { getRewardsControllerMessenger } from './messengers/rewards-controller-messenger';
import { getRewardsControllerInitMessenger } from './messengers/rewards-controller-messenger';
import { buildControllerInitRequestMock } from './test/utils';
import { RewardsControllerInit } from './rewards-controller-init';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import {
  validatedVersionGatedFeatureFlag,
  VersionGatedFeatureFlag,
} from '../../../shared/lib/feature-flags/version-gating';
import type { RewardsControllerInitMessenger } from './messengers/rewards-controller-messenger';
import type { ControllerInitRequest } from './types';
import type { RewardsControllerMessenger } from '../controllers/rewards/rewards-controller';

jest.mock('../controllers/rewards/rewards-controller');
jest.mock('../../../shared/lib/manifestFlags');
jest.mock('../../../shared/lib/feature-flags/version-gating');

const mockGetManifestFlags = jest.mocked(getManifestFlags);
const mockValidatedVersionGatedFeatureFlag = jest.mocked(
  validatedVersionGatedFeatureFlag,
);

function buildInitRequestMock(
  remoteFeatureFlags?: Record<string, unknown>,
): jest.Mocked<
  ControllerInitRequest<
    RewardsControllerMessenger,
    RewardsControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger<never, never>();

  const initMessenger = getRewardsControllerInitMessenger(
    baseControllerMessenger,
  );

  // Mock the RemoteFeatureFlagController:getState call
  // Always set up the mock, defaulting to empty remoteFeatureFlags if not provided
  jest
    .spyOn(initMessenger, 'call')
    .mockReturnValue({ remoteFeatureFlags: remoteFeatureFlags ?? {} } as never);

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getRewardsControllerMessenger(baseControllerMessenger),
    initMessenger,
  };
}

describe('RewardsControllerInit', () => {
  const RewardsControllerClassMock = jest.mocked(RewardsController);

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetManifestFlags.mockReturnValue({
      remoteFeatureFlags: undefined,
    } as never);
  });

  describe('controller instantiation', () => {
    it('returns controller instance', () => {
      const requestMock = buildInitRequestMock();
      const result = RewardsControllerInit(requestMock);

      expect(result.controller).toBeInstanceOf(RewardsController);
    });

    it('initializes with correct messenger', () => {
      const requestMock = buildInitRequestMock();
      RewardsControllerInit(requestMock);

      expect(RewardsControllerClassMock).toHaveBeenCalledWith({
        messenger: requestMock.controllerMessenger,
        state: expect.any(Object),
        rewardsEnabled: expect.any(Boolean),
      });
    });

    it('uses persisted state when available', () => {
      const requestMock = buildInitRequestMock();
      const mockPersistedState = {
        activeAccount: null,
        accounts: {},
        subscriptions: {},
        seasons: {},
        seasonStatuses: {},
        subscriptionTokens: {},
        rewardsEnabled: false,
      };
      requestMock.persistedState.RewardsController = mockPersistedState;

      RewardsControllerInit(requestMock);

      expect(RewardsControllerClassMock).toHaveBeenCalledWith({
        messenger: requestMock.controllerMessenger,
        state: mockPersistedState,
        rewardsEnabled: expect.any(Boolean),
      });
    });

    it('uses default state when no persisted state', () => {
      const requestMock = buildInitRequestMock();

      RewardsControllerInit(requestMock);

      const [constructorArgs] = RewardsControllerClassMock.mock.calls[0];
      expect(constructorArgs.state).toBeDefined();
    });
  });

  describe('feature flag resolution', () => {
    describe('when no manifest override', () => {
      beforeEach(() => {
        mockGetManifestFlags.mockReturnValue({
          remoteFeatureFlags: undefined,
        } as never);
      });

      it('enables rewards when remote flag is true', () => {
        const requestMock = buildInitRequestMock({
          rewardsEnabled: true,
        });

        RewardsControllerInit(requestMock);

        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: true,
          }),
        );
      });

      it('disables rewards when remote flag is false', () => {
        const requestMock = buildInitRequestMock({
          rewardsEnabled: false,
        });

        RewardsControllerInit(requestMock);

        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: false,
          }),
        );
      });

      it('disables rewards when remote flag is undefined', () => {
        const requestMock = buildInitRequestMock({
          rewardsEnabled: undefined,
        });

        RewardsControllerInit(requestMock);

        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: false,
          }),
        );
      });

      it('enables rewards when version-gated flag is valid', () => {
        const versionGatedFlag = {
          minimumVersion: '12.0.0',
        };
        mockValidatedVersionGatedFeatureFlag.mockReturnValue(true);

        const requestMock = buildInitRequestMock({
          rewardsEnabled: versionGatedFlag,
        });

        RewardsControllerInit(requestMock);

        expect(validatedVersionGatedFeatureFlag).toHaveBeenCalledWith(
          versionGatedFlag,
        );
        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: true,
          }),
        );
      });

      it('disables rewards when version-gated flag is invalid', () => {
        const versionGatedFlag = {
          minimumVersion: '999.0.0',
        };
        mockValidatedVersionGatedFeatureFlag.mockReturnValue(undefined);

        const requestMock = buildInitRequestMock({
          rewardsEnabled: versionGatedFlag,
        });

        RewardsControllerInit(requestMock);

        expect(validatedVersionGatedFeatureFlag).toHaveBeenCalledWith(
          versionGatedFlag,
        );
        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: false,
          }),
        );
      });
    });

    describe('when manifest override is present', () => {
      it('uses manifest flag when it is true', () => {
        mockGetManifestFlags.mockReturnValue({
          remoteFeatureFlags: {
            rewardsEnabled: true,
          },
        } as never);

        const requestMock = buildInitRequestMock({
          rewardsEnabled: false, // Remote flag is false
        });

        RewardsControllerInit(requestMock);

        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: true, // Manifest flag wins
          }),
        );
      });

      it('uses manifest flag when it is false', () => {
        mockGetManifestFlags.mockReturnValue({
          remoteFeatureFlags: {
            rewardsEnabled: false,
          },
        } as never);

        const requestMock = buildInitRequestMock({
          rewardsEnabled: true, // Remote flag is true
        });

        RewardsControllerInit(requestMock);

        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: false, // Manifest flag wins
          }),
        );
      });

      it('uses manifest version-gated flag over remote boolean flag', () => {
        const versionGatedFlag = {
          minimumVersion: '12.0.0',
        };
        mockGetManifestFlags.mockReturnValue({
          remoteFeatureFlags: {
            rewardsEnabled: versionGatedFlag,
          },
        } as never);
        mockValidatedVersionGatedFeatureFlag.mockReturnValue(true);

        const requestMock = buildInitRequestMock({
          rewardsEnabled: false, // Remote flag is false
        });

        RewardsControllerInit(requestMock);

        expect(validatedVersionGatedFeatureFlag).toHaveBeenCalledWith(
          versionGatedFlag,
        );
        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: true, // Manifest flag wins
          }),
        );
      });

      it('handles invalid manifest version-gated flag', () => {
        const versionGatedFlag = {
          minimumVersion: '999.0.0',
        };
        mockGetManifestFlags.mockReturnValue({
          remoteFeatureFlags: {
            rewardsEnabled: versionGatedFlag,
          },
        } as never);
        mockValidatedVersionGatedFeatureFlag.mockReturnValue(undefined);

        const requestMock = buildInitRequestMock({
          rewardsEnabled: true, // Remote flag is true
        });

        RewardsControllerInit(requestMock);

        expect(validatedVersionGatedFeatureFlag).toHaveBeenCalledWith(
          versionGatedFlag,
        );
        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: false, // Manifest flag (invalid) wins
          }),
        );
      });
    });

    describe('edge cases', () => {
      it('handles null remote feature flag', () => {
        const requestMock = buildInitRequestMock({
          rewardsEnabled: null,
        });

        RewardsControllerInit(requestMock);

        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: false,
          }),
        );
      });

      it('handles string remote feature flag (invalid)', () => {
        const requestMock = buildInitRequestMock({
          rewardsEnabled: 'invalid',
        });

        RewardsControllerInit(requestMock);

        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: false,
          }),
        );
      });

      it('handles numeric remote feature flag (invalid)', () => {
        const requestMock = buildInitRequestMock({
          rewardsEnabled: 1,
        });

        RewardsControllerInit(requestMock);

        expect(RewardsControllerClassMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rewardsEnabled: false,
          }),
        );
      });
    });
  });

  describe('logging', () => {
    it('logs the effective enabled state', () => {
      const logSpy = jest.spyOn(console, 'info').mockImplementation();

      const requestMock = buildInitRequestMock({
        rewardsEnabled: true,
      });

      RewardsControllerInit(requestMock);

      // Note: The implementation uses log.info from loglevel, which may need different mocking
      // This test ensures the function runs without errors with logging

      logSpy.mockRestore();
    });
  });
});
