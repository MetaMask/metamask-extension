import { RewardsController } from '../controllers/rewards/rewards-controller';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { RewardsControllerState } from '../controllers/rewards/rewards-controller.types';
import { getRootMessenger } from '../lib/messenger';
import {
  getRewardsControllerMessenger,
  getRewardsControllerInitMessenger,
} from './messengers/rewards-controller-messenger';
import { buildControllerInitRequestMock } from './test/utils';
import { RewardsControllerInit } from './rewards-controller-init';
import type {
  RewardsControllerInitMessenger,
  RewardsControllerMessenger,
} from './messengers/rewards-controller-messenger';
import type { ControllerInitRequest } from './types';

jest.mock('../controllers/rewards/rewards-controller');
jest.mock('../../../shared/lib/manifestFlags');
jest.mock('../../../shared/lib/feature-flags/version-gating');

const mockGetManifestFlags = jest.mocked(getManifestFlags);

function buildInitRequestMock(
  remoteFeatureFlags?: Record<string, unknown>,
  useExternalServices = true,
): jest.Mocked<
  ControllerInitRequest<
    RewardsControllerMessenger,
    RewardsControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  const initMessenger = getRewardsControllerInitMessenger(
    baseControllerMessenger,
  );

  // Mock the RemoteFeatureFlagController:getState and PreferencesController:getState calls
  // Always set up the mock, defaulting to empty remoteFeatureFlags if not provided
  jest.spyOn(initMessenger, 'call').mockImplementation((action: string) => {
    if (action === 'RemoteFeatureFlagController:getState') {
      return { remoteFeatureFlags: remoteFeatureFlags ?? {} } as never;
    }
    if (action === 'PreferencesController:getState') {
      return { useExternalServices } as never;
    }
    return undefined as never;
  });

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
        isDisabled: expect.any(Function),
      });
    });

    it('uses persisted state when available', () => {
      const requestMock = buildInitRequestMock();
      const mockPersistedState = {
        rewardsActiveAccount: null,
        rewardsAccounts: {},
        rewardsSubscriptions: {},
        rewardsSeasons: {},
        rewardsSeasonStatuses: {},
        rewardsSubscriptionTokens: {},
      } as Partial<RewardsControllerState>;
      requestMock.persistedState.RewardsController = mockPersistedState;

      RewardsControllerInit(requestMock);

      expect(RewardsControllerClassMock).toHaveBeenCalledWith({
        messenger: requestMock.controllerMessenger,
        state: mockPersistedState,
        isDisabled: expect.any(Function),
      });
    });

    it('uses default state when no persisted state', () => {
      const requestMock = buildInitRequestMock();

      RewardsControllerInit(requestMock);

      const [constructorArgs] = RewardsControllerClassMock.mock.calls[0];
      expect(constructorArgs.state).toBeDefined();
    });
  });
});
